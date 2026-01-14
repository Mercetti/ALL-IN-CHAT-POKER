module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    'import',
    'promise',
    'security'
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
      }
    }
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-void': 'error',
    'no-with': 'error',
    'no-delete-var': 'error',
    'no-global-assign': 'error',
    'no-unused-labels': 'error',
    'no-unused-private-class-members': 'error',
    'no-constant-condition': 'error',
    'no-dupe-args': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-imports': 'error',
    'no-empty': 'warn',
    'no-empty-function': 'warn',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-parens': 'warn',
    'no-extra-semi': 'error',
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-lone-blocks': 'error',
    'no-loop-func': 'error',
    'no-magic-numbers': 'warn',
    'no-mixed-operators': 'warn',
    'no-mixed-spaces-and-tabs': 'error',
    'no-multi-assign': 'warn',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-negated-in-lhs': 'error',
    'no-nested-ternary': 'warn',
    'no-new': 'warn',
    'no-new-object': 'error',
    'no-new-wrappers': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'warn',
    'no-proto': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': 'warn',
    'no-unused-expressions': 'error',
    'no-unused-vars': 'warn',
    'no-use-before-define': 'warn',
    'no-useless-computed-key': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'prefer-const': 'error',
    'prefer-promise-reject-errors': 'error',
    'radix': 'error',
    'require-await': 'error',
    'require-yield': 'error',
    'yoda': 'error'
  },
  overrides: [
    {
      files: ['*.tsx'],
      rules: {
        'react/prop-types': 'off'
      }
    }
  ]
};
