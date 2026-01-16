import { Orchestrator } from './orchestrator/core';
import { SkillFactory } from './orchestrator/skillModule';
import { Logger } from './utils/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Initialize orchestrator
const logger = new Logger();
const orchestrator = new Orchestrator();

// Register all skills
const skills = SkillFactory.getAllSkills();
for (const skill of skills) {
  orchestrator.registerSkill(skill);
}

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: orchestrator.getSystemStatus()
  });
});

// API Routes
app.get('/api/skills', (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] as string || 'user';
    const availableSkills = orchestrator.listSkills(userRole);
    
    res.json({
      success: true,
      skills: availableSkills,
      userRole,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get skills', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

app.post('/api/skills/:skillName/execute', async (req, res) => {
  try {
    const { skillName } = req.params;
    const { input, dryRun = false } = req.body;
    const userRole = req.headers['x-user-role'] as string || 'user';
    
    const result = await orchestrator.executeSkill(skillName, input, userRole, dryRun);
    
    res.json({
      success: result.success,
      result,
      executionTime: result.executionTime,
      requiresApproval: result.requiresApproval,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Skill execution failed: ${skillName}`, error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

app.get('/api/security/status', (req, res) => {
  try {
    const status = orchestrator.getSystemStatus();
    
    res.json({
      success: true,
      security: {
        mode: status.securityMode,
        events: status.recentSecurityEvents?.slice(0, 10) || []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get security status', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

app.post('/api/security/emergency-lock', (req, res) => {
  try {
    const { reason } = req.body;
    const userRole = req.headers['x-user-role'] as string || 'user';
    
    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Emergency lockdown requires owner privileges'
      });
    }
    
    orchestrator.emergencyLockdown(reason);
    
    res.json({
      success: true,
      message: 'Emergency lockdown activated',
      mode: 'Red',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Emergency lockdown failed', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

app.post('/api/security/resume', (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] as string || 'user';
    
    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Resume operations requires owner privileges'
      });
    }
    
    orchestrator.resumeOperations();
    
    res.json({
      success: true,
      message: 'Operations resumed to normal mode',
      mode: 'Green',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Resume operations failed', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Monetization endpoints
app.get('/api/monetization/tiers', (req, res) => {
  try {
    // This would use the MonetizationManager in a real implementation
    const tiers = [
      {
        name: 'Free',
        price: 0,
        features: ['Basic skills', 'Community support', '100 executions/month'],
        skillLimit: 5,
        apiLimit: 1000
      },
      {
        name: 'Pro',
        price: 29,
        features: ['Advanced skills', 'Email support', '1000 executions/month', 'Basic analytics'],
        skillLimit: 15,
        apiLimit: 10000
      },
      {
        name: 'Creator+',
        price: 99,
        features: ['All skills', 'Priority support', 'Unlimited executions', 'Advanced analytics'],
        skillLimit: 50,
        apiLimit: 100000
      },
      {
        name: 'Enterprise',
        price: 499,
        features: ['Custom skills', 'Dedicated support', 'Unlimited everything', 'SLA guarantee'],
        skillLimit: -1,
        apiLimit: -1
      }
    ];
    
    res.json({
      success: true,
      tiers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get monetization tiers', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Dataset and learning endpoints
app.get('/api/dataset/metrics', (req, res) => {
  try {
    // This would use DatasetManager in a real implementation
    const metrics = {
      totalEntries: 1250,
      approvedEntries: 980,
      pendingEntries: 270,
      lastTrainingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      trainingThreshold: 10,
      readyForTraining: true
    };
    
    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get dataset metrics', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

app.post('/api/dataset/train', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'] as string || 'user';
    
    if (userRole !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Dataset training requires owner privileges'
      });
    }
    
    await orchestrator.triggerLearningIfReady();
    
    res.json({
      success: true,
      message: 'Training triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Dataset training failed', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.log(`Acey Orchestrator started on port ${PORT}`);
  logger.log(`Registered ${skills.length} skills`);
  logger.log('Security mode: Green');
  logger.log('Ready for requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
