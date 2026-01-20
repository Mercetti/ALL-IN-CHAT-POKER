# Helm Control Deployment Guide

## Overview

Helm Control is a standalone orchestration engine for AI skill management, permissions, and execution. This guide provides step-by-step instructions for deploying Helm Control on a new website.

## System Requirements

### Minimum Requirements

- **Node.js**: v18.0.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB available space
- **OS**: Linux, macOS, or Windows 10+

### Recommended Requirements

- **Node.js**: v20.0.0 or higher
- **Memory**: 16GB RAM
- **Storage**: 50GB available space (SSD recommended)
- **CPU**: 4+ cores for optimal performance

## Installation Steps

### Step 1: Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-org/helm-control.git
cd helm-control

# Install dependencies
npm install

# Create data directories
mkdir -p helm-control-data/{skills,permissions,audit,logs}
```

### Step 2: Configuration

Create a `.env` file in the root directory:

```env
# Core Configuration
NODE_ENV=production
PORT=3000
HELM_DATA_PATH=./helm-control-data

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Database (if using external database)
DATABASE_URL=postgresql://user:password@localhost:5432/helm_control
REDIS_URL=redis://localhost:6379

# LLM Configuration
LLM_PROVIDER=openai
LLM_API_KEY=your-llm-api-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.7

# Resource Limits
MAX_MEMORY_PER_SKILL=4096
MAX_CPU_PER_SKILL=80
MAX_TIMEOUT_PER_SKILL=900

# Monitoring
HEALTH_CHECK_INTERVAL=30
AUDIT_RETENTION_DAYS=365
```

### Step 3: Database Setup

#### Option A: SQLite (Default)
```bash
# SQLite is included and requires no additional setup
# Database will be created automatically at ./helm-control-data/helm.db
```

#### Option B: PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb helm_control

# Create user
sudo -u postgres createuser helm_control

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE helm_control TO helm_control;"
```

### Step 4: Build and Start

```bash
# Build the application
npm run build

# Start Helm Control
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start ecosystem.config.js
```

### Step 5: Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 123,
  "skills": 12,
  "memory": {
    "used": 512,
    "available": 3584
  }
}
```

## Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "migrate": "node dist/migrate.js",
    "seed": "node dist/seed.js"
  }
}
```

### PM2 Configuration (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'helm-control',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## Folder Structure

```
helm-control/
├── src/
│   ├── core/
│   │   ├── index.ts                 # Main entry point
│   │   ├── skill-registry-v2-impl.ts
│   │   └── permission-policy-matrix.ts
│   ├── interfaces/
│   │   └── skill-registry-v2.ts
│   ├── skills/
│   │   └── skill-definitions-v2.ts
│   ├── prompts/
│   │   └── master-system-prompt-v2.md
│   └── utils/
├── dist/                              # Compiled JavaScript
├── helm-control-data/                  # Runtime data
│   ├── skills.json                   # Skill registry
│   ├── permissions.json               # Permission policies
│   ├── audit.json                   # Audit logs
│   └── logs/                       # Application logs
├── config/                           # Configuration files
├── tests/                            # Test files
└── docs/                             # Documentation
```

## Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Configure HTTPS
export SSL_CERT_PATH=./cert.pem
export SSL_KEY_PATH=./key.pem
```

### Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 3000/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Authentication Setup

```bash
# Create admin user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "role": "owner",
    "tier": "enterprise"
  }'

# Set password
curl -X POST http://localhost:3000/api/auth/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin-id-here",
    "password": "secure-password-here"
  }'
```

## Optional All-In Chat Poker Integration

### Demo Integration

To integrate with All-In Chat Poker for demo purposes:

```bash
# Install All-In Chat Poker (optional)
git clone https://github.com/your-org/all-in-chat-poker.git
cd all-in-chat-poker
npm install

# Configure integration
export ALL_IN_CHAT_POKER_URL=http://localhost:3001
export HELM_CONTROL_URL=http://localhost:3000
export DEMO_MODE=true

# Start both systems
# Terminal 1: Start Helm Control
cd helm-control
npm start

# Terminal 2: Start All-In Chat Poker
cd all-in-chat-poker
npm start
```

### Integration Configuration

```javascript
// In All-In Chat Poker config
const helmControlIntegration = {
  enabled: true,
  endpoint: 'http://localhost:3000/api/helm',
  apiKey: 'demo-integration-key',
  skills: ['audio-processor', 'graphics-engine', 'analytics-engine'],
  readOnly: true
};
```

## Monitoring and Maintenance

### Health Monitoring

```bash
# Check system health
curl http://localhost:3000/api/health

# Check skill status
curl http://localhost:3000/api/skills/status

# View system metrics
curl http://localhost:3000/api/metrics
```

### Log Management

```bash
# View recent logs
tail -f helm-control-data/logs/helm-control.log

# Rotate logs (weekly)
npm run rotate-logs

# Archive old logs
npm run archive-logs
```

### Backup Procedures

```bash
# Backup database
npm run backup-db

# Backup configuration
npm run backup-config

# Full system backup
npm run backup-full
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### Permission Errors
```bash
# Check file permissions
ls -la helm-control-data/

# Fix permissions
chmod 755 helm-control-data/
chmod 644 helm-control-data/*.json
```

### Performance Optimization

```bash
# Enable clustering
export CLUSTER_MODE=true
export WORKERS=4

# Optimize for production
export NODE_ENV=production
export UV_THREADPOOL_SIZE=128
```

## API Endpoints

### Core Endpoints

- `GET /health` - System health check
- `GET /api/skills` - List available skills
- `POST /api/skills/execute` - Execute skill
- `GET /api/permissions` - Get user permissions
- `POST /api/permissions/grant` - Grant permission
- `GET /api/metrics` - System metrics

### Admin Endpoints

- `POST /api/admin/skills/register` - Register new skill
- `PUT /api/admin/skills/:id` - Update skill
- `DELETE /api/admin/skills/:id` - Unregister skill
- `GET /api/admin/audit` - View audit logs
- `GET /api/admin/users` - Manage users

## Scaling Considerations

### Horizontal Scaling

```bash
# Use load balancer
nginx.conf:
upstream helm_control {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    location / {
        proxy_pass http://helm_control;
    }
}
```

### Database Scaling

```bash
# Read replica setup
export DATABASE_READ_REPLICA_URL=postgresql://user:password@replica:5432/helm_control

# Connection pooling
export DB_POOL_MIN=10
export DB_POOL_MAX=50
```

## Support

### Documentation

- **API Documentation**: http://localhost:3000/docs
- **Admin Guide**: http://localhost:3000/admin-guide
- **Troubleshooting**: http://localhost:3000/troubleshooting

### Community

- **GitHub Issues**: https://github.com/your-org/helm-control/issues
- **Discord Community**: https://discord.gg/helm-control
- **Documentation**: https://docs.helm-control.com

---

**Helm Control v2.0.0** - Deploy with confidence, scale with ease.
