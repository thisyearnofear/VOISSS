/**
 * ElevenLabs Scribe v2 — speech-to-text for contributor audio.
 *
 * Used to enrich imported/recorded voices with transcripts and language
 * detection: quality signals for publish review and future matching
 * dimensions (e.g. detecting whether a sample is spoken-word vs noise).
 */

export type ScribeResult = {
  text: string;
  languageCode?: string;
  languageProbability?: number;
  words?: number;
};

const SCRIBE_ENDPOINT = "https://api.elevenlabs.io/v1/speech-to-text";

async function callScribe(apiKey: string, form: FormData): Promise<ScribeResult> {
  form.set("model_id", "scribe_v2");
  const res = await fetch(SCRIBE_ENDPOINT, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Scribe failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return {
    text: data.text ?? "",
    languageCode: data.language_code,
    languageProbability: data.language_probability,
    words: Array.isArray(data.words) ? data.words.length : undefined,
  };
}

/** Transcribe an uploaded audio file. */
export async function transcribeFile(
  apiKey: string,
  file: Blob,
  filename = "audio.mp3"
): Promise<ScribeResult> {
  const form = new FormData();
  form.set("file", file, filename);
  return callScribe(apiKey, form);
}

/** Fetch a remote sample and transcribe it — used to enrich voice imports. */
export async function transcribeUrl(
  apiKey: string,
  audioUrl: string
): Promise<ScribeResult> {
  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) {
    throw new Error(`Could not fetch audio sample: ${audioRes.status}`);
  }
  const blob = await audioRes.blob();
  return transcribeFile(apiKey, blob, "sample.mp3");
}
