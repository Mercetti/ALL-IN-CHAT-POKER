module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapping: {
    '^express$': '<rootDir>/node_modules/express',
  },
};
