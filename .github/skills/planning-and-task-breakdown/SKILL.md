---
name: planning-and-task-breakdown
description: Break complex tasks into ordered, dependency-aware steps aligned to this repo's monorepo and sub-agent workflow.
---

# Planning and Task Breakdown Skill

## Overview

Use this skill to decompose a task into an ordered sequence of small, verifiable steps. Each step should be completable independently and testable before moving to the next. This is the operational complement to the `spec-driven-development` skill — spec says _what_, this skill says _in what order_.

## When to Use

- The task spans both `apps/api` and `apps/web`.
- The task involves 4+ files or 3+ distinct changes.
- You are the **triage** agent producing a plan for the **implementer**.
- The task has dependency ordering (e.g. schema before resolvers before frontend).

## When NOT to Use

- The task is a single-file change with obvious ordering.
- You already have a clear plan from triage output.
- Pure review or documentation tasks.

## Process

### 1. Identify the Dependency Graph

In this repo, changes typically flow in this order:

```
Schema → Resolvers → DataSource/Mappers → Frontend Queries → Components → Tests → Docs
```

Map your task onto this flow. Not every step applies to every task.

### 2. Produce the Step List

Write numbered steps with this format:

```
N. [Scope] Brief description
   Files: path/to/file.js
   Depends on: step M (or "none")
   Verify: how to confirm this step works
```

**Scope** is one of: `API`, `Web`, `Both`, `Test`, `Docs`.

Rules:

- Each step touches at most 2–3 files.
- Steps with no dependencies on each other can be done in parallel.
- Every step has a verification action (run a test, check lint, confirm render).
- The final step is always: run the `ci-validation` skill's full sequence.

### 3. Check for Completeness

Walk through the plan and ask:

- Does step 1 have zero dependencies on later steps?
- Can each step be verified independently?
- Are tests included as explicit steps (not afterthoughts)?
- Is there a doc update step if scripts, env vars, or conventions change?

### 4. Assign to the Pipeline

| Step Type                         | Agent       |
| --------------------------------- | ----------- |
| Scope analysis, risk assessment   | triage      |
| Code edits, test writing, CI runs | implementer |
| Diff review, coverage check       | reviewer    |

If using the full pipeline: triage produces the plan, implementer executes it step by step, reviewer validates the result.

## Example: Adding a New GraphQL Query

```
1. [API] Add type + query to schema.js
   Files: apps/api/src/graphql/schema.js
   Depends on: none
   Verify: npm run lint --workspace apps/api

2. [API] Add mapper function
   Files: apps/api/src/upstream/mappers.js
   Depends on: none
   Verify: npx jest apps/api/tests/mappers.test.js

3. [API] Wire resolver to datasource
   Files: apps/api/src/graphql/resolvers.js
   Depends on: 1, 2
   Verify: npx jest apps/api/tests/resolvers.test.js

4. [Web] Add query document
   Files: apps/web/src/lib/queries.js
   Depends on: 1
   Verify: npm run lint --workspace apps/web

5. [Web] Build page component
   Files: apps/web/src/pages/NewPage.jsx
   Depends on: 4
   Verify: npx jest apps/web/tests/newPage.test.jsx

6. [Test] Add API + Web Jest tests
   Files: apps/api/tests/resolvers.test.js, apps/web/tests/newPage.test.jsx
   Depends on: 3, 5
   Verify: npm run test

7. [Test] Add Playwright smoke test
   Files: apps/web/e2e/smoke.spec.js
   Depends on: 5
   Verify: npm run test:e2e:smoke

8. [Docs] Update README if query surface changed
   Files: README.md
   Depends on: 1
   Verify: npm run format

9. [CI] Full validation
   Depends on: all
   Verify: ci-validation skill sequence
```

## Common Rationalizations

- "I'll figure out the order as I go" — This leads to circular edits and broken intermediate states.
- "Tests can wait until the end" — Tests written step-by-step catch errors earlier.
- "Docs aren't part of the plan" — AGENTS.md requires doc updates when the API surface changes.

## Red Flags

- A step depends on more than 3 prior steps → it may need splitting.
- No verification action for a step → the step is not independently confirmable.
- Tests are lumped into a single final step → they should be co-located with the code step.
- The plan has no doc update step but changes the GraphQL surface or env vars.

## Verification

The plan is adequate when:

- [ ] Steps are numbered and dependency-ordered.
- [ ] Each step has files, dependencies, and a verify action.
- [ ] No step touches more than 3 files.
- [ ] Tests appear as explicit steps, not afterthoughts.
- [ ] Final step is the full `ci-validation` sequence.
