/* Auditoria Fase A: ESLint config reforçada */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: undefined },
  plugins: ['@typescript-eslint','jsx-a11y','import','react-refresh'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', disallowTypeAnnotations: false }],
    'import/order': ['error', { 'newlines-between':'always', alphabetize:{order:'asc', caseInsensitive:true}, groups:['builtin','external','internal','parent','sibling','index'] }],
    'no-console': ['warn', { allow: ['error','warn'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  settings: {
    'import/resolver': {
      typescript: {},
      node: { extensions: ['.js','.ts','.tsx'] }
    }
  }
};
