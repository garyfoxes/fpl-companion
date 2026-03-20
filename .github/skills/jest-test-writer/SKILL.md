---
name: jest-test-writer
description: Patterns and conventions for writing Jest tests in this repo (API + Web).
---

# Jest Test Writer Skill

Use this skill when adding or updating Jest tests. Refer to **AGENTS.md → Testing Expectations** for required coverage areas — this skill provides the _how_.

## General Conventions

- Test files live in the `tests/` directory of each workspace (`apps/api/tests/`, `apps/web/tests/`).
- Name test files `<subject>.test.js` (API) or `<subject>.test.jsx` (Web).
- Use `describe` / `it` blocks. Keep descriptions concise and behavior-focused.
- Each test should be independent — no shared mutable state between `it` blocks.
- Mock external boundaries (fetch, data sources), not internal helpers.

## API Test Patterns (`apps/api/tests/`)

### Resolver tests (`resolvers.test.js`)

- Create a mock `dataSources` object that stubs the methods called by the resolver.
- Call the resolver function directly with `(parent, args, { dataSources })`.
- Assert return shape matches the GraphQL type.
- Assert that upstream errors surface with correct `extensions.code`.

### Mapper tests (`mappers.test.js`)

- Test each mapper function with a valid upstream payload → assert normalized output fields.
- Test with missing/null required fields → assert the mapper returns `null`.
- Test `mapArray` with a mix of valid and invalid items → assert invalid items are silently dropped.

### Data source tests (`fplDataSource.test.js`)

- Mock `fetch` (or the HTTP layer) to return canned responses.
- Test happy path: correct URL called, response mapped.
- Test error paths: timeout → `UpstreamTimeoutError`, network failure → `UpstreamUnavailableError`, bad JSON → `BadUpstreamResponseError`.

### Filter / Paginate / Sort tests

- See existing tests in `filterAndPaginate.test.js` and `sort.test.js` as templates.
- Test edge cases: empty arrays, out-of-range pagination, missing filter args.

## Web Test Patterns (`apps/web/tests/`)

### Setup

- `setupTests.js` bootstraps `@testing-library/jest-dom`.
- `testUtils.jsx` provides a `renderWithProviders` wrapper (Apollo MockedProvider + MemoryRouter). Use it for every component test.

### Component / Page tests

- **Loading state**: Mock a query that hasn't resolved → assert a loading indicator appears.
- **Error state**: Mock a query that returns a `GraphQLError` → assert the error alert renders.
- **Empty state**: Mock a query that returns an empty list → assert an appropriate empty message.
- **Happy path**: Mock a query with representative data → assert key data renders in the DOM.

### Apollo MockedProvider variable matching

Apollo's `MockedProvider` performs **exact deep equality** on `variables`. Every variable the component sends — including optional ones that resolve to `null` — must be present in the mock's `request.variables`. Missing or extra keys cause the mock to silently not fire, leaving the component stuck in loading state.

- When a query gains a new optional variable (e.g. `orderBy`), update **every existing mock** for that query to include the new key, even when its value is `null`.
- When writing a new mock, inspect the component's `useQuery` call directly to enumerate all variables it sends.
- If tests hang on `findByText` with no error, the first thing to check is a variable mismatch in the mock.

```javascript
// BAD — missing orderBy — mock will never fire after orderBy was added to PLAYERS_QUERY
{ request: { query: PLAYERS_QUERY, variables: { search: null, teamId: null, limit: 200, offset: 0 } } }

// GOOD
{ request: { query: PLAYERS_QUERY, variables: { search: null, teamId: null, orderBy: null, limit: 200, offset: 0 } } }
```

### URL-filter persistence tests (`urlState.test.js`)

- Test that `syncFiltersToUrl` / `readFiltersFromUrl` round-trip correctly.
- Test missing/malformed query params default gracefully.

## Test Environment Hygiene

- **Always run `npm run test` from the repo root** when checking for noise — this runs both `apps/api` and `apps/web`. Never scope to a single workspace to verify hygiene; warnings in the other workspace will be missed.
- **`console.warn` and `console.error` noise must be addressed**, not ignored. A clean test run should produce no unexpected output so that real problems are visible.
- If a framework (e.g. Apollo, MUI) emits warns or errors not caused by application code — suppress them with a targeted filter in `apps/web/tests/setupTests.js` using `beforeAll`/`afterAll`. The filter must match a unique string from that specific message (e.g. the Apollo error CDN URL `go.apollo.dev/c/err`) so it does not silence unrelated output. Apply the same filter to both `console.warn` and `console.error` when the framework uses both channels.
- Note: Apollo's `MockedProvider` calls `console.error` when a mock's `error:` property fires (i.e. in intentional error-state tests). This is also covered by the Apollo CDN URL filter.
- Never use a blanket `jest.spyOn(console, 'error').mockImplementation(() => {})` without a guard condition — that hides real problems.
- When a framework patch resolves the underlying issue, remove the suppression.

## Running Tests

Use the `ci-validation` skill for the full verification sequence. For quick iteration:

```sh
# Single workspace
npm run test --workspace apps/api
npm run test --workspace apps/web

# Single file
npx jest --config apps/api/jest.config.cjs apps/api/tests/mappers.test.js
```
