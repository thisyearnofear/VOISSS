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
  moveToOutput, 
  cleanupTempFiles, 
  getPublicUrl,
} = require('../services/ffmpeg-service');
const { runMigrations, closePool } = require('../services/db-service');

const path = require('path');

/**
 * Process a single export job
 * PRINCIPLE: CLEAN - Single responsibility, clear error handling
 */
async function processExportJob(job) {
  const { jobId, kind, audioUrl, transcriptId, userId } = job.data;
  const startTime = Date.now();
  const tempFiles = [];

  console.log(`\n▶️  Processing export: ${jobId} (${kind})`);

  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing', { workerId: process.env.WORKER_ID });

    // Step 1: Download audio
    const inputFileName = `${jobId}_input.webm`;
    const inputPath = await downloadFile(audioUrl, inputFileName);
    tempFiles.push(inputPath);

    // Step 2: Encode (format-specific)
    let outputPath;
    if (kind === 'mp3') {
      outputPath = path.join('/tmp/voisss-exports', `${jobId}.mp3`);
      await encodeAudio(inputPath, 'mp3', outputPath);
    } else if (kind === 'mp4') {
      outputPath = path.join('/tmp/voisss-exports', `${jobId}.mp4`);
      await encodeAudio(inputPath, 'mp4', outputPath);
    } else {
      throw new Error(`Unsupported export kind: ${kind}`);
    }
    tempFiles.push(outputPath);

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
