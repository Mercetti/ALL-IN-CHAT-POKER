module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['src/main.js', 'src/preload.js'],
      env: {
        browser: false,
        node: true,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
    {
      files: ['vite.config.js'],
      env: {
        browser: false,
        node: true,
      },
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
