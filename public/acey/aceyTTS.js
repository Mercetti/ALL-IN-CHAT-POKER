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

export function speakBrowserWithSettings(text, settings = {}) {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  
  // Apply tone-specific settings
  const voiceMap = {
    'flirty': 'female-soft',
    'savage': 'female-sharp',
    'playful': 'female-energetic',
    'dealer': 'female-neutral'
  };
  
  const rateMap = {
    'flirty': 0.9,
    'savage': 1.1,
    'playful': 1.0,
    'dealer': 0.95
  };
  
  const pitchMap = {
    'flirty': 1.1,
    'savage': 0.9,
    'playful': 1.0,
    'dealer': 1.0
  };
  
  // Use server settings or defaults
  utterance.rate = settings.rate || rateMap[settings.tone] || 1.0;
  utterance.pitch = settings.pitch || pitchMap[settings.tone] || 1.0;
  
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
    const url = `/acey/tts?text=${encodeURIComponent(text)}${opts.tone ? `&tone=${encodeURIComponent(opts.tone)}` : ''}`;
    let audioBuffer = AUDIO_CACHE.get(url);
    if (!audioBuffer) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('TTS request failed');
      
      const data = await response.json();
      if (data.success && data.provider === 'browser') {
        // Use browser TTS with settings from server
        speakBrowserWithSettings(text, data.data);
        return;
      }
      
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
