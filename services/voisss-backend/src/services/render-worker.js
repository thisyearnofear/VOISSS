/**
 * Render Worker Thread
 * Handles SVG to PNG conversion (CPU-intensive task)
 */

const { parentPort } = require('worker_threads');
const sharp = require('sharp');
const fs = require('fs');

parentPort.on('message', async (taskData) => {
  try {
    const { svg, outputPath } = taskData;

    // Render SVG to PNG using Sharp
    const buffer = await sharp(Buffer.from(svg))
      .png({ quality: 80, compressionLevel: 6 })
      .toFile(outputPath);

    parentPort.postMessage({
      success: true,
      path: outputPath,
      size: buffer.size,
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
    });
  }
});
