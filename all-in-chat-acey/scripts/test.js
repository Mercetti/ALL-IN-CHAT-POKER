#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

// Test scripts configuration
const scripts = {
  'test:unit': 'jest --testPathPattern=tests/unit --coverage',
  'test:integration': 'jest --testPathPattern=tests/integration --coverage',
  'test:e2e': 'playwright test',
  'test:all': 'jest --coverage && playwright test',
  'test:watch': 'jest --watch',
  'test:ci': 'jest --coverage --ci --reporters=default --reporters=junit --coverageReporters=text --coverageReporters=lcov',
  'test:server': 'node tests/server.js',
  'test:setup': 'node tests/setup.js',
  'test:teardown': 'node tests/teardown.js',
};

// Run the specified script
const scriptName = process.argv[2];
const script = scripts[scriptName];

if (!script) {
  console.error('Available test scripts:');
  Object.keys(scripts).forEach(name => {
    console.log(`  npm run ${name}`);
  });
  process.exit(1);
}

console.log(`Running: ${script}`);
const child = exec(script, {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Error running test script:', error);
  process.exit(1);
});
