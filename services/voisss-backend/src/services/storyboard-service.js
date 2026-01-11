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

  // Define High Production filters (Glows, Shadows, Texture)
  const activeColor = escapeXml(template.typography.highlightColor || template.typography.activeColor || '#FF006B');

  const defs = `
    <defs>
      ${template.background.type === 'gradient' ? generateGradientSvg(bgId, template.background.colors || []) : ''}
      
      <!-- Text Shadow for readability -->
      <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
        <feOffset dx="0" dy="4" result="offsetblur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Active word glow -->
      <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 0  0 0 0 0 0.4  0 0 0 0.6 0" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <!-- Background noise texture for premium feel -->
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
      </filter>
    </defs>
  `;

  // Typography
  const fontFamily = escapeXml(template.typography.fontFamily);
  const baseFontSize = template.typography.fontSizePx;
  const lineHeightPx = Math.round(baseFontSize * template.typography.lineHeight);
  const fontWeight = template.typography.fontWeight;
  const textColor = escapeXml(template.typography.textColor || '#FFFFFF');
  const mutedColor = escapeXml(template.typography.mutedColor || '#666666');

  // Center vertical target
  const y0 = Math.round(dim.h * 0.5);

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

  // FIXED BASELINE LOGIC:
  // Find which line the active word is on. Center THAT line at y0.
  // This prevents the "segment jump" where whole blocks shift when segment length changes.
  let activeLineIndex = -1;
  if (activeWordIndex !== -1) {
    activeLineIndex = lines.findIndex(l => l.words.some(w => w.globalIndex === activeWordIndex));
  }

  const totalHeight = lines.length * lineHeightPx;
  let startY;
  if (activeLineIndex !== -1) {
    // The active line's baseline should be at y0 + (lineHeight/4) roughly for eye-level centering
    startY = y0 - (activeLineIndex * lineHeightPx) + (lineHeightPx / 4);
  } else {
    // Fallback to block centering if no word is active
    startY = y0 - (totalHeight / 2) + (lineHeightPx / 2);
  }

  // Render text lines
  const textXml = lines
    .map((line, li) => {
      const y = startY + li * lineHeightPx;
      const isActiveLine = li === activeLineIndex;

      const tspans = line.words.map((w) => {
        let color = textColor;
        let weight = fontWeight;
        let fsize = baseFontSize;
        let filter = '';

        if (activeWordIndex !== -1) {
          if (w.globalIndex === activeWordIndex) {
            color = activeColor;
            weight = '900';
            fsize = Math.round(baseFontSize * scaleFactor);
            filter = 'url(#activeGlow)';
          } else if (w.globalIndex < activeWordIndex) {
            color = textColor;
          } else {
            color = mutedColor;
          }
        }

        return `<tspan fill="${color}" font-weight="${weight}" font-size="${fsize}" filter="${filter}">${escapeXml(w.word)} </tspan>`;
      }).join('');

      // Apply subtle opacity fade to non-active lines
      const lineOpacity = (activeLineIndex === -1 || isActiveLine) ? 1.0 : 0.4;

      return `<text x="${dim.w / 2}" y="${y}" font-family="${fontFamily}" text-anchor="middle" filter="url(#textShadow)" opacity="${lineOpacity}">${tspans}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">
  ${defs}
  <rect width="100%" height="100%" fill="${bgFill}"/>
  <!-- Subtle Grain Texturing -->
  <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5"/>
  
  <!-- Outer Frame Decoration -->
  <rect x="${template.layout.paddingPx / 2}" y="${template.layout.paddingPx / 2}" width="${dim.w - template.layout.paddingPx}" height="${dim.h - template.layout.paddingPx}" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" stroke-width="2" rx="48"/>
  
  ${textXml}
  
  <!-- Branding -->
  <g transform="translate(${dim.w / 2}, ${dim.h - template.layout.paddingPx})">
    <text fill="${mutedColor}" font-family="${fontFamily}" font-size="28" font-weight="800" opacity="0.3" text-anchor="middle">VOISSS</text>
    <rect x="-40" y="10" width="80" height="2" fill="${activeColor}" opacity="0.2"/>
  </g>
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
          if (animType === 'pop' && wordDur > 180) {
            // POP: 4-stage smooth scaling sequence
            const p1 = Math.round(wordDur * 0.15);
            const p2 = Math.round(wordDur * 0.15);
            const p3 = Math.round(wordDur * 0.30);

            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.startMs + p1,
              durationMs: p1,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.30), // Initial Punch
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + p1,
              endMs: word.startMs + p1 + p2,
              durationMs: p2,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.15), // Elastic Settle
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + p1 + p2,
              endMs: word.startMs + p1 + p2 + p3,
              durationMs: p3,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.08), // Gentle Hold
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + p1 + p2 + p3,
              endMs: word.endMs,
              durationMs: word.endMs - (word.startMs + p1 + p2 + p3),
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.05), // Final State
            });
          } else if (animType === 'fade' && wordDur > 120) {
            // FADE: Simple start scale
            const p1 = Math.min(100, Math.round(wordDur * 0.4));
            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.startMs + p1,
              durationMs: p1,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.12),
            });
            frameData.push({
              text: word.word,
              startMs: word.startMs + p1,
              endMs: word.endMs,
              durationMs: word.endMs - (word.startMs + p1),
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1),
            });
          } else {
            // SNAP / DEFAULT - Subtle scale for "impact"
            frameData.push({
              text: word.word,
              startMs: word.startMs,
              endMs: word.endMs,
              durationMs: wordDur,
              frameIndex: frameIdx++,
              svg: generateSvgFrame(segment, template, style, frameIdx, wi, 1.04),
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
