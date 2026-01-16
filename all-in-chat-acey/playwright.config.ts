import { config } from '@playwright/test';

export default config({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...config.devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...config.devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...config.devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...config.devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...config.devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run test:server',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});
