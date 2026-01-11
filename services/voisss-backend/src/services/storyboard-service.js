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
function generateSvgFrame(segment, templateData, style, frameIdx, activeWordIndex = -1, scaleFactor = 1) {
  // Deep merge default template with provided data
  const template = {
    ...DEFAULT_TEMPLATE,
    ...templateData,
    background: { ...DEFAULT_TEMPLATE.background, ...(templateData.background || {}) },
    typography: { ...DEFAULT_TEMPLATE.typography, ...(templateData.typography || {}) },
    layout: { ...DEFAULT_TEMPLATE.layout, ...(templateData.layout || {}) },
  };

  // Map user style overrides
  if (style) {
    if (style.fontFamily) {
      const FONT_MAP = {
        'Sans': '"DejaVu Sans", sans-serif',
        'Serif': '"DejaVu Serif", serif',
        'Mono': '"DejaVu Sans Mono", monospace',
      };
      template.typography.fontFamily = FONT_MAP[style.fontFamily] || template.typography.fontFamily;
    }
    if (style.theme) {
      if (style.theme.background) template.background.colors = [style.theme.background];
      if (style.theme.textInactive) template.typography.mutedColor = style.theme.textInactive;
      if (style.theme.textActive) template.typography.highlightColor = style.theme.textActive;
      if (style.theme.textPast) template.typography.textColor = style.theme.textPast;
    }
  }

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
  const baseFontSize = template.typography.fontSizePx;
  const lineHeightPx = Math.round(baseFontSize * template.typography.lineHeight);
  const fontWeight = template.typography.fontWeight;
  const textColor = escapeXml(template.typography.textColor || '#FFFFFF');
  const mutedColor = escapeXml(template.typography.mutedColor || '#666666');
  const activeColor = escapeXml(template.typography.highlightColor || template.typography.activeColor || '#FF006B');

  // Layout
  const x0 = template.layout.paddingPx;
  const y0 = Math.round(dim.h * 0.5); // Center vertically

  // Process words into lines
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

  const totalHeight = lines.length * lineHeightPx;
  const startY = y0 - (totalHeight / 2);

  // Render text lines
  const textXml = lines
    .map((line, li) => {
      const y = startY + li * lineHeightPx;
      const tspans = line.words.map((w) => {
        let color = textColor;
        let weight = fontWeight;
        let fsize = baseFontSize;

        if (activeWordIndex !== -1) {
          if (w.globalIndex === activeWordIndex) {
            color = activeColor;
            weight = '900';
            fsize = Math.round(baseFontSize * scaleFactor);
          } else if (w.globalIndex < activeWordIndex) {
            color = textColor;
          } else {
            color = mutedColor;
          }
        }

        return `<tspan fill="${color}" font-weight="${weight}" font-size="${fsize}">${escapeXml(w.word)} </tspan>`;
      }).join('');

      return `<text x="${dim.w / 2}" y="${y}" font-family="${fontFamily}" text-anchor="middle">${tspans}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">
  ${defs}
  <rect width="100%" height="100%" fill="${bgFill}"/>
  <rect x="${template.layout.paddingPx / 2}" y="${template.layout.paddingPx / 2}" width="${dim.w - template.layout.paddingPx}" height="${dim.h - template.layout.paddingPx}" fill="rgba(0,0,0,0.04)" rx="48"/>
  ${textXml}
  <text x="${dim.w / 2}" y="${dim.h - template.layout.paddingPx}" fill="${mutedColor}" font-family="${fontFamily}" font-size="28" font-weight="800" opacity="0.4" text-anchor="middle">VOISSS</text>
</svg>`;
}

/**
 * Build frame sequence from manifest with styled SVGs
 * Maps transcript segments to visual frames with precise timing and template rendering
 * PRINCIPLE: CLEAN - Single responsibility for frame generation
 */
async function buildFrameSequence(manifest, template, style, jobId) {
  try {
    console.log(`\n📽️  Building frame sequence with style: ${style?.animation || 'default'}`);

    const frameData = [];
    let frameIdx = 0;
    let lastEndMs = 0;

    const animType = style?.animation || 'cut';

    manifest.segments.forEach((segment) => {
      // 1. Idle gap
      if (segment.startMs > lastEndMs + 10) {
        frameData.push({
          type: 'idle',
          startMs: lastEndMs,
          endMs: segment.startMs,
          durationMs: segment.startMs - lastEndMs,
          frameIndex: frameIdx++,
          svg: generateSvgFrame(segment, template, style, frameIdx, -1)
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
          svg: generateSvgFrame(segment, template, style, frameIdx, -1)
        });
      } else {
        words.forEach((word, wi) => {
          // Gap/Pause
          if (word.startMs > lastEndMs + 10 && wi > 0) {
            frameData.push({
              type: 'pause',
              startMs: lastEndMs,
              endMs: word.startMs,
              durationMs: word.startMs - lastEndMs,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi - 1)
            });
          }

          const wordDur = word.endMs - word.startMs;

          // IMPLEMENT ANIMATIONS:
          if (animType === 'pop' && wordDur > 150) {
            // POP: 3-stage scaling
            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.startMs + 60,
              durationMs: 60,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.25), // Burst
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + 60,
              endMs: word.startMs + 120,
              durationMs: 60,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.1), // Settle
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + 120,
              endMs: word.endMs,
              durationMs: word.endMs - (word.startMs + 120),
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.05), // Main
            });
          } else if (animType === 'fade' && wordDur > 100) {
            // FADE: Simple start scale
            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.startMs + 80,
              durationMs: 80,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.08),
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + 80,
              endMs: word.endMs,
              durationMs: word.endMs - (word.startMs + 80),
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1),
            });
          } else {
            // SNAP / DEFAULT
            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.endMs,
              durationMs: wordDur,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.02),
            });
          }
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
    const duration = frame.durationMs / 1000;

    concatList += `file '${framePath}'\nduration ${Math.max(0.01, duration)}\n`;
  });

  // FFmpeg concat demuxer "last file" bug fix: 
  // Add the last file one more time without duration to ensure the previous duration is respected
  if (frameData.length > 0) {
    const lastIdx = frameData.length - 1;
    const lastPath = `${outputDir}/${jobId}_frame_${String(lastIdx).padStart(4, '0')}.png`;
    concatList += `file '${lastPath}'\n`;
  }

  return concatList;
}

module.exports = {
  buildFrameSequence,
  calculateVideoParams,
  generateFrameConcat,
};
