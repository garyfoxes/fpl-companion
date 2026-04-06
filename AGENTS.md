# AGENTS.md

> **Start with [`AGENT_BOOTSTRAP.md`](AGENT_BOOTSTRAP.md)** — it covers read order, skill selection, scope discipline, and the sub-agent pipeline. This file defines the repo-specific rules that bootstrap references.

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

## Repo Layout

- Monorepo managed with npm workspaces.
- `apps/api` — GraphQL API server (Express + Apollo). Key paths:
  - `src/graphql/` — schema and resolvers.
  - `src/upstream/` — FPL upstream integration modules (upstream-shape handling stays here):
    - `fplDataSource.js` thin facade (public datasource methods + cache/readiness orchestration).
    - `upstreamTransport.js` request/fallback/timeout/error transport logic.
    - `payloadExtractors.js` list/object payload extraction.
    - `entityDescriptors.js` per-entity endpoint/cache/mapper metadata.
    - `healthState.js` readiness/health state helpers.
    - `mappers.js` normalization of upstream payloads.
  - `src/cache/` — TTL-based in-memory / Redis cache.
  - `src/errors/` — upstream error classes.
  - `src/utils/` — filter, paginate, sort helpers.
  - `tests/` — Jest unit/integration tests.
- `apps/web` — React SPA (Vite + MUI + Apollo Client). Key paths:
  - `src/pages/` — page components (lazy-loaded).
  - `src/components/` — shared layout and state components.
  - `src/lib/` — Apollo client and GraphQL query documents.
  - `src/utils/` — date formatting, URL state helpers.
  - `tests/` — Jest component/unit tests.
  - `e2e/` — Playwright smoke tests.

## Branch Policy

1. Check the current branch with `git branch --show-current`.
2. If on `main`, create and switch to a new branch BEFORE making any changes:
   - feature work → `feature/<short-description>`
   - bug fix → `bug/<short-description>`
   - chore/maintenance → `chore/<short-description>`
   - Use kebab-case, e.g. `feature/fixtures-team-names`.
3. If already on a `feature/`, `bug/`, or `chore/` branch, stay on it.
4. NEVER commit directly to `main`.

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
- Never duplicate exported names in the same file; ESLint treats redeclared bindings as a hard error.
- For resolvers that accept an array argument (`ids`, etc.), always de-duplicate the input and enforce a reasonable maximum length before issuing upstream calls. Exceed-limit errors must use `extensions.code: 'BAD_USER_INPUT'` and throw before any I/O.
- ESLint rules added to `eslint.config.js` must be verified as core rules (no plugin prefix) before committing. Plugin rules (e.g. `prefer-optional-chain` from `@typescript-eslint`) require the plugin to be installed and declared; core-only rules that are not available will throw a hard `TypeError` at lint time.

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

When creating a PR with `gh pr create`, always write the body using the file
creation tool (not via a terminal heredoc or inline string) and pass it via
`--body-file <path>`. Terminal tools mangle long lines, backticks, and special
characters. Delete the temp file after the PR is created. Never use `--fill` —
it ignores the template and populates from commit messages only. The body must
follow `.github/pull_request_template.md` exactly (all sections: Summary,
Linked Issue, Screenshots, How To Test with checkboxes, Risk Assessment,
Reviewer Checklist).

## Task Closeout Checklist

Use this checklist before marking any task complete:

1. `AGENTS.md` compliance reviewed.
2. Docs updated if scripts, env vars, architecture, or conventions changed.
3. Required validations completed:
   - `npm run format`
   - `npm run lint`
   - `npm run test`
   - `npm run test:e2e:smoke`

## Frontend Performance Conventions

- All page-level components must remain lazy-loaded via `React.lazy()` in `App.jsx`; do not convert them back to static imports.
- Named-export pages must use the `.then((m) => ({ default: m.ExportName }))` pattern with `React.lazy()` since all pages use named exports.
- The Vite `manualChunks` config in `apps/web/vite.config.mjs` groups `react/react-dom/react-router-dom`, `@apollo/client/graphql`, and `@mui/material/@emotion/*` into stable vendor chunks — do not collapse them.
- Run Lighthouse against `npm run preview` (production build, port 4173), not `npm run dev` (port 5173), for representative scores. Note: `npm run preview` starts both the API (port 4000) and web preview (port 4173) concurrently.

## Guardrails

- Do not introduce DB dependencies in MVP unless explicitly requested.
- Do not bypass the GraphQL BFF by calling upstream API directly from the web app.
- Do not change public GraphQL field names without coordinated frontend updates and tests.
- Keep docs current when scripts, env vars, or architecture change.
