jest.mock('../server/routes/public', () => {
  const express = require('express');
  return {
    createPublicRouter: jest.fn(() => express.Router()),
  };
});

jest.mock('../server/routes/partners', () => {
  const express = require('express');
  return {
    createPartnersRouter: jest.fn(() => express.Router()),
  };
});

jest.mock('../server/routes/catalog', () => {
  const express = require('express');
  return {
    createCatalogRouter: jest.fn(() => express.Router()),
  };
});

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
