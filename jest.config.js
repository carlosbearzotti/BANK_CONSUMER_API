module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/js/test-setup.js'],
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  moduleFileExtensions: ['js', 'json']
};
