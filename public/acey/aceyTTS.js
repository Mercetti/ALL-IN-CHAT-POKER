const AUDIO_CACHE = new Map();
let browserQueue = Promise.resolve();

export function speakBrowser(text) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.pitch = 1.2;
  utterance.rate = 1.08;
  browserQueue = browserQueue.then(() =>
    new Promise((resolve) => {
      utterance.onend = resolve;
      utterance.onerror = resolve;
      speechSynthesis.speak(utterance);
    })
  );
}

export async function playServerTTS(text, opts = {}) {
  try {
    const url = `/tts?text=${encodeURIComponent(text)}${opts.voice ? `&voice=${encodeURIComponent(opts.voice)}` : ''}`;
    let audioBuffer = AUDIO_CACHE.get(url);
    if (!audioBuffer) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('TTS request failed');
      const blob = await response.blob();
      audioBuffer = URL.createObjectURL(blob);
      AUDIO_CACHE.set(url, audioBuffer);
      setTimeout(() => {
        URL.revokeObjectURL(audioBuffer);
        AUDIO_CACHE.delete(url);
      }, 60 * 1000);
    }
    const audio = new Audio(audioBuffer);
    audio.play().catch(() => {});
  } catch (err) {
    console.warn('playServerTTS failed', err);
    speakBrowser(text);
  }
}
