module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/config.js',
    'src/cache/**/*.js',
    'src/errors/**/*.js',
    'src/graphql/resolvers.js',
    'src/upstream/**/*.js',
    'src/utils/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  }
};
