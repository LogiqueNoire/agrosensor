// services/gemini.ts

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generarRespuesta(prompt: string) {
  const response = await ai.models.generateContentStream({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });
  return response;
}