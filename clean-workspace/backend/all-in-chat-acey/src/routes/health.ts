import { Router, Request, Response } from 'express';
import { Logger } from '../utils/logger';
import HealthCheckService from '../services/healthCheckService';
import WebSocketService from '../services/websocketService';

const router = Router();
const logger = new Logger();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthService = HealthCheckService.getInstance();
    await healthService.performHealthCheck(req, res);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: 'Internal server error',
    });
  }
});

export default router;
