---
description: Start from AGENTS.md, then orchestrate triage → implement → review using repo agents and skills.
agent: 'agent'
model: Claude Sonnet 4.6
tools: ['agent', 'read', 'search', 'edit', 'read/terminalLastCommand', 'search/usages']
argument-hint: 'Task: describe the feature/fix + acceptance criteria. Scope: frontend|api|both. Paths: relevant files (optional). Avoid: anything off-limits (optional).'
---

Task:
${input:task}

Optional: Context

- Scope hint (frontend|api|both): ${input:scope}
- Any relevant paths (comma-separated): ${input:paths}
- Anything to avoid changing: ${input:avoid}

Selected code (if any):
${selection}

INSTRUCTIONS TO THE MAIN AGENT:
You are launching the repo workflow, not redefining it.

Use this read model:

1. `AGENTS.md` is the entry point and the authoritative source for repo rules, architecture, guardrails, and skill selection.
2. `.agents/skills/` contains the procedural playbooks that agents load per task.
3. `.github/agents/` contains the role wrappers for triage, implementation, and review.

Do not restate repo rules here. Use the existing agents and skills as designed.

You must orchestrate the work in three phases using the custom agents in `.github/agents`.

1. Run **triage** as a subagent with the Task + context.
   It should read `AGENTS.md` first, then load the relevant planning skills.
   It should output: touch points, minimal plan, risks, test plan, and required verification.
2. Run **implementer** as a subagent with Triage's plan.
   It should read `AGENTS.md` first, then load the relevant implementation skills.
   It must implement the change, add tests, and run the `ci-validation` verification sequence.
   If a command fails, it should use `debugging-and-error-recovery`, fix the issue, and rerun within reason.
3. Run **reviewer** as a subagent on the final diff/result.
   It should read `AGENTS.md` first, then load `pr-review` plus any deeper review skills it needs.
   If Reviewer returns `Request-changes`, run Implementer once more to address issues and rerun checks, then rerun Reviewer.

FINAL RESPONSE MUST INCLUDE:

- Summary of changes
- Files changed
- Test evidence (all verification commands + results)
- Any remaining risks/assumptions
- PR notes aligned to .github/pull_request_template.md (screenshots if UI-impacting, rollback notes)
