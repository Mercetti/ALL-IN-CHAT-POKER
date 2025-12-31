/**
 * Audio AI Service - Dedicated Machine for Audio Processing
 * Handles AI Audio Generator and Poker Audio System
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./server/config');
const Logger = require('./server/logger');

// Audio AI Systems
const AIAudioGenerator = require('./server/ai-audio-generator');
const PokerAudioSystem = require('./server/poker-audio-system');

const logger = new Logger();
const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://all-in-chat-poker.fly.dev'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Audio AI Systems
const aiAudioGenerator = new AIAudioGenerator({
  outputDir: path.join(__dirname, 'public/assets/audio'),
  enableGeneration: true,
  maxConcurrentGenerations: 2,
  defaultFormat: 'wav',
  quality: 'high'
});

const pokerAudio = new PokerAudioSystem({
  outputDir: path.join(__dirname, 'public/assets/audio'),
  enableGeneration: true,
  dmcaSafe: true,
  defaultMusicOff: true,
  maxDuration: 90,
  sampleRate: 44100
});

logger.info('Audio AI Service initialized', {
  audioGenerator: true,
  pokerAudio: true,
  port: config.PORT
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audio-ai',
    timestamp: new Date().toISOString(),
    systems: {
      audioGenerator: 'active',
      pokerAudio: 'active'
    }
  });
});

// Audio Generator Endpoints
app.get('/admin/ai/audio/library', (req, res) => {
  try {
    const library = aiAudioGenerator.getAudioLibrary();
    res.json(library);
  } catch (error) {
    logger.error('Failed to get audio library', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/ai/audio/generate/music', async (req, res) => {
  try {
    const { themeName, options } = req.body;
    
    if (!themeName) {
      return res.status(400).json({ error: 'themeName is required' });
    }
    
    const result = await aiAudioGenerator.generateThemeMusic(themeName, options);
    
    if (result.success) {
      logger.info('Theme music generated', { themeName, filepath: result.filepath });
    } else {
      logger.warn('Theme music generation failed', { themeName, error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Theme music generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/ai/audio/generate/effect', async (req, res) => {
  try {
    const { effectName, options } = req.body;
    
    if (!effectName) {
      return res.status(400).json({ error: 'effectName is required' });
    }
    
    const result = await aiAudioGenerator.generateSoundEffect(effectName, options);
    
    if (result.success) {
      logger.info('Sound effect generated', { effectName, filepath: result.filepath });
    } else {
      logger.warn('Sound effect generation failed', { effectName, error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Sound effect generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/ai/audio/generate/package', async (req, res) => {
  try {
    const options = req.body || {};
    
    logger.info('Starting complete audio package generation', options);
    
    const result = await aiAudioGenerator.generateAudioPackage(options);
    
    if (result.success) {
      logger.info('Audio package generated successfully', {
        musicCount: Object.keys(result.music).length,
        effectsCount: Object.keys(result.effects).length,
        ambientCount: Object.keys(result.ambient).length
      });
    } else {
      logger.error('Audio package generation failed', { errors: result.errors });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Audio package generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.get('/admin/ai/audio/history', (req, res) => {
  try {
    const history = aiAudioGenerator.getGenerationHistory();
    res.json(history);
  } catch (error) {
    logger.error('Failed to get audio generation history', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Poker Audio System Endpoints
app.get('/api/audio/library', (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    const userTier = req.query.tier || 'affiliate';
    const library = pokerAudio.getAvailableAudio(userId);
    
    res.json({
      library,
      userTier,
      dmcaPolicy: pokerAudio.getDMCAPolicy(),
      phases: Object.keys(library)
    });
  } catch (error) {
    logger.error('Failed to get audio library', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/audio/settings', (req, res) => {
  try {
    const userId = req.body.userId || 'anonymous';
    const settings = req.body;
    
    const updatedSettings = pokerAudio.updateUserSettings(userId, settings);
    
    res.json({
      success: true,
      settings: updatedSettings
    });
  } catch (error) {
    logger.error('Failed to update user audio settings', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/audio/generate/phase', async (req, res) => {
  try {
    const { phase, tier } = req.body;
    
    if (!phase) {
      return res.status(400).json({ error: 'phase is required' });
    }
    
    const userTier = tier || 'affiliate';
    const result = await pokerAudio.generatePhaseAudio(phase, userTier);
    
    logger.info('Phase audio generation completed', { 
      phase, 
      tier: userTier, 
      totalGenerated: result.totalGenerated 
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Phase audio generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/admin/audio/generate/tier-package', async (req, res) => {
  try {
    const { tier } = req.body;
    const userTier = tier || 'affiliate';
    
    logger.info('Starting tier package generation', { tier: userTier });
    
    const result = await pokerAudio.generateTierPackage(userTier);
    
    logger.info('Tier package generation completed', {
      tier: userTier,
      totalGenerated: result.totalGenerated,
      phases: Object.keys(result.phases)
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Tier package generation failed', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// Static files for generated audio
app.use('/assets/audio', express.static(path.join(__dirname, 'public/assets/audio')));

// Error handling
app.use((error, req, res, next) => {
  logger.error('Audio AI Service error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(config.PORT, '0.0.0.0', () => {
  logger.info(`Audio AI Service running on 0.0.0.0:${config.PORT}`, {
    environment: config.NODE_ENV,
    service: 'audio-ai'
  });
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof config.PORT === 'string' ? 'Pipe ' + config.PORT : 'Port ' + config.PORT;

  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Audio AI Service received SIGTERM, shutting down gracefully');
  server.close(() => {
    logger.info('Audio AI Service closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Audio AI Service received SIGINT, shutting down gracefully');
  server.close(() => {
    logger.info('Audio AI Service closed');
    process.exit(0);
  });
});
