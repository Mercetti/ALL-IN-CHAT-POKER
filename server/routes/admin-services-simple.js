const express = require('express');

function createSimpleAdminServicesRouter() {
  const router = express.Router();

  // AI service status endpoint
  router.get('/status', (req, res) => {
    try {
      res.json({
        status: 'OK',
        services: {
          ollama: {
            status: 'running',
            models: ['llama2', 'codellama'],
            endpoint: 'http://localhost:11434'
          },
          ai_error_manager: {
            status: 'active',
            errors_handled: 0,
            last_error: null
          },
          ai_performance_monitor: {
            status: 'active',
            cache_hit_rate: '85%',
            response_time_avg: '250ms'
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Service status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Ollama models endpoint
  router.get('/ollama/models', (req, res) => {
    try {
      res.json({
        status: 'OK',
        models: [
          {
            name: 'llama2',
            size: '3.8GB',
            modified_at: new Date().toISOString(),
            digest: 'sha256:abc123',
            details: {
              format: 'gguf',
              family: 'llama',
              families: null,
              parameter_size: '7B',
              quantization_level: 'q4_0'
            }
          },
          {
            name: 'codellama',
            size: '3.8GB',
            modified_at: new Date().toISOString(),
            digest: 'sha256:def456',
            details: {
              format: 'gguf',
              family: 'codellama',
              families: null,
              parameter_size: '7B',
              quantization_level: 'q4_0'
            }
          }
        ],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ollama models error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // AI performance metrics
  router.get('/performance/metrics', (req, res) => {
    try {
      res.json({
        status: 'OK',
        metrics: {
          total_requests: 1250,
          successful_requests: 1187,
          failed_requests: 63,
          average_response_time: 245,
          cache_hit_rate: 0.87,
          error_rate: 0.05,
          models: {
            llama2: {
              requests: 750,
              avg_response_time: 220,
              success_rate: 0.95
            },
            codellama: {
              requests: 500,
              avg_response_time: 280,
              success_rate: 0.92
            }
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

module.exports = {
  createSimpleAdminServicesRouter,
};
