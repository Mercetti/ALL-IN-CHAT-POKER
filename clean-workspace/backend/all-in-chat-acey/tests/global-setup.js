"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalTeardown = globalTeardown;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function globalSetup(config) {
    console.log('🚀 Setting up Playwright test environment...');
    try {
        // Install Playwright browsers
        console.log('Installing Playwright browsers...');
        await execAsync('npx playwright install chromium firefox webkit');
        // Start test database if needed
        console.log('Starting test database...');
        // await execAsync('docker-compose -f docker-compose.test.yml up -d postgres redis');
        // Run database migrations
        console.log('Running database migrations...');
        // await execAsync('npm run migrate:test');
        console.log('✅ Playwright test environment ready');
    }
    catch (error) {
        console.error('❌ Failed to setup test environment:', error);
        process.exit(1);
    }
}
async function globalTeardown(config) {
    console.log('🧹 Cleaning up Playwright test environment...');
    try {
        // Stop test database
        console.log('Stopping test database...');
        // await execAsync('docker-compose -f docker-compose.test.yml down');
        console.log('✅ Playwright test environment cleaned up');
    }
    catch (error) {
        console.error('❌ Failed to cleanup test environment:', error);
    }
}
exports.default = globalSetup;
//# sourceMappingURL=global-setup.js.map