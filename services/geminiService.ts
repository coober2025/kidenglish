
import { GoogleGenAI, Type } from "@google/genai";
import { CambridgeLevel, QuizQuestion, VocabularyCard } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODELS = {
  TEXT: 'gemini-2.5-flash',
  IMAGE: 'gemini-2.5-flash-image', 
};

/**
 * Helper to clean and parse JSON from AI response
 */
const safeJsonParse = (text: string | undefined): any => {
  if (!text) return null;
  
  // 1. Remove Markdown code blocks (```json ... ```)
  let cleanText = text.replace(/```json\n?|```/g, '').trim();
  
  // 2. Attempt to parse
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse failed on text:", cleanText.substring(0, 100) + "...", e);
    // Attempt basic repair for truncated JSON arrays
    if (cleanText.trim().startsWith('[') && !cleanText.trim().endsWith(']')) {
        const lastBracket = cleanText.lastIndexOf('}');
        if (lastBracket !== -1) {
            cleanText = cleanText.substring(0, lastBracket + 1) + ']';
            try {
                return JSON.parse(cleanText);
            } catch (e2) {
                return null;
            }
        }
    }
    return null;
  }
};

/**
 * Generates vocabulary cards.
 * If 'targetWords' is provided, it generates content specifically for those words.
 * Otherwise, it generates random words for the topic.
 */
export const generateVocabBatch = async (
  level: CambridgeLevel, 
  topicOrTitle: string, 
  targetWords?: string[]
): Promise<VocabularyCard[]> => {
  
  let prompt = "";
  
  // Construct a very clear, structured prompt to avoid model confusion
  if (targetWords && targetWords.length > 0) {
    prompt = `You are an expert Cambridge English Dictionary API for children.
    
    TASK: Generate vocabulary data for these exact words: ${targetWords.join(', ')}.
    LEVEL: Cambridge ${level} (Simple English).
    
    OUTPUT FORMAT: Return a strictly valid JSON array. Do not add any conversational text or explanations.
    
    Each object in the array must have these fields:
    1. "word": The target English word.
    2. "pronunciation": IPA phonetic transcription (e.g., /kæt/).
    3. "definition": A very simple English definition (max 10 words).
    4. "exampleSentence": A simple example sentence using the word.
    5. "sentenceTranslation": The Simplified Chinese (zh-CN) translation of the example sentence.
    6. "emoji": A single emoji character best representing the word. If abstract, use ✨.
    7. "imagePrompt": A specific description to draw a cute, isolated cartoon object of this word.
    
    Example JSON:
    [
      {
        "word": "cat",
        "pronunciation": "/kæt/",
        "definition": "A small furry animal with whiskers.",
        "exampleSentence": "The cat sleeps on the bed.",
        "sentenceTranslation": "猫睡在床上。",
        "emoji": "🐱",
        "imagePrompt": "A cute orange tabby cat sitting down, white background, vector style"
      }
    ]`;
  } else {
    // Fallback for random generation
    prompt = `Generate 5 English vocabulary words about "${topicOrTitle}" for Cambridge ${level} students.
    Output a JSON array with fields: word, pronunciation, definition, exampleSentence, sentenceTranslation (Chinese), emoji, imagePrompt.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // We set a high temperature to ensure creativity in sentences, but the Schema enforces structure
        temperature: 0.4, 
      },
    });

    const rawData = safeJsonParse(response.text);
    
    if (!rawData || !Array.isArray(rawData)) {
      throw new Error("Invalid or empty data from AI");
    }
    
    // Sanitize and Validate Data
    return rawData
      .filter((item: any) => item.word && typeof item.word === 'string') // Filter out bad objects
      .map((item: any, index: number) => {
        // Double check against "Korean explanation" bugs
        const cleanWord = item.word.replace(/[^\x00-\x7F]/g, "").trim(); // Remove non-ascii from word if any sneak in
        
        return {
          ...item,
          word: cleanWord || item.word, // Fallback to original if clean results in empty (e.g. valid UTF8 names? usually not for English learning)
          emoji: item.emoji && item.emoji.length <= 2 ? item.emoji : '✨', // Strict emoji check
          id: `${item.word}-${index}-${Date.now()}`
        };
    });
  } catch (error) {
    console.error("Error generating vocab:", error);
    throw error;
  }
};

/**
 * Generates an image based on the vocabulary card.
 */
export const generateIllustration = async (prompt: string): Promise<string> => {
  try {
    // We enforce the subject to prevent abstract art
    const finalPrompt = `Draw a ${prompt}. Simple, cute, flat vector art style for kids. White background. High quality, clear lines.`;
    
    const response = await ai.models.generateContent({
      model: MODELS.IMAGE,
      contents: {
        parts: [{ text: finalPrompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return ""; 
  } catch (error) {
    console.error("Error generating illustration:", error);
    return "";
  }
};

/**
 * Generates a mixed quiz (Multiple Choice + Sentence Scramble).
 */
export const generateQuiz = async (level: CambridgeLevel): Promise<QuizQuestion[]> => {
  const prompt = `Create a JSON list of 3 quiz questions for Cambridge English ${level}.
  
  Mix these 2 types:
  1. "multiple-choice": Grammar/Vocabulary. Options array required.
  2. "scramble": Sentence ordering. "scrambleSentence" string required.
  
  JSON Structure:
  [
    {
      "type": "multiple-choice",
      "question": "Select the correct word...",
      "options": ["A", "B", "C"],
      "correctAnswer": 0,
      "explanation": "..."
    },
    {
      "type": "scramble",
      "question": "Unscramble the sentence",
      "scrambleSentence": "The cat is black",
      "explanation": "..."
    }
  ]`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = safeJsonParse(response.text);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

/**
 * Chat functionality
 */
export const createChatSession = (level: CambridgeLevel) => {
  return ai.chats.create({
    model: MODELS.TEXT,
    config: {
      systemInstruction: `You are a magical talking animal tutor for a child (Level: ${level}).
      Be kind, funny, and encouraging. Use emojis.
      Keep answers short (max 2 sentences).
      If the child makes a grammar mistake, gently correct it.`,
    },
  });
};

/**
 * Translates text to Simplified Chinese
 */
export const translateToChinese = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: `Translate to Simplified Chinese (zh-CN). Output translation only.\n\nText: "${text}"`,
    });
    return response.text?.trim() || "Translation unavailable.";
  } catch (error) {
    console.error("Translation error:", error);
    return "Error translating.";
  }
};
