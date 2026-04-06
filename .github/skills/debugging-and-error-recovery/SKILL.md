---
name: debugging-and-error-recovery
description: Systematic approach to diagnosing and fixing failures in this repo's API, frontend, and CI pipeline.
---

# Debugging and Error Recovery Skill

## Overview

Use this skill when something fails — a test, a lint rule, a CI step, a runtime error — and the cause is not immediately obvious. This skill provides a structured diagnostic approach specific to this repo's architecture.

## When to Use

- A CI validation step fails and the fix is not obvious from the error message.
- A Jest test fails unexpectedly (not a simple assertion mismatch).
- A Playwright smoke test times out or produces unexpected behavior.
- A runtime error occurs in the API or frontend during manual testing.
- The implementer agent is stuck in a fix-retry loop.

## When NOT to Use

- The error message directly tells you the fix (e.g. "missing import `X`" → add the import).
- You are investigating behavior that already works correctly.
- The issue is a code review finding, not a runtime or build error.

## Process

### 1. Read the Error — Fully

Before hypothesizing a cause:

- Read the complete error output, not just the first line.
- Identify the error type: lint, parse, test assertion, test timeout, build, runtime.
- Note the exact file and line number if provided.

### 2. Classify the Failure

| Error Type            | Start Here                                                            |
| --------------------- | --------------------------------------------------------------------- |
| ESLint error          | Read the rule name. Check `eslint.config.js` for custom rules.        |
| Jest assertion fail   | Read expected vs. received. Check if mock data matches the code path. |
| Jest timeout / hang   | Apollo mock variable mismatch (see `jest-test-writer` skill).         |
| Playwright timeout    | Missing `responseFor` case or fixture field (see `playwright-smoke`). |
| Build error (Vite)    | Check import paths and named exports. Check `vite.config.mjs`.        |
| Runtime API error     | Check upstream mapper, error classes, resolver error handling.        |
| `npm run format` fail | Run `npm run format:write` and re-check.                              |

### 3. Isolate the Cause

Follow these principles:

**Narrow the scope** — Run the single failing test or lint rule, not the full suite.

```sh
# Single Jest test
npx jest --config apps/api/jest.config.cjs apps/api/tests/resolvers.test.js

# Single ESLint file
npx eslint apps/api/src/graphql/resolvers.js

# Playwright with headed browser
npx playwright test --headed --config apps/web/playwright.config.js
```

**Check recent changes** — If the failure appeared after your edit, diff the file to see what changed. Focus on the delta.

**Read before guessing** — Open the failing file and read the relevant section. Do not hypothesize from the error message alone.

**Check the boundary** — Many errors in this repo come from mismatches at architectural boundaries:

- GraphQL schema ↔ resolver return shape.
- Resolver ↔ datasource method signature.
- Upstream payload ↔ mapper field expectations.
- Apollo query variables ↔ MockedProvider mock variables.
- Playwright fixture objects ↔ GraphQL query fields.

### 4. Fix and Verify

After identifying the cause:

1. Make the minimal fix. Do not refactor unrelated code.
2. Re-run the specific failing test/command to confirm the fix.
3. Run the full `ci-validation` sequence to check for cascading effects.
4. If the fix introduced a new failure, go back to step 2 — do not stack fixes without verifying.

### 5. Escape Hatch: When You're Stuck

If you've been in a fix-retry loop for 3+ attempts on the same error:

1. **Stop and re-read the error** from scratch, ignoring your previous hypothesis.
2. **Check if your assumption about the code is wrong** — re-read the source file.
3. **Search the codebase** for similar patterns that work — find an existing resolver, test, or component that does something analogous.
4. **Check if the error is environmental** — wrong Node version, stale `node_modules`, port conflict.
5. If still stuck, **state the blocker clearly** in your output rather than guessing further.

## Repo-Specific Debugging Patterns

### Apollo MockedProvider hangs (Jest)

**Symptom**: Test hangs on `findByText` or `waitFor`, no error rendered.

**Cause**: Variable mismatch between the component's `useQuery` call and the mock's `request.variables`. Apollo requires exact deep equality — every key, including optional ones with `null` values.

**Fix**: Inspect the component's `useQuery` call, list every variable it sends, and match those exactly in the mock. See the `jest-test-writer` skill for detailed examples.

### Playwright smoke test sees no data

**Symptom**: Table is empty or detail panel doesn't appear.

**Cause**: Missing `case` in `responseFor` for the query's operation name, or a fixture object missing a field that the query requests.

**Fix**: Check `apps/web/src/lib/queries.js` for the operation name and verify a matching `case` exists in `apps/web/e2e/smoke.spec.js`. See the `playwright-smoke` skill.

### Upstream errors in API

**Symptom**: GraphQL response contains `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, or `BAD_UPSTREAM_RESPONSE`.

**Cause**: The upstream FPL API is down, slow, or returning unexpected payload shapes.

**Fix**: Check `apps/api/src/upstream/upstreamTransport.js` for timeout configuration. Check `apps/api/src/upstream/mappers.js` for the field the mapper expects. The stale-cache fallback should serve previous data if available — check `apps/api/src/upstream/fplDataSource.js` for the two-pass cache pattern.

### ESLint rule doesn't exist

**Symptom**: `TypeError` or "Definition for rule X was not found" at lint time.

**Cause**: The rule requires a plugin that isn't installed, or it's not a core ESLint rule.

**Fix**: Per AGENTS.md coding conventions, verify the rule is a core ESLint rule (no plugin prefix) before adding it. If it needs a plugin, install and declare the plugin first.

## Common Rationalizations

- "I'll just try a different approach" — Diagnose first. Switching approaches without understanding the failure wastes cycles.
- "The error is wrong / misleading" — Occasionally true, but verify before assuming.
- "I'll suppress the warning for now" — Only acceptable for framework-emitted noise with a targeted filter (see `jest-test-writer` skill). Never blanket-suppress.

## Red Flags

- Making the same fix attempt more than twice without re-reading the error.
- Editing files you haven't read.
- Adding `try/catch` or `.catch(() => {})` to make an error disappear without fixing the cause.
- Suppressing lint rules inline (`eslint-disable`) without understanding why they fire.

## Verification

Recovery is complete when:

- [ ] The specific failing command passes.
- [ ] The full `ci-validation` sequence passes.
- [ ] No new warnings or errors were introduced.
- [ ] The fix is minimal and does not include unrelated changes.
