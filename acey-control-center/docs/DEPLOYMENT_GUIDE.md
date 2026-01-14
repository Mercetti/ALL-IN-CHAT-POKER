# Acey Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Acey Control Center in various environments, from development to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 8.x or higher (or yarn 1.22.x+)
- **Redis**: 6.x or higher (for caching)
- **PostgreSQL**: 13.x or higher (for data persistence)
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB available space
- **CPU**: Minimum 2 cores (4 cores recommended)

### Development Tools

- **Git**: For version control
- **Docker**: For containerized deployment
- **kubectl**: For Kubernetes management
- **Fly CLI**: For Fly.io deployment

### Optional Dependencies

- **Elasticsearch**: For advanced logging and search
- **Prometheus**: For metrics collection
- **Grafana**: For metrics visualization
- **Nginx**: For reverse proxy and load balancing

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/acey-control-center.git
cd acey-control-center
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Configuration

Create environment configuration file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080
HOST=localhost

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/acey
REDIS_URL=redis://localhost:6379

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
API_KEY=your-api-key
ENCRYPTION_KEY=your-encryption-key

# AI Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Performance Configuration
CACHE_TTL=300000
CACHE_SIZE=1000
RATE_LIMIT=1000

# Monitoring Configuration
ENABLE_MONITORING=true
METRICS_PORT=9090
LOG_LEVEL=info

# Governance Configuration
ENABLE_GOVERNANCE=true
STRICT_MODE=true
HUMAN_OVERRIDE_REQUIRED=true
```

### 4. Database Setup

```bash
# Create database
createdb acey

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed
```

### 5. Redis Setup

```bash
# Start Redis
redis-server

# Test connection
redis-cli ping
```

---

## Development Deployment

### Local Development

```bash
# Start development server
npm run dev

# Start with hot reload
npm run dev:watch

# Start with debugging
npm run dev:debug
```

### Development Services

```bash
# Start all services
npm run dev:services

# Start individual services
npm run dev:server
npm run dev:redis
npm run dev:postgres
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

---

## Production Deployment

### Build Application

```bash
# Build for production
npm run build

# Build with optimization
npm run build:prod

# Build with analysis
npm run build:analyze
```

### Production Server

```bash
# Start production server
npm start

# Start with cluster mode
npm run start:cluster

# Start with PM2
pm2 start ecosystem.config.js
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'acey-control-center',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

---

## Docker Deployment

### Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S acey -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=acey:nodejs /app/dist ./dist
COPY --from=builder --chown=acey:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=acey:nodejs /app/package.json ./package.json

# Switch to non-root user
USER acey

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/server/index.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/acey
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=acey
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Docker Commands

```bash
# Build image
docker build -t acey-control-center .

# Run container
docker run -d \
  --name acey \
  -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  acey-control-center

# Use Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

---

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: acey
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: acey-config
  namespace: acey
data:
  NODE_ENV: "production"
  PORT: "8080"
  ENABLE_MONITORING: "true"
  LOG_LEVEL: "info"
```

### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: acey-secrets
  namespace: acey
type: Opaque
data:
  DATABASE_URL: <base64-encoded-database-url>
  REDIS_URL: <base64-encoded-redis-url>
  JWT_SECRET: <base64-encoded-jwt-secret>
  API_KEY: <base64-encoded-api-key>
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: acey-deployment
  namespace: acey
spec:
  replicas: 3
  selector:
    matchLabels:
      app: acey
  template:
    metadata:
      labels:
        app: acey
    spec:
      containers:
      - name: acey
        image: acey-control-center:latest
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: acey-config
        - secretRef:
            name: acey-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: acey-service
  namespace: acey
spec:
  selector:
    app: acey
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: acey-ingress
  namespace: acey
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - acey.yourdomain.com
    secretName: acey-tls
  rules:
  - host: acey.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: acey-service
            port:
              number: 80
```

### Kubernetes Commands

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n acey

# View logs
kubectl logs -f deployment/acey-deployment -n acey

# Scale deployment
kubectl scale deployment acey-deployment --replicas=5 -n acey

# Update deployment
kubectl set image deployment/acey-deployment acey=acey-control-center:v2 -n acey
```

---

## Cloud Deployment

### Fly.io Deployment

#### Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

#### Login

```bash
fly auth login
```

#### Initialize

```bash
fly launch
```

#### Configure fly.toml

```toml
app = "acey-control-center"

[build]
  image = "acey-control-center:latest"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    interval = 10000
    timeout = 2000
    grace_period = "5s"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[deploy]
  strategy = "canary"
```

#### Deploy

```bash
# Deploy application
fly deploy

# Check status
fly status

# View logs
fly logs

# Open application
fly open
```

### AWS Deployment

#### ECS Task Definition

```json
{
  "family": "acey-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "acey",
      "image": "your-registry/acey-control-center:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:acey-db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/acey",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Acey Control Center Stack'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub 'acey-${Environment}'

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Sub 'acey-${Environment}'
      Cpu: 512
      Memory: 1024
      NetworkMode: awsvpc
      RequiresCompatibilities: [FARGATE]
      ExecutionRoleArn: !Ref ExecutionRole

  Service:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          SecurityGroups: [!Ref SecurityGroup]
          Subnets: !Ref SubnetIds
          AssignPublicIp: ENABLED
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl -f http://localhost:8080/health

# Detailed health check
curl -f http://localhost:8080/health/detailed

# Readiness check
curl -f http://localhost:8080/health/ready
```

### Metrics Collection

```bash
# Get metrics
curl http://localhost:8080/metrics

# Get performance metrics
curl http://localhost:8080/metrics/performance

# Get governance metrics
curl http://localhost:8080/governance/stats
```

### Log Management

```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View access logs
tail -f logs/access.log

# Rotate logs
logrotate -f /etc/logrotate.d/acey
```

### Backup Procedures

```bash
# Database backup
pg_dump acey > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb backup_$(date +%Y%m%d_%H%M%S).rdb

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz .env docker-compose.yml
```

### Update Procedures

```bash
# Update dependencies
npm update

# Rebuild application
npm run build

# Restart service
pm2 restart acey-control-center

# Or with Docker
docker-compose pull
docker-compose up -d
```

---

## Troubleshooting

### Common Issues

#### Server Won't Start

```bash
# Check logs
pm2 logs acey-control-center

# Check port availability
netstat -tulpn | grep 8080

# Check environment variables
printenv | grep ACEY
```

#### Database Connection Issues

```bash
# Test database connection
psql $DATABASE_URL

# Check database status
pg_isready -h localhost -p 5432

# View database logs
tail -f /var/log/postgresql/postgresql.log
```

#### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis status
systemctl status redis

# View Redis logs
tail -f /var/log/redis/redis.log
```

#### Performance Issues

```bash
# Check system resources
top
htop
iotop

# Check application metrics
curl http://localhost:8080/metrics

# Profile application
npm run profile
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=acey:* npm start

# Enable verbose mode
VERBOSE=true npm start

# Enable performance monitoring
PERFORMANCE_MONITORING=true npm start
```

### Recovery Procedures

```bash
# Restart application
pm2 restart acey-control-center

# Reset database
npm run db:reset

# Clear cache
npm run cache:clear

# Full recovery
npm run recover
```

### Support Information

For additional support:

1. Check the [GitHub Issues](https://github.com/your-org/acey-control-center/issues)
2. Review the [System Architecture Documentation](SYSTEM_ARCHITECTURE.md)
3. Consult the [API Reference](API_REFERENCE.md)
4. Enable debug mode and provide logs

---

## Security Considerations

### Environment Security

- Use strong, unique passwords for all services
- Rotate secrets regularly
- Use environment-specific configurations
- Enable TLS/SSL for all communications

### Network Security

- Configure firewall rules appropriately
- Use VPN for remote access
- Implement rate limiting
- Monitor for suspicious activity

### Application Security

- Keep dependencies updated
- Regular security scans
- Input validation and sanitization
- Proper error handling

### Data Security

- Encrypt sensitive data at rest
- Use secure backup procedures
- Implement access controls
- Regular security audits

---

## Performance Optimization

### Application Optimization

- Enable caching for frequently accessed data
- Optimize database queries
- Use connection pooling
- Implement lazy loading

### Infrastructure Optimization

- Use CDN for static assets
- Implement load balancing
- Configure auto-scaling
- Monitor resource utilization

### Database Optimization

- Create appropriate indexes
- Optimize query performance
- Regular maintenance
- Monitor query performance

---

This deployment guide covers all aspects of deploying the Acey Control Center in various environments. For specific deployment scenarios or additional assistance, refer to the system documentation or contact the development team.
