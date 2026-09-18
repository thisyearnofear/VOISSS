/**
 * Export Worker
 * Polls database for pending export jobs and processes them
 * PRINCIPLE: MODULAR - Independent worker process, can scale separately
 * PRINCIPLE: CLEAN - Uses export-service for job management
 * PRINCIPLE: AGGRESSIVE CONSOLIDATION - No Bull/Redis, database-driven
 */

require('dotenv').config();

const path = require('path');
const fs = require('fs');

const {
  getNextPendingJob,
  updateJobStatus,
  failOrRetryJob,
  recoverStaleJobs,
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
} = require('../services/svg-renderer-service');
const {
  buildFrameSequence,
  calculateVideoParams,
  generateFrameConcat,
} = require('../services/storyboard-service');
const { runMigrations, closePool, query } = require('../services/db-service');
const { getWorkerPool, terminateWorkerPool } = require('../services/worker-pool');

process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});

/**
 * Process a single export job
 * PRINCIPLE: MODULAR - Clear separation of audio vs video paths
 */
async function processExportJob(job) {
  const workerInfo = `[Worker ${process.env.WORKER_ID} PID:${process.pid}]`;
  console.log(`${workerInfo} 📥 Processing export: ${job.jobId} (${job.kind})`);

  const { jobId, kind, audioUrl, manifest, template, style } = job;
  const startTime = Date.now();
  const tempFiles = [];

  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing', { progress: 5 });

    // Step 1: Download audio file
    console.log(`${workerInfo} Downloading audio...`);
    const inputFileName = `${jobId}_input.webm`;
    const inputPath = await downloadFile(audioUrl, inputFileName);
    tempFiles.push(inputPath);
    await updateJobStatus(jobId, 'processing', { progress: 20 });

    // Step 2: Route to appropriate processor
    let outputPath;
    if (kind === 'mp3') {
      console.log(`${workerInfo} Processing MP3...`);
      outputPath = await processAudioExport(jobId, inputPath, tempFiles, workerInfo);
      await updateJobStatus(jobId, 'processing', { progress: 80 });
    } else if (kind === 'mp4') {
      if (!manifest) {
        throw new Error('MP4 export requires storyboard manifest');
      }
      if (!template) {
        throw new Error('MP4 export requires template data');
      }
      console.log(`${workerInfo} Processing MP4...`);
      outputPath = await processVideoExport(jobId, inputPath, manifest, template, style, tempFiles, workerInfo);
    } else {
      throw new Error(`Unsupported export kind: ${kind}`);
    }

    // Step 3: Move to permanent storage
    const finalPath = moveToOutput(outputPath, jobId, kind);
    const publicUrl = getPublicUrl(finalPath);

    // Step 4: Get file size
    const fileSize = fs.statSync(finalPath).size;

    // Step 5: Mark complete
    const duration = Date.now() - startTime;
    await updateJobStatus(jobId, 'completed', {
      outputUrl: publicUrl,
      outputSize: fileSize,
      progress: 100,
    });

    console.log(`${workerInfo} ✅ Export complete: ${jobId} (${(fileSize / 1024 / 1024).toFixed(2)}MB, ${(duration / 1000).toFixed(1)}s)`);

    return { jobId, status: 'completed', publicUrl, fileSize };
  } catch (error) {
    console.error(`${workerInfo} ❌ Export failed: ${jobId}`, error.message);

    const outcome = await failOrRetryJob(
      jobId,
      error.message,
      job.attempts || 1,
    );
    if (outcome === 'retry') {
      console.log(`${workerInfo} ↻ Job ${jobId} scheduled for retry (attempt ${job.attempts}/${require('../services/export-service').MAX_ATTEMPTS})`);
    }

    throw error;
  } finally {
    // Cleanup temp files
    cleanupTempFiles(tempFiles);
  }
}

/**
 * Audio-only export path
 */
async function processAudioExport(jobId, audioPath, tempFiles, workerInfo) {
  const outputPath = path.join('/tmp/voisss-exports', `${jobId}.mp3`);
  console.log(`${workerInfo} Encoding to MP3...`);
  await encodeAudio(audioPath, 'mp3', outputPath);
  tempFiles.push(outputPath);
  return outputPath;
}

/**
 * Video export path
 */
async function processVideoExport(jobId, audioPath, manifest, template, style, tempFiles, workerInfo) {
  const outputDir = require('../services/ffmpeg-service').TEMP_DIR;

  try {
    console.log(`${workerInfo} 📹 Starting video composition`);
    console.log(`${workerInfo}    Segments: ${manifest.segments.length}`);

    // Step 1: Build frame sequence with template-styled SVG frames
    const frameData = await buildFrameSequence(manifest, template, style, jobId);

    // Step 2: Render SVG frames to PNG using Worker Thread Pool
    console.log(`${workerInfo} 🎨 Rendering ${frameData.length} frames...`);
    const pool = getWorkerPool();
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
          updateJobStatus(jobId, 'processing', { progress: renderProgress }).catch(() => { });
        }

        return result.path;
      });
    });

    const renderedFrames = await Promise.all(renderPromises);
    renderedFrames.forEach(p => tempFiles.push(p));

    // Step 3: Calculate video parameters
    const videoParams = calculateVideoParams(frameData, frameData[frameData.length - 1]?.endMs || 1000);
    console.log(`${workerInfo}    FPS: ${videoParams.fps}, Frames: ${frameData.length}`);

    // Step 4: Generate FFmpeg concat file
    const concatPath = path.join(outputDir, `${jobId}_concat.txt`);
    const concatList = generateFrameConcat(frameData, outputDir, jobId, videoParams.fps);
    fs.writeFileSync(concatPath, concatList);
    tempFiles.push(concatPath);

    // Step 5: Compose video with audio
    const outputPath = path.join(outputDir, `${jobId}.mp4`);
    console.log(`${workerInfo} 🎬 Composing video with audio...`);
    await composeVideoWithAudio(concatPath, audioPath, outputPath);
    tempFiles.push(outputPath);

    console.log(`${workerInfo} ✅ Video composition complete`);
    return outputPath;
  } catch (error) {
    console.error(`${workerInfo} ❌ Video export failed:`, error.message);
    throw error;
  }
}

/**
 * Main worker loop - polls database for jobs
 */
async function startWorker() {
  console.log('🚀 Export Worker Starting...');
  const workerId = process.env.WORKER_ID || `worker-${process.pid}`;
  console.log(`   Worker ID: ${workerId}`);

  try {
    // Run migrations and verify DB
    await runMigrations();
    const { rows } = await query('SELECT 1');
    console.log('✅ Database connection verified');

    const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds
    let consecutiveEmptyPolls = 0;
    let lastRecoverySweep = 0;
    const RECOVERY_SWEEP_INTERVAL_MS = 60000; // Sweep stale leases every minute

    console.log(`✅ Worker ready, polling database every ${POLL_INTERVAL_MS}ms`);

    // Poll loop
    while (true) {
      try {
        // Crash recovery: requeue jobs abandoned by dead workers
        const now = Date.now();
        if (now - lastRecoverySweep > RECOVERY_SWEEP_INTERVAL_MS) {
          lastRecoverySweep = now;
          const recovered = await recoverStaleJobs();
          if (recovered.requeued > 0 || recovered.failed > 0) {
            console.log(`${workerInfo} 🧹 Lease sweep: ${recovered.requeued} requeued, ${recovered.failed} permanently failed`);
          }
        }

        const job = await getNextPendingJob();

        if (!job) {
          consecutiveEmptyPolls++;
          if (consecutiveEmptyPolls % 10 === 0) {
            console.log(`⏳ No pending jobs (${consecutiveEmptyPolls * POLL_INTERVAL_MS / 1000}s idle)`);
          }
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          continue;
        }

        // Reset counter when we get a job
        consecutiveEmptyPolls = 0;

        // Process the job
        await processExportJob(job);

      } catch (error) {
        console.error('Error in job processing:', error.message);
        // Continue polling despite errors
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      }
    }
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
  await terminateWorkerPool();
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
