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

afterEach(() => {
  jest.clearAllMocks();
});
