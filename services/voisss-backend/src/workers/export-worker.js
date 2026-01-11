/**
 * Export Worker
 * Processes export jobs from queue
 * PRINCIPLE: MODULAR - Independent worker process, can scale separately
 * PRINCIPLE: CLEAN - Uses export-service for state management
 */

require('dotenv').config();

const path = require('path');
const { getQueue } = require('../services/queue-service');

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});
const {
  updateJobStatus,
  EXPORT_QUEUE,
} = require('../services/export-service');
const {
  downloadFile,
  encodeAudio,
  composeVideoWithAudio,
  moveToOutput,
  cleanupTempFiles,
  getPublicUrl,
} = require('../services/ffmpeg-service');
const {
  renderSvgToPng,
  renderSvgsToFrames,
} = require('../services/svg-renderer-service');
const {
  buildFrameSequence,
  calculateVideoParams,
  generateFrameConcat,
} = require('../services/storyboard-service');
const { runMigrations, closePool } = require('../services/db-service');
const { getWorkerPool, terminateWorkerPool } = require('../services/worker-pool');

/**
 * Process a single export job
 * PRINCIPLE: MODULAR - Clear separation of audio vs video paths
 * PRINCIPLE: CLEAN - Each path handles its own logic
 */
async function processExportJob(job) {
  const workerInfo = `[Worker ${process.env.WORKER_ID} PID:${process.pid}]`;
  console.log(`${workerInfo} 📥 RECEIVED JOB: ${job.id}`);
  console.log(`${workerInfo} Data keys:`, Object.keys(job.data).join(', '));

  const { jobId, kind, audioUrl, transcriptId, userId, manifest } = job.data;
  const startTime = Date.now();
  const tempFiles = [];

  console.log(`${workerInfo} ▶️  Processing job ${job.id} for export: ${jobId} (${kind})`);

  try {
    console.log(`${workerInfo} Updating status to processing...`);
    // Update status to processing
    await updateJobStatus(jobId, 'processing', {
      workerId: process.env.WORKER_ID || 'worker-pm2',
      progress: 5
    });
    console.log(`${workerInfo} Status updated, setting job progress...`);
    await job.progress(5); // Initial kick-off
    console.log(`${workerInfo} Initial progress set`);

    // Step 1: Get audio file (download or copy local)
    console.log(`${workerInfo} Downloading audio from: ${audioUrl}`);
    const inputFileName = `${jobId}_input.webm`;
    const inputPath = await downloadFile(audioUrl, inputFileName);
    // Note: for file:// URLs, downloadFile copies instead of downloading
    tempFiles.push(inputPath);
    console.log(`${workerInfo} Audio ready at: ${inputPath}`);
    await job.progress(20); // Audio downloaded

    // Step 2: Route to appropriate processor
    let outputPath;
    if (kind === 'mp3') {
      outputPath = await processAudioExport(jobId, inputPath, tempFiles);
      await job.progress(80);
    } else if (kind === 'mp4') {
      if (!manifest) {
        throw new Error('MP4 export requires storyboard manifest');
      }
      const template = job.data.template;
      if (!template) {
        throw new Error('MP4 export requires template data for rendering');
      }
      outputPath = await processVideoExport(jobId, inputPath, manifest, template, tempFiles, job);
    } else {
      throw new Error(`Unsupported export kind: ${kind}`);
    }

    // Step 3: Move to permanent storage
    const finalPath = moveToOutput(outputPath, jobId, kind);
    const publicUrl = getPublicUrl(finalPath);

    // Step 4: Get file size
    const fs = require('fs');
    const fileSize = fs.statSync(finalPath).size;

    // Step 5: Mark complete
    const duration = Date.now() - startTime;
    await updateJobStatus(jobId, 'completed', {
      outputUrl: publicUrl,
      outputSize: fileSize,
      stats: {
        durationMs: duration,
        fileSizeMb: (fileSize / 1024 / 1024).toFixed(2),
        kind
      }
    });

    console.log(`✅ Export complete: ${jobId}`);
    console.log(`   Format: ${kind}`);
    console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);

    return { jobId, status: 'completed', publicUrl, fileSize };
  } catch (error) {
    console.error(`❌ Export failed: ${jobId}`, error);

    const duration = Date.now() - startTime;
    await updateJobStatus(jobId, 'failed', {
      errorMessage: error.message,
    });

    throw error;
  } finally {
    // Cleanup temp files
    cleanupTempFiles(tempFiles);
  }
}

/**
 * Audio-only export path
 * PRINCIPLE: MODULAR - Focused on simple MP3 encoding
 */
async function processAudioExport(jobId, audioPath, tempFiles) {
  const outputPath = path.join('/tmp/voisss-exports', `${jobId}.mp3`);
  await encodeAudio(audioPath, 'mp3', outputPath);
  tempFiles.push(outputPath);
  return outputPath;
}

/**
 * Video export path
 * PRINCIPLE: MODULAR - Handles storyboard rendering + composition
 */
async function processVideoExport(jobId, audioPath, manifest, template, tempFiles, job) {
  const fs = require('fs');
  const outputDir = require('../services/ffmpeg-service').TEMP_DIR;

  try {
    console.log(`\n📹 Starting video composition: ${jobId}`);
    console.log(`   Segments: ${manifest.segments.length}`);
    console.log(`   Template: ${template.id}`);

    // Step 1: Build frame sequence with template-styled SVG frames
    const frameData = await buildFrameSequence(manifest, template, jobId);
    if (job) await job.progress(30);

    // Step 2: Render SVG frames to PNG using Worker Thread Pool
    console.log(`🎨 Rendering ${frameData.length} frames to PNG...`);

    const pool = getWorkerPool();
    const frameResults = [];
    
    // Render all frames in parallel using worker threads
    const renderPromises = frameData.map((frame, frameIdx) => {
      const framePath = path.join(outputDir, `${jobId}_frame_${String(frameIdx).padStart(4, '0')}.png`);
      
      return pool.executeTask({
        svg: frame.svg,
        outputPath: framePath,
      }).then(result => {
        if (!result.success) {
          throw new Error(`Frame ${frameIdx} rendering failed: ${result.error}`);
        }
        
        // Update progress every 10 frames
        if ((frameIdx + 1) % 10 === 0) {
          const renderProgress = 30 + Math.floor((frameIdx + 1) / frameData.length * 40);
          if (job) job.progress(renderProgress).catch(() => {});
          updateJobStatus(jobId, 'processing', { progress: renderProgress }).catch(() => {});
        }
        
        return result.path;
      });
    });

    const renderedFrames = await Promise.all(renderPromises);
    frameResults.push(...renderedFrames);
    renderedFrames.forEach(p => tempFiles.push(p));

    // Step 3: Calculate video parameters
    const videoParams = calculateVideoParams(frameData, frameData[frameData.length - 1]?.endMs || 1000);
    console.log(`   FPS: ${videoParams.fps}, Frames: ${frameData.length}`);

    // Step 4: Generate FFmpeg concat demuxer file
    const concatPath = path.join(outputDir, `${jobId}_concat.txt`);
    const concatList = generateFrameConcat(frameData, outputDir, jobId, videoParams.fps);
    fs.writeFileSync(concatPath, concatList);
    tempFiles.push(concatPath);
    console.log(`📋 Frame concat file created`);
    if (job) await job.progress(60);

    // Step 5: Compose video with audio using FFmpeg
    const outputPath = path.join(outputDir, `${jobId}.mp4`);
    console.log(`🎬 Composing video with audio...`);
    await composeVideoWithAudio(concatPath, audioPath, outputPath);
    tempFiles.push(outputPath);
    if (job) await job.progress(90);

    console.log(`✅ Video composition complete: ${jobId}`);
    return outputPath;
  } catch (error) {
    console.error(`❌ Video export failed: ${jobId}`, error);
    throw error;
  }
}



/**
 * Start worker and listen for jobs
 */
async function startWorker() {
  console.log('🚀 Export Worker Starting...');

  try {
    // Run migrations and test DB connection
    await runMigrations();

    // Explicitly test DB connection if migrations were skipped
    if (process.env.SKIP_MIGRATIONS === 'true') {
      const { query } = require('../services/db-service');
      await query('SELECT 1');
      console.log('✅ Database connection verified');
    }

    // Get queue and attach processor
    const queue = getQueue(EXPORT_QUEUE);

    // Set concurrency (how many jobs in parallel)
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2');
    console.log(`Worker concurrency: ${concurrency}`);

    // Register processor - Bull handles connection timing internally
    queue.process(concurrency, processExportJob);

    // Event listeners for monitoring
    queue.on('active', (job) => {
      console.log(`📤 Job started: ${job.id}`);
    });

    queue.on('completed', (job, result) => {
      console.log(`📬 Job completed: ${job.id}`);
    });

    queue.on('failed', (job, err) => {
      console.error(`📭 Job failed: ${job.id}`, err.message);
    });

    queue.on('error', (error) => {
      console.error('Queue error:', error);
    });

    console.log(`✅ Export worker ready`);
    console.log(`   Queue: ${EXPORT_QUEUE}`);
    console.log(`   Worker ID: ${process.env.WORKER_ID}`);
  } catch (error) {
    console.error('❌ Worker startup failed:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n⏹️  Shutting down worker...');
  const { closeQueues } = require('../services/queue-service');
  await closeQueues(); // Close all queues and clear cache
  await terminateWorkerPool(); // Terminate worker thread pool
  await closePool();
  console.log('✅ Worker shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start worker
if (require.main === module) {
  startWorker().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { processExportJob, startWorker };
