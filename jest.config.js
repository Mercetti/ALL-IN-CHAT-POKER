module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
  resetMocks: false,
  restoreMocks: false,
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/test/'],
  testTimeout: 30000, // Increase default test timeout to 30 seconds
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
    require: true,
    module: true,
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!express|@exodus/bytes|jsdom|whatwg-url|tr46|webidl-conversions|html-encoding-sniffer|data-urls)/',
  ],
  modulePathIgnorePatterns: [
    'node_modules/(?!(express))',
    'server/routes/.*\\.ts', // Ignore all TypeScript files in routes
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
