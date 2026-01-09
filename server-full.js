/**
 * Main Express/Socket.IO server with game logic, auth, and Twitch integration
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

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

// Import ConnectionHardener
const ConnectionHardener = require('./server/connection-hardener');
const connectionHardener = new ConnectionHardener();

// Import database and other modules
const db = require('./server/db');
const auth = require('./server/auth');
const config = require('./server/config');

// Import routes
const adminRoutes = require('./server/routes/admin');
const authRoutes = require('./server/routes/auth');
const publicRoutes = require('./server/routes/public');
const adminServicesRoutes = require('./server/routes/admin-services');
const adminAiControlRoutes = require('./server/routes/admin-ai-control');
const partnersRoutes = require('./server/routes/partners');
const catalogRoutes = require('./server/routes/catalog');

// Game modules
const pokerGame = require('./server/game/poker');
const blackjackGame = require('./server/game/blackjack');

// AI Systems
const aiErrorManager = require('./server/ai-error-manager');
const aiPerformanceOptimizer = require('./server/ai-performance-optimizer');
const aiUxMonitor = require('./server/ai-ux-monitor');
const aiAudioGenerator = require('./server/ai-audio-generator');
const aiSelfHealing = require('./server/ai-self-healing');
const pokerAudioSystem = require('./server/poker-audio-system');

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://js.stripe.com", "https://checkout.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://cdn.twitch.tv"],
      connectSrc: ["'self'", "https://all-in-chat-poker.fly.dev", "https://api.stripe.com", "wss://all-in-chat-poker.fly.dev"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://all-in-chat-poker.fly.dev',
      'https://allinchatpoker.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/', publicRoutes);
app.use('/admin/services', adminServicesRoutes);
app.use('/admin/ai', adminAiControlRoutes);
app.use('/partners', partnersRoutes);
app.use('/catalog', catalogRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('./package.json').version
  });
});

// Critical Functions for System Health
async function runSyntheticCheck() {
  try {
    console.log('Running synthetic health check...');
    
    // Test database connectivity
    const dbTest = db.db ? 'OK' : 'FAILED';
    
    // Test memory usage
    const memUsage = process.memoryUsage();
    const memStatus = memUsage.heapUsed < 500 * 1024 * 1024 ? 'OK' : 'HIGH';
    
    // Test AI systems
    const aiStatus = aiErrorManager ? 'OK' : 'FAILED';
    
    const results = {
      database: dbTest,
      memory: memStatus,
      ai: aiStatus,
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
    console.log('Starting database backup...');
    
    if (!db.db) {
      throw new Error('Database not available');
    }
    
    // Create backup timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, 'data', `backup-${timestamp}.db`);
    
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Copy database file
    const dbPath = db.db.filename;
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      
      const stats = fs.statSync(backupPath);
      const results = {
        status: 'OK',
        backupPath,
        size: stats.size,
        timestamp: new Date().toISOString()
      };
      
      console.log('Database backup completed', results);
      return results;
    } else {
      throw new Error('Source database file not found');
    }
  } catch (error) {
    console.error('Database backup failed', { error: error.message });
    return { status: 'FAILED', error: error.message };
  }
}

async function vacuumDb() {
  try {
    console.log('Starting database vacuum...');
    
    if (!db.db) {
      throw new Error('Database not available');
    }
    
    // Run VACUUM command
    await new Promise((resolve, reject) => {
      db.db.run('VACUUM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const results = {
      status: 'OK',
      timestamp: new Date().toISOString()
    };
    
    console.log('Database vacuum completed', results);
    return results;
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
  
  // Join channel room if provided
  const channel = socket.handshake.query.channel;
  if (channel) {
    socket.join(channel);
    console.log(`Socket ${socket.id} joined channel: ${channel}`);
  }
  
  // Handle game events
  socket.on('join-game', (data) => {
    pokerGame.handleJoinGame(socket, data);
  });
  
  socket.on('leave-game', (data) => {
    pokerGame.handleLeaveGame(socket, data);
  });
  
  socket.on('player-action', (data) => {
    pokerGame.handlePlayerAction(socket, data);
  });
  
  socket.on('chat-message', (data) => {
    pokerGame.handleChatMessage(socket, data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    pokerGame.handleDisconnect(socket);
  });
});

// Initialize AI systems
async function initializeAISystems() {
  try {
    console.log('Initializing AI systems...');
    
    // Initialize AI Error Manager
    if (aiErrorManager) {
      await aiErrorManager.initialize();
      console.log('AI Error Manager initialized');
    }
    
    // Initialize AI Performance Optimizer
    if (aiPerformanceOptimizer) {
      await aiPerformanceOptimizer.initialize();
      console.log('AI Performance Optimizer initialized');
    }
    
    // Initialize AI UX Monitor
    if (aiUxMonitor) {
      await aiUxMonitor.initialize();
      console.log('AI UX Monitor initialized');
    }
    
    // Initialize AI Audio Generator
    if (aiAudioGenerator) {
      await aiAudioGenerator.initialize();
      console.log('AI Audio Generator initialized');
    }
    
    // Initialize AI Self-Healing
    if (aiSelfHealing) {
      await aiSelfHealing.initialize();
      console.log('AI Self-Healing initialized');
    }
    
    // Initialize Poker Audio System
    if (pokerAudioSystem) {
      await pokerAudioSystem.initialize();
      console.log('Poker Audio System initialized');
    }
    
    console.log('All AI systems initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI systems:', error);
  }
}

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

// Start server
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, async () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database
  try {
    await db.initialize();
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
  
  // Initialize AI systems
  await initializeAISystems();
  
  // Initialize connection hardener after server starts
  connectionHardener.initialize(app, server, io);
  connectionHardener.startMonitoring();
  
  console.log('Server initialization complete');
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
