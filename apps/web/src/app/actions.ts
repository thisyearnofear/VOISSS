"use server";

import { generateContentFromAudio } from "../lib/gemini";

export async function generateRecordingInsights(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      throw new Error("No file provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");
    
    // Determine mime type
    const mimeType = file.type || "audio/mp3"; // Default fallback

    const insights = await generateContentFromAudio(base64Audio, mimeType);
    
    return { success: true, data: insights };
  } catch (error) {
    console.error("Error generating insights:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate insights" 
    };
  }
}
