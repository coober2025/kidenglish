
export type CambridgeLevel = 'Starters' | 'Movers' | 'Flyers';

export type TopicStatus = 'locked' | 'unlocked' | 'completed';

// Structure for our new static syllabus
export interface SyllabusUnit {
  id: string;
  level: CambridgeLevel; // New: Categorize units by difficulty
  title: string;
  description: string;
  icon: string;
  color: string;
  words: string[]; // The specific target vocabulary
}

export interface MistakeRecord {
  word: string;
  unitId: string;
  timestamp: number;
}

export interface UserProgress {
  unlockedUnits: string[]; // Changed from topics to Unit IDs (e.g., 'unit-1')
  completedUnits: Record<string, number>; // Unit ID -> Stars
  totalStars: number;
  mistakes: MistakeRecord[]; // New: Track words the user struggled with
}

export interface VocabularyCard {
  id: string;
  word: string;
  pronunciation: string; // IPA
  definition: string;
  exampleSentence: string;
  sentenceTranslation: string; // New: Chinese translation
  emoji: string;
  imagePrompt: string; 
}

export interface QuizQuestion {
  type: 'multiple-choice' | 'scramble'; // New: Support different question types
  question: string;
  options?: string[]; // Only for multiple-choice
  correctAnswer?: number; // Only for multiple-choice
  scrambleSentence?: string; // Only for scramble mode (the correct full sentence)
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  translation?: string; // Added to store translated text
}

export interface AppState {
  currentTab: 'learn' | 'quiz' | 'chat' | 'settings' | 'review';
  level: CambridgeLevel;
  coins: number;
  progress: UserProgress;
  lastLoginDate: string;
  streakDays: number;
  currentAvatar: string;
  unlockedAvatars: string[];
}
