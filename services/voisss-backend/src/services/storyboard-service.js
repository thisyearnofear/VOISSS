/**
 * Storyboard Service
 * Processes export manifests into timed frame sequences
 * PRINCIPLE: MODULAR - Standalone storyboard processing
 * PRINCIPLE: CLEAN - Explicit frame timing logic
 */

const { renderSvgsToFrames } = require('./svg-renderer-service');
const { renderCarouselSlidesAsSvg } = require('../../../apps/web/src/app/api/transcript/export/svg-render');

/**
 * Build frame sequence from manifest
 * Maps transcript segments to visual frames with precise timing
 * PRINCIPLE: DRY - Uses existing carousel rendering
 */
async function buildFrameSequence(manifest, template, jobId) {
  try {
    console.log(`\n📽️  Building frame sequence: ${jobId}`);
    console.log(`   Segments: ${manifest.segments.length}`);

    // Prepare storyboard input for SVG renderer
    // The manifest contains timing info we'll embed in frame metadata
    const frameData = manifest.segments.map((segment, idx) => ({
      text: segment.text,
      startMs: segment.startMs,
      endMs: segment.endMs,
      durationMs: segment.endMs - segment.startMs,
      frameIndex: idx,
    }));

    console.log(`✅ Frame sequence built: ${frameData.length} frames`);
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
