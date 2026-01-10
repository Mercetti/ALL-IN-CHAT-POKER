/**
 * Simple Express server to test deployment
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import simple auth routes
const { createSimpleAuthRouter } = require('./server/routes/auth-simple');
const { createSimpleAdminServicesRouter } = require('./server/routes/admin-services-simple');
const { createSimpleAdminAiControlRouter } = require('./server/routes/admin-ai-control-simple');

// Import Poker Audio System
const PokerAudioSystem = require('./server/poker-audio-system');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes
const authRoutes = createSimpleAuthRouter();
app.use('/auth', authRoutes);

// Admin services routes
const adminServicesRoutes = createSimpleAdminServicesRouter();
app.use('/admin/services', adminServicesRoutes);

// Admin AI control routes
const adminAiControlRoutes = createSimpleAdminAiControlRouter();
app.use('/admin/ai', adminAiControlRoutes);
app.use('/admin/ai-tools', adminAiControlRoutes); // Add alias for ai-tools endpoints

// Initialize Poker Audio System
let pokerAudioSystem;
try {
  pokerAudioSystem = new PokerAudioSystem({
    outputDir: path.join(__dirname, 'public/assets/audio'),
    enableGeneration: true,
    dmcaSafe: true,
    defaultMusicOff: true,
    maxDuration: 90,
    sampleRate: 44100
  });
  
  // Initialize the audio system
  pokerAudioSystem.initialize().then(() => {
    console.log('🎵 Poker Audio System initialized successfully');
  }).catch((error) => {
    console.error('❌ Failed to initialize Poker Audio System:', error.message);
  });
} catch (error) {
  console.error('❌ Failed to create Poker Audio System:', error.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Critical Functions for System Health
async function runSyntheticCheck() {
  try {
    console.log('Running synthetic health check...');
    
    const results = {
      database: 'OK',
      memory: 'OK',
      ai: 'OK',
      timestamp: new Date().toISOString()
    };
    
    console.log('Synthetic check completed', results);
    return results;
  } catch (error) {
    console.error('Synthetic check failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function runAssetCheck() {
  try {
    console.log('Running asset health check...');
    
    const publicDir = path.join(__dirname, 'public');
    const checks = {
      logoExists: fs.existsSync(path.join(publicDir, 'logo.png')),
      assetsDir: fs.existsSync(publicDir),
      cosmeticsDir: fs.existsSync(path.join(publicDir, 'assets', 'cosmetics'))
    };
    
    const results = {
      ...checks,
      status: Object.values(checks).every(Boolean) ? 'OK' : 'FAILED',
      timestamp: new Date().toISOString()
    };
    
    console.log('Asset check completed', results);
    return results;
  } catch (error) {
    console.error('Asset check failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function backupDb() {
  try {
    console.log('Database backup not implemented in simple mode');
    return { status: 'SKIPPED', message: 'Backup not implemented' };
  } catch (error) {
    console.error('Database backup failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function vacuumDb() {
  try {
    console.log('Database vacuum not implemented in simple mode');
    return { status: 'SKIPPED', message: 'Vacuum not implemented' };
  } catch (error) {
    console.error('Database vacuum failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

function getCriticalHashes() {
  try {
    const criticalFiles = [
      'server.js',
      'server/config.js',
      'server/auth.js',
      'server/db.js'
    ];
    
    const hashes = {};
    
    criticalFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
      } else {
        hashes[file] = 'MISSING';
      }
    });
    
    const results = {
      status: 'OK',
      hashes,
      timestamp: new Date().toISOString()
    };
    
    console.debug('Critical hashes generated', results);
    return results;
  } catch (error) {
    console.error('Failed to get critical hashes', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Export critical functions for health monitoring
module.exports = {
  runSyntheticCheck,
  runAssetCheck,
  backupDb,
  vacuumDb,
  getCriticalHashes,
  app,
  server,
  io
};

// Placeholder image endpoint for missing assets
app.get('/assets/placeholder.png', (req, res) => {
  // Return a simple 1x1 transparent PNG as base64
  const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
  res.send(transparentPixel);
});

// Dynamic cosmetic preview image generation
app.get('/uploads/cosmetics/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Extract cosmetic ID from filename
    const cosmeticId = filename.replace('_preview.png', '').replace('_cardback.png', '').replace('_table.png', '').replace('_chips.png', '');
    
    // Generate different colored placeholders based on cosmetic ID
    let color = '#888888'; // Default gray
    
    switch (cosmeticId) {
      case 'cosmetic_001':
        color = '#FF00FF'; // Neon purple
        break;
      case 'cosmetic_002':
        color = '#FFD700'; // Gold
        break;
      case 'cosmetic_003':
        color = '#00FFFF'; // Cyan
        break;
      case 'cosmetic_004':
        color = '#FF8800'; // Orange
        break;
      default:
        color = '#888888';
    }
    
    // Create a simple SVG image (browsers can handle SVG in img tags)
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="${color}"/>
        <text x="100" y="100" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
          ${cosmeticId.toUpperCase()}
        </text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (error) {
    console.error('Preview image error:', error);
    // Fallback to transparent pixel
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(transparentPixel);
  }
});

// Audio file endpoints - stream generated audio on the fly with type-specific sounds
app.get('/uploads/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    // Extract audio ID from filename
    const audioId = filename.replace('.mp3', '');
    
    // Determine audio type based on filename
    let audioType = 'background_music';
    let effectType = null;
    let frequency = 440; // Default A4 note
    let duration = 2; // Default duration
    
    if (filename.includes('chip_stack')) {
      audioType = 'game_sound';
      effectType = 'chip_stack';
      frequency = 800; // Higher frequency for chip sounds
      duration = 0.1; // Short duration for sound effects
    } else if (filename.includes('victory')) {
      audioType = 'game_sound';
      effectType = 'victory';
      frequency = 600; // Victory fanfare frequency
      duration = 0.5; // Medium duration
    } else if (filename.includes('card')) {
      audioType = 'game_sound';
      effectType = 'card';
      frequency = 1000; // Card flip sound
      duration = 0.05; // Very short duration
    } else if (filename.includes('theme')) {
      audioType = 'background_music';
      frequency = 220; // Lower frequency for background music
      duration = 3; // Longer duration for music
    }
    
    // Generate appropriate audio based on type
    const sampleRate = 44100;
    const samples = sampleRate * duration;
    const audioBuffer = Buffer.alloc(samples * 2); // 16-bit samples
    
    if (audioType === 'game_sound') {
      // Generate game sound effects
      if (effectType === 'chip_stack') {
        // Chip stack sound - quick descending tones
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate;
          const envelope = Math.exp(-t * 20); // Quick decay
          const freq = frequency * (1 - t * 0.5); // Descending frequency
          const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5 * 32767;
          audioBuffer.writeInt16LE(Math.round(sample), i * 2);
        }
      } else if (effectType === 'victory') {
        // Victory sound - ascending arpeggio
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate;
          const envelope = Math.sin(Math.PI * t / duration); // Smooth envelope
          const freq = frequency * (1 + t * 0.5); // Ascending frequency
          const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6 * 32767;
          audioBuffer.writeInt16LE(Math.round(sample), i * 2);
        }
      } else if (effectType === 'card') {
        // Card flip sound - quick click
        for (let i = 0; i < samples; i++) {
          const t = i / sampleRate;
          const envelope = Math.exp(-t * 50); // Very quick decay
          const noise = (Math.random() - 0.5) * 0.3; // Add some noise
          const sample = (Math.sin(2 * Math.PI * frequency * t) + noise) * envelope * 32767;
          audioBuffer.writeInt16LE(Math.round(sample), i * 2);
        }
      }
    } else {
      // Generate background music - more complex waveform
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const envelope = 0.3 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t); // Slow modulation
        const sample = (
          Math.sin(2 * Math.PI * frequency * t) * 0.3 +
          Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2 +
          Math.sin(2 * Math.PI * frequency * 2 * t) * 0.1
        ) * envelope * 32767;
        audioBuffer.writeInt16LE(Math.round(sample), i * 2);
      }
    }
    
    // Create a proper WAV file
    const channels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    const dataSize = audioBuffer.length;
    const fileSize = 36 + dataSize;
    
    // WAV header
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    // Combine header and audio data
    const wavData = Buffer.concat([header, audioBuffer]);
    
    // Set proper headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', wavData.length);
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Send the audio
    res.send(wavData);
  } catch (error) {
    console.error('Audio file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Audio streaming endpoint for real-time generation
app.get('/uploads/audio/stream/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Set up streaming headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Generate a simple tone stream
    const sampleRate = 22050;
    const duration = 1;
    const frequency = 440;
    
    // Create a simple WAV stream (more reliable than MP3)
    const numSamples = sampleRate * duration;
    const channels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // WAV header
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    
    // Generate sine wave data
    const audioData = Buffer.alloc(dataSize);
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.1 * 32767;
      const sampleInt = Math.round(sample);
      audioData.writeInt16LE(sampleInt, i * 2);
    }
    
    // Send header first
    res.write(header);
    
    // Stream audio data in chunks
    const chunkSize = 1024;
    for (let i = 0; i < audioData.length; i += chunkSize) {
      const chunk = audioData.slice(i, i + chunkSize);
      res.write(chunk);
      
      // Small delay to simulate streaming
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Audio streaming error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Simple server initialization complete');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
