#!/bin/bash
# Safe Cleanup Script for Helm Control
# Only removes files identified as safe-to-delete

echo "🧹 SAFE CLEANUP FOR HELM CONTROL"
echo "==============================="

# Backup critical data before cleanup
echo "📦 Creating backup of critical files..."
mkdir -p backup/$(date +%Y%m%d_%H%M%S)
cp -r server/ backup/$(date +%Y%m%d_%H%M%S)/
cp -r helm-control/ backup/$(date +%Y%m%d_%H%M%S)/
cp package.json backup/$(date +%Y%m%d_%H%M%S)/

# Remove safe-to-delete items
echo "🗑️  Removing safe-to-delete items..."

# Test outputs
rm -rf test-output/
rm -rf test-results/
rm -rf playwright-report/
rm -rf debug-output/

# Temporary files
find . -name "*.tmp" -delete
find . -name "*.bak" -delete
find . -name "*~" -delete
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# Duplicate and backup assets
find public/assets -name "duplicate-*" -delete
find public/assets -name "backup-*" -delete
find public/assets -name "old-*" -delete

# Mock and test data files
find . -name "*-mock-data.json" -delete
find . -name "*-test-data.json" -delete
find . -name "mock-*.js" -not -path "./node_modules/*" -delete

echo "✅ Safe cleanup completed!"

# Show space saved
echo "📊 SPACE SAVED:"
du -sh backup/
du -sh .

echo "🎯 Cleanup complete! Critical files preserved."