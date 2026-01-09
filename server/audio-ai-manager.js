/**
 * Audio AI Manager - Background music and game audio generation
 * Integrates with AI Control Center for seamless audio management
 */

const Logger = require('./logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const logger = new Logger('AUDIO-AI-MANAGER');

class AudioAIManager {
  constructor() {
    this.audioCache = new Map();
    this.generationQueue = [];
    this.isGenerating = false;
    this.aiEnabled = true;
    this.audioOutputPath = path.join(__dirname, '../generated-audio');
    this.supportedFormats = ['wav', 'mp3', 'ogg', 'm4a'];
    this.maxConcurrentGenerations = 2;
    this.currentGenerations = 0;
  }

  /**
   * Generate background music for game atmosphere
   */
  async generateBackgroundMusic(mood = 'ambient', duration = 30) {
    try {
      const ai = require('./ai');
      
      const prompt = `
      Generate ${duration} seconds of background music for a poker game.
      Mood: ${mood}
      Style: Ambient, subtle, non-intrusive
      Instrument: Piano, strings, synth pads
      Tempo: Slow (60-80 BPM)
      Key: C minor
      Should be in the background, not distracting
      
      Return JSON with:
      {
        "type": "background_music",
        "mood": "${mood}",
        "duration": ${duration},
        "description": "Background music for poker game",
        "instruments": ["piano", "strings", "synth"],
        "tempo": 60,
        "key": "C minor",
        "volume": 0.3
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are an expert music composer. Generate musical notation.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.7,
        maxTokens: 1000
      });

      const musicData = JSON.parse(response);
      
      // Save generated audio
      const filename = `background_${mood}_${Date.now()}.json`;
      const filePath = path.join(this.audioOutputPath, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(musicData, null, 2));
      
      logger.info('Background music generated', { 
        mood, 
        duration, 
        filename,
        filePath 
      });
      
      return {
        success: true,
        data: musicData,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('Failed to generate background music', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate game sound effects
   */
  async generateGameSound(effectType, description) {
    try {
      const ai = require('./ai');
      
      const prompt = `
      Generate a ${effectType} sound effect for a poker game.
      Description: ${description}
      
      Should be:
      - Short (1-2 seconds)
      - High quality
      - Clear and recognizable
      - Not too loud or distracting
      
      Return JSON with:
      {
        "type": "game_sound",
        "effect": "${effectType}",
        "description": "${description}",
        "duration": 2,
        "volume": 0.8
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are a sound effects designer. Generate audio data.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 500
      });

      const soundData = JSON.parse(response);
      
      // Save generated sound
      const filename = `${effectType}_${Date.now()}.json`;
      const filePath = path.join(this.audioOutputPath, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(soundData, null, 2));
      
      logger.info('Game sound generated', { 
        effectType, 
        description, 
        filename,
        filePath 
      });
      
      return {
        success: true,
        data: soundData,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('Failed to generate game sound', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate voice lines for poker game
   */
  async generateVoiceLine(text, character = 'announcer') {
    try {
      const ai = require('./ai');
      
      const prompt = `
      Generate a voice line for a poker game announcer.
      Character: ${character} (professional, friendly, exciting)
      Text: "${text}"
      
      Voice characteristics:
      - Professional poker announcer
      - Clear pronunciation
      - Moderate pace
      - Engaging tone
      - Not too fast or slow
      
      Audio specifications:
      - Duration: 3-5 seconds
      - Format: WAV, 44.1kHz, 16-bit
      - Volume: 0.7
      - Voice: Male announcer, warm tone
      
      Return JSON with:
      {
        "type": "voice_line",
        "character": "${character}",
        "text": "${text}",
        "duration": 4,
        "format": "wav",
        "sampleRate": 44100,
        "volume": 0.7
        "voiceType": "male_announcer"
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are a voice over artist. Generate audio data.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.2,
        maxTokens: 800
      });

      const voiceData = JSON.parse(response);
      
      // Save generated voice
      const filename = `voice_${character}_${Date.now()}.wav`;
      const filePath = path.join(this.audioOutputPath, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(voiceData, null, 2));
      
      logger.info('Voice line generated', { 
        character, 
        text, 
        filename,
        filePath 
      });
      
      return {
        success: true,
        data: voiceData,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('Failed to generate voice line', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate ambient soundscapes for different game states
   */
  async generateAmbientSoundscape(gameState = 'normal') {
    try {
      const ai = require('./ai');
      
      const prompt = `
      Generate an ambient soundscape for poker game state: ${gameState}.
      
      The soundscape should include:
      - Background casino ambiance
      - Card shuffling sounds
      - Chip stacking sounds
      - Player chatter (muted)
      - Drink ordering sounds
      
      Duration: 60 seconds
      Layers: Multiple audio tracks mixed
      
      Return JSON with:
      {
        "type": "ambient_soundscape",
        "gameState": "${gameState}",
        "duration": 60,
        "layers": [
          {
            "type": "casino_ambient",
            "description": "Low casino background noise with distant chatter",
            "volume": 0.2
          },
          {
            "type": "card_sounds",
            "description": "Card shuffling and dealing sounds",
            "volume": 0.4
          },
          {
            "type": "chip_sounds",
            "description": "Poker chip sounds",
            "volume": 0.3
          }
        ]
      }
      }
      `;

      const response = await ai.chat([
        { role: 'system', content: 'You are an audio engineer. Generate multi-track audio data.' },
        { role: 'user', content: prompt }
      ], {
        temperature: 0.5,
        maxTokens: 1500
      });

      const soundscapeData = JSON.parse(response);
      
      // Save generated soundscape
      const filename = `soundscape_${gameState}_${Date.now()}.json`;
      const filePath = path.join(this.audioOutputPath, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(soundscapeData, null, 2));
      
      logger.info('Ambient soundscape generated', { 
        gameState, 
        filename, 
        filePath 
      });
      
      return {
        success: true,
        data: soundscapeData,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('Failed to generate ambient soundscape', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate complete audio package for game state
   */
  async generateAudioPackage(gameState = 'normal') {
    try {
      const ai = require('./ai');
      
      const prompt = `
      Generate a complete audio package for poker game state: ${gameState}.
      
      Include:
      1. Background music (60 seconds)
      2. Game soundscape (60 seconds, 4 layers)
      3. Voice lines for key events
      4. Sound effects library for common actions
      
      Audio specifications:
      - Background music: MP3, 128kbps, stereo
      - Game sounds: WAV, 44.1kHz, 16-bit
      - Voice lines: WAV, 44.1kHz, 16-bit
      - Sound effects: WAV, 44.1kHz, 16-bit
      
      Return JSON with:
      {
        "type": "audio_package",
        "gameState": "${gameState}",
        "duration": 120,
        "components": {
          "background_music": {
            "duration": 60,
            "format": "mp3",
            "bitrate": 128,
            "sampleRate": 44100
          },
          "ambient_soundscape": {
            "duration": 60,
            "layers": 4,
            "format": "wav",
            "sampleRate": 44100
          },
          "voice_lines": [
            {
              "event": "player_wins_big_pot",
              "text": "Huge pot winner!",
              "duration": 3,
              "character": "excited_announcer"
            },
            {
              "event": "player_loses_big_pot",
              "text": "Better luck next time!",
              "duration": 2,
              "character": "sympathetic_announcer"
            }
          ]
        },
        "sound_effects": [
          {
            "type": "card_deal",
            "description": "Cards being dealt",
            "duration": 1,
            "volume": 0.5
          },
          {
            "type": "chip_stack",
            "description": "Poker chips pushed to center",
            "duration": 1,
            "volume": 0.6
          }
        ]
      }
      }
      }
      `;

      const audioPackageData = JSON.parse(response);
      
      // Save audio package
      const filename = `audio_package_${gameState}_${Date.now()}.json`;
      const filePath = path.join(this.audioOutputPath, filename);
      
      fs.writeFileSync(filePath, JSON.stringify(audioPackageData, null, 2));
      
      logger.info('Audio package generated', { 
        gameState, 
        filename, 
        filePath 
      });
      
      return {
        success: true,
        data: audioPackageData,
        filePath,
        filename
      };
    } catch (error) {
      logger.error('Failed to generate audio package', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audio generation status
   */
  getGenerationStatus() {
    return {
      isGenerating: this.isGenerating,
      currentGenerations: this.currentGenerations,
      maxConcurrent: this.maxConcurrentGenerations,
      queueLength: this.generationQueue.length
      cacheSize: this.audioCache.size
    };
  }

  /**
   * Add audio generation to queue
   */
  addToQueue(type, params = {}) {
    if (this.generationQueue.length >= this.maxConcurrentGenerations) {
      return { success: false, error: 'Generation queue full' };
    }

    this.generationQueue.push({
      id: Date.now().toString(),
      type,
      params,
      status: 'queued',
      timestamp: new Date().toISOString()
    });
    
    // Process queue asynchronously
    this.processQueue();
  }

  /**
   * Process generation queue
   */
  async processQueue() {
    while (this.generationQueue.length > 0 && this.currentGenerations < this.maxConcurrentGenerations) {
      const item = this.generationQueue.shift();
      this.currentGenerations++;
      
      try {
        let result;
        switch (item.type) {
          case 'background_music':
            result = await this.generateBackgroundMusic(item.params.mood, item.params.duration);
            break;
          case 'game_sound':
            result = await this.generateGameSound(item.params.effectType, item.params.description);
            break;
          case 'voice_line':
            result = await this.generateVoiceLine(item.params.text, item.params.character);
            break;
          case 'ambient_soundscape':
            result = await this.generateAmbientSoundscape(item.params.gameState);
            break;
          case 'audio_package':
            result = await this.generateAudioPackage(item.params.gameState);
            break;
        }
        
        // Update status
        item.status = result.success ? 'completed' : 'failed';
        item.result = result.success ? result : { error: result.error };
        item.timestamp = new Date().toISOString();
        
        // Cache the result
        if (result.success) {
          const cacheKey = `${item.type}_${JSON.stringify(item.params)}`;
          this.audioCache.set(cacheKey, result);
        }
        
        this.currentGenerations--;
      } catch (error) {
        item.status = 'failed';
        item.result = { error: error.message };
        item.timestamp = new Date().toISOString();
      }
    }
  }

  /**
   * Get generated audio files
   */
  getGeneratedFiles() {
    const files = [];
    
    for (const [key, data] of this.audioCache) {
      files.push({
        type: key.split('_')[0],
        filename: data.filename || `${key}_${Date.now()}`,
        filePath: data.filePath,
        timestamp: data.timestamp || new Date().toISOString(),
        size: data.size || 0
      });
    }
    
    return files.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).getTime());
  }
}

  /**
   * Clear audio cache
   */
  clearCache() {
    this.audioCache.clear();
    logger.info('Audio cache cleared');
  }
}

module.exports = AudioAIManager;
