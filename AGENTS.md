# AGENTS.md

This file defines implementation and review guardrails for agents working in this repository.

## Project Goal

Deliver and maintain a read-only, user-friendly Fantasy Premier League data browser.

## Core Scope (MVP)

- Players browsing and detail retrieval.
- Teams browsing and detail retrieval.
- Fixtures browsing with filtering.
- Events/Gameweeks browsing and detail retrieval.

Out of scope for MVP:

- Authentication and authorization.
- Squad optimization, transfer recommendations, live rank projections.
- Persistent relational storage.

## Architecture Rules

- Keep a strict boundary: `apps/web` only consumes GraphQL from `apps/api`.
- Keep upstream-specific data shape handling inside `apps/api/src/upstream/`.
- Normalize API response fields in mappers before exposing data to frontend.
- Preserve stateless API behavior; cache is TTL-based and replaceable.

## Coding Conventions

- Language: JavaScript (with clear naming and modular structure).
- Keep functions focused and side effects explicit.
- Avoid hidden mutations and avoid broad catch blocks without rethrow/mapping.
- Prefer small, composable helpers for filtering/pagination/state parsing.
- Keep UI responsive and accessible (labels, semantic table headings, alerts).

## GraphQL And Error Contract

- GraphQL errors must include machine-readable codes in `extensions.code`.
- Upstream mapping:
  - Timeout -> `UPSTREAM_TIMEOUT`
  - Connectivity/downstream failure -> `UPSTREAM_UNAVAILABLE`
  - Invalid payload -> `BAD_UPSTREAM_RESPONSE`
- Return partial valid data where possible by dropping malformed records.

## Testing Expectations

Before submitting work, validate:

1. `npm run format`
2. `npm run lint`
3. `npm run test`
4. `npm run test:e2e:smoke`

CI uses `npm ci` (not `npm install`) for reproducible builds.

Required test coverage:

- API resolvers and datasource behavior.
- Mapper normalization and invalid payload handling.
- Frontend loading/error/empty states.
- Route/page smoke and URL-filter persistence.
- API-down handling in browser smoke tests.

## PR Requirements

Follow `.github/pull_request_template.md` and include:

- Problem statement and summary.
- Test evidence.
- Risks and rollback notes.
- Screenshots for UI-impacting changes.

## Guardrails

- Do not introduce DB dependencies in MVP unless explicitly requested.
- Do not bypass the GraphQL BFF by calling upstream API directly from the web app.
- Do not change public GraphQL field names without coordinated frontend updates and tests.
- Keep docs current when scripts, env vars, or architecture change.
