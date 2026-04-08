---
name: playwright-smoke
description: Patterns and conventions for writing and updating Playwright smoke tests in this repo.
---

# Playwright Smoke Skill

## Overview

Patterns and conventions for writing and updating Playwright smoke tests under `apps/web/e2e/`. All smoke tests run against a fully mocked GraphQL layer — no real API is started. Refer to **AGENTS.md → Testing Expectations** for when smoke tests are required.

Think of this as the "critical route still works" skill. It is intentionally narrower than full end-to-end testing and focuses on user-visible route confidence with mocked data.

## Use With

- `graphql-change` — when a contract change affects rendered data or route behavior.
- `jest-test-writer` — when route-level smoke coverage should be complemented by component-level tests.
- `ci-validation` — for the final smoke run.
- `performance-optimization` — when route loading, query shape, or perceived loading behavior changes.

## When to Use

- Adding a new page/route to the frontend.
- Adding a new GraphQL query consumed by an existing page.
- Changing the GraphQL schema in a way that affects rendered data.
- The **triage** agent identified Playwright smoke updates in the test plan.

## When NOT to Use

- API-only changes with no frontend impact.
- Adding Jest unit/component tests (use `jest-test-writer` skill).
- The change doesn't add a new route or modify a critical user flow.

## Process

Follow the single-file smoke test structure below rather than inventing a new test harness.

All smoke tests run against a fully mocked GraphQL layer — no real API is started. The mock is defined in a single file:

```
apps/web/e2e/smoke.spec.js
```

Structure:

1. **Fixture objects** at the top — one array per entity (`players`, `teams`, `fixtures`, `events`). Every field requested in the corresponding GraphQL query must be present.
2. **`responseFor(operationName, variables)`** — a dispatcher that returns the correct mock response for each Apollo operation name.
3. **`test.beforeEach`** — intercepts all `**/graphql` requests via `page.route()` and delegates to `responseFor`.
4. **Individual tests** — navigate to routes and assert UI state.

## Adding a New Entity

### Step 1 — Add fixture data

Add a fixture array at the top of the file. Every field in the corresponding `ENTITY_QUERY` and `ENTITIES_QUERY` in `apps/web/src/lib/queries.js` must be present in each fixture object — missing fields silently become `undefined` in test assertions.

```javascript
const myEntities = [{ id: 1, name: 'Example' /* ...all queried fields */ }];
```

### Step 2 — Wire into `responseFor`

Add a `case` for each Apollo operation name that the new page uses. Operation names are the string after the `query` keyword in `apps/web/src/lib/queries.js`.

```javascript
case 'MyEntities':
  return { data: { myEntities } };
case 'MyEntity':
  return {
    data: {
      myEntity: myEntities.find((e) => e.id === variables.id) || null,
    },
  };
```

If a query supports filtering by a variable (e.g. `eventId`), replicate that filter in the `case` body so search/filter smoke tests work correctly. See the `'Players'` and `'Fixtures'` cases as templates.

### Step 3 — Write the tests

Each new page needs at minimum:

- A **list render** test: navigate to the route, assert the heading and at least one table column header.
- A **detail view** test: click a row (or navigate to `?selected=<id>`), assert the detail panel title.

```javascript
test('my entities list @smoke', async ({ page }) => {
  await page.goto('/my-entities');
  await expect(page.getByRole('heading', { name: 'My Entities' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
});

test('my entity detail panel @smoke', async ({ page }) => {
  await page.goto('/my-entities?selected=1');
  await expect(page.getByText('My entity details: Example')).toBeVisible();
});
```

Tag every test with `@smoke` in the name — the CI command filters on this tag.

## Updating Fixture Objects After a Schema Change

When new fields are added to a GraphQL type:

1. Add the new fields to **every object** in the relevant fixture array (even if the value is `null`).
2. If the new field is rendered in the list table, add an assertion for its column header.
3. If the new field is rendered in the detail panel, add an assertion for its label text.

Omitting fields from fixture objects doesn't cause test failures immediately — it causes silent `undefined` values that may mask regressions.

## Adding a New Query to an Existing Page

When a new GraphQL query is added to an existing page (not a whole new entity), `responseFor` needs a new `case` for that operation name. This is easy to miss because the existing page tests don't break — the new query just silently returns `{ data: {} }`.

Example: adding `playersByIds` for a comparison panel on the Players page:

```javascript
case 'PlayersByIds':
  return {
    data: {
      playersByIds: players.filter((p) => (variables?.ids || []).includes(p.id)),
    },
  };
```

Check `apps/web/src/lib/queries.js` for the operation name (the string after `query`) and ensure a matching `case` exists in `responseFor` before writing smoke assertions that depend on it.

## API-Down Error State

One global error state test covers all routes. It lives at the bottom of `smoke.spec.js`:

```javascript
test('api-down error state @smoke', async ({ page }) => {
  await page.unroute('**/graphql');
  await page.route('**/graphql', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ errors: [{ message: 'upstream down' }] }),
    });
  });
  await page.goto('/events');
  await expect(page.getByRole('alert')).toContainText('Unable to load data');
});
```

Do not add duplicate API-down tests per route — the `PageState` component handles the error state uniformly.

## Selectors

Prefer role-based and label-based selectors in this order:

1. `page.getByRole('heading', { name: '...' })`
2. `page.getByRole('columnheader', { name: '...' })`
3. `page.getByRole('cell', { name: '...' })`
4. `page.getByLabel('...')`
5. `page.getByText('...')` — use `{ exact: true }` when the string might appear as a substring elsewhere

Avoid `page.locator('.css-class')` and `page.locator('[data-testid]')` — they couple tests to implementation details.

## Running Smoke Tests

```sh
# From repo root
npm run test:e2e:smoke

# With UI (headed, useful for debugging)
npx playwright test --config apps/web/playwright.config.js --headed
```

Run against the production build (`npm run preview`, port 4173), not the dev server — see `playwright.config.js` for the configured base URL.

## Common Rationalizations

- "The existing page tests still pass, so adding the new query's mock case can wait" — The test passes because the query silently returns `{ data: {} }`. The new feature is untested.
- "I'll use `data-testid` for this one element" — Prefer role/label selectors. Test IDs couple tests to implementation.
- "I'll add a per-route API-down test for thoroughness" — One global test already covers this. Duplicates increase maintenance without coverage gain.

## Red Flags

- Fixture objects that don't include every field from the corresponding GraphQL query document.
- A new `case` in `responseFor` with no corresponding test assertions.
- Tests that don't tag `@smoke` in the name — CI filters on this tag.
- Smoke tests that depend on the dev server instead of the production build.

## Verification

- [ ] Every new page has at minimum a list render test and a detail view test.
- [ ] Every new GraphQL query has a matching `case` in `responseFor`.
- [ ] Fixture objects include all fields from the query document in `apps/web/src/lib/queries.js`.
- [ ] All tests include `@smoke` in the test name.
- [ ] `npm run test:e2e:smoke` passes.
