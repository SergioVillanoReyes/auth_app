module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'indent': ['error', 2],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'jsx-quotes': ['error', 'prefer-double'],
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
