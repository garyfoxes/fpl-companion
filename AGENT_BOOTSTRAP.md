# AGENT_BOOTSTRAP.md

Meta-instructions for AI agents (Copilot, Codex, or any LLM-powered tool) working in this repository. Read this file first, then follow the references below.

## Read Order

1. **This file** — how to operate in this repo.
2. **AGENTS.md** — repo-specific architecture, guardrails, error contract, branch policy.
3. **Relevant skill(s)** under `.github/skills/` — detailed procedures for specific task types.

Do not skip steps 1–2. Skills are optional per-task but should be loaded when they match the work.

## Choosing a Skill

| Task Type                          | Skill                          |
| ---------------------------------- | ------------------------------ |
| Adding/changing GraphQL types      | `graphql-change`               |
| Writing or updating Jest tests     | `jest-test-writer`             |
| Writing or updating Playwright E2E | `playwright-smoke`             |
| Reviewing a PR or diff             | `pr-review`                    |
| Running the CI validation sequence | `ci-validation`                |
| Clarifying scope or writing a spec | `spec-driven-development`      |
| Breaking a task into steps         | `planning-and-task-breakdown`  |
| Diagnosing failures or errors      | `debugging-and-error-recovery` |
| Security-sensitive changes         | `security-and-hardening`       |
| Performance-sensitive changes      | `performance-optimization`     |

If multiple skills apply, load them all. Skills reference AGENTS.md rather than restating rules — loading both is safe.

Common pairings in this repo:

- `graphql-change` + `jest-test-writer`
- `graphql-change` + `performance-optimization`
- `graphql-change` + `security-and-hardening`
- `pr-review` + `security-and-hardening` for boundary-sensitive changes
- `pr-review` + `performance-optimization` for query, loading, or bundle-sensitive changes

## When to Plan Before Coding

Start with planning (not code) when any of these are true:

- The task touches both `apps/api` and `apps/web`.
- The task adds or changes a GraphQL type, query, or mutation.
- The task has unclear acceptance criteria or ambiguous scope.
- You expect the diff to span more than 3 files.

Use the **triage** agent or the **planning-and-task-breakdown** skill to produce a plan first.

## Scope Discipline

- Implement exactly what was asked. No drive-by refactors.
- Do not add features, comments, type annotations, or error handling beyond the request.
- Do not modify files unrelated to the task.
- If you notice an existing issue unrelated to the task, note it in your output — do not fix it.

## Verify, Don't Assume

- Read the file before editing it. Understand existing code before changing it.
- Run code to confirm behavior; do not assume a function works from its name alone.
- After editing, check for errors (lint, type, parse) before moving on.
- Run the `ci-validation` sequence before declaring work complete.

## Surface Assumptions and Ambiguity

When the task is underspecified:

1. State your assumptions explicitly before proceeding.
2. If multiple valid interpretations exist, ask the user to clarify — do not guess.
3. If you must proceed without clarification, choose the most conservative interpretation and note it.

## Sub-Agent Pipeline

This repo uses three specialized agents under `.github/agents/`:

| Agent           | Role                                            | Can Edit? | Can Run Commands? |
| --------------- | ----------------------------------------------- | --------- | ----------------- |
| **triage**      | Analyze scope, identify touch points, plan work | No        | No                |
| **implementer** | Write code, add tests, run CI checks            | Yes       | Yes               |
| **reviewer**    | Review diff for correctness, safety, coverage   | No        | No                |

**Standard workflow**: triage → implementer → reviewer.

- Use **triage** first for any non-trivial task to produce a plan before code is written.
- Use **implementer** to execute the plan, write tests, and verify.
- Use **reviewer** to validate the result; loop back to implementer if issues are found.

For simple, well-scoped tasks (e.g. fixing a typo, adding a test), going directly to implementer is acceptable.

## Branch Policy

Follow the branch policy in AGENTS.md. Never commit directly to `main`. Check your current branch before making any edits.
