/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: ['@react-native-community'],
  rules: {
    'no-undef': 'off',
    'no-unused-vars': 'warn',
  }
};