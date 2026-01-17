"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
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
exports.default = globalTeardown;
//# sourceMappingURL=global-teardown.js.map