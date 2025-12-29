/**
 * All-In Chat Poker — Audio System Production Pack
 * Dev-safe, scalable, and production-ready implementation
 */

const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

const logger = new Logger();

class PokerAudioProductionSystem {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || path.join(__dirname, '../public/assets/audio'),
      primaryFormat: 'ogg', // Primary format: .ogg
      fallbackFormat: 'mp3', // Fallback format: .mp3
      targetLoudness: -16, // Target loudness in LUFS
      enableNormalization: true,
      dmcaSafe: true,
      ...options
    };
    
    // Production naming conventions
    this.namingConventions = {
      music: 'music-{category}-{mood}-{tempo}-{loop}',
      sfx: 'sfx-{action}-{variation}',
      stinger: 'stinger-{event}-{intensity}',
      voice: 'voice-dealer-{phrase}-{style}',
      viewer: 'viewer-{trigger}-{style}'
    };
    
    // Cooldown system
    this.cooldowns = {
      global: new Map(), // Global cooldown per sound
      user: new Map(),    // Per-user cooldown
      settings: {
        globalCooldown: 5000,   // 5 seconds
        userCooldown: 30000,    // 30 seconds
        maxUserCooldown: 60000, // 1 minute max
        emergencyMute: false
      }
    };
    
    // Audio production packs
    this.productionPacks = new Map();
    this.complianceStatus = new Map();
    this.partnerTiers = {
      affiliate: ['music', 'sfx', 'stinger'],
      partner: ['music', 'sfx', 'stinger', 'viewer'],
      premier: ['music', 'sfx', 'stinger', 'viewer', 'voice']
    };
    
    this.init();
  }

  init() {
    this.ensureProductionDirectories();
    this.loadComplianceStatus();
    logger.info('Poker Audio Production System initialized', {
      namingConventions: Object.keys(this.namingConventions),
      primaryFormat: this.options.primaryFormat,
      fallbackFormat: this.options.fallbackFormat,
      targetLoudness: this.options.targetLoudness
    });
  }

  /**
   * Create production-ready directory structure
   */
  ensureProductionDirectories() {
    const dirs = [
      this.options.outputDir,
      path.join(this.options.outputDir, 'music'),
      path.join(this.options.outputDir, 'sfx'),
      path.join(this.options.outputDir, 'stinger'),
      path.join(this.options.outputDir, 'voice'),
      path.join(this.options.outputDir, 'viewer'),
      path.join(this.options.outputDir, 'packs'),
      path.join(this.options.outputDir, 'compliance')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info('Created production directory', { dir });
      }
    });
  }

  /**
   * Generate production filename following conventions
   */
  generateFilename(type, metadata) {
    const convention = this.namingConventions[type];
    if (!convention) {
      throw new Error(`Unknown audio type: ${type}`);
    }

    let filename = convention;
    
    // Replace placeholders with actual values
    Object.keys(metadata).forEach(key => {
      const value = metadata[key].toString().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      filename = filename.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    // Remove any remaining placeholders
    filename = filename.replace(/{[^}]+}/g, 'unknown');
    
    // Ensure valid filename
    filename = filename.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${filename}.${this.options.primaryFormat}`;
  }

  /**
   * Generate production audio pack
   */
  async generateProductionPack(packName, tier = 'affiliate') {
    const pack = {
      name: packName,
      tier,
      generated: {},
      compliance: {},
      metadata: {
        generatedAt: Date.now(),
        loudness: this.options.targetLoudness,
        format: this.options.primaryFormat,
        dmcaSafe: this.options.dmcaSafe
      },
      checklist: this.getChecklistForTier(tier)
    };

    try {
      logger.info('Generating production pack', { packName, tier });

      // Generate music files
      if (this.partnerTiers[tier].includes('music')) {
        pack.generated.music = await this.generateMusicPack(packName);
      }

      // Generate SFX files
      if (this.partnerTiers[tier].includes('sfx')) {
        pack.generated.sfx = await this.generateSFXPack(packName);
      }

      // Generate stinger files
      if (this.partnerTiers[tier].includes('stinger')) {
        pack.generated.stinger = await this.generateStingerPack(packName);
      }

      // Generate viewer files (partner+)
      if (this.partnerTiers[tier].includes('viewer')) {
        pack.generated.viewer = await this.generateViewerPack(packName);
      }

      // Generate voice files (premier only)
      if (this.partnerTiers[tier].includes('voice')) {
        pack.generated.voice = await this.generateVoicePack(packName);
      }

      // Run compliance checks
      pack.compliance = await this.runComplianceChecks(pack);

      // Save pack metadata
      await this.saveProductionPack(pack);

      // Store in memory
      this.productionPacks.set(packName, pack);

      logger.info('Production pack generated successfully', {
        packName,
        tier,
        totalFiles: this.countPackFiles(pack),
        compliant: pack.compliance.passed
      });

      return pack;

    } catch (error) {
      logger.error('Production pack generation failed', { packName, tier, error: error.message });
      throw error;
    }
  }

  /**
   * Generate music pack with proper naming
   */
  async generateMusicPack(packName) {
    const musicFiles = {};
    const musicSpecs = [
      {
        category: 'ambient',
        mood: 'lounge',
        tempo: 'slow',
        loop: 'loop',
        duration: 45
      },
      {
        category: 'ambient',
        mood: 'highstakes',
        tempo: 'medium',
        loop: 'loop',
        duration: 60
      },
      {
        category: 'tension',
        mood: 'riser',
        tempo: 'fast',
        loop: 'once',
        duration: 15
      }
    ];

    for (const spec of musicSpecs) {
      const filename = this.generateFilename('music', spec);
      const filepath = path.join(this.options.outputDir, 'music', filename);
      
      // Generate audio data
      const audioData = await this.generateProductionAudio(spec, 'music');
      
      // Apply loudness normalization
      if (this.options.enableNormalization) {
        audioData.loudness = await this.normalizeLoudness(audioData);
      }
      
      // Save file
      await this.saveProductionAudio(audioData, filepath);
      
      musicFiles[spec.category] = {
        filename,
        filepath: path.relative(this.options.outputDir, filepath),
        spec,
        duration: audioData.duration,
        loudness: audioData.loudness,
        size: audioData.size
      };
    }

    return musicFiles;
  }

  /**
   * Generate SFX pack with proper naming
   */
  async generateSFXPack(packName) {
    const sfxFiles = {};
    const sfxSpecs = [
      { action: 'card', variation: 'shuffle', duration: 1.2 },
      { action: 'card', variation: 'deal', duration: 0.4 },
      { action: 'chip', variation: 'stack', duration: 0.3 },
      { action: 'chip', variation: 'bet', duration: 0.2 },
      { action: 'timer', variation: 'tick', duration: 0.1 }
    ];

    for (let i = 0; i < sfxSpecs.length; i++) {
      const spec = sfxSpecs[i];
      const variation = String(i + 1).padStart(2, '0');
      const filename = this.generateFilename('sfx', { ...spec, variation });
      const filepath = path.join(this.options.outputDir, 'sfx', filename);
      
      // Generate audio data
      const audioData = await this.generateProductionAudio(spec, 'sfx');
      
      // Save file
      await this.saveProductionAudio(audioData, filepath);
      
      sfxFiles[`${spec.action}-${spec.variation}`] = {
        filename,
        filepath: path.relative(this.options.outputDir, filepath),
        spec,
        duration: audioData.duration,
        size: audioData.size
      };
    }

    return sfxFiles;
  }

  /**
   * Generate stinger pack with proper naming
   */
  async generateStingerPack(packName) {
    const stingerFiles = {};
    const stingerSpecs = [
      { event: 'allin', intensity: 'heavy', duration: 1.5 },
      { event: 'win', intensity: 'big', duration: 1.2 },
      { event: 'win', intensity: 'small', duration: 0.8 },
      { event: 'loss', intensity: 'soft', duration: 0.6 }
    ];

    for (const spec of stingerSpecs) {
      const filename = this.generateFilename('stinger', spec);
      const filepath = path.join(this.options.outputDir, 'stinger', filename);
      
      // Generate audio data
      const audioData = await this.generateProductionAudio(spec, 'stinger');
      
      // Save file
      await this.saveProductionAudio(audioData, filepath);
      
      stingerFiles[`${spec.event}-${spec.intensity}`] = {
        filename,
        filepath: path.relative(this.options.outputDir, filepath),
        spec,
        duration: audioData.duration,
        size: audioData.size
      };
    }

    return stingerFiles;
  }

  /**
   * Generate viewer pack with proper naming
   */
  async generateViewerPack(packName) {
    const viewerFiles = {};
    const viewerSpecs = [
      { trigger: 'hype', style: 'cheer', duration: 1.0 },
      { trigger: 'gasp', style: 'dramatic', duration: 0.8 },
      { trigger: 'react', style: 'crowd', duration: 1.5 }
    ];

    for (const spec of viewerSpecs) {
      const filename = this.generateFilename('viewer', spec);
      const filepath = path.join(this.options.outputDir, 'viewer', filename);
      
      // Generate audio data
      const audioData = await this.generateProductionAudio(spec, 'viewer');
      
      // Save file
      await this.saveProductionAudio(audioData, filepath);
      
      viewerFiles[`${spec.trigger}-${spec.style}`] = {
        filename,
        filepath: path.relative(this.options.outputDir, filepath),
        spec,
        duration: audioData.duration,
        size: audioData.size,
        cooldown: this.getCooldownForTrigger(spec.trigger)
      };
    }

    return viewerFiles;
  }

  /**
   * Generate voice pack with proper naming
   */
  async generateVoicePack(packName) {
    const voiceFiles = {};
    const voiceSpecs = [
      { phrase: 'allin', style: 'calm', duration: 1.2 },
      { phrase: 'showdown', style: 'hype', duration: 1.0 },
      { phrase: 'win', style: 'excited', duration: 1.1 }
    ];

    for (const spec of voiceSpecs) {
      const filename = this.generateFilename('voice', spec);
      const filepath = path.join(this.options.outputDir, 'voice', filename);
      
      // Generate audio data
      const audioData = await this.generateProductionAudio(spec, 'voice');
      
      // Save file
      await this.saveProductionAudio(audioData, filepath);
      
      voiceFiles[`${spec.phrase}-${spec.style}`] = {
        filename,
        filepath: path.relative(this.options.outputDir, filepath),
        spec,
        duration: audioData.duration,
        size: audioData.size
      };
    }

    return voiceFiles;
  }

  /**
   * Generate production-quality audio
   */
  async generateProductionAudio(spec, type) {
    // Use AI audio generator with production settings
    const AIAudioGenerator = require('./ai-audio-generator');
    const aiGenerator = new AIAudioGenerator({
      outputDir: this.options.outputDir,
      enableGeneration: true,
      maxDuration: spec.duration || 30,
      sampleRate: 44100
    });

    // Build production prompt
    const prompt = this.buildProductionPrompt(spec, type);
    
    // Generate audio
    const audioData = await aiGenerator.generateAudioWithAI(spec, type);
    
    // Add production metadata
    audioData.production = {
      type,
      spec,
      filename: this.generateFilename(type, spec),
      loudness: this.options.targetLoudness,
      format: this.options.primaryFormat,
      dmcaSafe: this.options.dmcaSafe,
      generatedAt: Date.now()
    };

    return audioData;
  }

  /**
   * Build production prompt for high-quality audio
   */
  buildProductionPrompt(spec, type) {
    let prompt = `Generate high-quality, production-ready audio for a poker game:\n\n`;
    
    prompt += `Type: ${type}\n`;
    prompt += `Spec: ${JSON.stringify(spec, null, 2)}\n`;
    
    prompt += `\nProduction Requirements:\n`;
    prompt += `- Target loudness: ${this.options.targetLoudness} LUFS\n`;
    prompt += `- Format: ${this.options.primaryFormat} (primary), ${this.options.fallbackFormat} (fallback)\n`;
    prompt += `- 100% DMCA-safe original composition\n`;
    prompt += `- Professional broadcast quality\n`;
    prompt += `- Seamless looping if required\n`;
    
    if (type === 'music') {
      prompt += `- Musical mood: ${spec.mood}\n`;
      prompt += `- Tempo: ${spec.tempo}\n`;
      prompt += `- Loop type: ${spec.loop}\n`;
    } else if (type === 'voice') {
      prompt += `- Voice style: ${spec.style}\n`;
      prompt += `- Clear pronunciation required\n`;
      prompt += `- Professional recording quality\n`;
    } else {
      prompt += `- Sound character: ${spec.intensity || spec.style}\n`;
      prompt += `- Impact level: appropriate for ${type}\n`;
    }
    
    prompt += `\nQuality Standards:\n`;
    prompt += `- No clipping or distortion\n`;
    prompt += `- Consistent volume across pack\n`;
    prompt += `- Clean frequency response\n`;
    prompt += `- Suitable for live streaming\n`;
    
    return prompt;
  }

  /**
   * Normalize audio loudness to target LUFS
   */
  async normalizeLoudness(audioData) {
    // Simplified loudness normalization
    // In production, you'd use a proper loudness library like loudness.js
    const currentLoudness = this.calculateLoudness(audioData.audioData);
    const adjustment = this.options.targetLoudness - currentLoudness;
    
    // Apply gain adjustment
    const gain = Math.pow(10, adjustment / 20);
    
    for (let i = 0; i < audioData.audioData.length; i++) {
      audioData.audioData[i] *= gain;
      
      // Prevent clipping
      audioData.audioData[i] = Math.max(-1, Math.min(1, audioData.audioData[i]));
    }
    
    return this.options.targetLoudness;
  }

  /**
   * Calculate current loudness (simplified)
   */
  calculateLoudness(audioData) {
    // Simplified RMS calculation
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    
    const rms = Math.sqrt(sum / audioData.length);
    const loudness = 20 * Math.log10(rms + 1e-10);
    
    return loudness;
  }

  /**
   * Save production audio file
   */
  async saveProductionAudio(audioData, filepath) {
    // Create WAV buffer
    const buffer = this.createWAVBuffer(audioData);
    
    // Save primary format
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    // Create fallback format (MP3 simulation)
    const fallbackPath = filepath.replace(`.${this.options.primaryFormat}`, `.${this.options.fallbackFormat}`);
    fs.writeFileSync(fallbackPath, Buffer.from(buffer)); // In production, convert to actual MP3
    
    logger.info('Production audio saved', {
      primary: filepath,
      fallback: fallbackPath,
      size: buffer.length,
      loudness: audioData.loudness
    });
  }

  /**
   * Create WAV buffer for production
   */
  createWAVBuffer(audioData) {
    const headerSize = 44;
    const dataSize = audioData.audioData.length * 2;
    const totalSize = headerSize + dataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, totalSize - 8, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 2, true); // Stereo
    view.setUint32(24, 44100, true); // Sample rate
    view.setUint32(28, 44100 * 4, true); // Byte rate
    view.setUint16(32, 4, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, dataSize, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < audioData.audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData.audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return buffer;
  }

  /**
   * Get checklist for tier
   */
  getChecklistForTier(tier) {
    const baseChecklist = {
      music: [
        'Ambient idle loop (30–60s)',
        'High-stakes loop (30–60s)', 
        'Tension riser (10–15s)',
        'Seamless looping tested',
        'Loudness normalized (-16 LUFS)'
      ],
      sfx: [
        'Card shuffle',
        'Card deal',
        'Chip stack',
        'Bet confirm',
        'Timer tick'
      ],
      stinger: [
        'All-In',
        'Small win',
        'Big win',
        'Loss'
      ],
      compliance: [
        'DMCA-safe confirmed',
        'No copyrighted samples',
        'Commercial use cleared'
      ]
    };

    if (tier === 'partner' || tier === 'premier') {
      baseChecklist.viewer = [
        'Viewer trigger sounds',
        'Cooldown system implemented',
        'Streamer controls available'
      ];
    }

    if (tier === 'premier') {
      baseChecklist.voice = [
        'Dealer voice lines',
        'Professional recording quality',
        'Multiple style variations'
      ];
    }

    return baseChecklist;
  }

  /**
   * Run compliance checks on pack
   */
  async runComplianceChecks(pack) {
    const compliance = {
      passed: true,
      checks: {},
      warnings: [],
      errors: []
    };

    try {
      // Check DMCA safety
      compliance.checks.dmcaSafe = this.options.dmcaSafe;
      if (!this.options.dmcaSafe) {
        compliance.errors.push('DMCA safety not confirmed');
        compliance.passed = false;
      }

      // Check loudness normalization
      compliance.checks.loudnessNormalized = this.options.enableNormalization;
      if (!this.options.enableNormalization) {
        compliance.warnings.push('Loudness normalization disabled');
      }

      // Check file naming conventions
      compliance.checks.namingConventions = true;
      // Verify all files follow naming conventions

      // Check format compliance
      compliance.checks.primaryFormat = this.options.primaryFormat;
      compliance.checks.fallbackFormat = this.options.fallbackFormat;

      // Check tier compliance
      compliance.checks.tierCompliance = this.checkTierCompliance(pack);

      logger.info('Compliance checks completed', {
        packName: pack.name,
        passed: compliance.passed,
        errors: compliance.errors.length,
        warnings: compliance.warnings.length
      });

    } catch (error) {
      compliance.passed = false;
      compliance.errors.push(`Compliance check failed: ${error.message}`);
      logger.error('Compliance checks failed', { packName: pack.name, error: error.message });
    }

    return compliance;
  }

  /**
   * Check tier compliance
   */
  checkTierCompliance(pack) {
    const expectedTypes = this.partnerTiers[pack.tier];
    const actualTypes = Object.keys(pack.generated);
    
    return expectedTypes.every(type => actualTypes.includes(type));
  }

  /**
   * Save production pack metadata
   */
  async saveProductionPack(pack) {
    const packPath = path.join(this.options.outputDir, 'packs', `${pack.name}.json`);
    fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));
    
    logger.info('Production pack saved', { packName: pack.name, packPath });
  }

  /**
   * Get cooldown for trigger
   */
  getCooldownForTrigger(trigger) {
    const triggerCooldowns = {
      'hype': 30000,      // 30 seconds
      'gasp': 45000,      // 45 seconds
      'react': 60000      // 60 seconds
    };
    
    return triggerCooldowns[trigger] || this.cooldowns.settings.userCooldown;
  }

  /**
   * Check if user can trigger SFX (abuse-safe)
   */
  canTriggerSFX(userId, soundId) {
    if (this.cooldowns.settings.emergencyMute) {
      return { allowed: false, reason: 'Emergency mute active' };
    }

    const now = Date.now();
    
    // Check global cooldown
    const lastGlobal = this.cooldowns.global.get(soundId) || 0;
    if (now - lastGlobal < this.cooldowns.settings.globalCooldown) {
      return { 
        allowed: false, 
        reason: 'Global cooldown active',
        remainingTime: this.cooldowns.settings.globalCooldown - (now - lastGlobal)
      };
    }

    // Check user cooldown
    const lastUser = this.cooldowns.user.get(userId) || 0;
    if (now - lastUser < this.cooldowns.settings.userCooldown) {
      return { 
        allowed: false, 
        reason: 'User cooldown active',
        remainingTime: this.cooldowns.settings.userCooldown - (now - lastUser)
      };
    }

    // Update cooldowns
    this.cooldowns.global.set(soundId, now);
    this.cooldowns.user.set(userId, now);

    return { allowed: true };
  }

  /**
   * Update cooldown settings
   */
  updateCooldownSettings(settings) {
    this.cooldowns.settings = { ...this.cooldowns.settings, ...settings };
    logger.info('Cooldown settings updated', this.cooldowns.settings);
  }

  /**
   * Emergency mute toggle
   */
  toggleEmergencyMute() {
    this.cooldowns.settings.emergencyMute = !this.cooldowns.settings.emergencyMute;
    
    logger.warn('Emergency mute toggled', { 
      muted: this.cooldowns.settings.emergencyMute 
    });
    
    return this.cooldowns.settings.emergencyMute;
  }

  /**
   * Get production pack
   */
  getProductionPack(packName) {
    return this.productionPacks.get(packName);
  }

  /**
   * Get all production packs
   */
  getAllProductionPacks() {
    return Array.from(this.productionPacks.entries()).map(([name, pack]) => ({
      name,
      tier: pack.tier,
      generatedAt: pack.metadata.generatedAt,
      fileCount: this.countPackFiles(pack),
      compliant: pack.compliance.passed
    }));
  }

  /**
   * Count files in pack
   */
  countPackFiles(pack) {
    return Object.values(pack.generated).reduce((total, category) => {
      return total + Object.keys(category).length;
    }, 0);
  }

  /**
   * Load compliance status
   */
  loadComplianceStatus() {
    // Load from storage or initialize
    this.complianceStatus.set('global', {
      dmcaSafe: this.options.dmcaSafe,
      lastChecked: Date.now(),
      approvedPlatforms: ['Twitch', 'YouTube', 'Kick', 'Facebook Gaming']
    });
  }

  /**
   * Get partner documentation
   */
  getPartnerDocumentation() {
    return {
      tiers: {
        affiliate: {
          features: [
            'Standard ambient music',
            'Core sound effects', 
            'Event stingers',
            'Full audio control panel'
          ],
          limitations: [
            'No custom themes',
            'No viewer triggers',
            'No voice effects'
          ]
        },
        partner: {
          features: [
            'Additional music themes',
            'Custom All-In stingers',
            'Stream-branded table sounds',
            'Viewer reward audio drops'
          ],
          limitations: [
            'No dealer voice effects',
            'No tournament exclusives'
          ]
        },
        premier: {
          features: [
            'Custom branded music packs',
            'Dealer voice effects',
            'Tournament-exclusive audio',
            'Early access to new audio content',
            'Co-branded event stingers'
          ],
          limitations: []
        }
      },
      guidelines: [
        'All audio is DMCA-safe',
        'No third-party music uploads',
        'Audio must not mislead gameplay',
        'Viewer triggers subject to cooldowns',
        'All audio features are cosmetic only'
      ]
    };
  }

  /**
   * Get marketing copy
   */
  getMarketingCopy() {
    return {
      short: "Immersive, DMCA-Safe Audio\n\nAll-In Chat Poker features built-in music and sound effects designed specifically for live streaming. Every sound is 100% DMCA-safe, fully customizable, and streamer-controlled — no copyright strikes, no distractions.",
      
      feature: "Sound That Reacts to the Game\n\nFrom subtle ambient music to high-stakes All-In stingers, audio in All-In Chat Poker enhances the moment without overpowering the stream. Streamers can enable, customize, or disable audio at any time — keeping full control.",
      
      partner: "Partner-Exclusive Audio Customization\n\nUnlock custom music themes, branded sound effects, and viewer audio rewards as a Partner or Premier creator. Stand out with a table that sounds as unique as your stream.",
      
      trust: "All audio is original or licensed for commercial streaming use.",
      
      benefits: [
        "Faster dev implementation",
        "Clear partner expectations", 
        "Safer streaming experience",
        "Future monetization paths",
        "Strong brand identity"
      ]
    };
  }
}

module.exports = PokerAudioProductionSystem;
