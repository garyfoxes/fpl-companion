---
name: graphql-change
description: End-to-end procedure for adding or modifying a GraphQL type, query, or mutation across the full stack.
---

# GraphQL Change Skill

## Overview

End-to-end procedure for adding or modifying GraphQL types, queries, or mutations across the full stack. Refer to **AGENTS.md** for the architecture rules, error contract, and guardrails — do not duplicate them here.

## When to Use

- Adding a new GraphQL type, query, or mutation.
- Modifying an existing type's fields, arguments, or return shape.
- Adding a new upstream entity that needs schema-through-frontend wiring.
- The **triage** agent identified GraphQL touch points in the plan.

## When NOT to Use

- Frontend-only changes that consume existing queries without modifying them.
- API changes that don't touch the GraphQL schema (e.g. cache tuning, config).
- Writing tests for existing GraphQL behavior (use `jest-test-writer` instead).

## Process

Work through these files **in order**. Skip any step that doesn't apply to the change.

### 1. Schema (`apps/api/src/graphql/schema.js`)

- Add/update type definitions, query fields, or input types.
- Keep naming consistent with existing types (PascalCase types, camelCase fields).

### 2. Resolvers (`apps/api/src/graphql/resolvers.js`)

- Wire query/mutation to the data source.
- Return data through existing filter/paginate/sort helpers in `apps/api/src/utils/` where applicable.
- Ensure every error thrown or forwarded includes `extensions.code` per the error contract in AGENTS.md.
- For resolvers that accept a list argument (e.g. `ids: [Int!]!`): **de-duplicate** and **cap** before issuing any upstream calls. Exceed-limit must throw a `GraphQLError` with `extensions.code: 'BAD_USER_INPUT'` and return before I/O. Example:

  ```javascript
  const MAX = 10;
  const ids = [...new Set(args.ids)];
  if (ids.length > MAX) {
    throw new GraphQLError(`Accepts at most ${MAX} IDs`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  ```

### 3. Upstream Data Source (`apps/api/src/upstream/fplDataSource.js`)

- Add or adjust fetch methods for the new data.
- Map upstream HTTP errors to the correct error classes in `apps/api/src/errors/upstreamErrors.js`.
- For a **new entity**, also update steps 3a and 3b below before touching the data source.

#### 3a. Entity Descriptor (`apps/api/src/upstream/entityDescriptors.js`) — new entities only

Add an entry to `ENTITY_DESCRIPTORS` with `list` and `item` configs:

```javascript
myEntity: {
  list: {
    cacheKey: 'myentity:list',
    ttlKey: 'myEntity',       // must match a key in the TTL config
    endpoint: '/api/myentity',
    mapper: mapMyEntity,      // imported from mappers.js
    payloadKey: 'myEntity',   // key used to look up the array in the upstream response
  },
  item: {
    cacheKeyPrefix: 'myentity:',
    ttlKey: 'myEntity',
    endpoint: (id) => `/api/myentity/${id}`,
    mapper: mapMyEntity,
    payloadKey: 'myEntity',
  },
},
```

The `getListConfig(entity, ttl)` and `getItemConfig(entity, id, ttl)` helpers validate the key at runtime and will throw if the entity name is not registered.

#### 3b. Payload Extractor (`apps/api/src/upstream/payloadExtractors.js`) — new entities only

Add the entity's key candidates to the `keyCandidates` map inside `extractList`. If the upstream API uses a different field name than the entity name (like `players` → also `elements`), list both:

```javascript
const keyCandidates = {
  players: ['players', 'elements'],
  teams: ['teams'],
  fixtures: ['fixtures'],
  events: ['events'],
  myEntity: ['myEntity'], // add here
}[key] || [key];
```

If the upstream always uses the same key name, the `|| [key]` fallback handles it automatically and no change is needed.

### 4. Mappers (`apps/api/src/upstream/mappers.js`)

- Normalize upstream fields before they reach resolvers.
- Individual mapper functions must return `null` for records with missing required fields.
- `mapArray` must silently drop `null` entries (partial valid data).
- Use `asNumber()`, `asString()`, `asBoolean()` helpers for safe null/undefined coercion — never access upstream fields directly.
- ICT Index, xG, and influence fields are **decimal strings** upstream — use `asString()`, not `asNumber()`.

### 5. Client Queries (`apps/web/src/lib/queries.js`)

- Add or update the `gql` query/mutation document to match the new schema.
- Request only the fields the UI needs.

### 6. Page / Component (`apps/web/src/pages/` or `apps/web/src/components/`)

- Consume the query via Apollo `useQuery` / `useMutation`.
- Handle loading, error, and empty states (see `PageState.jsx` for the shared pattern).
- Preserve URL-filter persistence if the page uses query-string state.

#### URL state conventions (applies to any page with filters or item selection)

Use the helpers from `apps/web/src/utils/urlState.js`:

```javascript
const [searchParams, setSearchParams] = useSearchParams();
const selectedId = readIntParam(searchParams, 'selected');
const teamId = readIntParam(searchParams, 'teamId'); // or readBooleanParam / getParam
```

Key rules:

- **Filter changes must clear `selected`**: use `setParam` twice, or build the new params object before calling `setSearchParams`.
- **Always pass `{ replace: true }`** to `setSearchParams` to avoid polluting browser history.
- **Skip the detail query when nothing is selected**: `useQuery(DETAIL_QUERY, { skip: !selectedId })`.
- Combine loading/error across all queries: `const loading = q1.loading || q2.loading`.
- `setParam(searchParams, key, null)` deletes the key from the URL — use this to clear a filter.

### 7. Tests

- **API** (see `jest-test-writer` skill):
  - Resolver test covering happy path + error codes.
  - Mapper test covering normalization + invalid payloads.
  - Data source test if a new fetch method was added.
- **Web** (see `jest-test-writer` skill):
  - Component test covering loading/error/empty states.
- **E2E**: Update Playwright smoke if a new route or critical user flow was added.

### 8. Verification

Run the `ci-validation` skill's verification sequence before finishing.

## Error Contract Quick Reference

All GraphQL errors must use `extensions.code`. Upstream mapping:

| Upstream Failure                  | `extensions.code`       |
| --------------------------------- | ----------------------- |
| Timeout                           | `UPSTREAM_TIMEOUT`      |
| Connectivity / downstream failure | `UPSTREAM_UNAVAILABLE`  |
| Invalid payload                   | `BAD_UPSTREAM_RESPONSE` |

Details live in the **GraphQL And Error Contract** section of AGENTS.md.

## Common Rationalizations

- "I'll add the frontend later" — If the schema change is user-facing, the query document and component update should ship together.
- "The mapper is trivial, I'll skip the test" — Mapper tests catch upstream payload drift. Always test normalization and null handling.
- "I don't need to update the entity descriptor for this" — If you're adding a new entity, missing the descriptor causes runtime failures that only appear on first fetch.

## Red Flags

- Schema field added but no resolver wired → GraphQL returns `null` silently.
- Resolver calls datasource without error mapping → unhandled upstream errors leak raw messages.
- New query variable added but existing Apollo mocks not updated → Jest tests hang (see `jest-test-writer` skill).
- Playwright fixture objects missing new fields → smoke tests pass but don't cover the new data.

## Verification

- [ ] Schema, resolver, datasource, mapper, query document, and component are consistent.
- [ ] Every new error path includes `extensions.code`.
- [ ] Jest tests cover happy path + error codes.
- [ ] Mapper tests cover normalization + null/missing fields.
- [ ] Playwright smoke test updated if a new route or query was added.
- [ ] `README.md` GraphQL Query Surface updated if the public API changed.
- [ ] Full `ci-validation` sequence passes.
