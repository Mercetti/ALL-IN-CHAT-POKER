#!/bin/bash

# Automated Database Backup Script for Fly.io Deployment
# This script creates automated backups of the SQLite database

set -e

# Configuration
DB_FILE="/data/data.db"
BACKUP_DIR="/data/backups"
MAX_BACKUPS=10  # Keep only the last 10 backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."

# Create backup
if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_FILE"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    # Clean up old backups (keep only MAX_BACKUPS)
    cd "$BACKUP_DIR"
    ls -t *.db | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm 2>/dev/null || true
    echo "🧹 Cleaned up old backups (keeping last $MAX_BACKUPS)"
    
    # List current backups
    echo "📋 Current backups:"
    ls -la *.db | tail -5
    
else
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi

echo "✅ Backup completed successfully!"
