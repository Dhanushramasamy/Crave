import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeImage(base64Image: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this item for home or office inspiration. Return a JSON object with: 'name' (string), 'category' (e.g. Chair, Lamp, Desk), 'room' (suggested space like Living Room, Office, Bathroom), and 'description' (short aesthetic analysis)." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image.split(',')[1] } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
}
