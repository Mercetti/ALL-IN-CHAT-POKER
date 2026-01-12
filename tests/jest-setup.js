const express = require('express');

jest.mock('../server/routes/public', () => ({
  createPublicRouter: jest.fn(() => express.Router()),
}));

jest.mock('../server/routes/partners', () => ({
  createPartnersRouter: jest.fn(() => express.Router()),
}));

jest.mock('../server/routes/catalog', () => ({
  createCatalogRouter: jest.fn(() => express.Router()),
}));

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
  resetMocks: false,
  restoreMocks: false,
  globals: {
    express: true,
    jest: true,
    describe: true,
    it: true,
    expect: true,
    beforeAll: true,
    afterAll: true,
    beforeEach: true,
    afterEach: true,
    console: true,
    window: true,
    document: true,
    navigator: true,
  },
  transformIgnorePatterns: [
    'node_modules/(?!express)/',
  ],
};
