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

const DEFAULT_TEMPLATE = {
  aspect: 'portrait',
  background: { type: 'solid', colors: ['#0A0A0A'] },
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSizePx: 64,
    lineHeight: 1.2,
    fontWeight: '700',
    textColor: '#FFFFFF',
    mutedColor: '#666666',
  },
  layout: {
    paddingPx: 80,
    maxCharsPerLine: 30,
  },
};

/**
 * Generate styled SVG frame from segment text and template
 * Supports word-level highlighting for karaoke effect
 * PRINCIPLE: CLEAN - Full template rendering logic in one place
 */
function generateSvgFrame(segment, templateData, frameIdx, activeWordIndex = -1) {
  // Deep merge default template with provided data
  const template = {
    ...DEFAULT_TEMPLATE,
    ...templateData,
    background: { ...DEFAULT_TEMPLATE.background, ...(templateData.background || {}) },
    typography: { ...DEFAULT_TEMPLATE.typography, ...(templateData.typography || {}) },
    layout: { ...DEFAULT_TEMPLATE.layout, ...(templateData.layout || {}) },
  };

  const dim = DIMENSIONS[template.aspect] || DIMENSIONS.portrait;
  const bgId = `bg_${frameIdx}`;

  // Background
  const bgFill = template.background.type === 'gradient'
    ? `url(#${bgId})`
    : escapeXml((template.background.colors && template.background.colors[0]) || '#0A0A0A');

  const defs = template.background.type === 'gradient'
    ? `<defs>${generateGradientSvg(bgId, template.background.colors || [])}</defs>`
    : '';

  // Typography
  const fontFamily = escapeXml(template.typography.fontFamily);
  const fontSize = template.typography.fontSizePx;
  const lineHeightPx = Math.round(fontSize * template.typography.lineHeight);
  const fontWeight = template.typography.fontWeight;
  const textColor = escapeXml(template.typography.textColor);
  const mutedColor = escapeXml(template.typography.mutedColor || '#666666');
  const activeColor = escapeXml(template.typography.textColor);

  // Layout
  const x = template.layout.paddingPx;
  const y0 = Math.round(dim.h * 0.5); // Center vertically

  // Process words into lines with highlight information
  const maxCharsPerLine = template.layout.maxCharsPerLine || 30;
  const words = segment.words || segment.text.split(/\s+/).map(w => ({ word: w }));

  const lines = [];
  let currentLine = { words: [] };
  let currentLen = 0;

  words.forEach((w, idx) => {
    const wordText = w.word;
    if (currentLen + wordText.length > maxCharsPerLine && currentLine.words.length > 0) {
      lines.push(currentLine);
      currentLine = { words: [] };
      currentLen = 0;
    }
    currentLine.words.push({ ...w, globalIndex: idx });
    currentLen += wordText.length + 1;
  });
  if (currentLine.words.length > 0) lines.push(currentLine);

  // Vertical adjustment to center the whole block
  const totalHeight = lines.length * lineHeightPx;
  const startY = y0 - (totalHeight / 2);

  // Render text lines with tspans for word-level coloring
  const textXml = lines
    .map((line, li) => {
      const y = startY + li * lineHeightPx;
      const tspans = line.words.map((w) => {
        const isPast = activeWordIndex !== -1 && w.globalIndex < activeWordIndex;
        const isActive = activeWordIndex !== -1 && w.globalIndex === activeWordIndex;

        let color = mutedColor;
        let weight = fontWeight;

        if (isActive) {
          color = activeColor;
          weight = '900'; // Bold active word
        } else if (isPast) {
          color = textColor;
        }

        return `<tspan fill="${color}" font-weight="${weight}">${escapeXml(w.word)} </tspan>`;
      }).join('');

      return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}">${tspans}</text>`;
    })
    .join('');

  // Build SVG
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">
  ${defs}
  <rect width="100%" height="100%" fill="${bgFill}"/>
  <rect x="${template.layout.paddingPx / 2}" y="${template.layout.paddingPx / 2}" width="${dim.w - template.layout.paddingPx}" height="${dim.h - template.layout.paddingPx}" fill="rgba(0,0,0,0.08)" rx="32"/>
  ${textXml}
  <text x="${x}" y="${dim.h - template.layout.paddingPx}" fill="${mutedColor}" font-family="${fontFamily}" font-size="28" font-weight="700" opacity="0.6">VOISSS</text>
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
    console.log(`\n📽️  Building word-level frame sequence: ${jobId}`);

    const frameData = [];
    let frameIdx = 0;
    let lastEndMs = 0;

    manifest.segments.forEach((segment) => {
      // 1. Handle gap before segment if needed
      if (segment.startMs > lastEndMs + 10) {
        frameData.push({
          type: 'idle',
          startMs: lastEndMs,
          endMs: segment.startMs,
          durationMs: segment.startMs - lastEndMs,
          frameIndex: frameIdx++,
          svg: generateSvgFrame(segment, template, frameIdx, -1)
        });
      }

      const words = segment.words || [];
      if (words.length === 0) {
        frameData.push({
          text: segment.text,
          startMs: segment.startMs,
          endMs: segment.endMs,
          durationMs: segment.endMs - segment.startMs,
          frameIndex: frameIdx++,
          svg: generateSvgFrame(segment, template, frameIdx, -1)
        });
      } else {
        // 2. Generate a frame for each word
        words.forEach((word, wi) => {
          if (word.startMs > lastEndMs + 10 && wi > 0) {
            frameData.push({
              type: 'pause',
              startMs: lastEndMs,
              endMs: word.startMs,
              durationMs: word.startMs - lastEndMs,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, frameIdx, wi - 1)
            });
          }

          frameData.push({
            text: word.word,
            startMs: word.startMs,
            endMs: word.endMs,
            durationMs: word.endMs - word.startMs,
            frameIndex: frameIdx++,
            svg: generateSvgFrame(segment, template, frameIdx, wi),
          });
          lastEndMs = word.endMs;
        });
      }
      lastEndMs = segment.endMs;
    });

    console.log(`✅ Frame sequence built: ${frameData.length} word-level frames`);
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

  frameData.forEach((frame, idx) => {
    const framePath = `${outputDir}/${jobId}_frame_${String(idx).padStart(4, '0')}.png`;

    // Each frame duration in seconds
    // No more 0.95 scale; use exact timing.
    const duration = frame.durationMs / 1000;

    // FFmpeg requires a duration for each file. 
    // The last frame is usually problematic but FFmpeg handles it if provided.
    concatList += `file '${framePath}'\nduration ${Math.max(0.01, duration)}\n`;
  });

  return concatList;
}

module.exports = {
  buildFrameSequence,
  calculateVideoParams,
  generateFrameConcat,
};
