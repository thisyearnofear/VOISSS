/**
 * Export Worker
 * Processes export jobs from queue
 * PRINCIPLE: MODULAR - Independent worker process, can scale separately
 * PRINCIPLE: CLEAN - Uses export-service for state management
 */

require('dotenv').config();

const { getQueue } = require('../services/queue-service');
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

const path = require('path');

/**
 * Process a single export job
 * PRINCIPLE: MODULAR - Clear separation of audio vs video paths
 * PRINCIPLE: CLEAN - Each path handles its own logic
 */
async function processExportJob(job) {
  const { jobId, kind, audioUrl, transcriptId, userId, manifest } = job.data;
  const startTime = Date.now();
  const tempFiles = [];

  console.log(`\n▶️  Processing export: ${jobId} (${kind})`);

  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing', { workerId: process.env.WORKER_ID });

    // Step 1: Get audio file (download or copy local)
    const inputFileName = `${jobId}_input.webm`;
    const inputPath = await downloadFile(audioUrl, inputFileName);
    // Note: for file:// URLs, downloadFile copies instead of downloading
    tempFiles.push(inputPath);

    // Step 2: Route to appropriate processor
    let outputPath;
    if (kind === 'mp3') {
      outputPath = await processAudioExport(jobId, inputPath, tempFiles);
    } else if (kind === 'mp4') {
      if (!manifest) {
        throw new Error('MP4 export requires storyboard manifest');
      }
      const template = job.data.template;
      if (!template) {
        throw new Error('MP4 export requires template data for rendering');
      }
      outputPath = await processVideoExport(jobId, inputPath, manifest, template, tempFiles);
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
async function processVideoExport(jobId, audioPath, manifest, template, tempFiles) {
  const fs = require('fs');
  const outputDir = require('../services/ffmpeg-service').TEMP_DIR;

  try {
    console.log(`\n📹 Starting video composition: ${jobId}`);
    console.log(`   Segments: ${manifest.segments.length}`);
    console.log(`   Template: ${template.id}`);

    // Step 1: Build frame sequence with template-styled SVG frames
    const frameData = await buildFrameSequence(manifest, template, jobId);
    
    // Step 2: Render SVG frames to PNG using Sharp
    console.log(`🎨 Rendering ${frameData.length} frames to PNG...`);
    const frameResults = await Promise.all(
      frameData.map((frame, idx) => 
        renderSvgToPng(frame.svg, path.join(outputDir, `${jobId}_frame_${String(idx).padStart(4, '0')}.png`))
      )
    );
    frameResults.forEach(p => tempFiles.push(p));

    // Step 3: Calculate video parameters
    const videoParams = calculateVideoParams(frameData, frameData[frameData.length - 1]?.endMs || 1000);
    console.log(`   FPS: ${videoParams.fps}, Frames: ${frameData.length}`);

    // Step 4: Generate FFmpeg concat demuxer file
    const concatPath = path.join(outputDir, `${jobId}_concat.txt`);
    const concatList = generateFrameConcat(frameData, outputDir, jobId, videoParams.fps);
    fs.writeFileSync(concatPath, concatList);
    tempFiles.push(concatPath);
    console.log(`📋 Frame concat file created`);

    // Step 5: Compose video with audio using FFmpeg
    const outputPath = path.join(outputDir, `${jobId}.mp4`);
    console.log(`🎬 Composing video with audio...`);
    await composeVideoWithAudio(concatPath, audioPath, outputPath);
    tempFiles.push(outputPath);

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
    // Run migrations
    await runMigrations();

    // Get queue and attach processor
    const queue = getQueue(EXPORT_QUEUE);

    // Set concurrency (how many jobs in parallel)
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '2');
    console.log(`Worker concurrency: ${concurrency}`);

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
  const queue = getQueue(EXPORT_QUEUE);
  await queue.close();
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
