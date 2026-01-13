/* eslint-env node, jest */
const path = require('path');
const dotenv = require('dotenv');

// Load .env so tests have DB paths, secrets, etc.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Mock fetch globally for endpoints that rely on it
if (!global.fetch) {
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({}),
    text: async () => '',
    status: 200,
  }));
}

// Set up global test environment
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: process.env.VERBOSE_TESTS ? console.log : jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

afterEach(() => {
  jest.clearAllMocks();
});
