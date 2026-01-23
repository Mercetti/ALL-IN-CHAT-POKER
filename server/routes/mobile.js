/**
 * Mobile Routes - Simplified Version
 * Basic mobile API routes
 */

const express = require('express');
const logger = require('../utils/logger');

function createMobileRoutes(options = {}) {
  const router = express.Router();
  
  // Mobile status endpoint
  router.get('/status', (req, res) => {
    res.json({
      status: 'online',
      service: 'mobile-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // Mobile health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      checks: {
        api: 'ok',
        database: 'ok',
        websocket: 'ok'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Mobile configuration
  router.get('/config', (req, res) => {
    res.json({
      apiVersion: '1.0.0',
      features: {
        notifications: true,
        realTime: true,
        offline: false
      },
      limits: {
        maxConnections: 100,
        requestTimeout: 30000
      },
      timestamp: new Date().toISOString()
    });
  });

  // Mobile user profile
  router.get('/profile', (req, res) => {
    // Simplified profile response
    res.json({
      user: {
        id: 'mobile-user-123',
        username: 'mobile-user',
        avatar: null,
        settings: {
          notifications: true,
          theme: 'light'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  // Mobile notifications
  router.get('/notifications', (req, res) => {
    res.json({
      notifications: [
        {
          id: '1',
          type: 'info',
          title: 'Welcome',
          message: 'Mobile API is working',
          timestamp: new Date().toISOString(),
          read: false
        }
      ],
      unread: 1,
      timestamp: new Date().toISOString()
    });
  });

  // Mobile actions
  router.post('/action', (req, res) => {
    const { action, data } = req.body;
    
    logger.info('Mobile action received', { action, data });
    
    res.json({
      success: true,
      action,
      result: `Action ${action} processed successfully`,
      timestamp: new Date().toISOString()
    });
  });

  // Mobile sync
  router.post('/sync', (req, res) => {
    const { lastSync } = req.body;
    
    logger.info('Mobile sync requested', { lastSync });
    
    res.json({
      success: true,
      synced: true,
      lastSync: new Date().toISOString(),
      changes: []
    });
  });

  // Mobile upload
  router.post('/upload', (req, res) => {
    // Simplified upload handling
    res.json({
      success: true,
      message: 'Upload endpoint available',
      timestamp: new Date().toISOString()
    });
  });

  // Mobile websocket info
  router.get('/websocket', (req, res) => {
    res.json({
      endpoint: '/ws/mobile',
      protocols: ['websocket'],
      timestamp: new Date().toISOString()
    });
  });

  // Mobile analytics
  router.get('/analytics', (req, res) => {
    res.json({
      usage: {
        requests: Math.floor(Math.random() * 1000),
        users: Math.floor(Math.random() * 100),
        uptime: process.uptime()
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 5
      },
      timestamp: new Date().toISOString()
    });
  });

  // Error handling middleware
  router.use((error, req, res, next) => {
    logger.error('Mobile route error', { error: error.message, path: req.path });
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

module.exports = createMobileRoutes;
