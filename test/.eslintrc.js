module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    node: true,
    es2021: true
  },
  rules: {
    'brace-style': ['error', 'stroustrup', {
      allowSingleLine: true
    }],
    // "semi": ['warn', 'always', {
    //   omitLastInOneLineBlock: true
    // }],
    "max-len": ['error', {
      code: 80, tabWidth: 2, ignoreUrls: false, ignoreStrings: false,
      ignoreTemplateLiterals: false, ignoreRegExpLiterals: false
    }],
    'indent': 'off',
    '@typescript-eslint/indent': ['warn', 2],
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off'
  }
};