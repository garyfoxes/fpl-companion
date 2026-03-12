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

### URL-filter persistence tests (`urlState.test.js`)

- Test that `syncFiltersToUrl` / `readFiltersFromUrl` round-trip correctly.
- Test missing/malformed query params default gracefully.

## Running Tests

Use the `ci-validation` skill for the full verification sequence. For quick iteration:

```sh
# Single workspace
npm run test --workspace apps/api
npm run test --workspace apps/web

# Single file
npx jest --config apps/api/jest.config.cjs apps/api/tests/mappers.test.js
```
