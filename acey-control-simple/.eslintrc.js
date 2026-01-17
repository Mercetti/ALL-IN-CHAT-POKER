const config = {
  root: true,
  extends: ['@react-native-community'],
  parser: 'babel-eslint',
  plugins: ['@react-native-community'],
  env: {
    'react-native/react-native': true,
    jest: true,
    es6: true,
    node: true,
    browser: true
  },
  globals: {
    console: 'writable',
    require: 'writable',
    __dirname: 'readonly',
    setTimeout: 'readonly',
    alert: 'readonly',
    Device: 'readonly',
    jest: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    describe: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    module: 'writable',
    process: 'writable'
  },
  rules: {
    'react-native/no-unused-styles': 'error',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn'
  }
};

module.exports = config;
