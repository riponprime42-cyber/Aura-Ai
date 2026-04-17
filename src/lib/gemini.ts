import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

if (!apiKey) {
  console.warn('GEMINI_API_KEY is missing. AI features will not work until set in environment variables.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

export async function chatStream(prompt: string, history: Message[], attachments: any[] = []) {
  const model = ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      })),
      {
        role: "user",
        parts: [
          ...attachments.map(att => ({
            inlineData: {
              data: att.data.split(',')[1] || att.data,
              mimeType: att.type
            }
          })),
          { text: prompt }
        ]
      }
    ],
    config: {
      systemInstruction: "You are Aura AI, a helpful and friendly assistant. Follow the user's instructions carefully. If they speak in Bengali, respond in Bengali. Provide clear, concise, and helpful answers."
    }
  });

  return model;
}

export async function generateTitle(firstMessage: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a short, concise title (max 5 words) for a chat thread starting with this message: "${firstMessage}". Return only the title text.`
  });
  return response.text?.trim() || "New Chat";
}
