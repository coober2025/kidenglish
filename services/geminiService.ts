
import { GoogleGenAI, Type } from "@google/genai";
import { CambridgeLevel, QuizQuestion, VocabularyCard } from "../types";

// CRITICAL FIX: Prevent White Screen Crash
const API_KEY = process.env.API_KEY || "";
const isValidKey = API_KEY && API_KEY.length > 0 && API_KEY !== '""';

// Initialize SDK only if we have a key.
const genAI = isValidKey ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MODELS = {
  TEXT: 'gemini-2.5-flash',
  IMAGE: 'gemini-2.5-flash-image', 
};

const safeJsonParse = (text: string | undefined): any => {
  if (!text) return null;
  let cleanText = text.replace(/```json\n?|```/g, '').trim();
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse failed on text:", cleanText.substring(0, 100) + "...", e);
    if (cleanText.trim().startsWith('[') && !cleanText.trim().endsWith(']')) {
        const lastBracket = cleanText.lastIndexOf('}');
        if (lastBracket !== -1) {
            cleanText = cleanText.substring(0, lastBracket + 1) + ']';
            try { return JSON.parse(cleanText); } catch (e2) { return null; }
        }
    }
    return null;
  }
};

export const generateVocabBatch = async (
  level: CambridgeLevel, 
  topicOrTitle: string, 
  targetWords?: string[]
): Promise<VocabularyCard[]> => {
  
  if (!genAI) {
    console.warn("Gemini SDK not initialized. API_KEY missing.");
    // Return empty array instead of throwing to prevent app crash
    throw new Error("API Key is missing. Please check Vercel settings.");
  }

  let prompt = "";
  if (targetWords && targetWords.length > 0) {
    prompt = `You are an expert Cambridge English Dictionary API for children.
    TASK: Generate vocabulary data for: ${targetWords.join(', ')}.
    LEVEL: Cambridge ${level} (Simple English).
    OUTPUT: Strict JSON array. No text.
    Fields: word, pronunciation, definition (simple), exampleSentence, sentenceTranslation (Simplified Chinese), emoji, imagePrompt (cute cartoon style).`;
  } else {
    prompt = `Generate 5 English vocabulary words about "${topicOrTitle}" for Cambridge ${level}. Output strict JSON array.`;
  }

  try {
    const response = await genAI.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.4 },
    });
    const rawData = safeJsonParse(response.text);
    if (!rawData || !Array.isArray(rawData)) throw new Error("Invalid AI data");
    
    return rawData.map((item: any, index: number) => ({
        ...item,
        emoji: item.emoji && item.emoji.length <= 2 ? item.emoji : '✨', 
        id: `${item.word}-${index}-${Date.now()}`
    }));
  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
};

export const generateIllustration = async (prompt: string): Promise<string> => {
  if (!genAI) return "";
  try {
    const finalPrompt = `Draw a ${prompt}. Simple, cute, flat vector art style for kids. White background.`;
    const response = await genAI.models.generateContent({
      model: MODELS.IMAGE,
      contents: { parts: [{ text: finalPrompt }] },
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return ""; 
  } catch (error) {
    console.error("Error generating illustration:", error);
    return "";
  }
};

export const generateQuiz = async (level: CambridgeLevel): Promise<QuizQuestion[]> => {
  if (!genAI) throw new Error("API Key Missing");
  const prompt = `Create a JSON list of 3 quiz questions for Cambridge English ${level}. Mix multiple-choice and scramble.`;
  try {
    const response = await genAI.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const data = safeJsonParse(response.text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const createChatSession = (level: CambridgeLevel) => {
  if (!genAI) throw new Error("API Key Missing");
  return genAI.chats.create({
    model: MODELS.TEXT,
    config: { systemInstruction: `You are a helpful animal tutor for a child (Level: ${level}). Keep it simple.` },
  });
};

export const translateToChinese = async (text: string): Promise<string> => {
  if (!genAI) return "Translation unavailable.";
  try {
    const response = await genAI.models.generateContent({
      model: MODELS.TEXT,
      contents: `Translate to Simplified Chinese (zh-CN). Output translation only.\n\nText: "${text}"`,
    });
    return response.text?.trim() || "Translation unavailable.";
  } catch (error) {
    return "Error translating.";
  }
};
