/**
 * Centralized Text-to-Speech utility.
 * Handles voice selection (preferring English GB/US) and playback management.
 */

let voices: SpeechSynthesisVoice[] = [];

// Load voices immediately
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const speak = (text: string) => {
  if (!text || typeof window === 'undefined') return;

  // Cancel any ongoing speech to prevent overlapping
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a good English voice
  // Preference: Google US/UK -> Apple Samantha/Daniel -> Any English
  const preferredVoice = voices.find(v => 
    v.name.includes("Google US English") || 
    v.name.includes("Google UK English Female") ||
    v.name.includes("Samantha") ||
    v.name.includes("Daniel")
  ) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  // Fallback lang just in case
  utterance.lang = 'en-GB';
  
  // Slightly slower rate for kids
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};