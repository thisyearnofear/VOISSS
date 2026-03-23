/**
 * Generates a deterministic SVG "Voice Fingerprint" based on a voice ID.
 * This ensures every voice in the marketplace has a unique, professional visual identity.
 */
export function generateVoiceFingerprint(id: string): string {
  // Simple deterministic hash function for colors and shapes
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  const saturation = 65;
  const lightness = 50;

  const color1 = `hsl(${hue1}, ${saturation}%, ${lightness}%)`;
  const color2 = `hsl(${hue2}, ${saturation}%, ${lightness}%)`;

  // Deterministic "waveform" points
  const points = [];
  for (let i = 0; i < 8; i++) {
    const seed = (hash >> (i * 2)) & 0xFF;
    const height = 10 + (seed % 30);
    points.push(height);
  }

  const bars = points.map((h, i) => `
    <rect 
      x="${10 + i * 10}" 
      y="${25 - h / 2}" 
      width="4" 
      height="${h}" 
      rx="2" 
      fill="url(#grad-${id})"
      opacity="${0.4 + (h / 50)}"
    />
  `).join("");

  return `
    <svg width="100" height="50" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100" height="50" rx="12" fill="rgba(255,255,255,0.03)" />
      ${bars}
    </svg>
  `;
}
