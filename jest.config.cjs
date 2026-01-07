/* eslint-env node */
const path = require('path');

module.exports = {
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: [path.join(__dirname, 'tests', 'setup', 'jest.setup.js')],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
  collectCoverageFrom: ['server.js', 'server/**/*.js'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 30000
};
