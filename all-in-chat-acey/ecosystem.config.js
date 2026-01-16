/**
 * PM2 Ecosystem Configuration for Acey Backend
 * @type {import('pm2').EcosystemConfig}
 */
/* eslint-disable */
module.exports = {
  apps: [
    {
      name: 'acey-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: './logs/combined-error.log',
      out_file: './logs/combined-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],
  deploy: {
    production: {
      user: 'nodejs',
      host: '127.0.0.1',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/acey-backend.git',
      path: '/app',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
