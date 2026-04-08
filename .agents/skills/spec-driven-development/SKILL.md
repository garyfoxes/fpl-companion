---
name: spec-driven-development
description: Write a lightweight spec before implementing non-trivial changes, aligned to this repo's GraphQL/API/Web architecture.
---

# Spec-Driven Development Skill

## Overview

Use this skill to produce a short written spec before writing code. A spec captures what will change, why, and what "done" looks like — reducing wasted implementation cycles and clarifying scope across the triage → implementer → reviewer pipeline.

Think of this as the "make the task concrete" step. The output should be short enough to scan quickly and specific enough that the implementer and reviewer can work from the same shared intent.

## Use With

- `planning-and-task-breakdown` — after the spec is clear and the work needs ordering.
- `graphql-change` — when the spec changes schema, resolver, mapper, or query behavior.
- `security-and-hardening` — when the task changes boundaries, config, or dependency surface.
- `performance-optimization` — when the task changes query shape, loading paths, or cache behavior.

## When to Use

- The task adds or changes a GraphQL type, query, or mutation.
- The task touches both `apps/api` and `apps/web`.
- Acceptance criteria are ambiguous or missing.
- The task involves more than one entity or data flow change.
- You are the **triage** agent producing a plan for the **implementer**.

## When NOT to Use

- Single-file bug fixes with obvious scope (typo, off-by-one, missing import).
- Adding a test for already-implemented behavior.
- Documentation-only changes.

## Process

Work from context to scope to verification. The goal is not a long design doc; it is a reliable handoff.

### 1. Gather Context

Read `AGENTS.md` for architecture rules, error contract, and repo layout. Then read the files relevant to the affected area:

- **API changes**: `apps/api/src/graphql/schema.js`, `resolvers.js`, relevant upstream modules.
- **Web changes**: the page/component under `apps/web/src/pages/` or `src/components/`, and `apps/web/src/lib/queries.js`.
- **Both**: start from the schema, trace through resolvers → datasource → mapper → query document → component.

### 2. Write the Spec

Produce exactly these sections:

**Goal** — One sentence describing the user-visible or developer-visible outcome.

**Scope** — Frontend / API / Both.

**Changes** — Numbered list of files to touch and what changes in each.

**GraphQL contract** — If the schema changes: the exact new/modified type definitions. If not, write "No schema change."

**Error handling** — Which `extensions.code` values apply. Reference the error contract in AGENTS.md.

**Acceptance criteria** — Concrete, testable statements. Example: "The `players` query accepts an optional `position` argument and filters results server-side."

**Test plan** — What Jest tests (API and/or Web) and Playwright smoke tests are needed. Reference the `jest-test-writer` and `playwright-smoke` skills for patterns.

**Out of scope** — Anything explicitly excluded to prevent scope creep.

### 3. Validate the Spec

Before passing to implementer:

- Every file listed in "Changes" exists in the repo (or is being created).
- The GraphQL contract is consistent with existing schema naming conventions.
- The test plan covers the required areas from AGENTS.md → Testing Expectations.
- No item in "Changes" is a drive-by refactor unrelated to the goal.

## Common Rationalizations

These sound reasonable but violate scope discipline:

- "While I'm in this file, I'll also clean up…" — Don't. Note it separately.
- "This would be easier if I refactored X first…" — Only if the task literally cannot be done without it.
- "I'll add types/docs to make it clearer…" — Only if the task requires it.

## Red Flags

- Spec lists more than 8 files → the task may need to be split.
- "Changes" section includes files with no clear connection to the goal.
- Acceptance criteria are vague ("it should work correctly") instead of testable.
- Test plan is missing or says "will add tests later."

## Verification

The spec is adequate when:

- [ ] Goal is a single sentence.
- [ ] Every changed file has a stated reason.
- [ ] Acceptance criteria are testable without reading the spec author's mind.
- [ ] Test plan references specific test files and assertion types.
- [ ] Out-of-scope section exists (even if it says "None").
