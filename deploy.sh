#!/bin/bash

# Production Deployment Script for All-In Chat Poker
# This script prepares and deploys the application to production

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Configuration
APP_NAME="all-in-chat-poker"
DEPLOY_BRANCH="main"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on the correct branch
check_branch() {
    log_info "Checking current branch..."
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    if [ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]; then
        log_error "Must be on $DEPLOY_BRANCH branch to deploy. Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    log_success "On correct branch: $CURRENT_BRANCH"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database if it exists
    if [ -f "./data/data.db" ]; then
        cp "./data/data.db" "$BACKUP_DIR/data_$TIMESTAMP.db"
        log_success "Database backed up to $BACKUP_DIR/data_$TIMESTAMP.db"
    fi
    
    # Backup current deployment
    if [ -d "./current" ]; then
        cp -r "./current" "$BACKUP_DIR/deployment_$TIMESTAMP"
        log_success "Current deployment backed up to $BACKUP_DIR/deployment_$TIMESTAMP"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing production dependencies..."
    
    # Clean install to ensure no dev dependencies
    npm ci --only=production
    
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    
    npm test
    
    log_success "All tests passed"
}

# Validate configuration
validate_config() {
    log_info "Validating production configuration..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Please create it with production settings."
        exit 1
    fi
    
    # Run configuration validation
    node -e "
        const validator = require('./server/config-validator');
        const validation = validator.printValidationReport();
        if (!validation.isValid) {
            console.error('Configuration validation failed');
            process.exit(1);
        }
    "
    
    log_success "Configuration validation passed"
}

# Build assets
build_assets() {
    log_info "Building assets..."
    
    # Minify CSS if needed
    if command -v cleancss &> /dev/null; then
        find ./public -name "*.css" -not -path "./node_modules/*" -exec cleancss -o {} {} \;
        log_success "CSS files minified"
    fi
    
    # Optimize images if needed
    if command -v imagemin &> /dev/null; then
        imagemin ./public/assets/images/* --out-dir=./public/assets/images/
        log_success "Images optimized"
    fi
    
    log_success "Assets built"
}

# Security checks
security_checks() {
    log_info "Running security checks..."
    
    # Check for known vulnerabilities
    npm audit --audit-level high
    
    # Run ESLint if available
    if command -v npx &> /dev/null && [ -f ".eslintrc.js" ]; then
        npx eslint server/
        log_success "ESLint checks passed"
    fi
    
    log_success "Security checks completed"
}

# Database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Add migration logic here if needed
    # node server/migrate.js
    
    log_success "Database migrations completed"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Start the application in background
    NODE_ENV=production npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 10
    
    # Check if application is running
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Health check passed"
        kill $APP_PID
    else
        log_error "Health check failed"
        kill $APP_PID
        exit 1
    fi
}

# Deploy to production
deploy() {
    log_info "Deploying to production..."
    
    # Create current directory if it doesn't exist
    mkdir -p ./current
    
    # Copy application files
    rsync -av --exclude=node_modules \
              --exclude=.git \
              --exclude=logs \
              --exclude=backups \
              --exclude=data \
              --exclude=.env \
              ./ ./current/
    
    # Copy production dependencies
    cp -r node_modules ./current/
    
    # Copy environment file
    cp .env ./current/
    
    log_success "Application deployed to ./current"
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    
    # If using PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart $APP_NAME || pm2 start server.js --name $APP_NAME
        log_success "PM2 services restarted"
    fi
    
    # If using systemd
    if systemctl is-active --quiet $APP_NAME; then
        systemctl restart $APP_NAME
        log_success "Systemd service restarted"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log_info "Cleaning up old backups..."
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.db" -mtime +7 -delete
    find $BACKUP_DIR -name "deployment_*" -mtime +7 -delete
    
    log_success "Old backups cleaned up"
}

# Post-deployment verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if application is responding
    sleep 5
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Deployment verified - application is responding"
    else
        log_error "Deployment verification failed"
        exit 1
    fi
}

# Rollback function
rollback() {
    log_warning "Initiating rollback..."
    
    if [ -d "$BACKUP_DIR/deployment_$TIMESTAMP" ]; then
        # Stop current application
        if command -v pm2 &> /dev/null; then
            pm2 stop $APP_NAME
        fi
        
        # Restore backup
        rm -rf ./current
        cp -r "$BACKUP_DIR/deployment_$TIMESTAMP" ./current
        
        # Restart application
        if command -v pm2 &> /dev/null; then
            pm2 start $APP_NAME
        fi
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
        exit 1
    fi
}

# Main deployment flow
main() {
    # Check for rollback flag
    if [ "$1" = "--rollback" ]; then
        rollback
        exit 0
    fi
    
    # Run deployment steps
    check_branch
    create_backup
    install_dependencies
    run_tests
    validate_config
    build_assets
    security_checks
    run_migrations
    health_check
    deploy
    restart_services
    cleanup_backups
    verify_deployment
    
    log_success "🎉 Deployment completed successfully!"
    echo "=================================="
    echo "Application is running at: http://localhost:3000"
    echo "Logs are available in: ./logs/"
    echo "Backups are stored in: $BACKUP_DIR"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
