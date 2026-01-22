#!/bin/bash
# Optimized Docker Build Script

echo "🐳 Building Optimized Helm Control Docker Image..."

# Use BuildKit for better caching
export DOCKER_BUILDKIT=1

# Build with multiple platforms
docker build \
    --file Dockerfile.optimized \
    --tag helm-control:optimized \
    --tag helm-control:latest \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    .

echo "✅ Build complete!"

# Image size analysis
echo "📊 Image Size Analysis:"
docker images helm-control

# Security scan
echo "🔒 Security Scan:"
docker scan helm-control:optimized

echo "🚀 Ready for deployment!"