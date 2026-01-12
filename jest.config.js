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
  modulePathIgnorePatterns: [
    'node_modules/(?!(express))',
  ],
};
