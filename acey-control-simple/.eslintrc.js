module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    'react-native/react-native': true,
  },
  extends: [
    'eslint:recommended',
    '@react-native-community',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
  },
  plugins: [
    'react',
    'react-native',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'off',
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
    process: 'writable',
    global: 'writable'
  }
};