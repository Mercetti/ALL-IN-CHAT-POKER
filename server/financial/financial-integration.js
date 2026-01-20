/**
 * ACEY FINANCIAL OPERATIONS SYSTEM - Server Integration
 * Core Safety Rules: Acey CANNOT send money or trigger payouts
 * Only collect revenue data, calculate payouts, prepare batches, detect anomalies
 */

const { createFinancialAPIRoutes } = require('./financial-api');
const Logger = require('../logger');

const logger = new Logger('financial-integration');

/**
 * Integrate financial operations system into main server
 */
function integrateFinancialSystem(app, db) {
  try {
    logger.info('🏦 Integrating ACEY Financial Operations System...');
    
    // Initialize database if needed
    if (!db.initialized) {
      db.init();
    }
    
    // Initialize database schema if needed
    initializeDatabase(db);
    
    // Mount financial API routes
    const financialAPI = createFinancialAPIRoutes();
    app.use('/api/financial', financialAPI);
    
    logger.info('✅ Financial API routes mounted at /api/financial');
    logger.info('🔒 Financial system integration complete');
    
    return true;
    
  } catch (error) {
    logger.error('❌ Failed to integrate financial system', { error: error.message });
    return false;
  }
}

/**
 * Initialize database schema if tables don't exist
 */
function initializeDatabase(db) {
  try {
    logger.info('🗄️ Initializing financial database schema...');
    
    // Check if tables exist
    const database = db.getDatabase();
    const tableCheck = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN (
        'financial_events', 'partner_profiles', 'monthly_ledgers', 
        'payout_batches', 'financial_flags', 'financial_audit_log',
        'financial_system_config'
      )
    `).all();
    
    if (tableCheck.length === 7) {
      logger.info('✅ Database schema already exists');
      return;
    }
    
    // Read and execute schema
    const fs = require('fs');
    const schemaPath = require('path').join(__dirname, 'database-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      logger.info(`📋 Executing ${statements.length} schema statements...`);
      
      database.exec('BEGIN TRANSACTION');
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length > 0) {
          try {
            database.exec(statement);
          } catch (error) {
            logger.error(`❌ Failed to execute statement ${i + 1}: ${statement}`, { error: error.message });
            throw error;
          }
        }
      }
      
      database.exec('COMMIT');
      logger.info('✅ Database schema initialized successfully');
      
    } else {
      throw new Error('Database schema file not found');
    }
    
  } catch (error) {
    logger.error('❌ Failed to initialize database schema', { error: error.message });
    throw error;
  }
}

/**
 * Add financial system health check to server
 */
function addFinancialHealthCheck(app, db) {
  app.get('/health/financial', (req, res) => {
    try {
      // Test database connection
      const database = db.getDatabase();
      const dbTest = database.prepare('SELECT 1').get();
      
      // Test financial system
      const PayoutEngine = require('./payout-engine');
      const payoutEngine = new PayoutEngine();
      const stats = payoutEngine.getBatchStatistics();
      
      const health = {
        status: dbTest && payoutEngine ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbTest ? 'connected' : 'disconnected',
        payout_engine: payoutEngine ? 'operational' : 'error',
        batch_stats: stats,
        last_check: new Date().toISOString()
      };
      
      res.json({
        success: health.status === 'healthy',
        data: health
      });
      
    } catch (error) {
      logger.error('Financial health check failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Financial system health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * Get financial system status summary
 */
function getFinancialSystemStatus() {
  try {
    const PayoutEngine = require('./payout-engine');
    const payoutEngine = new PayoutEngine();
    const stats = payoutEngine.getBatchStatistics();
    const flags = payoutEngine.getActiveFlags();
    
    return {
      status: 'operational',
      database: 'connected',
      features: {
        revenue_tracking: true,
        payout_calculation: true,
        batch_management: true,
        anomaly_detection: true,
        audit_logging: true,
        paypal_export: true,
        owner_approval: true
      },
      statistics: stats,
      active_flags: flags.length,
      last_updated: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      last_updated: new Date().toISOString()
    };
  }
}

module.exports = {
  integrateFinancialSystem,
  addFinancialHealthCheck,
  getFinancialSystemStatus
};
