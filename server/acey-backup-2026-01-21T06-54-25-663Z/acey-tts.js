/**
 * Acey TTS Endpoint
 * Handles text-to-speech requests for Acey
 */

const express = require('express');
const Logger = require('./logger');
const fetch = require('node-fetch');

const logger = new Logger('acey-tts');

const router = express.Router();

// TTS configuration
const TTS_PROVIDERS = {
  // Free TTS options
  elevenlabs: {
    enabled: false, // Requires API key
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: 'Bella', // Female voice
    endpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
  },
  
  // Browser-based TTS (fallback)
  browser: {
    enabled: true,
    endpoint: null // Uses client-side TTS
  }
};

/**
 * TTS endpoint - converts text to speech
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, tone = 'playful', provider = 'browser' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    logger.info('TTS request', { text: text.substring(0, 50), tone, provider });

    // For now, return browser TTS instructions
    // In production, you might want to use a service like ElevenLabs
    if (provider === 'browser') {
      return res.json({
        success: true,
        provider: 'browser',
        data: {
          text,
          tone,
          // Voice settings for browser TTS
          voice: getVoiceForTone(tone),
          rate: getRateForTone(tone),
          pitch: getPitchForTone(tone)
        }
      });
    }

    // External TTS provider (ElevenLabs, etc.)
    if (provider === 'elevenlabs' && TTS_PROVIDERS.elevenlabs.enabled) {
      try {
        const response = await fetch(`${TTS_PROVIDERS.elevenlabs.endpoint}/${TTS_PROVIDERS.elevenlabs.voiceId}`, {
          method: 'POST',
          headers: {
            'xi-api-key': TTS_PROVIDERS.elevenlabs.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        });

        if (!response.ok) {
          throw new Error(`TTS API error: ${response.status}`);
        }

        const audioBuffer = await response.buffer();
        
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length
        });
        
        return res.send(audioBuffer);
      } catch (error) {
        logger.error('External TTS failed', { error: error.message });
        // Fallback to browser TTS
      }
    }

    // Default fallback
    res.json({
      success: true,
      provider: 'browser',
      data: {
        text,
        tone,
        voice: getVoiceForTone(tone),
        rate: getRateForTone(tone),
        pitch: getPitchForTone(tone)
      }
    });

  } catch (error) {
    logger.error('TTS request failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'TTS request failed'
    });
  }
});

/**
 * Get voice settings based on tone
 */
function getVoiceForTone(tone) {
  const voices = {
    flirty: 'female-soft',
    savage: 'female-sharp', 
    playful: 'female-energetic',
    dealer: 'female-neutral'
  };
  return voices[tone] || voices.playful;
}

function getRateForTone(tone) {
  const rates = {
    flirty: 0.9,    // Slower, more seductive
    savage: 1.1,    // Faster, more aggressive
    playful: 1.0,   // Normal pace
    dealer: 0.95   // Slightly slower, professional
  };
  return rates[tone] || 1.0;
}

function getPitchForTone(tone) {
  const pitches = {
    flirty: 1.1,    // Higher pitch
    savage: 0.9,    // Lower pitch
    playful: 1.0,   // Normal pitch
    dealer: 1.0    // Normal pitch
  };
  return pitches[tone] || 1.0;
}

/**
 * Health check for TTS service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    providers: Object.keys(TTS_PROVIDERS).filter(key => TTS_PROVIDERS[key].enabled),
    timestamp: Date.now()
  });
});

module.exports = router;
