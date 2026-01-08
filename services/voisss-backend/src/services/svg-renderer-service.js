/**
 * SVG Renderer Service
 * Converts SVG strings to PNG images
 * PRINCIPLE: MODULAR - Isolated concern for rendering
 * PRINCIPLE: PERFORMANT - Uses sharp for fast image processing
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = process.env.EXPORT_TEMP_DIR || '/tmp/voisss-exports';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Render SVG to PNG using sharp
 * PRINCIPLE: CLEAN - Single responsibility
 */
async function renderSvgToPng(svgString, outputPath, dimensions = { w: 1080, h: 1920 }) {
  try {
    // sharp can render SVG directly if librsvg is available
    // Otherwise, convert SVG buffer to PNG
    const buffer = Buffer.from(svgString, 'utf-8');
    
    console.log(`Rendering SVG → PNG: ${outputPath}`);
    
    const result = await sharp(buffer, { density: 150 })
      .png({ quality: 90 })
      .toFile(outputPath);

    console.log(`✅ SVG rendered: ${outputPath} (${(result.size / 1024).toFixed(1)}KB)`);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        // ignore cleanup errors
      }
    }
    throw new Error(`SVG rendering failed: ${error.message}`);
  }
}

/**
 * Batch render SVGs to PNGs
 * PRINCIPLE: PERFORMANT - Process multiple files efficiently
 */
async function renderSvgsToFrames(svgArray, jobId, maxParallel = 4) {
  const results = [];
  
  // Process in batches to avoid overwhelming system
  for (let i = 0; i < svgArray.length; i += maxParallel) {
    const batch = svgArray.slice(i, i + maxParallel);
    const batchPromises = batch.map(async (svg, idx) => {
      const frameNum = i + idx;
      const outputPath = path.join(TEMP_DIR, `${jobId}_frame_${String(frameNum).padStart(4, '0')}.png`);
      const pngPath = await renderSvgToPng(svg);
      return { frameNum, path: pngPath };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generate SVG frames from storyboard manifest
 * PRINCIPLE: DRY - Reuses carousel SVG rendering logic
 */
function generateSvgsFromManifest(manifest, template) {
  // This will be called with the manifest from frontend
  // and will generate SVG strings for each segment
  // Implementation depends on template structure
  return manifest.segments.map((seg, idx) => {
    // SVG generation logic - simplified for now
    return `<svg><!-- frame ${idx} for segment ${seg.text} --></svg>`;
  });
}

module.exports = {
  renderSvgToPng,
  renderSvgsToFrames,
  generateSvgsFromManifest,
  TEMP_DIR,
};
