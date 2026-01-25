/**
 * Optimized Jest Configuration
 * Performance-focused configuration for faster test execution
 */

module.exports = {
  "maxWorkers": "50%",
  "testTimeout": 10000,
  "verbose": false,
  "collectCoverage": false,
  "collectCoverageFrom": [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/*.stories.{js,jsx}",
    "!src/**/index.{js,jsx}"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "testMatch": [
    "**/__tests__/**/*.(js|jsx)",
    "**/*.(test|spec).(js|jsx)",
    "!test/**/*.(test|spec).js"
  ],
  "modulePathIgnorePatterns": [
    "<rootDir>/build/"
  ],
  "transformIgnorePatterns": [
    "node_modules/(?!(module-to-transform|@exodus/bytes|parse5|jsdom)/)"
  ],
  "moduleNameMapping": {
    "^@exodus/bytes$": "<rootDir>/node_modules/@exodus/bytes/lib/index.js"
  },
  "setupFilesAfterEnv": [
    "<rootDir>/tests/jest-setup.js"
  ],
  "testEnvironment": "node",
  "clearMocks": true,
  "resetMocks": true,
  "restoreMocks": true
};
