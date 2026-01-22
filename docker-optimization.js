/**
 * PHASE 4 - DOCKER IMAGE OPTIMIZATION
 * 
 * TARGETS:
 * - Ideal: <1GB
 * - Acceptable: <2GB  
 * - 3GB requires justification
 * 
 * CURRENT: 5.59 GB → TARGET: ~1-2 GB
 */

const fs = require('fs');
const path = require('path');

console.log('🐳 PHASE 4 - DOCKER IMAGE OPTIMIZATION');
console.log('=====================================');

// 1. Create multi-stage Dockerfile
const multiStageDockerfile = `
# Multi-stage Dockerfile for Helm Control
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up dev dependencies after build
RUN npm prune --production

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S helm -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production --no-cache

# Copy built application from builder stage
COPY --from=builder --chown=helm:nodejs /app/dist ./dist
COPY --from=builder --chown=helm:nodejs /app/public ./public
COPY --from=builder --chown=helm:nodejs /app/server ./server

# Copy essential files
COPY --chown=helm:nodejs server.js ./
COPY --chown=helm:nodejs helm-server.js ./

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/temp && \\
    chown -R helm:nodejs /app/logs /app/data /app/temp

# Switch to non-root user
USER helm

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "helm-server.js"]
`;

console.log('\n📝 Creating multi-stage Dockerfile...');
fs.writeFileSync('Dockerfile.optimized', multiStageDockerfile.trim());
console.log('✅ Multi-stage Dockerfile created');

// 2. Create .dockerignore for production
const optimizedDockerignore = `
# Development dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build artifacts (will be rebuilt in container)
build/
dist/
.next/
.turbo/
.vite/
.cache/

# Development files
.env.local
.env.development
.env.test
.env

# Logs (will be created in container)
logs/
*.log

# Runtime data (will be created in container)
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/

# Test outputs
test-results/
playwright-report/
test-output/
test-output/

# Development apps (keep source, exclude built)
acey-control-apk/
acey-control-center/
acey-control-simple/
mobile/
apps/
clean-workspace/

# Git (will be rebuilt in container)
.git/

# Development tools
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Documentation (not needed in production)
docs/
*.md

# Large assets that should be streamed
public/assets/audio/
public/assets/videos/
public/assets/large-*/

# Temporary files
tmp/
temp/
.tmp/

# Cache files
.npm
.yarn
.yarn-integrity

# Lock files (will be regenerated)
package-lock.json
yarn.lock

# Development scripts
scripts/dev-*
scripts/test-*
`;

console.log('\n🚫 Creating optimized .dockerignore...');
fs.writeFileSync('.dockerignore.optimized', optimizedDockerignore.trim());
console.log('✅ Optimized .dockerignore created');

// 3. Create docker-compose for optimized deployment
const dockerCompose = `
version: '3.8'

services:
  helm-control:
    build:
      context: .
      dockerfile: Dockerfile.optimized
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - helm-control
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.1'

volumes:
  logs:
  data:

networks:
  default:
    driver: bridge
`;

console.log('\n🐙 Creating optimized docker-compose...');
fs.writeFileSync('docker-compose.optimized.yml', dockerCompose.trim());
console.log('✅ Optimized docker-compose created');

// 4. Create nginx configuration for static file serving
const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=static:10m rate=30r/s;

    # Upstream backend
    upstream helm_backend {
        server helm-control:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Referrer-Policy strict-origin-when-cross-origin;

        # Static files with caching
        location /static/ {
            limit_req zone=static burst=50 nodelay;
            alias /usr/share/nginx/html/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API requests
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://helm_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket connections
        location /socket.io/ {
            proxy_pass http://helm_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Main application
        location / {
            proxy_pass http://helm_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://helm_backend;
            access_log off;
        }
    }
}
`;

console.log('\n🌐 Creating nginx configuration...');
fs.writeFileSync('nginx.conf', nginxConfig.trim());
console.log('✅ Nginx configuration created');

// 5. Create build and deployment scripts
const buildScript = `#!/bin/bash
# Optimized Docker Build Script

echo "🐳 Building Optimized Helm Control Docker Image..."

# Use BuildKit for better caching
export DOCKER_BUILDKIT=1

# Build with multiple platforms
docker build \\
    --file Dockerfile.optimized \\
    --tag helm-control:optimized \\
    --tag helm-control:latest \\
    --build-arg BUILDKIT_INLINE_CACHE=1 \\
    .

echo "✅ Build complete!"

# Image size analysis
echo "📊 Image Size Analysis:"
docker images helm-control

# Security scan
echo "🔒 Security Scan:"
docker scan helm-control:optimized

echo "🚀 Ready for deployment!"
`;

const deployScript = `#!/bin/bash
# Optimized Deployment Script

echo "🚀 Deploying Optimized Helm Control..."

# Stop existing services
docker-compose -f docker-compose.optimized.yml down

# Pull latest images
docker-compose -f docker-compose.optimized.yml pull

# Start services
docker-compose -f docker-compose.optimized.yml up -d

# Wait for health check
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check status
docker-compose -f docker-compose.optimized.yml ps

echo "✅ Deployment complete!"
echo "🌐 Access at: http://localhost"
`;

console.log('\n📜 Creating build and deployment scripts...');
fs.writeFileSync('build-optimized.sh', buildScript.trim());
fs.writeFileSync('deploy-optimized.sh', deployScript.trim());
console.log('✅ Scripts created');

console.log('\n🎯 DOCKER OPTIMIZATION SUMMARY');
console.log('================================');
console.log('✅ Multi-stage Dockerfile - separates build and runtime');
console.log('✅ Optimized .dockerignore - excludes unnecessary files');
console.log('✅ Docker Compose - resource limits and health checks');
console.log('✅ Nginx configuration - static file serving and compression');
console.log('✅ Build and deployment scripts');

console.log('\n📊 EXPECTED DOCKER IMPROVEMENTS:');
console.log('• Image size: 5.59 GB → ~800MB - 1.2GB');
console.log('• Build time: ~40% faster with caching');
console.log('• Security: Non-root user, minimal attack surface');
console.log('• Performance: Nginx static serving, gzip compression');
console.log('• Reliability: Health checks, graceful shutdowns');

console.log('\n🔧 BUILD COMMANDS:');
console.log('chmod +x build-optimized.sh deploy-optimized.sh');
console.log('./build-optimized.sh');
console.log('./deploy-optimized.sh');

console.log('\n🚀 READY FOR PHASE 5 - SAFE CLEANUP');
