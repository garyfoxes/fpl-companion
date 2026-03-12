---
name: graphql-change
description: End-to-end procedure for adding or modifying a GraphQL type, query, or mutation across the full stack.
---

# GraphQL Change Skill

Use this skill whenever a task adds, modifies, or removes GraphQL types, queries, or mutations.
Refer to **AGENTS.md** for the architecture rules, error contract, and guardrails — do not duplicate them here.

## Touch-Point Checklist

Work through these files **in order**. Skip any step that doesn't apply to the change.

### 1. Schema (`apps/api/src/graphql/schema.js`)

- Add/update type definitions, query fields, or input types.
- Keep naming consistent with existing types (PascalCase types, camelCase fields).

### 2. Resolvers (`apps/api/src/graphql/resolvers.js`)

- Wire query/mutation to the data source.
- Return data through existing filter/paginate/sort helpers in `apps/api/src/utils/` where applicable.
- Ensure every error thrown or forwarded includes `extensions.code` per the error contract in AGENTS.md.

### 3. Upstream Data Source (`apps/api/src/upstream/fplDataSource.js`)

- Add or adjust fetch methods for the new data.
- Map upstream HTTP errors to the correct error classes in `apps/api/src/errors/upstreamErrors.js`.

### 4. Mappers (`apps/api/src/upstream/mappers.js`)

- Normalize upstream fields before they reach resolvers.
- Individual mapper functions must return `null` for records with missing required fields.
- `mapArray` must silently drop `null` entries (partial valid data).

### 5. Client Queries (`apps/web/src/lib/queries.js`)

- Add or update the `gql` query/mutation document to match the new schema.
- Request only the fields the UI needs.

### 6. Page / Component (`apps/web/src/pages/` or `apps/web/src/components/`)

- Consume the query via Apollo `useQuery` / `useMutation`.
- Handle loading, error, and empty states (see `PageState.jsx` for the shared pattern).
- Preserve URL-filter persistence if the page uses query-string state.

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
