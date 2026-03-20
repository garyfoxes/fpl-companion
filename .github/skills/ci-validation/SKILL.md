---
name: ci-validation
description: The four-command verification sequence that must pass before submitting work, plus troubleshooting tips.
---

# CI Validation Skill

Use this skill to validate changes before committing or submitting a PR.
The required checks are defined in **AGENTS.md → Testing Expectations**; this skill provides execution details and troubleshooting.

## Verification Sequence

Run these commands **in order** from the repo root. All must pass.

```sh
npm run format        # 1. Prettier — check formatting
npm run lint          # 2. ESLint — across all workspaces
npm run test          # 3. Jest — unit + integration across all workspaces
npm run test:e2e:smoke # 4. Playwright — smoke tests for apps/web
```

### Step 3 — Console Noise Check (MANDATORY)

After `npm run test` passes, verify the output contains **zero** `console.warn` or `console.error` lines. Do NOT pipe through `tail` — that hides noise above the summary. Run:

```sh
npm run test 2>&1 | grep -c 'console\.\(warn\|error\)$'
```

The result must be `0`. If non-zero, see **jest-test-writer SKILL → Test Environment Hygiene** for remediation.

## CI Parity Notes

- CI runs on **Node 20** with `npm ci` (not `npm install`).
- CI caches Playwright browsers based on `apps/web/package.json` hash.
- The full CI pipeline also runs `npm run check:yaml` and `npm run build` — these are not part of the agent verification sequence but will run in CI.

## Common Failure Modes

| Symptom                                 | Likely Cause                            | Fix                                                                                                                             |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format` fails with diff output | Unformatted files                       | Run `npm run format:write` then re-check                                                                                        |
| ESLint `no-unused-vars` or `no-undef`   | New import missing or stale import      | Add/remove the import                                                                                                           |
| Jest snapshot mismatch                  | Intended UI change                      | Update snapshots with `npx jest --updateSnapshot` in the relevant workspace                                                     |
| Playwright `browserType.launch` error   | Chromium not installed locally          | Run `npx playwright install chromium`                                                                                           |
| Playwright test timeout                 | API server not started or port conflict | The smoke tests auto-start the servers via `webServer` config in `playwright.config.js` — check for port conflicts on 4000/4173 |

## Quick Iteration

When iterating on a single workspace or test file, avoid running the full sequence every time:

```sh
# Format + lint one workspace
npm run format:write && npm run lint --workspace apps/api

# Run one test file
npx jest --config apps/api/jest.config.cjs apps/api/tests/resolvers.test.js

# Run Playwright with headed browser for debugging
npx playwright test --headed --config apps/web/playwright.config.js
```

Always run the **full sequence** before the final commit.
