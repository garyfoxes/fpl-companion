---
name: pr-review
description: Structured code-review checklist for this repository, aligned to AGENTS.md guardrails.
---

# PR Review Skill

## Overview

Structured code-review checklist for this repository, aligned to AGENTS.md guardrails. Each section below maps to a guardrail or convention in **AGENTS.md** — refer there for full details rather than restating rules here.

## When to Use

- You are the **reviewer** agent evaluating a diff.
- You are self-reviewing before submitting a PR.
- The **build-feature** prompt has reached the review phase.

## When NOT to Use

- Planning or triaging a task (use `spec-driven-development` or `planning-and-task-breakdown`).
- Implementing changes (use the relevant implementation skills).

## Process

### 1. Architecture Boundary (AGENTS.md → Architecture Rules)

- `apps/web` consumes data exclusively through the GraphQL API — no direct upstream calls.
- Upstream-specific data shaping stays inside `apps/api/src/upstream/`.
- Mappers normalize fields before data reaches resolvers/frontend.

### 2. GraphQL + Error Contract (AGENTS.md → GraphQL And Error Contract)

- Every GraphQL error includes `extensions.code`.
- Upstream failures use the correct code: `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `BAD_UPSTREAM_RESPONSE`.
- Partial valid data is returned where possible (malformed records dropped, not rejected).
- **Resolver array inputs** (e.g. `ids: [Int!]!`): flag as **High** if the resolver does not de-duplicate IDs and enforce a server-side maximum before issuing upstream calls. Exceeding the limit must throw `BAD_USER_INPUT` before any I/O.

### 3. Web UX (AGENTS.md → Coding Conventions)

- Loading, error, and empty states are handled for any data-fetching component.
- URL-filter persistence works correctly (round-trips through query params).
- Accessibility basics: form labels, semantic table headings, alert roles.

### 4. Test Coverage (AGENTS.md → Testing Expectations)

- **API Jest**: resolvers, data sources, mapper normalization, invalid payload handling.
- **Web Jest**: loading/error/empty states, route smoke, URL-filter persistence where relevant.
- **Playwright smoke**: API-down handling and route/page smoke when user flows change.
- **Apollo mock variable shapes**: when a query gains a new variable (e.g. an optional `orderBy`), every existing mock for that query must include the new key — even with a `null` value. A missing key causes the mock to silently not fire. Flag any test that added a variable to a query document without updating all existing mocks for that query as a **High** finding.
- No "TODO: add tests" — tests ship with the change.

### 5. CI Fit

- Changes should pass the full `ci-validation` skill verification sequence.
- No new scripts or env vars that aren't reflected in CI workflow.

### 6. Documentation Currency (AGENTS.md → Guardrails)

- `README.md` updated if npm scripts, env vars, architecture, GraphQL query surface, or UI features changed.
- `AGENTS.md` updated if new conventions, guardrails, or patterns were introduced.
- SKILL.md files updated if new patterns were introduced during the task (e.g. new test helpers, new resolver guards, new URL param helpers).
- Flag missing doc updates as a **Med** finding.

### 7. Frontend Performance (AGENTS.md → Frontend Performance Conventions)

- Page components remain lazy-loaded via `React.lazy()`.
- Vite `manualChunks` vendor groupings not modified without justification.

### 8. Repo Configuration Safety

- `.vscode/settings.json` is committed to the repo and affects all contributors. Flag changes that broaden MCP/extension access (e.g. `chat.mcp.access: "all"`) as a **Med** (security/UX) finding — personal editor preferences should not be committed to shared config.

## Output Format

Structure the review output as:

1. **Verdict**: Approve / Approve-with-notes / Request-changes
2. **Findings** (High / Med / Low) — reference the checklist section
3. **Concrete fixes** — actionable bullets
4. **Test gaps** — missing coverage
5. **PR readiness** — screenshots needed? risks/rollback notes? PR template sections missing?

## Common Rationalizations

- "The tests pass so the code is correct" — Tests verify behavior under mocked conditions. Review checks architecture, error contract, and edge cases tests may not cover.
- "It's a small change, full review is overkill" — Small changes can break GraphQL contracts or introduce security issues. Apply the checklist proportionally but don't skip sections.
- "I'll flag it as Low since it works" — Severity should reflect impact, not current functionality. A missing `extensions.code` is High even if the error path is rarely hit.

## Red Flags

- GraphQL error responses without `extensions.code`.
- Direct upstream API calls from `apps/web` (bypasses the BFF boundary).
- Resolver accepting array input without de-duplication and max-length enforcement.
- "TODO: add tests" in the diff — tests must ship with the change.
- Apollo mock variable shapes that don't match the component's `useQuery` call.
- Missing doc updates when the GraphQL surface, env vars, or scripts changed.

## Verification

The review is complete when:

- [ ] All 8 checklist sections have been evaluated.
- [ ] Every finding has a severity (High/Med/Low) and actionable fix.
- [ ] The verdict is stated explicitly.
- [ ] Output follows the 5-section format above.
