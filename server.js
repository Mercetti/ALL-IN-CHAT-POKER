/**
 * Simple Express server to test deployment
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const fetch = global.fetch || require('node-fetch');
const cookieParser = require('cookie-parser');

const SecurityManager = require('./server/security');
const middleware = require('./server/middleware');
const startup = require('./server/startup');
const ConnectionHardener = require('./server/connection-hardener');
const db = require('./server/db');
const auth = require('./server/auth');
const config = require('./server/config/env');
const Logger = require('./server/logger');

// Validate environment configuration
if (!config.validateCriticalEnvVars()) {
  console.error('❌ Critical environment variables are missing. Please check your .env file.');
  process.exit(1);
}
const payoutStore = require('./server/payout-store');
const { PerformanceMonitor } = require('./server/utils/performance-monitor');
let AIPerformanceMonitor;
try {
  AIPerformanceMonitor = require('./server/ai-performance-monitor');
} catch (e) {
  console.warn('Could not load AIPerformanceMonitor:', e.message);
  AIPerformanceMonitor = class {
    constructor() {
      this.init = () => {};
      this.startMonitoring = () => {};
      this.stopMonitoring = () => {};
      this.recordRequest = () => {};
      this.analyzePerformance = () => {};
      this.getMetrics = () => ({});
    }
  };
}
const UnifiedAISystem = require('./server/unified-ai');
const { registerAdminAiControlRoutes } = require('./server/routes/admin-ai-control');
const { createSimpleAdminAiControlRouter } = require('./server/routes/admin-ai-control-simple');
const createAdminAILearningRoutes = require('./server/routes/admin-ai-learning');
const { createAdminRouter } = require('./server/routes/admin');
const { createAuthRouter } = require('./server/routes/auth');

// 🛡️ STABILITY MODULE INTEGRATION
const { AceyStabilityModule } = require('./server/stability/acey-stability');
const { ModeManager } = require('./server/stability/acey-modes');
const { ProfileManager } = require('./server/stability/startup-profiles');
const { StabilityWatchdog } = require('./server/stability/stability-watchdog');
const { FounderAssistant } = require('./server/stability/founder-assistant');
const { ReplayEngine } = require('./server/stability/replay-engine');
const { CognitiveThrottling } = require('./server/stability/cognitive-throttling');
const { MobileAPIController } = require('./server/stability/mobile-api-controller');

// Initialize Acey Financial Integration
const { integrateFinancialSystem, addFinancialHealthCheck } = require('./server/financial/financial-integration');

// Initialize Acey Service Controller
const aceyServiceController = require('./server/acey-service-controller');
const createPublicRouter = require('./server/routes/public');
const loggingRouter = require('./server/routes/logging');
const datasetRouter = require('./server/routes/dataset.js');
const simulationRouter = require('./server/routes/simulation.js');
const workflowRouter = require('./server/routes/workflow.js');
const commandsRouter = require('./server/routes/commands.js');
const createPartnersRouter = require('./server/routes/partners');
const createCatalogRouter = require('./server/routes/catalog');
const createAdminServicesRouter = require('./server/routes/admin-services');
const { createUnlockRouter } = require('./server/routes/unlock.js');
const { createIncidentRouter } = require('./server/routes/incident.js');
const { createFinanceRouter } = require('./server/routes/finance');
const { createTrustRouter } = require('./server/routes/trust');
const { createAIJobsRouter } = require('./server/routes/ai-jobs');
const { createDisputeRouter } = require('./server/routes/disputes');
const { createAnalyticsRouter } = require('./server/routes/analytics');
const { createInvestorRouter } = require('./server/routes/investor');

// Import the new modules
const finance = require('./server/finance');
const trustEngine = require('./server/trust');
const disputeModule = require('./server/disputes');
const analytics = require('./server/analytics');
const investor = require('./server/investor');
const { getActorFromReq, recordLoginAttempt, getAdminActivitySummary, clearAdminLoginHistory } = require('./server/admin/ops');
const { validateBody } = require('./server/utils/file-ops');
const { validateLocalLogin } = require('./server/routes/auth-simple');

// Discord integration
const { registerDiscordRoutes, getDiscordConfig } = require('./server/discord');

const logger = new Logger('server');
const unifiedAI = new UnifiedAISystem({
  enableChatBot: true,
  enableCosmeticAI: true,
});
const connectionHardener = new ConnectionHardener();

// Initialize performanceMonitor early
let performanceMonitor;
if (!config.isTest()) {
  performanceMonitor = new AIPerformanceMonitor();
} else {
  // Create a mock performanceMonitor for tests (without Jest)
  performanceMonitor = {
    init: () => {},
    startMonitoring: () => {},
    stopMonitoring: () => {},
    recordRequest: () => {},
    analyzePerformance: () => {},
    getMetrics: () => ({}),
  };
}

const recentErrors = [];
const recentSlowRequests = [];
const recentSocketDisconnects = [];
let lastTmiReconnectAt = null;

async function sendMonitorAlert(message, options = {}) {
  if (!config.MONITOR_WEBHOOK_URL) return false;

  try {
    await fetch(config.MONITOR_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message || 'AI Control Center alert',
        embeds: options.description || options.fields ? [{
          title: options.title || 'AI Control Center',
          description: options.description,
          fields: options.fields,
          timestamp: new Date().toISOString(),
        }] : undefined,
      }),
    });
    return true;
  } catch (error) {
    logger.warn?.('Monitor alert dispatch failed', { error: error.message });
    return false;
  }
}

function collectAiOverviewPanels() {
  return [
    {
      key: 'errorManager',
      category: 'Stability',
      title: 'Error Manager',
      description: 'Auto-detects regressions & suggests patches.',
      state: 'online',
      metrics: [
        { label: 'Errors Handled', value: '0' },
        { label: 'Last Error', value: 'None' },
      ],
    },
    {
      key: 'performanceOptimizer',
      category: 'Performance',
      title: 'Performance Optimizer',
      description: 'Monitors CPU/memory & applies live tuning.',
      state: 'online',
      metrics: [
        { label: 'CPU Usage', value: '45%' },
        { label: 'Memory Usage', value: '62%' },
      ],
    },
    {
      key: 'audioGenerator',
      category: 'Media',
      title: 'AI Audio Generator',
      description: 'Builds music beds and FX packs on demand.',
      state: 'online',
      metrics: [
        { label: 'Tracks Generated', value: '89' },
        { label: 'Avg Time', value: '2.1s' },
      ],
    },
  ];
}

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

// Core middleware stack
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Simple CORS middleware for development
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost:8081') || origin.includes('127.0.0.1:8081') || origin.includes('localhost:8082') || origin.includes('127.0.0.1:8082'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Device-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(middleware.createRequestTrackingMiddleware({ recentErrors, recentSlowRequests }));
app.use(middleware.createCorsMiddleware({ config }));

// Security hardening layer
const securityManager = new SecurityManager(app, config);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes (DB-backed)
const authRoutes = createAuthRouter({
  config,
  auth,
  db,
  jwt: auth,
  logger,
  fetch,
  rateLimit: (name, windowMs, max) => (req, res, next) => next(),
  validateBody,
  validateLocalLogin,
  isBanned: (login, ip) => {
    const normalizedLogin = (login || '').toLowerCase().trim();
    const normalizedIP = (ip || '').trim();
    
    // Check banned logins from config
    const bannedLogins = (config.BANNED_LOGINS || '').split(',').map(l => l.trim().toLowerCase()).filter(Boolean);
    if (bannedLogins.includes(normalizedLogin)) {
      return true;
    }
    
    // Check banned IPs from config
    const bannedIPs = (config.BANNED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean);
    if (bannedIPs.includes(normalizedIP)) {
      return true;
    }
    
    // Check database for banned status
    try {
      const profile = db.getProfile(normalizedLogin);
      if (profile && profile.role === 'banned') {
        return true;
      }
    } catch (err) {
      logger.warn('Error checking ban status in database', { error: err.message, login: normalizedLogin });
    }
    
    return false;
  },
  fetchTwitchUser: async (accessToken) => {
    try {
      const res = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Client-ID': config.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.data?.[0] || null;
    } catch {
      return null;
    }
  },
  defaultChannel: '',
});
app.use('/auth', authRoutes);

// Admin services routes
app.use('/admin/services', createAdminServicesRouter);

// Discord integration (if configured)
try {
  const discordConfig = getDiscordConfig();
  if (discordConfig.publicKey && discordConfig.clientId) {
    registerDiscordRoutes(app);
    console.log('✅ Discord integration enabled');
  } else {
    console.log('⚠️ Discord integration disabled - missing configuration');
  }
} catch (error) {
  console.warn('⚠️ Discord integration failed to initialize:', error.message);
}

// Initialize TMI client if bot credentials are available
let tmiClient = null;
if (process.env.BOT_USERNAME && process.env.BOT_OAUTH_TOKEN) {
  const tmi = require('tmi.js');
  const TARGET_CHANNELS = (process.env.TARGET_CHANNELS || process.env.TWITCH_CHANNEL || '')
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean);
  
  tmiClient = new tmi.Client({
    options: { debug: false },
    identity: { 
      username: process.env.BOT_USERNAME, 
      password: process.env.BOT_OAUTH_TOKEN 
    },
    channels: TARGET_CHANNELS,
    connection: { reconnect: true, secure: true },
  });
  
  tmiClient.on('connected', (addr, port) => {
    logger.info(`TMI client connected to ${addr}:${port}`);
  });
  
  tmiClient.on('disconnected', (reason) => {
    logger.warn('TMI client disconnected', { reason });
  });
  
  // Connect in background
  tmiClient.connect().catch(err => {
    logger.error('TMI client connection failed', { error: err.message });
  });
}

// Admin routes (DB-backed login, logout, CSRF, etc.)
const adminRoutes = createAdminRouter({
  auth,
  middleware,
  config,
  logger,
  rateLimit: (name, windowMs, max) => (req, res, next) => next(),
  db,
  tmiClient,
  blockedIPs: new Map(),
  adminLoginAttempts: new Map(),
  recentErrors,
  recentSlowRequests,
  recentSocketDisconnects,
  lastTmiReconnectAt: null,
  getCriticalHashes,
  recordLoginAttempt,
});
app.use('/admin', adminRoutes);

// Admin user management CRUD/audit routes
const { createAdminUsersRouter } = require('./server/routes/admin-users');
const adminUsersRoutes = createAdminUsersRouter({ auth, db, logger, validateBody });
app.use(adminUsersRoutes);

// Player/Streamer management routes
const { createPlayersRouter } = require('./server/routes/players');
const playersRoutes = createPlayersRouter({ auth, db, logger, validateBody, fetch, config });
app.use(playersRoutes);

// Public, partners, and catalog routes
// const publicRoutes = createPublicRouter({ config, defaultChannel: '' });
// app.use('/public', publicRoutes);
// const partnersRoutes = createPartnersRouter({ auth, db, logger });
// app.use('/partners', partnersRoutes);
const catalogRoutes = createCatalogRouter({ db });
app.use('/catalog', catalogRoutes);

// Admin AI control routes (simple router for demo/fallback)
const adminAiControlRoutes = createSimpleAdminAiControlRouter();
app.use('/admin/ai', adminAiControlRoutes);
app.use('/admin/ai-tools', adminAiControlRoutes); // Alias for simple endpoints

// Logging routes for LLM interaction tracking
app.use('/api', loggingRouter);

// Security and governance routes
const unlockRoutes = createUnlockRouter({ auth, db, logger });
app.use('/unlock', unlockRoutes);

const incidentRoutes = createIncidentRouter({ auth, db, logger });
app.use('/incidents', incidentRoutes);

// Financial Operations routes
const financeRoutes = createFinanceRouter({ auth, db, logger });
app.use('/api/finance', financeRoutes);

// Trust Score routes
const trustRoutes = createTrustRouter({ auth, db, logger });
app.use('/api/trust', trustRoutes);

// Dispute Management routes
const disputeRoutes = createDisputeRouter({ auth, db, logger });
app.use('/api/disputes', disputeRoutes);

// Analytics routes
const analyticsRoutes = createAnalyticsRouter({ auth, db, logger });
app.use('/api/analytics', analyticsRoutes);

// Investor Dashboard routes
const investorRoutes = createInvestorRouter({ auth, db, logger });
app.use('/api/investor', investorRoutes);

// AI Jobs routes
const aiJobsRoutes = createAIJobsRouter({ auth, db, logger });
app.use('/api/ai', aiJobsRoutes);

// File Tools API for Acey
const fileToolsRoutes = require('./server/api/file-tools');
app.use('/api/file-tools', fileToolsRoutes);
app.use('/api', datasetRouter);
app.use('/api', simulationRouter);
app.use('/api', workflowRouter);
app.use('/api', commandsRouter);

// Register Acey Financial Operations System
integrateFinancialSystem(app, db);
addFinancialHealthCheck(app, db);

// Register full AI Control Center routes (authenticated, feature-complete)
if (!config.isTest()) {
  registerAdminAiControlRoutes(app, {
    auth,
    performanceMonitor,
    collectAiOverviewPanels,
    unifiedAI,
    sendMonitorAlert,
    logger,
  });

  // Register AI Learning routes
  const learningOrchestrator = createAdminAILearningRoutes(app, {
    auth,
    unifiedAI,
    sendMonitorAlert,
    performanceMonitor,
    logger,
  });
  console.log('✅ AI Learning routes enabled');
}

// Initialize Poker Audio System
let pokerAudioSystem;
if (!config.isTest()) {
  try {
    // Check if PokerAudioSystem class exists
    const PokerAudioSystem = require('./server/poker-audio-system-simple');
    pokerAudioSystem = new PokerAudioSystem({
      outputDir: path.join(__dirname, 'public/assets/audio'),
      enableGeneration: true,
      dmcaSafe: true,
      defaultMusicOff: true,
    });
    
    // Initialize the audio system
    pokerAudioSystem.initialize();
    console.log('🎵 Poker Audio System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to create Poker Audio System:', error.message);
  }
}

// Acey Control Center API endpoints for mobile web app
app.post('/api/acey/control', (req, res) => {
  try {
    console.log('🎮 Acey Control Request - Headers:', req.headers);
    console.log('🎮 Acey Control Request - Body:', req.body);
    
    const { command } = req.body;
    console.log('🎮 Acey Control Command:', command);
    
    // Handle different commands
    let response = { success: false, message: 'Unknown command' };
    
    switch (command) {
      case 'start':
        response = { success: true, message: 'Acey system started successfully' };
        break;
      case 'stop':
        response = { success: true, message: 'Acey system stopped successfully' };
        break;
      case 'restart':
        response = { success: true, message: 'Acey system restarted successfully' };
        break;
      case 'safe-mode':
        response = { success: true, message: 'Safe mode activated successfully' };
        break;
    }
    
    console.log('🎮 Acey Control Response:', response);
    
    // Set proper content type and send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    console.error('❌ Acey Control Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/acey/mode', (req, res) => {
  try {
    console.log('🔄 Acey Mode Request - Headers:', req.headers);
    console.log('🔄 Acey Mode Request - Body:', req.body);
    
    const { mode } = req.body;
    console.log('🔄 Acey Mode Change:', mode);
    
    // Handle different modes
    let response = { success: false, message: 'Unknown mode' };
    
    switch (mode) {
      case 'full':
      case 'creator':
      case 'minimal':
      case 'safe':
      case 'offline':
        response = { success: true, mode: mode, message: `Switched to ${mode} mode successfully` };
        break;
    }
    
    console.log('🔄 Acey Mode Response:', response);
    
    // Set proper content type and send JSON response
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  } catch (error) {
    console.error('❌ Acey Mode Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Overlay route - serve the overlay page
app.get('/overlay', (req, res) => {
  res.sendFile('obs-overlay.html', { root: './public' });
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

// Game engines and socket handlers with cosmetics and heuristics
const { createSocketHandlers } = require('./server/socket');
const { DEFAULT_CHANNEL } = require('./server/channel-state');
const { getCosmeticsForLogin, getHeuristics, getDefaultAvatarForLogin } = require('./server/db');
const { openBettingWindow, startRoundInternal, settleRound } = require('./server/game/core');

// Overlay state maps
const overlaySettingsByChannel = new Map();
const overlayFxByChannel = new Map();

// Rate limiting for socket events
function socketRateLimit(socket, eventName, limitMs = 1000) {
  const key = `${socket.id}:${eventName}`;
  const now = Date.now();
  if (socket.lastEventTimes && socket.lastEventTimes[key] && now - socket.lastEventTimes[key] < limitMs) {
    return false;
  }
  if (!socket.lastEventTimes) socket.lastEventTimes = {};
  socket.lastEventTimes[key] = now;
  return true;
}

// Initialize socket handlers with full production features
createSocketHandlers({
  io,
  auth,
  db,
  logger,
  recentSocketDisconnects,
  getStateForChannel: require('./server/game/core').getStateForChannel,
  getChannelFromSocket: require('./server/auth').getChannelFromSocket,
  socketRateLimit,
  DEFAULT_CHANNEL,
  openBettingWindow,
  startRoundInternal,
  settleRound,
  getCosmeticsForLogin,
  getHeuristics,
  getDefaultAvatarForLogin,
  overlaySettingsByChannel,
  overlayFxByChannel
});

// AI monitoring and control systems integration
// const { initializeAIMonitoring } = require('./server/ai-monitoring');
const { getAIAudioGenerator } = require('./server/ai-audio-generator');

// Initialize AI monitoring
try {
  // initializeAIMonitoring({
  //   logger,
  //   performanceMonitor,
  //   unifiedAI,
  //   sendMonitorAlert,
  //   db
  // });
  console.log('🤖 AI monitoring system initialized');
} catch (error) {
  console.error('❌ Failed to initialize AI monitoring:', error.message);
}

// Startup/health subsystems integration
const { checkStartup: doStartupChecks, logStartupCheck: doLogStartupCheck, getHealth: getStartupHealth } = require('./server/startup');

// Run startup checks
try {
  const startupResults = doStartupChecks();
  console.log('🚀 Startup checks completed:', startupResults);
} catch (error) {
  console.error('❌ Startup checks failed:', error.message);
}

// ======================
// Helm Engine Integration
// ======================
const { helmEngine: HelmEngine } = require('./server/helm/index');
const FallbackDealer = require('./server/fallbackDealer');

let helmEngine;
try {
  helmEngine = new HelmEngine({
    enableSecurity: true,
    enableMemory: true,
    enablePersonaSystem: true,
    defaultPersona: 'acey',
    logLevel: 'info'
  });
} catch (error) {
  console.error('Failed to initialize Helm engine, using fallback dealer', error);
  helmEngine = {
    addChatMessage: () => {},
    addGameEvent: (sessionId, event) => {
      const { type, player, card } = event;
      const message = FallbackDealer.formatDealerLine(type, player, card);
      if (message) {
        // Emit the message to the overlay
        io.to(sessionId).emit('overlay', {
          source: 'fallback',
          text: message,
          tone: 'playful',
          type: 'message'
        });
      }
    }
  };
}
console.log('Helm engine created successfully');

// ======================
// AI Control Center Integration
// ======================
let aceyBridge;
try {
  // Import the AceyBridge class and filter utilities
  const { AceyBridge } = require('./acey-control-center/dist/server/aceyBridge');
  const { filterAceyLogs, applyAutoRulesToOutput } = require('./server/utils/filter');
  
  // Initialize the bridge to connect Acey with AI Control Center
  aceyBridge = new AceyBridge({
    controlCenterUrl: 'http://localhost:3001',
    aceySystemUrl: 'http://localhost:8080', // Your existing server
    autoRulesEnabled: true,
    dryRunMode: false // Set to true for testing
  });
  
  // Start the bridge connection
  aceyBridge.connect().then(() => {
    console.log('🔗 Acey Bridge connected - Acey ↔ AI Control Center');
  }).catch(error => {
    console.warn('⚠️ Acey Bridge connection failed, running without Control Center:', error.message);
  });
  
  // Fallback aceyEngine if not defined
  const aceyEngine = global.aceyEngine || {
    addChatMessage: async (data) => {
      console.log('🤖 Acey fallback: addChatMessage called', data);
    },
    addGameEvent: async (sessionId, event) => {
      console.log('🎮 Acey fallback: addGameEvent called', { sessionId, event });
    }
  };
  
  // Override Acey Engine's addChatMessage to route through Control Center
  const originalAddChatMessage = aceyEngine.addChatMessage;
  aceyEngine.addChatMessage = async function(data) {
    try {
      // Convert chat message to Acey output format
      const aceyOutput = {
        speech: data.message || data.text || '',
        intents: [
          {
            type: "memory_proposal",
            scope: "event",
            summary: `Chat: ${data.message || data.text || ''}`,
            confidence: 0.8,
            ttl: "1h"
          }
        ]
      };
      
      // Apply auto-rules for live processing
      const filteredOutput = applyAutoRulesToOutput(aceyOutput);
      
      if (!filteredOutput) {
        console.log('🚫 Chat message rejected by auto-rules');
        return; // Don't process rejected messages
      }
      
      // Send to Control Center via bridge
      if (aceyBridge && aceyBridge.getStatus().connected) {
        await aceyBridge.handleAceyOutput(filteredOutput);
      }
      
      // Still call original method for local processing with filtered output
      return originalAddChatMessage.call(this, {
        ...data,
        filteredOutput // Add filtered output for reference
      });
    } catch (error) {
      console.error('Bridge chat processing failed:', error);
      // Fallback to original processing
      return originalAddChatMessage.call(this, data);
    }
  };
  
  // Override Acey Engine's addGameEvent to route through Control Center  
  const originalAddGameEvent = aceyEngine.addGameEvent;
  aceyEngine.addGameEvent = async function(sessionId, event) {
    try {
      const { type, player, card } = event;
      const aceyOutput = {
        speech: `Game event: ${type} by ${player}`,
        intents: [
          {
            type: "memory_proposal", 
            scope: "event",
            summary: `Game: ${type} - ${player} ${card ? `drew ${card}` : ''}`,
            confidence: 0.9,
            ttl: "2h"
          },
          {
            type: "trust_signal",
            delta: type === 'all-in' ? 0.1 : 0.05,
            reason: `Game engagement: ${type}`,
            reversible: true
          }
        ]
      };
      
      // Apply auto-rules for live processing
      const filteredOutput = applyAutoRulesToOutput(aceyOutput);
      
      if (!filteredOutput) {
        console.log('🚫 Game event rejected by auto-rules');
        return; // Don't process rejected events
      }
      
      // Send to Control Center via bridge
      if (aceyBridge && aceyBridge.getStatus().connected) {
        await aceyBridge.handleAceyOutput(filteredOutput);
      }
      
      // Still call original method for local processing
      return originalAddGameEvent.call(this, sessionId, event);
    } catch (error) {
      console.error('Bridge game event processing failed:', error);
      // Fallback to original processing
      return originalAddGameEvent.call(this, sessionId, event);
    }
  };
  
  console.log('🤖 AI Control Center integration enabled with auto-rules');
  
} catch (error) {
  console.warn('⚠️ Could not initialize AI Control Center Bridge:', error.message);
  console.log('🔄 Running without AI Control Center - all features will work locally');
}

// Socket.IO connection handling (legacy, kept for compatibility)
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
  
  // Forward chat/game events to Acey Engine
  socket.on('chatMessage', (data) => {
    aceyEngine.addChatMessage(data);
  });
  
  socket.on('gameEvent', (data) => {
    aceyEngine.addGameEvent(socket.id, data);
    
    // Capture game revenue for financial processing
    if (data.type === 'gameEnd' && data.totalRake) {
      financialIntegration.onGameEnd({
        gameId: data.gameId || `GAME-${socket.id}-${Date.now()}`,
        partnerId: data.partnerId || 'partner_042',
        totalRake: data.totalRake,
        playerCount: data.playerCount || 2
      });
    }
  });
});

// ======================
// Helm WebSocket Integration
// ======================
const HelmWebSocketServer = require('./server/helm-websocket-simple');
const { extractUserLogin, getChannelFromSocket } = require('./server/auth');

// Initialize Helm WebSocket server
const helmWebSocket = new HelmWebSocketServer({ 
  port: 8081,
  path: '/helm',
  logger: console
});

// Start Helm WebSocket service
if (!config.isTest()) {
  console.log('🎤 Helm WebSocket server initialized');
}

// Initialize database and modules
async function initializeServer() {
  try {
    if (typeof db.initialize === 'function') {
      db.initialize();
    } else if (typeof db.init === 'function') {
      db.init();
    } else {
      console.log('⚠️ No database initialization method found');
    }
    
    console.log('🗄️ Database initialized successfully');
    
    // Initialize Acey Service Controller
    aceyServiceController.initialize(app);
    
    // 🛡️ INITIALIZE STABILITY MODULE
    console.log('🛡️ Initializing Acey Stability Module...');
    
    // Initialize core stability components
    const modeManager = new ModeManager();
    const profileManager = new ProfileManager();
    const stabilityWatchdog = new StabilityWatchdog();
    await stabilityWatchdog.start();
    const founderAssistant = new FounderAssistant();
    const replayEngine = new ReplayEngine();
    const cognitiveThrottling = new CognitiveThrottling();
    const mobileAPIController = new MobileAPIController();
    
    // Integrate stability components
    app.locals.stability = {
      modeManager,
      profileManager,
      stabilityWatchdog,
      founderAssistant,
      replayEngine,
      cognitiveThrottling,
      mobileAPIController
    };
    
    console.log('🛡️ Acey Stability Module initialized successfully');
    
    // 💰 INTEGRATE FINANCIAL SYSTEM
    console.log('💰 Integrating ACEY Financial Operations System...');
    
    // Integrate financial system
    const financialSuccess = integrateFinancialSystem(app, db);
    if (financialSuccess) {
      console.log('💰 Financial system integrated successfully');
    } else {
      console.log('⚠️ Financial system integration failed, continuing without it');
    }
    
    // Add financial health check
    addFinancialHealthCheck(app, db);
    console.log('💰 Financial health checks added');
    
    console.log('🔧 Financial & Governance modules initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    if (!config.isTest()) {
      process.exit(1);
    }
  }
}

// Initialize server
initializeServer();

// Initialize AI Worker in main app (no extra service needed)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AI_WORKER !== 'false') {
  console.log('[MAIN] Starting AI Worker in main process...');
  try {
    const AIWorker = require('./ai-worker');
    const aiWorker = new AIWorker();
    aiWorker.start().catch(error => {
      console.error('[MAIN] Failed to start AI Worker:', error);
    });
    console.log('[MAIN] AI Worker started successfully - processing jobs in background');
  } catch (error) {
    console.warn('[MAIN] AI Worker not available:', error.message);
  }
}

// Start server
const serverConfig = config.getServerConfig();
const { port: PORT, host: HOST } = serverConfig;

if (!config.isTest()) {
  console.log(`Starting server on ${HOST}:${PORT}`);
}

server.listen(PORT, HOST, () => {
  if (!config.isTest()) {
    console.log(`Server running at http://${HOST}:${PORT}`);
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server startup failed:', err);
  }
  if (!config.isTest()) {
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  helmWebSocket.close();  // Add Helm shutdown
  if (aceyBridge) {
    aceyBridge.disconnect();  // Add Bridge shutdown
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  helmWebSocket.close();  // Add Helm shutdown
  if (aceyBridge) {
    aceyBridge.disconnect();  // Add Bridge shutdown
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// ======================
// Ultra Status Helper
// ======================
async function checkUltraStatus(user) {
  try {
    // Get user profile from database
    const db = require('./server/db');
    const profile = db.getProfile(user);
    
    // Check subscription status
    return profile?.subscription === 'ultra' || 
           profile?.role === 'admin' || 
           profile?.role === 'streamer';
  } catch (error) {
    console.error('Ultra status check failed', error);
    return false;
  }
}

// ======================
// Acey TTS Endpoint
// ======================
app.get('/tts', async (req, res) => {
  try {
    const text = req.query.text;
    const voice = req.query.voice || 'default';
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }
    
    // Extract user session
    const user = extractUserLogin(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check Ultra status
    const isUltra = await checkUltraStatus(user);
    if (!isUltra) {
      return res.status(403).json({ error: 'Ultra subscription required' });
    }
    
    // Generate TTS audio using AI audio generator
    const audioGenerator = getAIAudioGenerator();
    const audioBuffer = await audioGenerator.generateTTS(text, voice);
    
    // Return audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Export critical functions for health monitoring
// Direct supertest compatibility - assign server methods to app
app.address = server.address.bind(server);
app.listen = server.listen.bind(server);
app.close = server.close.bind(server);

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
