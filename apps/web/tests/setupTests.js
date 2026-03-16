import '@testing-library/jest-dom';

// Apollo Client 3.14.0 internally passes the removed `canonizeResults` option to
// cache.diff inside MockedProvider, producing noisy framework warns/errors that
// are not caused by application code. MockedProvider also calls console.error
// when a mock's `error:` property fires during intentional error-state tests.
// Suppress only messages that originate from the Apollo error CDN so real
// application warnings and errors still surface.
const apolloNoise = (...args) =>
  typeof args[0] === 'string' && args[0].includes('go.apollo.dev/c/err');

const originalWarn = console.warn;
const originalError = console.error;
beforeAll(() => {
  console.warn = (...args) => {
    if (apolloNoise(...args)) return;
    originalWarn(...args);
  };
  console.error = (...args) => {
    if (apolloNoise(...args)) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
