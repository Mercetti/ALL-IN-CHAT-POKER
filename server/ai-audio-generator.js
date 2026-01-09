/**
 * AI Audio Generator
 * Uses AI to generate theme music and in-game sounds
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger();

class AIAudioGenerator {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || path.join(__dirname, '../public/assets/audio'),
      enableGeneration: options.enableGeneration !== false,
      maxDuration: options.maxDuration || 30, // seconds
      sampleRate: options.sampleRate || 44100,
      ...options
    };
    
    this.audioLibrary = new Map();
    this.soundLibrary = new Map();
    this.generationHistory = new Map();
    this.soundEffects = new Map();
    
    this.init();
  }

  init() {
    // Create audio directory if it doesn't exist
    this.ensureAudioDirectory();
    
    // Initialize sound library
    this.initializeSoundLibrary();
    
    logger.info('AI Audio Generator initialized', {
      outputDir: this.options.outputDir,
      enableGeneration: this.options.enableGeneration
    });
  }

  /**
   * Ensure audio directory exists
   */
  ensureAudioDirectory() {
    const dirs = [
      this.options.outputDir,
      path.join(this.options.outputDir, 'music'),
      path.join(this.options.outputDir, 'effects'),
      path.join(this.options.outputDir, 'ambient')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created audio directory', { dir });
      }
    });
  }

  /**
   * Initialize sound library with predefined categories
   */
  initializeSoundLibrary() {
    this.soundLibrary.set('music', {
      themes: [
        {
          name: 'main_theme',
          description: 'Main poker game theme - upbeat and engaging',
          mood: 'energetic',
          tempo: 120,
          duration: 30,
          instruments: ['piano', 'bass', 'drums', 'synth']
        },
        {
          name: 'victory_theme',
          description: 'Victory celebration music - triumphant and exciting',
          mood: 'triumphant',
          tempo: 140,
          duration: 15,
          instruments: ['trumpet', 'drums', 'cymbals', 'strings']
        },
        {
          name: 'thinking_theme',
          description: 'Background music for player decision time - thoughtful',
          mood: 'contemplative',
          tempo: 80,
          duration: 20,
          instruments: ['piano', 'strings', 'soft_pad']
        },
        {
          name: 'lobby_theme',
          description: 'Lobby/waiting area music - relaxed and welcoming',
          mood: 'relaxed',
          tempo: 100,
          duration: 25,
          instruments: ['guitar', 'bass', 'light_drums']
        }
      ]
    });

    this.soundLibrary.set('effects', {
      game: [
        {
          name: 'card_deal',
          description: 'Card dealing sound - crisp and satisfying',
          type: 'action',
          duration: 0.5,
          pitch: 'medium'
        },
        {
          name: 'chip_stack',
          description: 'Chip stacking sound - clinking and satisfying',
          type: 'action',
          duration: 0.3,
          pitch: 'medium'
        },
        {
          name: 'chip_bet',
          description: 'Chip betting sound - decisive and clear',
          type: 'action',
          duration: 0.4,
          pitch: 'high'
        },
        {
          name: 'button_click',
          description: 'UI button click sound - responsive and modern',
          type: 'ui',
          duration: 0.1,
          pitch: 'medium'
        },
        {
          name: 'notification',
          description: 'Notification sound - gentle attention grabber',
          type: 'ui',
          duration: 0.2,
          pitch: 'high'
        },
        {
          name: 'error',
          description: 'Error sound - soft but clear indication',
          type: 'ui',
          duration: 0.3,
          pitch: 'low'
        }
      ],
      events: [
        {
          name: 'win',
          description: 'Win celebration sound - exciting and rewarding',
          type: 'celebration',
          duration: 1.0,
          pitch: 'high'
        },
        {
          name: 'lose',
          description: 'Lose sound - gentle and not harsh',
          type: 'event',
          duration: 0.8,
          pitch: 'low'
        },
        {
          name: 'all_in',
          description: 'All-in dramatic sound - tension and excitement',
          type: 'event',
          duration: 1.5,
          pitch: 'high'
        },
        {
          name: 'showdown',
          description: 'Showdown reveal sound - dramatic pause',
          type: 'event',
          duration: 2.0,
          pitch: 'medium'
        }
      ]
    });

    this.soundLibrary.set('ambient', [
      {
        name: 'casino_ambient',
        description: 'Background casino atmosphere - subtle and immersive',
        type: 'atmosphere',
        duration: 60,
        intensity: 'low'
      },
      {
        name: 'table_ambient',
        description: 'Poker table background sounds - cards and chips',
        type: 'atmosphere',
        duration: 45,
        intensity: 'medium'
      }
    ]);
  }

  /**
   * Generate theme music using AI
   */
  async generateThemeMusic(themeName, options = {}) {
    try {
      const theme = this.findTheme(themeName);
      if (!theme) {
        throw new Error(`Theme '${themeName}' not found`);
      }

      logger.info('Generating theme music', { themeName, options });

      // Generate audio data using AI
      const audioData = await this.generateAudioWithAI(theme, 'music', options);
      
      // Save to file
      const filename = `${themeName}_${Date.now()}.wav`;
      const filepath = path.join(this.options.outputDir, 'music', filename);
      
      await this.saveAudioFile(audioData, filepath);
      
      // Update library
      this.audioLibrary.set(themeName, {
        filepath,
        metadata: theme,
        generatedAt: Date.now(),
        duration: audioData.duration
      });

      logger.info('Theme music generated successfully', { 
        themeName, 
        filepath, 
        duration: audioData.duration 
      });

      return {
        success: true,
        themeName,
        filepath: `/assets/audio/music/${filename}`,
        duration: audioData.duration,
        metadata: theme
      };

    } catch (error) {
      logger.error('Failed to generate theme music', { 
        themeName, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate sound effect using AI
   */
  async generateSoundEffect(effectName, options = {}) {
    try {
      const effect = this.findSoundEffect(effectName);
      if (!effect) {
        throw new Error(`Sound effect '${effectName}' not found`);
      }

      logger.info('Generating sound effect', { effectName, options });

      // Generate audio data using AI
      const audioData = await this.generateAudioWithAI(effect, 'effect', options);
      
      // Save to file
      const filename = `${effectName}_${Date.now()}.wav`;
      const filepath = path.join(this.options.outputDir, 'effects', filename);
      
      await this.saveAudioFile(audioData, filepath);
      
      // Update library
      this.soundEffects.set(effectName, {
        filepath,
        metadata: effect,
        generatedAt: Date.now(),
        duration: audioData.duration
      });

      logger.info('Sound effect generated successfully', { 
        effectName, 
        filepath, 
        duration: audioData.duration 
      });

      return {
        success: true,
        effectName,
        filepath: `/assets/audio/effects/${filename}`,
        duration: audioData.duration,
        metadata: effect
      };

    } catch (error) {
      logger.error('Failed to generate sound effect', { 
        effectName, 
        error: error.message 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate audio using AI (simulated - in production would use actual AI audio generation)
   */
  async generateAudioWithAI(audioSpec, type, options = {}) {
    // This is a simulated AI audio generation
    // In production, you would integrate with services like:
    // - OpenAI Jukebox
    // - Google MusicLM
    // - Riffusion
    // - Stable Audio
    // - Custom audio generation models

    const ai = require('./ai');
    
    const prompt = this.buildAudioPrompt(audioSpec, type, options);
    
    try {
      const response = await ai.chat([
        { 
          role: 'system', 
          content: 'You are an expert audio engineer and composer. Generate detailed audio specifications based on the requirements.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ], {
        context: 'audio',
        temperature: 0.8,
        maxTokens: 1000
      });

      // Parse AI response and generate audio data
      const audioSpec = this.parseAudioResponse(response);
      
      // Generate actual audio data (simplified simulation)
      return this.generateAudioData(audioSpec);

    } catch (error) {
      logger.warn('AI audio generation failed, using fallback', { error: error.message });
      
      // Fallback to procedural generation
      return this.generateFallbackAudio(audioSpec, type);
    }
  }

  /**
   * Build prompt for AI audio generation
   */
  buildAudioPrompt(audioSpec, type, options = {}) {
    let prompt = `Generate audio specifications for a poker game ${type}:\n\n`;
    
    prompt += `Description: ${audioSpec.description}\n`;
    prompt += `Mood: ${audioSpec.mood || audioSpec.type}\n`;
    prompt += `Duration: ${audioSpec.duration} seconds\n`;
    
    if (audioSpec.tempo) {
      prompt += `Tempo: ${audioSpec.tempo} BPM\n`;
    }
    
    if (audioSpec.instruments) {
      prompt += `Instruments: ${audioSpec.instruments.join(', ')}\n`;
    }
    
    if (audioSpec.pitch) {
      prompt += `Pitch: ${audioSpec.pitch}\n`;
    }
    
    prompt += `\nProvide detailed specifications including:\n`;
    prompt += `- Waveform characteristics\n`;
    prompt += `- Frequency ranges\n`;
    prompt += `- Envelope settings\n`;
    prompt += `- Effects and processing\n`;
    prompt += `- File format recommendations\n`;
    
    if (type === 'music') {
      prompt += `- Chord progression\n`;
      prompt += `- Melody structure\n`;
      prompt += `- Rhythm patterns\n`;
      prompt += `- Instrument arrangement\n`;
    }
    
    return prompt;
  }

  /**
   * Parse AI response to extract audio specifications
   */
  parseAudioResponse(aiResponse) {
    // Simplified parsing - in production would be more sophisticated
    const specs = {
      sampleRate: this.options.sampleRate,
      channels: 2,
      bitDepth: 16,
      duration: 30,
      frequency: 440,
      waveform: 'sine',
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.7,
        release: 0.3
      },
      effects: []
    };

    // Extract specifications from AI response
    // This would involve more sophisticated parsing in production
    
    return specs;
  }

  /**
   * Generate actual audio data (simplified simulation)
   */
  generateAudioData(specs) {
    // This is a simplified audio generation
    // In production, you would use actual audio synthesis libraries
    // like Tone.js, Web Audio API, or custom DSP
    
    const samples = specs.sampleRate * specs.duration;
    const audioData = new Float32Array(samples * specs.channels);
    
    // Generate simple sine wave as demonstration
    for (let i = 0; i < samples; i++) {
      const t = i / specs.sampleRate;
      const value = Math.sin(2 * Math.PI * specs.frequency * t) * 
                   this.envelope(t, specs.envelope);
      
      // Stereo output
      audioData[i * 2] = value;     // Left channel
      audioData[i * 2 + 1] = value; // Right channel
    }
    
    return {
      audioData,
      duration: specs.duration,
      sampleRate: specs.sampleRate,
      channels: specs.channels
    };
  }

  /**
   * ADSR envelope
   */
  envelope(time, env) {
    if (time < env.attack) {
      return time / env.attack;
    } else if (time < env.attack + env.decay) {
      const t = (time - env.attack) / env.decay;
      return 1 - t * (1 - env.sustain);
    } else if (time < env.attack + env.decay + env.sustain) {
      return env.sustain;
    } else {
      const t = (time - env.attack - env.decay - env.sustain) / env.release;
      return env.sustain * (1 - t);
    }
  }

  /**
   * Fallback audio generation
   */
  generateFallbackAudio(audioSpec, type) {
    // Generate simple procedural audio as fallback
    const specs = {
      sampleRate: this.options.sampleRate,
      channels: 2,
      duration: audioSpec.duration || 1,
      frequency: type === 'music' ? 440 : 880,
      waveform: 'sine'
    };

    return this.generateAudioData(specs);
  }

  /**
   * Save audio data to file
   */
  async saveAudioFile(audioData, filepath) {
    // This is a simplified WAV file writer
    // In production, you would use proper audio libraries
    
    const buffer = this.createWAVBuffer(audioData);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    logger.info('Audio file saved', { filepath, size: buffer.length });
  }

  /**
   * Create WAV file buffer (simplified)
   */
  createWAVBuffer(audioData) {
    // Simplified WAV file creation
    // In production, use proper audio libraries like node-wav
    
    const headerSize = 44;
    const dataSize = audioData.audioData.length * 2; // 16-bit samples
    const totalSize = headerSize + dataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, totalSize - 8, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, audioData.channels, true);
    view.setUint32(24, audioData.sampleRate, true);
    view.setUint32(28, audioData.sampleRate * audioData.channels * 2, true);
    view.setUint16(32, audioData.channels * 2, true);
    view.setUint16(34, 16, true); // bits per sample
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, dataSize, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < audioData.audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData.audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return buffer;
  }

  /**
   * Find theme by name
   */
  findTheme(themeName) {
    const themes = this.soundLibrary.get('music')?.themes || [];
    return themes.find(theme => theme.name === themeName);
  }

  /**
   * Find sound effect by name
   */
  findSoundEffect(effectName) {
    const effects = this.soundLibrary.get('effects');
    if (!effects) return null;
    
    // Search in all effect categories
    for (const category of Object.values(effects)) {
      const effect = category.find(e => e.name === effectName);
      if (effect) return effect;
    }
    
    return null;
  }

  /**
   * Generate complete audio package
   */
  async generateAudioPackage(options = {}) {
    const results = {
      music: {},
      effects: {},
      ambient: {},
      success: true,
      errors: []
    };

    try {
      // Generate all theme music
      const themes = this.soundLibrary.get('music')?.themes || [];
      for (const theme of themes) {
        if (!options.skipMusic) {
          const result = await this.generateThemeMusic(theme.name, options);
          if (result.success) {
            results.music[theme.name] = result;
          } else {
            results.errors.push(`Music ${theme.name}: ${result.error}`);
          }
        }
      }

      // Generate all sound effects
      const effects = this.soundLibrary.get('effects');
      if (effects && !options.skipEffects) {
        for (const category of Object.values(effects)) {
          for (const effect of category) {
            const result = await this.generateSoundEffect(effect.name, options);
            if (result.success) {
              results.effects[effect.name] = result;
            } else {
              results.errors.push(`Effect ${effect.name}: ${result.error}`);
            }
          }
        }
      }

      // Generate ambient sounds
      const ambient = this.soundLibrary.get('ambient') || [];
      if (!options.skipAmbient) {
        for (const amb of ambient) {
          const result = await this.generateSoundEffect(amb.name, options);
          if (result.success) {
            results.ambient[amb.name] = result;
          } else {
            results.errors.push(`Ambient ${amb.name}: ${result.error}`);
          }
        }
      }

      logger.info('Audio package generation completed', {
        musicCount: Object.keys(results.music).length,
        effectsCount: Object.keys(results.effects).length,
        ambientCount: Object.keys(results.ambient).length,
        errors: results.errors.length
      });

    } catch (error) {
      logger.error('Audio package generation failed', { error: error.message });
      results.success = false;
      results.errors.push(`Package generation: ${error.message}`);
    }

    return results;
  }

  /**
   * Get audio library
   */
  getAudioLibrary() {
    return {
      music: this.soundLibrary.get('music')?.themes || [],
      effects: this.soundLibrary.get('effects') || {},
      ambient: this.soundLibrary.get('ambient') || [],
      generated: Object.fromEntries(this.audioLibrary),
      soundEffects: Object.fromEntries(this.soundEffects)
    };
  }

  /**
   * Get generation history
   */
  getGenerationHistory() {
    return Array.from(this.generationHistory.entries()).map(([id, info]) => ({
      id,
      ...info,
      timestamp: new Date(info.timestamp).toISOString()
    }));
  }
}

module.exports = AIAudioGenerator;
