#!/bin/bash

# Mobile App Testing Script
# Comprehensive testing for React Native mobile app

set -e

echo "🧪 Running Mobile App Tests..."
echo "=================================="

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from mobile/ directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running ESLint..."
npm run lint
LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
    echo "❌ ESLint failed with exit code $LINT_EXIT_CODE"
    exit 1
else
    echo "✅ ESLint passed"
fi

# Run unit tests
echo "🧪 Running Unit Tests..."
npm test
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed with exit code $TEST_EXIT_CODE"
    exit 1
else
    echo "✅ All tests passed"
fi

# Run performance tests
echo "⚡ Running Performance Tests..."
npm test -- --testNamePattern="performance"

PERF_EXIT_CODE=$?

if [ $PERF_EXIT_CODE -ne 0 ]; then
    echo "❌ Performance tests failed with exit code $PERF_EXIT_CODE"
    exit 1
else
    echo "✅ Performance tests passed"
fi

# Generate coverage report
echo "📊 Generating Coverage Report..."
npm test -- --coverage

COVERAGE_EXIT_CODE=$?

if [ $COVERAGE_EXIT_CODE -ne 0 ]; then
    echo "❌ Coverage report failed with exit code $COVERAGE_EXIT_CODE"
    exit 1
else
    echo "✅ Coverage report generated"
fi

# Check bundle size
echo "📦 Checking Bundle Size..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output ./bundle-output

if [ -f "./bundle-output/index.android.bundle" ]; then
    BUNDLE_SIZE=$(wc -c < "./bundle-output/index.android.bundle")
    echo "📱 Android Bundle Size: ${BUNDLE_SIZE} bytes"
    
    if [ $BUNDLE_SIZE -gt 5242880 ]; then
        echo "⚠️  Bundle size exceeds 5MB limit"
    else
        echo "✅ Bundle size within acceptable limits"
    fi
else
    echo "❌ Bundle generation failed"
    exit 1
fi

echo "=================================="
echo "🎉 Mobile App Testing Complete!"
echo ""
echo "📋 Test Results Summary:"
echo "  - ESLint: $([ $LINT_EXIT_CODE -eq 0 ] && echo '✅ Passed' || echo '❌ Failed')"
echo "  - Unit Tests: $([ $TEST_EXIT_CODE -eq 0 ] && echo '✅ Passed' || echo '❌ Failed')"
echo "  - Performance Tests: $([ $PERF_EXIT_CODE -eq 0 ] && echo '✅ Passed' || echo '❌ Failed')"
echo "  - Coverage Report: $([ $COVERAGE_EXIT_CODE -eq 0 ] && echo '✅ Generated' || echo '❌ Failed')"
echo "  - Bundle Size: $BUNDLE_SIZE bytes"
echo ""
echo "📱 Ready for App Store Submission!"
