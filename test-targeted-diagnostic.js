/**
 * Targeted diagnostic to find the hanging module
 */

console.log('🔍 Starting targeted module diagnostics...');

// Test basic modules first
console.log('✅ Loading basic modules...');
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
console.log('✅ Basic modules loaded');

// Test server core modules in batches
const batches = [
  {
    name: 'Security & Core',
    modules: [
      './server/security',
      './server/config/env',
      './server/logger',
      './server/db'
    ]
  },
  {
    name: 'Middleware & Auth',
    modules: [
      './server/middleware',
      './server/auth',
      './server/startup',
      './server/connection-hardener'
    ]
  },
  {
    name: 'AI Systems',
    modules: [
      './server/ai-performance-monitor',
      './server/unified-ai'
    ]
  },
  {
    name: 'Stability Modules',
    modules: [
      './server/stability/acey-stability',
      './server/stability/acey-modes',
      './server/stability/startup-profiles',
      './server/stability/stability-watchdog'
    ]
  }
];

for (const batch of batches) {
  console.log(`\n🔍 Testing ${batch.name} batch...`);
  
  for (const modulePath of batch.modules) {
    try {
      console.log(`  📦 Loading ${modulePath}...`);
      const startTime = Date.now();
      const module = require(modulePath);
      const loadTime = Date.now() - startTime;
      console.log(`  ✅ ${modulePath} loaded (${loadTime}ms)`);
    } catch (error) {
      console.error(`  ❌ Failed to load ${modulePath}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log(`✅ ${batch.name} batch completed`);
}

console.log('\n🎉 All critical batches loaded successfully!');
console.log('🚀 The hanging module is not in these batches');
