/**
 * E2E Test Demo
 * Demonstrates the E2E server setup working with Playwright
 */

const { testServerManager } = require('./tests/e2e/test-server-manager');
const { chromium } = require('playwright');

async function runE2EDemo() {
  console.log('🎭 Running E2E Test Demo...');
  
  let browser;
  let page;
  
  try {
    // Start the test server
    console.log('1️⃣ Starting test server...');
    await testServerManager.start();
    
    // Launch browser
    console.log('2️⃣ Launching browser...');
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();
    
    // Test server health endpoint
    console.log('3️⃣ Testing server health endpoint...');
    const healthResponse = await page.goto('http://localhost:8080/health');
    console.log(`Health status: ${healthResponse.status()}`);
    
    // Test main page
    console.log('4️⃣ Testing main page...');
    const mainResponse = await page.goto('http://localhost:8080');
    console.log(`Main page status: ${mainResponse.status()}`);
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot for verification
    console.log('5️⃣ Taking screenshot...');
    await page.screenshot({ path: 'e2e-demo-screenshot.png' });
    
    console.log('✅ E2E Test Demo Completed Successfully!');
    console.log('📸 Screenshot saved as e2e-demo-screenshot.png');
    
  } catch (error) {
    console.error('❌ E2E Test Demo Failed:', error);
    throw error;
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    
    console.log('6️⃣ Stopping test server...');
    await testServerManager.stop();
  }
}

// Run the demo
runE2EDemo();
