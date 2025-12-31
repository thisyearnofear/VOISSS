import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    "Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set in environment variables"
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({
  model: "gemini-3-flash", // Upgraded to Gemini 3 Flash (released Dec 2025) for bleeding-edge speed and intelligence
});

export async function generateContentFromAudio(
  audioBase64: string,
  mimeType: string
) {
  if (!apiKey) {
    throw new Error("Google API Key is missing");
  }

  const prompt = `
    Analyze this audio recording and provide structured insights.
    Return the response in JSON format with the following schema:
    {
      "title": "A short, catchy title for the recording (max 60 chars)",
      "summary": "A concise summary of the content (3 bullet points)",
      "tags": ["Array", "of", "5", "relevant", "hashtags"],
      "actionItems": ["Array", "of", "actionable", "tasks", "extracted", "from", "audio"]
    }
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    },
  ]);

  const response = await result.response;
  const text = response.text();

  // Clean up the response if it includes markdown code blocks
  const jsonString = text.replace(/```json\n|\n```/g, "").trim();

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse Gemini response:", text, error);
    throw new Error("Failed to parse AI insights");
  }
}
