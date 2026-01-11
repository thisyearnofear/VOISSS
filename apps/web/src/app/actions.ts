"use server";

import { generateContentFromAudio } from "../lib/gemini";

export async function generateRecordingInsights(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No audio file found in the request.");
    }

    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error("The audio file is empty.");
    }

    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    // Clean mime type (remove codecs)
    let mimeType = file.type || "audio/webm";
    if (mimeType.includes(";")) {
      mimeType = mimeType.split(";")[0];
    }

    console.log(`Analyzing audio: ${mimeType}, size: ${buffer.length} bytes`);

    const insights = await generateContentFromAudio(base64Audio, mimeType);

    return { success: true, data: insights };
  } catch (error) {
    console.error("Gemini Server Action Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "The AI was unable to process this audio. Please ensure it has clear speech."
    };
  }
}
