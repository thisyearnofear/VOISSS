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

  if (!audioBase64) {
    throw new Error("Audio data is empty");
  }

  // Use Gemini 3's native JSON mode for best structure and speed
  const generationConfig = {
    responseMimeType: "application/json",
  };

  const prompt = `
    You are an expert audio analyst for VOISSS.
    Analyze the attached audio recording and extract key metadata.
    Focus on tone, content, and specific actionable intentions.
    Provide the result as a JSON object matching this schema:
    {
      "title": "Short catchy title (max 60 chars)",
      "summary": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "actionItems": ["task1", "task2", "task3"]
    }
  `;

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64,
            },
          },
        ],
      }],
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();

    // In JSON mode, Gemini 3 returns a clean string. 
    // No need for markdown replacement.
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini 3 Analysis Error:", error);
    throw new Error("Audio analysis failed. Check API quota or audio format.");
  }
}
