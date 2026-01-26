/**
 * AI Processing Worker for Cosmetics Generation
 * Handles AI-powered cosmetic creation and processing
 */

const { Pool } = require('pg');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// AI System (reuse existing)
const AI = require('./server/ai');
const EnhancedCosmeticAI = require('./server/enhanced-cosmetic-ai');

class AIWorker {
  constructor() {
    this.isRunning = false;
    this.jobQueue = [];
    this.processingJobs = new Set();
    this.maxConcurrentJobs = parseInt(process.env.MAX_CONCURRENT_JOBS) || 3;
    this.jobTimeout = parseInt(process.env.JOB_TIMEOUT) || 30000;
    
    // Initialize your AI system with intelligent model selection
    this.ai = new AI();
    this.cosmeticAI = new EnhancedCosmeticAI({
      enablePublicGeneration: false, // Worker-only
      maxConcurrentGenerations: this.maxConcurrentJobs,
      // Use your intelligent AI system
      useLocalAI: true,
      ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
      intelligentRouting: true // Enable smart model selection
    });
    
    console.log('[AI-WORKER] AI Worker initialized with intelligent LLM routing');
    console.log(`[AI-WORKER] Max concurrent jobs: ${this.maxConcurrentJobs}`);
    console.log(`[AI-WORKER] Ollama host: ${process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'}`);
    console.log('[AI-WORKER] Smart model selection enabled for optimal results');
  }

  async start() {
    console.log('[AI-WORKER] Starting AI processing worker...');
    this.isRunning = true;
    
    // Start processing jobs
    this.processQueue();
    
    // Set up periodic job checking
    setInterval(() => this.checkForJobs(), 5000);
    
    console.log('[AI-WORKER] AI Worker started successfully');
  }

  async checkForJobs() {
    try {
      // Check database for pending AI jobs
      const query = `
        SELECT * FROM ai_jobs 
        WHERE status = 'pending' 
        AND job_type IN ('cosmetic_generation', 'card_design', 'chip_style', 'avatar_creation')
        ORDER BY created_at ASC
        LIMIT 10
      `;
      
      const result = await pool.query(query);
      
      for (const job of result.rows) {
        if (!this.processingJobs.has(job.id) && this.processingJobs.size < this.maxConcurrentJobs) {
          this.processingJobs.add(job.id);
          this.jobQueue.push(job);
        }
      }
    } catch (error) {
      console.error('[AI-WORKER] Error checking for jobs:', error);
    }
  }

  async processQueue() {
    while (this.isRunning && this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      
      // Process job with timeout
      await Promise.race([
        this.processJob(job),
        this.timeout(job.id)
      ]);
      
      this.processingJobs.delete(job.id);
    }
    
    // Continue processing if still running
    if (this.isRunning) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async processJob(job) {
    console.log(`[AI-WORKER] Processing job ${job.id}: ${job.job_type}`);
    
    try {
      // Update job status to processing
      await this.updateJobStatus(job.id, 'processing');
      
      let result;
      
      switch (job.job_type) {
        case 'cosmetic_generation':
          result = await this.generateCosmetic(job);
          break;
        case 'card_design':
          result = await this.generateCardDesign(job);
          break;
        case 'chip_style':
          result = await this.generateChipStyle(job);
          break;
        case 'avatar_creation':
          result = await this.generateAvatar(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.job_type}`);
      }
      
      // Update job with success
      await this.updateJobStatus(job.id, 'completed', result);
      console.log(`[AI-WORKER] Job ${job.id} completed successfully`);
      
    } catch (error) {
      console.error(`[AI-WORKER] Job ${job.id} failed:`, error);
      
      // Update job with error
      await this.updateJobStatus(job.id, 'failed', { error: error.message });
    }
  }

  async generateCosmetic(job) {
    const { prompt, cosmetic_type, style_requirements } = job.parameters;
    
    // Prepare messages with cosmetic context for intelligent model selection
    const messages = [
      {
        role: 'system',
        content: `You are a cosmetic designer for poker games. Generate detailed, creative cosmetic descriptions for ${cosmetic_type}.`
      },
      {
        role: 'user', 
        content: `Generate a ${cosmetic_type} with the following specifications: ${prompt}. Style requirements: ${style_requirements || 'modern and elegant'}`
      }
    ];
    
    const result = await this.cosmeticAI.generateEnhancedCosmetic({
      type: cosmetic_type,
      prompt: prompt,
      style: style_requirements,
      userId: job.user_id,
      context: 'cosmetic', // Enable intelligent model selection
      messages: messages
    });
    
    // Save generated cosmetic to database
    await this.saveCosmetic(result, job.user_id);
    
    return result;
  }

  async generateCardDesign(job) {
    const { theme, colors, style, elements } = job.parameters;
    
    // Generate card design using AI with intelligent model selection
    const prompt = `Create a poker card design with theme: ${theme}, colors: ${colors}, style: ${style}, elements: ${elements}`;
    
    const messages = [
      {
        role: 'system',
        content: 'You are a professional poker card designer. Create detailed, visually appealing card designs.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const result = await this.ai.generateImage({
      prompt: prompt,
      size: '512x512',
      style: 'detailed',
      context: 'design', // Enable intelligent model selection
      messages: messages
    });
    
    // Save card design
    await this.saveCardDesign(result, job);
    
    return result;
  }

  async generateChipStyle(job) {
    const { base_style, colors, effects, denomination } = job.parameters;
    
    const prompt = `Generate chip style with base: ${base_style}, colors: ${colors}, effects: ${effects}, denomination: ${denomination}`;
    
    const messages = [
      {
        role: 'system',
        content: 'You are a poker chip designer. Create attractive, professional chip designs.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const result = await this.ai.generateImage({
      prompt: prompt,
      size: '256x256',
      style: 'detailed',
      context: 'design', // Enable intelligent model selection
      messages: messages
    });
    
    // Save chip style
    await this.saveChipStyle(result, job);
    
    return result;
  }

  async generateAvatar(job) {
    const { description, style, size } = job.parameters;
    
    const prompt = `Generate avatar with description: ${description}, style: ${style}, size: ${size}`;
    
    const messages = [
      {
        role: 'system',
        content: 'You are an avatar designer. Create unique, appealing user avatars.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const result = await this.ai.generateImage({
      prompt: prompt,
      size: '512x512',
      style: 'avatar',
      context: 'creative', // Enable intelligent model selection
      messages: messages
    });
    
    // Save avatar
    await this.saveAvatar(result, job.user_id);
    
    return result;
  }

  async saveCosmetic(cosmetic, userId) {
    const query = `
      INSERT INTO cosmetics (
        id, name, type, description, image_url, price, tier, 
        created_by, created_at, is_ai_generated
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), true
      )
    `;
    
    await pool.query(query, [
      cosmetic.id,
      cosmetic.name,
      cosmetic.type,
      cosmetic.description,
      cosmetic.imageUrl,
      cosmetic.price || 100,
      cosmetic.tier || 'basic',
      userId
    ]);
  }

  async saveCardDesign(design, job) {
    const query = `
      INSERT INTO ai_generated_assets (
        id, asset_type, image_url, parameters, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
    `;
    
    await pool.query(query, [
      `card_${Date.now()}`,
      'card_design',
      design.imageUrl,
      JSON.stringify(job.parameters),
      job.user_id
    ]);
  }

  async saveChipStyle(style, job) {
    const query = `
      INSERT INTO ai_generated_assets (
        id, asset_type, image_url, parameters, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW()
      )
    `;
    
    await pool.query(query, [
      `chip_${Date.now()}`,
      'chip_style',
      style.imageUrl,
      JSON.stringify(job.parameters),
      job.user_id
    ]);
  }

  async saveAvatar(avatar, userId) {
    const query = `
      INSERT INTO user_avatars (
        id, user_id, image_url, parameters, created_at
      ) VALUES (
        $1, $2, $3, $4, NOW()
      )
    `;
    
    await pool.query(query, [
      `avatar_${Date.now()}`,
      userId,
      avatar.imageUrl,
      JSON.stringify(avatar.parameters)
    ]);
  }

  async updateJobStatus(jobId, status, result = null) {
    const query = `
      UPDATE ai_jobs 
      SET status = $1, result = $2, updated_at = NOW() 
      WHERE id = $3
    `;
    
    await pool.query(query, [status, result ? JSON.stringify(result) : null, jobId]);
  }

  timeout(jobId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ error: 'Job timeout' });
      }, this.jobTimeout);
    });
  }

  async stop() {
    console.log('[AI-WORKER] Stopping AI worker...');
    this.isRunning = false;
    
    // Wait for current jobs to finish (with timeout)
    const maxWait = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.processingJobs.size > 0 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('[AI-WORKER] AI Worker stopped');
  }
}

// Initialize and start worker
const worker = new AIWorker();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[AI-WORKER] Received SIGINT, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[AI-WORKER] Received SIGTERM, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

// Start the worker
worker.start().catch(error => {
  console.error('[AI-WORKER] Failed to start worker:', error);
  process.exit(1);
});
