---
name: pr-review
description: Structured code-review checklist for this repository, aligned to AGENTS.md guardrails.
---

# PR Review Skill

## Overview

Use this skill to review a change before submission or merge. This is the repository-specific review checklist and quality gate for `fpl-companion`.

The goal is not to enforce personal preference. The goal is to confirm that the change:

- satisfies the task,
- respects repo architecture and contracts,
- includes appropriate tests,
- updates docs when needed,
- is ready for PR review with clear risks and verification.

Refer to **AGENTS.md** for the authoritative repo rules. This skill tells you how to apply them during review.

For deeper analysis on specific risks, load these companion skills:

- `security-and-hardening`
- `performance-optimization`

Think of this as the "is this ready for human review or merge?" skill. It should produce a clear verdict, not a loose set of observations.

## Use With

- `security-and-hardening` — when the change affects boundaries, dependencies, shared config, or upstream/untrusted data handling.
- `performance-optimization` — when the change affects query shape, list behavior, route loading, or caching.
- `ci-validation` — when the verification story is incomplete or suspicious.

## When to Use

- You are the **reviewer** agent evaluating a diff.
- You are self-reviewing before submitting a PR.
- A feature, bug fix, or refactor is complete and needs a final quality pass.
- You need to assess whether the diff is ready for human review.

## When NOT to Use

- The task is still being clarified or scoped.
- The change is still being implemented.
- You need to plan work rather than evaluate completed work.
- You need deep debugging or root-cause analysis before review.

Use the corresponding lifecycle skills first if the work is not yet review-ready.

## Severity Guide

Use these severities consistently:

- **High**: Must be fixed before merge. Breaks correctness, contract, architecture boundary, user-visible behavior, safety, or required test coverage.
- **Med**: Should be fixed before merge unless there is a clear reason not to. Weakens maintainability, docs, CI fit, or reviewer confidence.
- **Low**: Useful improvement or polish. Not a merge blocker by itself.

Do not reduce severity because a change is small. Judge impact, not diff size.

## Process

### 1. Understand the Change

Before reviewing details, establish context:

- What is this change trying to do?
- What acceptance criteria or user-visible behavior is it supposed to satisfy?
- Which parts of the system are affected: `apps/api`, `apps/web`, docs, config, or multiple?
- Does the change appear larger than necessary for the stated task?

If intent is unclear, say so in the review.

### 2. Review the Tests First

Read tests before implementation where possible.

Check:

- Are tests present for the changed behavior?
- Do they verify behavior rather than implementation details?
- Are happy path, edge cases, and error paths covered where relevant?
- If the change touches user flows, should Playwright smoke coverage change too?
- Does the verification story appear complete and credible?

Flag as **High** if behavior changed materially and required tests are missing.

### 3. Review the Diff Against Repo Guardrails

Evaluate each area below.

#### 3a. Architecture Boundary

- `apps/web` consumes data exclusively through the GraphQL API — no direct upstream calls.
- Upstream-specific data shaping stays inside `apps/api/src/upstream/`.
- Mappers normalize fields before data reaches resolvers/frontend.
- Upstream and boundary validation logic stays in the API layer rather than leaking into the web app.

Flag as **High**:

- direct upstream API calls from `apps/web`
- upstream-shape handling leaking into resolvers or frontend
- contract logic pushed into the wrong layer

#### 3b. GraphQL + Error Contract

- Every GraphQL error includes `extensions.code`.
- Upstream failures use the correct code: `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `BAD_UPSTREAM_RESPONSE`.
- Partial valid data is returned where possible (malformed records dropped, not rejected).

Flag as **High**:

- missing `extensions.code`
- incorrect upstream error mapping
- resolver behavior that rejects recoverable partial-valid-data scenarios without repo justification

For resolver array inputs such as `ids`:

- inputs must be de-duplicated
- server-side max length must be enforced before I/O
- exceed-limit must throw `BAD_USER_INPUT`
- external or upstream data should still be treated as untrusted at the boundary and normalized before downstream use

Treat violations here as **High**.

If the change touches external data handling, dependency/config safety, or boundary validation, also consult `security-and-hardening`.

#### 3c. Web UX and Accessibility

- Loading, error, and empty states are handled for any data-fetching component.
- URL-filter persistence works correctly (round-trips through query params).
- Accessibility basics: form labels, semantic table headings, alert roles.

Check:

- loading/error/empty handling for data-fetching views
- filter/detail behavior still works cleanly
- accessible labels and semantic roles remain intact

Flag as **High** if the user can hit a broken or missing state.
Flag as **Med** for weaker accessibility or UX consistency issues that should still be corrected.

#### 3d. Frontend Performance Conventions

- Page components remain lazy-loaded via `React.lazy()`.
- Vite `manualChunks` vendor groupings are not changed casually.
- GraphQL query documents should request only fields the UI actually uses.
- List and detail flows should avoid unnecessary query waterfalls or avoidable duplicate fetches.

Flag as **Med** or **High** depending on risk if these conventions are broken.

If the change affects query shape, list size, lazy-loading, caching, or perceived loading performance, also consult `performance-optimization`.

#### 3e. Test Coverage

- **API Jest**: resolvers, data sources, mapper normalization, invalid payload handling.
- **Web Jest**: loading/error/empty states, route smoke, URL-filter persistence where relevant.
- **Playwright smoke**: API-down handling and route/page smoke when user flows change.
- **Apollo mock variable shapes**: when a query gains a new variable (e.g. an optional `orderBy`), every existing mock for that query must include the new key — even with a `null` value. A missing key causes the mock to silently not fire. Flag any test that added a variable to a query document without updating all existing mocks for that query as a **High** finding.
- No "TODO: add tests" — tests ship with the change.

#### 3f. CI Fit and Verification

- Changes should pass the full `ci-validation` skill verification sequence.
- No new scripts or env vars that aren't reflected in CI workflow.
- Verification should be proportionate to any performance-sensitive or boundary-sensitive change.

Flag as **Med** or **High** if the verification story is incomplete for the type of change.

#### 3g. Documentation Currency

- `README.md` updated if npm scripts, env vars, architecture, GraphQL query surface, or UI features changed.
- `AGENTS.md` updated if new conventions, guardrails, or patterns were introduced.
- SKILL.md files updated if new patterns were introduced during the task (e.g. new test helpers, new resolver guards, new URL param helpers).
- Flag missing doc updates as a **Med** finding.

#### 3h. Repo Configuration Safety

- `.vscode/settings.json` is committed to the repo and affects all contributors.
- Shared repo config changes should reflect a repo need, not personal preference.

Flag as **Med** unless the impact is clearly severe.

### 4. Assess Review Scope and Diff Quality

Check whether the change is reviewable as submitted:

- Is the diff tightly scoped to the task?
- Is unrelated cleanup mixed into feature work?
- Is the diff significantly larger than it needs to be?
- Are there obvious dead-code remnants or orphaned branches left behind?
- Are new dependencies justified?
- Does the change introduce unnecessary performance or security surface area relative to the stated goal?

Large or noisy diffs are at least **Med** if they reduce review confidence.

### 5. Form the Verdict

Use:

- **Approve**: No meaningful issues remain.
- **Approve-with-notes**: Non-blocking issues exist, but the change is still acceptable.
- **Request-changes**: One or more **High** issues remain, or overall review confidence is too low.

## Output Format

Structure the review output exactly like this:

### 1. Verdict

One of:

- Approve
- Approve-with-notes
- Request-changes

### 2. Findings

Flat bullets grouped by severity:

- `High` — issue, impact, and why it matters
- `Med` — issue, impact, and why it matters
- `Low` — issue, impact, and why it matters

Each finding should:

- point to a concrete file or behavior when possible
- explain why it matters in repo terms
- avoid vague style-only feedback

### 3. Concrete Fixes

Actionable bullets describing what to change.

### 4. Test Gaps

List missing or weak coverage explicitly.
If there are no gaps, say so.

### 5. PR Readiness Notes

Call out PR-template-related needs:

- screenshots
- risks / rollback notes
- test evidence
- linked docs updates

### 6. What's Done Well

Include at least one brief positive observation when honestly warranted.

## Common Rationalizations

- "The tests pass so the code is correct" — Passing tests are necessary, not sufficient. Review also checks architecture, contracts, edge cases, and missing coverage.
- "It's a small change, so a light review is enough" — Small changes can still break GraphQL contracts, error handling, or URL-state behavior.
- "It works in the browser, so the review should be low severity" — A manually working path does not excuse contract violations, missing tests, or broken edge cases.
- "This is just cleanup around the task" — Unrelated cleanup increases review risk. Keep feature work and refactors separate unless the cleanup is truly inseparable.
- "I don't want to block on docs" — If the change modifies scripts, env vars, conventions, architecture, or user-facing behavior, docs are part of the deliverable.
- "This is read-only data, so security does not matter" — Boundary validation, input limits, dependency hygiene, and safe error behavior still matter in a read-only app.
- "This query is small today, so we do not need to think about performance" — Unbounded queries, over-fetching, and broken lazy-loading are easier to prevent than to unwind later.

## Red Flags

- GraphQL error responses without `extensions.code`.
- Direct upstream API calls from `apps/web` (bypasses the BFF boundary).
- Resolver accepting array input without de-duplication and max-length enforcement.
- "TODO: add tests" in the diff — tests must ship with the change.
- Apollo mock variable shapes that don't match the component's `useQuery` call.
- Missing doc updates when the GraphQL surface, env vars, or scripts changed.
- Missing loading, error, or empty states in changed views.
- New dependency added without clear necessity or impact justification.
- Over-fetching query fields or introducing unbounded list behavior without a reason.
- Reviewer cannot determine what was validated.

## Verification

The review is complete when:

- [ ] The change intent is understood well enough to review it.
- [ ] Tests were reviewed before or alongside implementation.
- [ ] All review areas above were considered proportionally to the diff.
- [ ] Every finding has a severity and a concrete explanation.
- [ ] The verdict is stated explicitly.
- [ ] Test gaps are called out explicitly, even if none.
- [ ] PR readiness notes are included.
