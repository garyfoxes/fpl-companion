import '@testing-library/jest-dom';

// Apollo Client 3.14.0 internally passes the removed `canonizeResults` option to
// cache.diff inside MockedProvider, producing noisy framework warns that are not
// caused by application code. Suppress only that specific warn so real warnings
// still surface.
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('go.apollo.dev/c/err')) {
      return;
    }
    originalWarn(...args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
});
