---
description: Triage → Implement → Review using AGENTS.md guardrails and repo scripts.
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
You must orchestrate the work in three phases using the custom agents in .github/agents.
All repo rules live in AGENTS.md — do not restate them here. Agents and skills reference AGENTS.md as the single source.

1. Run **triage** as a subagent with the Task + context. Require it to output: touch points, minimal plan, risks, test plan, and required verification.
2. Run **implementer** as a subagent with Triage's plan. It must implement the change, add tests, and run the `ci-validation` skill's verification sequence. If a command fails, fix and rerun until green (within reason), then report outcomes.
3. Run **reviewer** as a subagent on the final diff/result. If Reviewer returns Request-changes, run Implementer once more to address issues and rerun checks, then rerun Reviewer.

FINAL RESPONSE MUST INCLUDE:

- Summary of changes
- Files changed
- Test evidence (all verification commands + results)
- Any remaining risks/assumptions
- PR notes aligned to .github/pull_request_template.md (screenshots if UI-impacting, rollback notes)
