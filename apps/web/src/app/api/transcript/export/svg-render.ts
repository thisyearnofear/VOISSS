import type { TranscriptTemplate, TimedTranscript } from '@voisss/shared/types/transcript';
import { buildTranscriptPages } from '@voisss/shared/utils/timed-transcript';

const DIMENSIONS: Record<TranscriptTemplate['aspect'], { w: number; h: number }> = {
  portrait: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
  landscape: { w: 1920, h: 1080 },
};

function esc(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function gradientSvg(id: string, colors: string[]) {
  const stops = colors.length ? colors : ['#0A0A0A', '#1A1A1A'];
  const stopsXml = stops
    .map((c, i) => {
      const offset = Math.round((i / Math.max(1, stops.length - 1)) * 100);
      return `<stop offset=\"${offset}%\" stop-color=\"${esc(c)}\" />`;
    })
    .join('');

  return `<linearGradient id=\"${id}\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">${stopsXml}</linearGradient>`;
}

export function renderCarouselSlidesAsSvg(params: {
  transcript: TimedTranscript;
  template: TranscriptTemplate;
  maxSlides?: number;
}): Array<{ filename: string; svg: string }> {
  const { transcript, template, maxSlides = 8 } = params;

  const dim = DIMENSIONS[template.aspect];
  const pages = buildTranscriptPages({
    transcript,
    maxLines: template.layout.maxLines,
    maxCharsPerLine: template.layout.maxCharsPerLine,
  }).slice(0, maxSlides);

  return pages.map((p, idx) => {
    const bgId = `bg_${idx}`;
    const bgFill =
      template.background.type === 'gradient'
        ? `url(#${bgId})`
        : esc(template.background.colors[0] || '#0A0A0A');

    const defs =
      template.background.type === 'gradient'
        ? `<defs>${gradientSvg(bgId, template.background.colors)}</defs>`
        : '';

    const fontFamily = esc(template.typography.fontFamily);
    const fontSize = template.typography.fontSizePx;
    const lineHeightPx = Math.round(fontSize * template.typography.lineHeight);

    const x = template.layout.paddingPx;
    const y0 = Math.round(dim.h * 0.55);

    const lines = p.lines.length ? p.lines : [{ text: '' }];

    const textXml = lines
      .map((line, li) => {
        const y = y0 + li * lineHeightPx;
        return `<text x=\"${x}\" y=\"${y}\" fill=\"${esc(template.typography.textColor)}\" font-family=\"${fontFamily}\" font-size=\"${fontSize}\" font-weight=\"${template.typography.fontWeight}\">${esc(line.text)}</text>`;
      })
      .join('');

    const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${dim.w}\" height=\"${dim.h}\" viewBox=\"0 0 ${dim.w} ${dim.h}\">
  ${defs}
  <rect width=\"100%\" height=\"100%\" fill=\"${bgFill}\"/>
  <rect x=\"${template.layout.paddingPx / 2}\" y=\"${template.layout.paddingPx / 2}\" width=\"${dim.w - template.layout.paddingPx}\" height=\"${dim.h - template.layout.paddingPx}\" fill=\"rgba(0,0,0,0.12)\" rx=\"24\"/>
  ${textXml}
  <text x=\"${x}\" y=\"${dim.h - template.layout.paddingPx}\" fill=\"${esc(template.typography.mutedColor)}\" font-family=\"${fontFamily}\" font-size=\"24\" font-weight=\"600\">VOISSS</text>
</svg>`;

    return {
      filename: `voisss_${transcript.id}_${template.aspect}_${idx + 1}.svg`,
      svg,
    };
  });
}

export function renderMp4StoryboardManifest(params: {
  transcript: TimedTranscript;
  template: TranscriptTemplate;
}): {
  transcriptId: string;
  templateId: string;
  aspect: TranscriptTemplate['aspect'];
  segments: Array<{ startMs: number; endMs: number; text: string }>;
} {
  const { transcript, template } = params;
  return {
    transcriptId: transcript.id,
    templateId: template.id,
    aspect: template.aspect,
    segments: transcript.segments.map((s) => ({
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
      words: s.words,
    })),
  };
}
