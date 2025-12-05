/**
 * Startup checks and health diagnostics
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');
const Logger = require('./logger');

const logger = new Logger('startup');

/**
 * Check startup conditions
 * @returns {Object} - Check results with status and issues
 */
function checkStartup() {
  const results = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      environment: checkEnvironment(),
      database: checkDatabase(),
      redis: checkRedis(),
    },
    issues: [],
  };

  // Collect issues
  Object.entries(results.checks).forEach(([name, check]) => {
    if (!check.ok) {
      results.issues.push(`${name}: ${check.error}`);
      if (check.severity === 'critical') {
        results.status = 'error';
      } else if (results.status !== 'error') {
        results.status = 'warning';
      }
    }
  });

  return results;
}

/**
 * Check required environment variables
 * @returns {Object}
 */
function checkEnvironment() {
  const issues = [];

  if (!process.env.JWT_SECRET) {
    issues.push('JWT_SECRET not set; using default value (change in production)');
  }

  return {
    ok: issues.length === 0,
    error: issues.join('; '),
    severity: issues.length > 0 ? 'warning' : undefined,
    details: {
      port: config.PORT,
      nodeEnv: config.NODE_ENV,
      dbFile: config.DB_FILE,
    },
  };
}

/**
 * Check database accessibility
 * @returns {Object}
 */
function checkDatabase() {
  const dbDir = path.dirname(config.DB_FILE);

  try {
    // Check if directory exists, create if not
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Try to write a test file
    const testFile = path.join(dbDir, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return {
      ok: true,
      details: {
        dbPath: config.DB_FILE,
        writable: true,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: `Database directory not writable: ${err.message}`,
      severity: 'critical',
    };
  }
}

/**
 * Check Redis connectivity if configured
 * @returns {Object}
 */
function checkRedis() {
  const redisUrl = (config.REDIS_URL || '').trim();

  // Treat empty/whitespace as not configured
  if (!redisUrl) {
    return {
      ok: true,
      details: { configured: false },
    };
  }

  // Just verify URL format, actual connection tested when client initializes
  try {
    new URL(redisUrl);
    return {
      ok: true,
      details: { configured: true, url: redisUrl },
    };
  } catch (err) {
    return {
      ok: false,
      error: `Invalid Redis URL: ${err.message}`,
      severity: 'warning',
    };
  }
}

/**
 * Log startup check results
 * @param {Object} results - Results from checkStartup()
 */
function logStartupCheck(results) {
  if (results.status === 'ok') {
    logger.info('All startup checks passed', results.checks);
  } else if (results.status === 'warning') {
    logger.warn('Startup checks completed with warnings', results);
  } else {
    logger.error('Startup checks failed', results);
  }
}

/**
 * Get health status for monitoring
 * @returns {Object}
 */
function getHealth() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    config: {
      port: config.PORT,
      nodeEnv: config.NODE_ENV,
      logLevel: config.LOG_LEVEL,
    },
  };
}

module.exports = {
  checkStartup,
  logStartupCheck,
  getHealth,
};
