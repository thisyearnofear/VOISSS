/**
 * FFmpeg Service
 * Handles all audio/video encoding operations
 * PRINCIPLE: MODULAR - Composable encoding operations
 * PRINCIPLE: CLEAN - Single responsibility for encoding
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const TEMP_DIR = process.env.EXPORT_TEMP_DIR || '/tmp/voisss-exports';
const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || '/var/www/voisss-exports';

// Ensure directories exist
[TEMP_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Get FFmpeg command for format
 * PRINCIPLE: DRY - Single source of encoding parameters
 */
function getFFmpegCommand(format, inputPath, outputPath) {
  const commands = {
    mp3: `ffmpeg -i "${inputPath}" -q:a 5 -codec:a libmp3lame "${outputPath}"`,
    mp4: `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac "${outputPath}"`,
  };

  if (!commands[format]) {
    throw new Error(`Unsupported format: ${format}`);
  }

  return commands[format];
}

/**
 * Encode audio file to target format
 * PRINCIPLE: PERFORMANT - Uses FFmpeg with reasonable quality settings
 */
async function encodeAudio(inputPath, format, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const cmd = getFFmpegCommand(format, inputPath, outputPath);

  try {
    console.log(`Encoding ${format}: ${inputPath} → ${outputPath}`);
    await execAsync(cmd, {
      timeout: 300000, // 5 minutes max
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg encoding failed: output file not created');
    }

    const stats = fs.statSync(outputPath);
    console.log(`✅ Encoding complete: ${outputPath} (${stats.size} bytes)`);

    return {
      path: outputPath,
      size: stats.size,
      format,
    };
  } catch (error) {
    // Cleanup failed output
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw new Error(`FFmpeg encoding failed: ${error.message}`);
  }
}

/**
 * Download file from URL to temp location
 * PRINCIPLE: CLEAN - Separate concern from encoding
 */
async function downloadFile(url, tempFileName) {
  const tempPath = path.join(TEMP_DIR, tempFileName);
  const fetch = require('node-fetch');

  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url, { timeout: 30000 });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(tempPath, buffer);

    console.log(`✅ Downloaded: ${tempPath} (${buffer.length} bytes)`);
    return tempPath;
  } catch (error) {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Move file from temp to output directory
 * PRINCIPLE: CLEAN - Explicit file management
 */
function moveToOutput(tempPath, jobId, format) {
  const outputFileName = `${jobId}.${format === 'mp3' ? 'mp3' : 'mp4'}`;
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  fs.renameSync(tempPath, outputPath);
  return outputPath;
}

/**
 * Cleanup temp files
 * PRINCIPLE: PERFORMANT - Reduce disk usage
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
 * PRINCIPLE: MODULAR - Configurable based on storage backend
 */
function getPublicUrl(outputPath) {
  const baseUrl = process.env.EXPORT_PUBLIC_URL || 'http://localhost:5577';
  const fileName = path.basename(outputPath);
  return `${baseUrl}/exports/${fileName}`;
}

module.exports = {
  encodeAudio,
  downloadFile,
  moveToOutput,
  cleanupTempFiles,
  getPublicUrl,
  TEMP_DIR,
  OUTPUT_DIR,
};
