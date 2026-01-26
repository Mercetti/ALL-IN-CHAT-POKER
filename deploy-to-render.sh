#!/bin/bash

# Deploy to Render - Quick Deployment Script
# This script helps you deploy your poker game to Render

set -e  # Exit on any error

echo "🚀 Deploying to Render..."
echo "=".repeat(50)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed or not in PATH"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes"
    read -p "Do you want to commit them? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Adding all changes..."
        git add .
        
        read -p "Enter commit message: " -r
        echo
        if [ -z "$REPLY" ]; then
            COMMIT_MSG="Deploy to Render - $(date)"
        else
            COMMIT_MSG="$REPLY"
        fi
        
        print_status "Committing changes..."
        git commit -m "$COMMIT_MSG"
    else
        print_error "Please commit your changes before deploying"
        exit 1
    fi
fi

# Check if we're on the correct branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You're not on the main branch"
    read -p "Do you want to switch to main branch? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Switching to main branch..."
        git checkout main
        git pull origin main
    else
        print_warning "Deploying from branch: $CURRENT_BRANCH"
    fi
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found"
    exit 1
fi

print_status "Found render.yaml configuration"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
fi

print_status "Found package.json"

# Check if server.js exists
if [ ! -f "server.js" ]; then
    print_error "server.js not found"
    exit 1
fi

print_status "Found server.js"

# Validate package.json scripts
if ! npm run start --dry-run > /dev/null 2>&1; then
    print_warning "Testing start script..."
    if ! node -e "require('./package.json').scripts.start" > /dev/null 2>&1; then
        print_error "Invalid start script in package.json"
        exit 1
    fi
fi

print_status "Package.json scripts validated"

# Check health endpoint
print_status "Checking health endpoint in server.js..."
if ! grep -q "app.get.*health" server.js; then
    print_warning "Health endpoint not found in server.js"
    print_warning "Render requires a health check endpoint"
else
    print_status "Health endpoint found"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git push origin $CURRENT_BRANCH

if [ $? -ne 0 ]; then
    print_error "Failed to push to GitHub"
    exit 1
fi

print_status "Successfully pushed to GitHub"

# Wait a moment for GitHub to process
print_status "Waiting for GitHub to process..."
sleep 3

# Test deployment (if test script exists)
if [ -f "test-render-deployment.js" ]; then
    print_status "Running deployment test..."
    node test-render-deployment.js
else
    print_warning "Deployment test script not found"
fi

print_header "=".repeat(50)
print_status "🎉 Deployment initiated!"
print_status ""
print_status "Next steps:"
print_status "1. Go to https://render.com"
print_status "2. Check your services in the dashboard"
print_status "3. Monitor the build logs"
print_status "4. Test your application at:"
print_status "   https://all-in-chat-poker.onrender.com"
print_status ""
print_status "Health check:"
print_status "   https://all-in-chat-poker.onrender.com/health"
print_status ""
print_status "If you encounter issues:"
print_status "1. Check Render logs in the dashboard"
print_status "2. Verify environment variables"
print_status "3. Check the build process"
print_status ""
print_status "For troubleshooting, run:"
print_status "   node test-render-deployment.js"
print_header "=".repeat(50)
