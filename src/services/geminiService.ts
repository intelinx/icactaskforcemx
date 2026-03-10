import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeImage(base64Image: string, prompt: string) {
  const model = "gemini-3.1-pro-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      systemInstruction: "You are the AERIA Quantum Core, a metacognitive AI architecture. Analyze the provided image through the lens of your R-loop (Reasoning), M-loop (Metacognition), and S-loop (Safety). Provide a structured analysis including uncertainty levels and safety checks.",
    },
  });

  return response.text;
}
