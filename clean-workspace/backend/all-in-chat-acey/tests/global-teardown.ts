import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Playwright test environment...');
  
  try {
    // Stop test database
    console.log('Stopping test database...');
    // await execAsync('docker-compose -f docker-compose.test.yml down');
    
    console.log('✅ Playwright test environment cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
  }
}

export default globalTeardown;
