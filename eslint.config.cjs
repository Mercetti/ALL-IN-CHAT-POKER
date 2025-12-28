const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'public/**',
      'bot/**',
      'electron/**',
      'data/**',
      'scripts/**',
      'server.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['server/**/*.js', 'test/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-redeclare': 'off',
      'no-undef': 'off',
      'no-const-assign': 'off',
    },
  },
];
