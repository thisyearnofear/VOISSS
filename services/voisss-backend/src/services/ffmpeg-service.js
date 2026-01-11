/**
 * FFmpeg Service - Optimized
 * Uses fluent-ffmpeg for proper process management and better error handling
 * PRINCIPLE: PERFORMANT - Streaming, proper resource cleanup
 * PRINCIPLE: MODULAR - Reusable encoding operations
 */

const FFmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const TEMP_DIR = process.env.EXPORT_TEMP_DIR || '/tmp/voisss-exports';
const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || '/var/www/voisss-exports';

// Ensure directories exist
[TEMP_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Encode audio file to target format
 * PRINCIPLE: PERFORMANT - Proper FFmpeg resource handling with fluent-ffmpeg
 */
async function encodeAudio(inputPath, format, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      return reject(new Error(`Input file not found: ${inputPath}`));
    }

    console.log(`Encoding ${format}: ${inputPath} → ${outputPath}`);
    
    const timeout = format === 'mp3' ? 180000 : 600000;
    let command = FFmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioQuality(5)
      .format('mp3')
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r  Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('error', (err) => {
        console.error('\n❌ FFmpeg error:', err.message);
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {}
        }
        reject(new Error(`FFmpeg encoding failed: ${err.message}`));
      })
      .on('end', () => {
        console.log('\n✅ Encoding complete');
        const stats = fs.statSync(outputPath);
        resolve({
          path: outputPath,
          size: stats.size,
          format,
        });
      });

    // Set timeout
    setTimeout(() => {
      command.kill();
      reject(new Error(`FFmpeg encoding timeout after ${timeout}ms`));
    }, timeout);

    command.save(outputPath);
  });
}

/**
 * Compose video from frame sequence + audio
 * Uses concat demuxer for fast frame composition
 */
async function composeVideoWithAudio(frameConcat, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(frameConcat)) {
      return reject(new Error(`Frame concat file not found: ${frameConcat}`));
    }
    if (!fs.existsSync(audioPath)) {
      return reject(new Error(`Audio file not found: ${audioPath}`));
    }

    console.log(`🎬 Composing video: ${outputPath}`);
    
    const timeout = 600000; // 10 minutes
    let command = FFmpeg()
      .input(`concat:${frameConcat}`)
      .input(audioPath)
      .videoCodec('libx264')
      .videoFilter('scale=1920:1080:force_original_aspect_ratio=decrease')
      .fps(30)
      .outputOptions([
        '-preset fast',  // Use outputOptions instead of preset()
        '-crf 23',
        '-c:a aac',
        '-ac 2',
        '-b:a 128k',
        '-shortest',
        '-movflags +faststart' // Enable streaming
      ])
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r  Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('error', (err) => {
        console.error('\n❌ Video composition failed:', err.message);
        if (fs.existsSync(outputPath)) {
          try {
            fs.unlinkSync(outputPath);
          } catch (e) {}
        }
        reject(new Error(`Video composition failed: ${err.message}`));
      })
      .on('end', () => {
        console.log('\n✅ Video composition complete');
        const stats = fs.statSync(outputPath);
        resolve({
          path: outputPath,
          size: stats.size,
          format: 'mp4',
        });
      });

    setTimeout(() => {
      command.kill();
      reject(new Error(`Video composition timeout after ${timeout}ms`));
    }, timeout);

    command.save(outputPath);
  });
}

/**
 * Download file from URL to temp location
 */
async function downloadFile(url, tempFileName) {
  const tempPath = path.join(TEMP_DIR, tempFileName);

  try {
    // Handle file:// URLs (local files)
    if (url.startsWith('file://')) {
      const filePath = url.slice(7);
      console.log(`Copying local file: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      fs.copyFileSync(filePath, tempPath);
      const stats = fs.statSync(tempPath);
      console.log(`✅ Copied: ${tempPath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      return tempPath;
    }

    // Handle HTTP(S) URLs
    const fetch = require('node-fetch');
    console.log(`Downloading: ${url}`);
    const response = await fetch(url, { timeout: 30000 });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(tempPath, buffer);

    console.log(`✅ Downloaded: ${tempPath} (${(buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    return tempPath;
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {}
    }
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Move file from temp to output directory
 */
function moveToOutput(tempPath, jobId, format) {
  const outputFileName = `${jobId}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  fs.renameSync(tempPath, outputPath);
  return outputPath;
}

/**
 * Cleanup temp files
 */
function cleanupTempFiles(files) {
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up: ${filePath}`);
      } catch (error) {
        console.error(`Failed to cleanup ${filePath}:`, error);
      }
    }
  });
}

/**
 * Get public URL for output file
 */
function getPublicUrl(outputPath) {
  const baseUrl = process.env.EXPORT_PUBLIC_URL || 'http://localhost:5577';
  const fileName = path.basename(outputPath);
  return `${baseUrl}/exports/${fileName}`;
}

module.exports = {
  encodeAudio,
  composeVideoWithAudio,
  downloadFile,
  moveToOutput,
  cleanupTempFiles,
  getPublicUrl,
  TEMP_DIR,
  OUTPUT_DIR,
};
