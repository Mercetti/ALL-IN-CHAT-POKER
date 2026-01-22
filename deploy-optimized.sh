#!/bin/bash
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