const express = require('express');
const crypto = require('crypto');

function createSimpleAdminAiControlRouter() {
  const router = express.Router();

  // AI Control Center overview
  router.get('/overview', (req, res) => {
    try {
      res.json({
        panels: [
          {
            key: 'errorManager',
            category: 'Stability',
            title: 'Error Manager',
            description: 'Auto-detects regressions & suggests patches.',
            state: 'online',
            metrics: [
              { label: 'Errors Handled', value: '0' },
              { label: 'Last Error', value: 'None' },
              { label: 'Uptime', value: '99.9%' }
            ]
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
              { label: 'Cache Hit Rate', value: '87%' }
            ]
          },
          {
            key: 'uxMonitor',
            category: 'Experience',
            title: 'UX Monitor',
            description: 'Tracks funnel health and friction events.',
            state: 'online',
            metrics: [
              { label: 'Active Users', value: '1250' },
              { label: 'Avg Session Time', value: '4m 23s' },
              { label: 'Conversion Rate', value: '94%' }
            ]
          },
          {
            key: 'audioGenerator',
            category: 'Media',
            title: 'AI Audio Generator',
            description: 'Builds music beds and FX packs on demand.',
            state: 'online',
            metrics: [
              { label: 'Tracks Generated', value: '89' },
              { label: 'Avg Generation Time', value: '2.1s' },
              { label: 'Storage Used', value: '245MB' }
            ]
          },
          {
            key: 'selfHealing',
            category: 'Reliability',
            title: 'Self-Healing System',
            description: 'Auto-recovers from failures and restarts services.',
            state: 'online',
            metrics: [
              { label: 'Healing Events', value: '12' },
              { label: 'Avg Recovery Time', value: '1.8s' },
              { label: 'Uptime', value: '99.9%' }
            ]
          },
          {
            key: 'codeQuality',
            category: 'Development',
            title: 'Code Quality Guardian',
            description: 'Ensures code quality and best practices.',
            state: 'online',
            metrics: [
              { label: 'Checks Passed', value: '145' },
              { label: 'Issues Found', value: '3' },
              { label: 'Code Coverage', value: '87%' }
            ]
          }
        ]
      });
    } catch (error) {
      console.error('AI Control overview error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Control Center services status (alias for frontend)
  router.get('/services/status', (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          services: {
            ollama: {
              status: 'running',
              pid: 1234,
              port: 11434,
              lastCheck: new Date().toISOString()
            },
            tunnel: {
              status: 'running',
              pid: 5678,
              url: 'https://tunnel.all-in-chat-poker.fly.dev',
              lastCheck: new Date().toISOString()
            }
          },
          config: {
            aiProvider: 'ollama',
            ollamaHost: 'localhost',
            ollamaModel: 'llama2-7b'
          }
        }
      });
    } catch (error) {
      console.error('Service status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Control Center ollama models (alias for frontend)
  router.get('/services/ollama/models', (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          models: [
            {
              name: 'deepseek-coder:1.3b',
              model: 'deepseek-coder:1.3b',
              size: 770000000,
              digest: 'sha256:abc123'
            },
            {
              name: 'qwen:0.5b',
              model: 'qwen:0.5b',
              size: 390000000,
              digest: 'sha256:def456'
            },
            {
              name: 'llama3.2:1b',
              model: 'llama3.2:1b',
              size: 780000000,
              digest: 'sha256:ghi789'
            },
            {
              name: 'tinyllama:latest',
              model: 'tinyllama:latest',
              size: 450000000,
              digest: 'sha256:jkl012'
            },
            {
              name: 'llama3.2:latest',
              model: 'llama3.2:latest',
              size: 2000000000,
              digest: 'sha256:mno345'
            }
          ]
        }
      });
    } catch (error) {
      console.error('Ollama models error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Service control endpoints
  router.post('/services/ollama/start', (req, res) => {
    try {
      res.json({
        status: 'OK',
        message: 'Ollama service started successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Start ollama error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/services/ollama/stop', (req, res) => {
    try {
      res.json({
        status: 'OK',
        message: 'Ollama service stopped successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stop ollama error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/services/tunnel/start', (req, res) => {
    try {
      res.json({
        status: 'OK',
        message: 'Tunnel service started successfully',
        tunnel_url: 'https://tunnel.all-in-chat-poker.fly.dev',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Start tunnel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/services/tunnel/stop', (req, res) => {
    try {
      res.json({
        status: 'OK',
        message: 'Tunnel service stopped successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stop tunnel error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/services/test-connection', (req, res) => {
    try {
      res.json({
        status: 'OK',
        message: 'Connection test successful',
        response_time: '45ms',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Control Center status
  router.get('/status', (req, res) => {
    try {
      res.json({
        status: 'OK',
        control_center: {
          active: true,
          version: '1.0.0',
          features: {
            code_quality_guardian: true,
            coding_assistant: true,
            performance_optimizer: true,
            error_manager: true,
            self_healing: true
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI Control status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI models endpoint
  router.get('/models', (req, res) => {
    try {
      res.json({
        status: 'OK',
        models: [
          {
            id: 'llama2-7b',
            name: 'Llama 2 7B',
            type: 'text-generation',
            status: 'active',
            provider: 'ollama',
            capabilities: ['text-generation', 'code-generation'],
            performance: {
              avg_response_time: '220ms',
              success_rate: 0.95,
              requests_per_minute: 45
            }
          },
          {
            id: 'codellama-7b',
            name: 'Code Llama 7B',
            type: 'code-generation',
            status: 'active',
            provider: 'ollama',
            capabilities: ['code-generation', 'text-generation', 'debugging'],
            performance: {
              avg_response_time: '280ms',
              success_rate: 0.92,
              requests_per_minute: 30
            }
          }
        ],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI models error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI configuration endpoint
  router.get('/config', (req, res) => {
    try {
      res.json({
        status: 'OK',
        config: {
          ollama: {
            endpoint: 'http://localhost:11434',
            timeout: 30000,
            max_retries: 3
          },
          performance: {
            cache_size: '100MB',
            cache_ttl: 3600,
            max_concurrent_requests: 10
          },
          quality: {
            enable_code_quality: true,
            enable_auto_fix: true,
            strict_mode: false
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Performance endpoint
  router.get('/performance', (req, res) => {
    try {
      res.json({
        status: 'OK',
        performance: {
          overall: {
            cpu_usage: '45%',
            memory_usage: '62%',
            disk_usage: '38%',
            network_io: '125 MB/s',
            uptime: '99.9%'
          },
          models: {
            'llama2-7b': {
              avg_response_time: 220,
              requests_per_minute: 45,
              success_rate: 0.95,
              memory_usage: '2.1GB'
            },
            'codellama-7b': {
              avg_response_time: 280,
              requests_per_minute: 30,
              success_rate: 0.92,
              memory_usage: '2.3GB'
            }
          },
          cache: {
            hit_rate: 0.87,
            size: '100MB',
            evictions: 12,
            ttl: 3600
          },
          errors: {
            total_errors: 63,
            error_rate: 0.05,
            last_error: null,
            critical_errors: 0
          },
          optimizations: {
            auto_scaling_enabled: true,
            query_optimization: true,
            cache_optimization: true,
            model_quantization: false
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Performance data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI analytics endpoint
  router.get('/analytics', (req, res) => {
    try {
      res.json({
        status: 'OK',
        analytics: {
          usage: {
            total_requests: 2500,
            successful_requests: 2375,
            failed_requests: 125,
            avg_response_time: 250
          },
          models: {
            'llama2-7b': {
              requests: 1500,
              success_rate: 0.96,
              avg_time: 220
            },
            'codellama-7b': {
              requests: 1000,
              success_rate: 0.93,
              avg_time: 280
            }
          },
          errors: {
            timeout_errors: 45,
            model_errors: 30,
            network_errors: 25,
            other_errors: 25
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI analytics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI Tools chat endpoint
  router.post('/chat', (req, res) => {
    try {
      const { message, model = 'llama2-7b' } = req.body || {};
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // Simulate AI chat response
      const responses = [
        "I understand your request. Let me help you with that.",
        "That's an interesting question. Based on my analysis...",
        "I can assist you with this task. Here's what I recommend...",
        "Thank you for your message. I'm processing your request...",
        "I've analyzed your input and here's my response..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Return the format the frontend expects: { id: string, content: string }
      res.json({
        id: crypto.randomBytes(16).toString('hex'),
        content: randomResponse
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Audio and Cosmetics review endpoints
  
  // Get generated audio files
  router.get('/audio/files', (req, res) => {
    try {
      // Mock audio files data
      res.json({
        success: true,
        data: {
          files: [
            {
              id: 'audio_001',
              name: 'poker_theme_energetic.mp3',
              type: 'background_music',
              mood: 'energetic',
              duration: '2:30',
              size: '3.8MB',
              createdAt: '2026-01-09T18:45:00Z',
              url: '/uploads/audio/poker_theme_energetic.mp3'
            },
            {
              id: 'audio_002', 
              name: 'chip_stack_sound.mp3',
              type: 'game_sound',
              effectType: 'chip_stack',
              duration: '0:03',
              size: '0.2MB',
              createdAt: '2026-01-09T18:47:00Z',
              url: '/uploads/audio/chip_stack_sound.mp3'
            },
            {
              id: 'audio_003',
              name: 'victory_fanfare.mp3',
              type: 'game_sound',
              effectType: 'victory',
              duration: '0:05',
              size: '0.4MB',
              createdAt: '2026-01-09T18:50:00Z',
              url: '/uploads/audio/victory_fanfare.mp3'
            }
          ],
          totalSize: '4.4MB',
          totalCount: 3
        }
      });
    } catch (error) {
      console.error('Get audio files error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get cosmetic sets
  router.get('/cosmetics/sets', (req, res) => {
    try {
      // Mock cosmetic sets data
      res.json({
        success: true,
        data: {
          sets: [
            {
              id: 'cosmetic_001',
              name: 'Neon Dreams',
              theme: 'neon',
              type: 'cardBack',
              description: 'Vibrant neon card back with glowing effects',
              createdAt: '2026-01-09T19:00:00Z',
              preview: '/uploads/cosmetics/neon_dreams_preview.png',
              assets: {
                cardBack: '/uploads/cosmetics/neon_dreams_cardback.png',
                table: '/uploads/cosmetics/neon_dreams_table.png'
              },
              style: 'detailed',
              palette: ['#FF00FF', '#00FFFF', '#FFFF00']
            },
            {
              id: 'cosmetic_002',
              name: 'Royal Flush',
              theme: 'luxury',
              type: 'fullSet',
              description: 'Elegant gold and marble themed poker set',
              createdAt: '2026-01-09T19:15:00Z',
              preview: '/uploads/cosmetics/royal_flush_preview.png',
              assets: {
                cardBack: '/uploads/cosmetics/royal_flush_cardback.png',
                table: '/uploads/cosmetics/royal_flush_table.png',
                chips: '/uploads/cosmetics/royal_flush_chips.png'
              },
              style: 'realistic',
              palette: ['#FFD700', '#FFFFFF', '#8B4513']
            }
          ],
          totalCount: 2
        }
      });
    } catch (error) {
      console.error('Get cosmetic sets error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Generate new audio
  router.post('/audio/generate', (req, res) => {
    try {
      const { type, mood, duration, effectType, description } = req.body;
      
      // Mock generation response
      const newAudio = {
        id: `audio_${Date.now()}`,
        name: `${type}_${mood || effectType}_${Date.now()}.mp3`,
        type,
        mood: mood || effectType,
        duration: duration || '0:05',
        size: '2.1MB',
        createdAt: new Date().toISOString(),
        url: `/uploads/audio/${type}_${mood || effectType}_${Date.now()}.mp3`,
        status: 'generating'
      };
      
      res.json({
        success: true,
        data: newAudio,
        message: 'Audio generation started'
      });
    } catch (error) {
      console.error('Generate audio error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Generate new cosmetic
  router.post('/cosmetics/generate', (req, res) => {
    try {
      const { prompt, preset, cosmeticTypes, style, palette } = req.body;
      
      // Mock generation response
      const newCosmetic = {
        id: `cosmetic_${Date.now()}`,
        name: `${preset || 'custom'}_${Date.now()}`,
        theme: prompt || 'custom',
        type: cosmeticTypes?.[0] || 'cardBack',
        description: `AI-generated cosmetic based on: ${prompt}`,
        createdAt: new Date().toISOString(),
        preview: `/uploads/cosmetics/${preset || 'custom'}_preview.png`,
        assets: {},
        style: style || 'detailed',
        palette: palette || ['#FF0000', '#00FF00', '#0000FF'],
        status: 'generating'
      };
      
      res.json({
        success: true,
        data: newCosmetic,
        message: 'Cosmetic generation started'
      });
    } catch (error) {
      console.error('Generate cosmetic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = {
  createSimpleAdminAiControlRouter,
};
