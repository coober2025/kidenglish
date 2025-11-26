
import { GoogleGenAI } from "@google/genai";
import { CambridgeLevel, QuizQuestion, VocabularyCard } from "../types";

// Helper to handle Vercel env injection
const getApiKey = () => {
  // Check multiple possible sources for the key
  const key = process.env.API_KEY;
  if (key && key.length > 0 && key !== '""' && !key.includes("process.env")) {
    return key;
  }
  return "";
};

const API_KEY = getApiKey();
const genAI = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MODELS = {
  TEXT: 'gemini-2.5-flash',
  IMAGE: 'gemini-2.5-flash-image', 
};

// Fallback generator for when API fails (Rate Limit / No Key)
const getOfflineVocab = (words: string[]): VocabularyCard[] => {
  return words.map((w, i) => ({
    id: `offline-${w}-${Date.now()}-${i}`,
    word: w,
    pronunciation: `/${w.toLowerCase()}/`,
    definition: `The definition of ${w} (Offline Mode)`,
    exampleSentence: `This is a simple sentence about ${w}.`,
    sentenceTranslation: `这是关于 ${w} 的一个简单句子。（离线模式）`,
    emoji: '📚',
    imagePrompt: w
  }));
};

const safeJsonParse = (text: string | undefined): any => {
  if (!text) return null;
  let cleanText = text.replace(/```json\n?|```/g, '').trim();
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse failed on text:", cleanText.substring(0, 100) + "...", e);
    // Simple repair for truncated arrays
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
  
  // 1. Fallback if no SDK
  if (!genAI) {
    console.warn("Gemini SDK not initialized. Using offline data.");
    if (targetWords) return getOfflineVocab(targetWords);
    throw new Error("API Key missing and no words provided.");
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
    console.error("Gemini API Error (likely rate limit):", error);
    // 2. Fallback on API Error (e.g. 429 Resource Exhausted)
    if (targetWords && targetWords.length > 0) {
       console.log("Serving offline data due to API error.");
       return getOfflineVocab(targetWords);
    }
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
    // Suppress image generation errors to avoid interrupting user flow
    console.warn("Image gen failed:", error);
    return "";
  }
};

export const generateQuiz = async (level: CambridgeLevel): Promise<QuizQuestion[]> => {
  if (!genAI) {
      // Return a mock quiz if API fails
      return [
          {
              type: 'multiple-choice',
              question: 'Which word is an animal? (Offline Mode)',
              options: ['Car', 'Dog', 'Apple', 'Blue'],
              correctAnswer: 1,
              explanation: 'A Dog is an animal.'
          },
          {
              type: 'scramble',
              question: 'Make a sentence.',
              scrambleSentence: 'I like apples',
              explanation: 'Subject + Verb + Object'
          }
      ];
  }
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
    console.error("Quiz gen error:", error);
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
  if (!genAI) return "翻译暂不可用 (离线)";
  try {
    const response = await genAI.models.generateContent({
      model: MODELS.TEXT,
      contents: `Translate to Simplified Chinese (zh-CN). Output translation only.\n\nText: "${text}"`,
    });
    return response.text?.trim() || "翻译失败";
  } catch (error) {
    return "翻译失败";
  }
};
