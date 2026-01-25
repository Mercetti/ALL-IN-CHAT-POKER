#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating Render Deployment Secrets\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log(`JWT_SECRET: ${jwtSecret}`);

// Generate Admin Token
const adminToken = crypto.randomBytes(32).toString('hex');
console.log(`ADMIN_TOKEN: ${adminToken}`);

// Generate Admin Password
const adminPassword = crypto.randomBytes(16).toString('hex');
console.log(`ADMIN_PASSWORD: ${adminPassword}`);

console.log('\n📋 Copy these values to your Render dashboard:');
console.log('1. Go to your service in Render');
console.log('2. Click "Environment" tab');
console.log('3. Add these as secrets');
console.log('\n🤖 For Discord bot, also add:');
console.log('- DISCORD_BOT_TOKEN (from Discord Developer Portal)');
console.log('- DISCORD_CLIENT_ID (from Discord Developer Portal)');

console.log('\n✅ Secrets generated! Save these somewhere safe.');
