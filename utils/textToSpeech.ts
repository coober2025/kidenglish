
/**
 * Centralized Text-to-Speech utility.
 * Handles voice selection (preferring English GB/US) and playback management.
 */

let voices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  if (typeof window === 'undefined') return;
  const available = window.speechSynthesis.getVoices();
  if (available.length > 0) {
    voices = available;
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const speak = (text: string) => {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  // Crucial for Mobile: Cancel previous speech to allow new one
  window.speechSynthesis.cancel();

  // Mobile often lazy loads voices, try loading again
  if (voices.length === 0) {
      loadVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Prefer high quality English voices
  const preferredVoice = voices.find(v => 
    v.name.includes("Google US English") || 
    v.name.includes("Samantha") ||
    v.name.includes("Daniel") ||
    (v.lang === 'en-US' && v.name.includes("Enhanced")) ||
    v.lang === 'en-US'
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.lang = 'en-US'; // Fallback
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  utterance.volume = 1.0;

  utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      // Fallback specifically for iOS Safari which might choke on custom voices
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
          const backup = new SpeechSynthesisUtterance(text);
          backup.lang = 'en-US';
          window.speechSynthesis.speak(backup);
      }
  };

  window.speechSynthesis.speak(utterance);
};
