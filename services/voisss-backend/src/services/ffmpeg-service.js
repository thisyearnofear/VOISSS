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
function getFFmpegCommand(format, inputPath, outputPath, options = {}) {
  const commands = {
    // Audio only - simple encoding
    mp3: `ffmpeg -i "${inputPath}" -q:a 5 -codec:a libmp3lame "${outputPath}"`,
    
    // Video with audio track
    mp4_with_audio: `ffmpeg -f concat -safe 0 -i "${options.frameConcat}" -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -shortest "${outputPath}"`,
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
async function encodeAudio(inputPath, format, outputPath, options = {}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const cmd = getFFmpegCommand(format, inputPath, outputPath, options);

  try {
    console.log(`Encoding ${format}: ${inputPath} → ${outputPath}`);
    await execAsync(cmd, {
      timeout: format === 'mp3' ? 180000 : 600000, // Audio: 3min, Video: 10min
      maxBuffer: 20 * 1024 * 1024, // 20MB buffer for video
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg encoding failed: output file not created');
    }

    const stats = fs.statSync(outputPath);
    console.log(`✅ Encoding complete: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

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
 * Compose video from frames + audio
 * PRINCIPLE: MODULAR - Handles video-specific FFmpeg logic
 */
async function composeVideoWithAudio(frameConcat, audioPath, outputPath) {
  if (!fs.existsSync(frameConcat)) {
    throw new Error(`Frame concat file not found: ${frameConcat}`);
  }
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  return encodeAudio(audioPath, 'mp4_with_audio', outputPath, { frameConcat });
}

/**
 * Download file from URL to temp location
 * PRINCIPLE: CLEAN - Separate concern from encoding
 */
async function downloadFile(url, tempFileName) {
  const tempPath = path.join(TEMP_DIR, tempFileName);

  try {
    // Handle file:// URLs (local files)
    if (url.startsWith('file://')) {
      const filePath = url.slice(7); // Remove 'file://'
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
      } catch (e) {
        // ignore cleanup errors
      }
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
  composeVideoWithAudio,
  downloadFile,
  moveToOutput,
  cleanupTempFiles,
  getPublicUrl,
  TEMP_DIR,
  OUTPUT_DIR,
};
