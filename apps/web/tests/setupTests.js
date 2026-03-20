import '@testing-library/jest-dom';

// Apollo Client 3.14.0 internally passes removed options (canonizeResults,
// addTypename) to cache internals inside MockedProvider, producing noisy message-104
// framework deprecation warnings not caused by application code. MockedProvider
// also calls console.error when a mock's `error:` property fires during intentional
// error-state tests. Match the Apollo error CDN URL combined with the specific
// message code 104 (the "removed option" deprecation class) so the filter is
// tight and does not suppress unrelated Apollo errors (e.g. message 13 = missing
// field, which should surface as a real test failure signal).
// Message 49 is the MockLink `onError` deprecation warning — also framework noise.
const apolloNoise = (...args) =>
  typeof args[0] === 'string' &&
  args[0].includes('go.apollo.dev/c/err') &&
  (args[0].includes('%22message%22%3A104') || args[0].includes('%22message%22%3A49'));

const originalWarn = console.warn;
const originalError = console.error;
beforeAll(() => {
  console.warn = (...args) => {
    if (apolloNoise(...args)) return;
    originalWarn.apply(console, args);
  };
  console.error = (...args) => {
    if (apolloNoise(...args)) return;
    originalError.apply(console, args);
  };
});
afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
