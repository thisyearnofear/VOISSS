import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn(
    "Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set in environment variables"
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
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
    You are an expert Social Media Strategist and Audio Analyst for VOISSS.
    Analyze the attached audio recording and provide a high-impact content strategy.
    
    Return a JSON object with:
    {
      "title": "A viral-style hook or title (max 60 chars)",
      "summary": ["Key Point 1", "Key Point 2", "Key Point 3"],
      "tags": ["socialtag1", "socialtag2", "socialtag3", "socialtag4", "socialtag5"],
      "actionItems": ["Caption for X/Farcaster", "Caption for TikTok/Reels", "Key takeaway"]
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
