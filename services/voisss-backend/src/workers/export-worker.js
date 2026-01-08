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
      outputPath = await processVideoExport(jobId, inputPath, manifest, tempFiles);
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
async function processVideoExport(jobId, audioPath, manifest, tempFiles) {
  const fs = require('fs');
  const outputDir = require('../services/ffmpeg-service').TEMP_DIR;

  try {
    console.log(`\n📹 Starting video composition: ${jobId}`);
    console.log(`   Segments: ${manifest.segments.length}`);

    // Step 1: Build frame sequence from manifest
    const frameData = await buildFrameSequence(manifest, {}, jobId);
    
    // Step 2: Generate SVG frames for each segment
    // For now, create simple placeholder frames with segment text
    // In production, this would render actual template visuals
    const svgFrames = frameData.map((frame, idx) => {
      const dims = {
        portrait: { w: 1080, h: 1920 },
        square: { w: 1080, h: 1080 },
        landscape: { w: 1920, h: 1080 },
      }[manifest.aspect] || { w: 1080, h: 1920 };

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dims.w}" height="${dims.h}" viewBox="0 0 ${dims.w} ${dims.h}">
  <rect width="100%" height="100%" fill="#0A0A0A"/>
  <text x="40" y="${dims.h / 2}" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="48" font-weight="bold" word-wrap="break-word" width="${dims.w - 80}">
    ${escapeXml(frame.text)}
  </text>
  <text x="40" y="${dims.h - 60}" fill="#888888" font-family="Arial, sans-serif" font-size="20">VOISSS</text>
</svg>`;
    });

    // Step 3: Render SVG frames to PNG
    console.log(`🎨 Rendering ${svgFrames.length} frames to PNG...`);
    const frameResults = await Promise.all(
      svgFrames.map((svg, idx) => 
        renderSvgToPng(svg, path.join(outputDir, `${jobId}_frame_${String(idx).padStart(4, '0')}.png`))
      )
    );
    frameResults.forEach(p => tempFiles.push(p));

    // Step 4: Calculate video parameters
    const videoParams = calculateVideoParams(frameData, frameData[frameData.length - 1]?.endMs || 1000);
    console.log(`   FPS: ${videoParams.fps}, Frames: ${videoParams.numFrames}`);

    // Step 5: Generate FFmpeg concat demuxer file
    const concatPath = path.join(outputDir, `${jobId}_concat.txt`);
    const concatList = generateFrameConcat(frameData, outputDir, jobId, videoParams.fps);
    fs.writeFileSync(concatPath, concatList);
    tempFiles.push(concatPath);
    console.log(`📋 Frame concat file: ${concatPath}`);

    // Step 6: Compose video with audio using FFmpeg
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
 * Helper to escape XML special characters
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
