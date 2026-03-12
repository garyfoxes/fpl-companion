---
name: pr-review
description: Structured code-review checklist for this repository, aligned to AGENTS.md guardrails.
---

# PR Review Skill

Use this skill when reviewing code changes. Each section below maps to a guardrail or convention in **AGENTS.md** — refer there for full details rather than restating rules here.

## Review Checklist

### 1. Architecture Boundary (AGENTS.md → Architecture Rules)

- `apps/web` consumes data exclusively through the GraphQL API — no direct upstream calls.
- Upstream-specific data shaping stays inside `apps/api/src/upstream/`.
- Mappers normalize fields before data reaches resolvers/frontend.

### 2. GraphQL + Error Contract (AGENTS.md → GraphQL And Error Contract)

- Every GraphQL error includes `extensions.code`.
- Upstream failures use the correct code: `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `BAD_UPSTREAM_RESPONSE`.
- Partial valid data is returned where possible (malformed records dropped, not rejected).

### 3. Web UX (AGENTS.md → Coding Conventions)

- Loading, error, and empty states are handled for any data-fetching component.
- URL-filter persistence works correctly (round-trips through query params).
- Accessibility basics: form labels, semantic table headings, alert roles.

### 4. Test Coverage (AGENTS.md → Testing Expectations)

- **API Jest**: resolvers, data sources, mapper normalization, invalid payload handling.
- **Web Jest**: loading/error/empty states, route smoke, URL-filter persistence where relevant.
- **Playwright smoke**: API-down handling and route/page smoke when user flows change.
- No "TODO: add tests" — tests ship with the change.

### 5. CI Fit

- Changes should pass the full `ci-validation` skill verification sequence.
- No new scripts or env vars that aren't reflected in CI workflow.

### 6. Documentation Currency (AGENTS.md → Guardrails)

- `README.md` updated if npm scripts, env vars, architecture, or Getting Started steps changed.
- `AGENTS.md` updated if new conventions, guardrails, or patterns were introduced.
- Flag missing doc updates as a **Med** finding.

### 7. Frontend Performance (AGENTS.md → Frontend Performance Conventions)

- Page components remain lazy-loaded via `React.lazy()`.
- Vite `manualChunks` vendor groupings not modified without justification.

## Output Format

Structure the review output as:

1. **Verdict**: Approve / Approve-with-notes / Request-changes
2. **Findings** (High / Med / Low) — reference the checklist section
3. **Concrete fixes** — actionable bullets
4. **Test gaps** — missing coverage
5. **PR readiness** — screenshots needed? risks/rollback notes? PR template sections missing?
