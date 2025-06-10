module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  rules: {
    // Relaxed rules for existing codebase
    'no-console': 'off', // Allow console statements in scripts
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-duplicate-imports': 'error',
    
    // TypeScript rules - more lenient
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    
    // Disable problematic rules for now
    'no-unused-vars': 'off', // Let TypeScript handle this
    'no-undef': 'off' // TypeScript handles this better
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    '*.js',
    '*.config.js',
    'jest.config.js',
    '.eslintrc.js'
  ]
}; 