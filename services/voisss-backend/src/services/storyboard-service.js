/**
 * Storyboard Service
 * Processes export manifests into timed frame sequences with template rendering
 * PRINCIPLE: MODULAR - Standalone storyboard processing
 * PRINCIPLE: CLEAN - Explicit frame timing and SVG generation
 */

const { renderSvgsToFrames } = require('./svg-renderer-service');

// Dimensions for each aspect ratio
const DIMENSIONS = {
  portrait: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
  landscape: { w: 1920, h: 1080 },
};

/**
 * Escape XML special characters
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
 * Generate SVG gradient definition
 */
function generateGradientSvg(id, colors) {
  const stops = colors.length ? colors : ['#0A0A0A', '#1A1A1A'];
  const stopsXml = stops
    .map((c, i) => {
      const offset = Math.round((i / Math.max(1, stops.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${escapeXml(c)}" />`;
    })
    .join('');

  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stopsXml}</linearGradient>`;
}

/**
 * Generate styled SVG frame from segment text and template
 * PRINCIPLE: CLEAN - Full template rendering logic in one place
 */
function generateSvgFrame(segment, template, frameIdx) {
  const dim = DIMENSIONS[template.aspect] || DIMENSIONS.portrait;
  const bgId = `bg_${frameIdx}`;
  
  // Background
  const bgFill = template.background.type === 'gradient'
    ? `url(#${bgId})`
    : escapeXml(template.background.colors[0] || '#0A0A0A');

  const defs = template.background.type === 'gradient'
    ? `<defs>${generateGradientSvg(bgId, template.background.colors)}</defs>`
    : '';

  // Typography
  const fontFamily = escapeXml(template.typography.fontFamily);
  const fontSize = template.typography.fontSizePx;
  const lineHeightPx = Math.round(fontSize * template.typography.lineHeight);
  const fontWeight = template.typography.fontWeight;
  const textColor = escapeXml(template.typography.textColor);
  const mutedColor = escapeXml(template.typography.mutedColor);

  // Layout
  const x = template.layout.paddingPx;
  const y0 = Math.round(dim.h * 0.55);

  // Split text into lines based on max chars
  const maxCharsPerLine = template.layout.maxCharsPerLine || 40;
  const words = segment.text.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Render text lines
  const textXml = lines
    .map((line, li) => {
      const y = y0 + li * lineHeightPx;
      return `<text x="${x}" y="${y}" fill="${textColor}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}">${escapeXml(line)}</text>`;
    })
    .join('');

  // Build SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">
  ${defs}
  <rect width="100%" height="100%" fill="${bgFill}"/>
  <rect x="${template.layout.paddingPx / 2}" y="${template.layout.paddingPx / 2}" width="${dim.w - template.layout.paddingPx}" height="${dim.h - template.layout.paddingPx}" fill="rgba(0,0,0,0.12)" rx="24"/>
  ${textXml}
  <text x="${x}" y="${dim.h - template.layout.paddingPx}" fill="${mutedColor}" font-family="${fontFamily}" font-size="24" font-weight="600">VOISSS</text>
</svg>`;

  return svg;
}

/**
 * Build frame sequence from manifest with styled SVGs
 * Maps transcript segments to visual frames with precise timing and template rendering
 * PRINCIPLE: CLEAN - Single responsibility for frame generation
 */
async function buildFrameSequence(manifest, template, jobId) {
  try {
    console.log(`\n📽️  Building frame sequence: ${jobId}`);
    console.log(`   Segments: ${manifest.segments.length}`);

    // Generate styled SVG for each segment
    const frameData = manifest.segments.map((segment, idx) => ({
      text: segment.text,
      startMs: segment.startMs,
      endMs: segment.endMs,
      durationMs: segment.endMs - segment.startMs,
      frameIndex: idx,
      svg: generateSvgFrame(segment, template, idx),
    }));

    console.log(`✅ Frame sequence built: ${frameData.length} frames with template styling`);
    return frameData;
  } catch (error) {
    throw new Error(`Frame sequence building failed: ${error.message}`);
  }
}

/**
 * Calculate frame rate and duration from sequence
 * PRINCIPLE: PERFORMANT - Determine optimal encoding parameters
 */
function calculateVideoParams(frameData, audioLengthMs) {
  const numFrames = frameData.length;
  const videoDurationMs = audioLengthMs;
  
  // Adaptive FPS based on content
  let fps = 24; // default
  if (numFrames > 60) fps = 30; // More frames = higher fps
  if (numFrames > 120) fps = 60;

  const expectedFrames = Math.round((videoDurationMs / 1000) * fps);
  
  return {
    fps,
    numFrames,
    videoDurationMs,
    framePerMs: fps / 1000,
  };
}

/**
 * Create frame metadata for FFmpeg concat
 * PRINCIPLE: CLEAN - Separate concern for frame timing
 */
function generateFrameConcat(frameData, outputDir, jobId, fps = 24) {
  let concatList = '';
  const msPerFrame = 1000 / fps;

  frameData.forEach((frame, idx) => {
    const framePath = `${outputDir}/${jobId}_frame_${String(idx).padStart(4, '0')}.png`;
    // Each frame duration in seconds (with padding for audio sync)
    const duration = (frame.durationMs / 1000) * 0.95; // slight adjustment
    concatList += `file '${framePath}'\nduration ${Math.max(0.04, duration)}\n`;
  });

  return concatList;
}

module.exports = {
  buildFrameSequence,
  calculateVideoParams,
  generateFrameConcat,
};
