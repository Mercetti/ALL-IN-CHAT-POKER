# All-In Chat Poker - Production Deployment Guide

## 🚀 Production Deployment Checklist

This guide will help you deploy the All-In Chat Poker application to a production environment safely and efficiently.

### 📋 Prerequisites

- **Node.js 18.0.0+** with npm 8.0.0+
- **Git** for version control
- **Domain name** (optional but recommended)
- **SSL certificate** (required for HTTPS)
- **Reverse proxy** (nginx/Apache) recommended
- **Process manager** (PM2/systemd) recommended

### 🔧 Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/poker-game-overlay.git
cd poker-game-overlay
git checkout main
```

#### 2. Install Dependencies
```bash
npm ci --only=production
```

#### 3. Configure Environment
```bash
# Copy production template
cp .env.production .env

# Edit with your production values
nano .env
```

**Critical settings to update:**
- `JWT_SECRET` - Generate a secure 32+ character string
- `ADMIN_PASSWORD` - Set a strong admin password
- `ADMIN_TOKEN` - Generate a secure admin token
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

#### 4. Generate Secure Secrets
```bash
# Use the built-in generator
node -e "
const validator = require('./server/config-validator');
console.log('JWT_SECRET=' + validator.generateSecureSecret());
console.log('ADMIN_PASSWORD=' + validator.generateSecurePassword());
console.log('ADMIN_TOKEN=' + validator.generateSecureSecret(32));
"
```

### 🔒 Security Configuration

#### 1. Validate Configuration
```bash
npm run security:check
```

#### 2. Security Audit
```bash
npm run security:audit
```

#### 3. Set File Permissions
```bash
# Make scripts executable
chmod +x deploy.sh

# Set proper permissions for data directory
mkdir -p data logs backups
chmod 755 data logs backups
chmod 600 .env
```

### 🗄️ Database Setup

#### 1. Initialize Database
```bash
# The application will create the database automatically
# Ensure the data directory exists and is writable
mkdir -p /opt/data
chmod 755 /opt/data
```

#### 2. Backup Strategy
```bash
# Create backup directory
mkdir -p backups

# Set up automated backups (add to crontab)
# 0 2 * * * /path/to/poker-game-overlay/backup.sh
```

### 🌐 Web Server Configuration

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

### 🚀 Deployment

#### 1. Automated Deployment
```bash
# Run the deployment script
npm run deploy
```

#### 2. Manual Deployment Steps
```bash
# 1. Run tests
npm test

# 2. Validate configuration
npm run security:check

# 3. Start application
npm run prod

# 4. Verify health
npm run health
```

### 📊 Monitoring and Logging

#### 1. Health Checks
```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed

# Metrics endpoint
curl http://localhost:3000/metrics
```

#### 2. Log Management
```bash
# View application logs
npm run logs

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log
```

#### 3. Process Management with PM2
```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "poker-game"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor PM2
pm2 monit
```

### 🔧 Maintenance

#### 1. Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm ci --only=production

# Restart application
pm2 restart poker-game
```

#### 2. Backup and Restore
```bash
# Create backup
npm run backup

# Restore from backup
cp backups/data_YYYYMMDD_HHMMSS.db data/data.db
pm2 restart poker-game
```

#### 3. Log Rotation
```bash
# Setup logrotate (create /etc/logrotate.d/poker-game)
/path/to/poker-game/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload poker-game
    endscript
}
```

### 🚨 Troubleshooting

#### Common Issues

1. **Application won't start**
   ```bash
   # Check configuration
   npm run security:check
   
   # Check logs
   npm run logs
   
   # Verify database permissions
   ls -la data/
   ```

2. **High memory usage**
   ```bash
   # Check memory usage
   curl http://localhost:3000/health/detailed
   
   # Restart application
   pm2 restart poker-game
   ```

3. **Database errors**
   ```bash
   # Check database file
   ls -la data/data.db
   
   # Verify database integrity
   sqlite3 data/data.db "PRAGMA integrity_check;"
   ```

4. **WebSocket connection issues**
   ```bash
   # Check nginx configuration
   nginx -t
   
   # Reload nginx
   systemctl reload nginx
   ```

### 📈 Performance Optimization

#### 1. Enable Clustering
Add to `.env`:
```env
ENABLE_CLUSTERING=true
CLUSTER_WORKERS=0  # 0 = auto-detect CPU count
```

#### 2. Redis Caching
Add to `.env`:
```env
REDIS_URL=redis://localhost:6379
```

#### 3. CDN for Static Assets
Configure your CDN to serve static files from `/public/`

### 🔒 Security Best Practices

1. **Regular Updates**
   ```bash
   # Update dependencies monthly
   npm update
   npm audit fix
   ```

2. **Access Control**
   - Use strong passwords
   - Enable 2FA where possible
   - Limit admin access
   - Use IP whitelisting for admin panel

3. **SSL/TLS**
   - Always use HTTPS
   - Keep certificates updated
   - Use strong cipher suites

4. **Monitoring**
   - Monitor error logs
   - Set up alerts for high error rates
   - Monitor resource usage

### 📞 Support

For production issues:
1. Check the logs first
2. Run health checks
3. Review this guide
4. Check GitHub issues
5. Contact support team

### 🔄 CI/CD Integration

#### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci --only=production
      - run: npm test
      - run: npm run security:check
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull origin main
            npm ci --only=production
            pm2 restart poker-game
```

---

## 🎯 Production Readiness Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Database initialized and backed up
- [ ] Security validation passed
- [ ] Health checks working
- [ ] Monitoring configured
- [ ] Log rotation setup
- [ ] Backup strategy implemented
- [ ] Process manager configured
- [ ] Firewall rules configured
- [ ] Domain DNS configured
- [ ] Performance monitoring set up
- [ ] Error alerting configured
- [ ] Documentation updated
- [ ] Team trained on deployment process

Once all items are checked, your application is production-ready! 🚀
