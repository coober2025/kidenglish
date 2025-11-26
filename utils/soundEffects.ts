
/**
 * A simple synthesizer using the Web Audio API to generate game sound effects
 * This avoids the need for external MP3 files and ensures instant playback.
 */

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

type SoundType = 'correct' | 'wrong' | 'click' | 'success' | 'coin';

export const playSFX = (type: SoundType) => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'correct':
      // Ding! High pitch sine wave
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case 'wrong':
      // Buzz! Low pitch saw wave
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, now);
      oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case 'success':
      // Level Up! Arpeggio
      oscillator.type = 'square';
      gainNode.gain.value = 0.05;
      
      // Play a quick melody
      [440, 554, 659, 880].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        gn.gain.setValueAtTime(0.05, now + i * 0.1);
        gn.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
      });
      break;

    case 'coin':
      // Coin collect sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, now);
      oscillator.frequency.linearRampToValueAtTime(2000, now + 0.1);
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
      break;

    case 'click':
    default:
      // Subtle click
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300, now);
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
      break;
  }
};
