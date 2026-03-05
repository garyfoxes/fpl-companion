---
description: Triage → Implement → Review using AGENTS.md guardrails and repo scripts.
agent: 'agent'
model: Claude Sonnet 4.6
tools: ['agent', 'read', 'search', 'edit', 'read/terminalLastCommand', 'search/usages']
---

Task:
${input:task:Describe the feature/fix + acceptance criteria}

Optional: Context

- Scope hint (frontend|api|both): ${input:scope:}
- Any relevant paths (comma-separated): ${input:paths:}
- Anything to avoid changing: ${input:avoid:}

Selected code (if any):
${selection}

INSTRUCTIONS TO THE MAIN AGENT:
You must orchestrate the work in three phases using the custom agents in .github/agents:

1. Run triage as a subagent with the Task + context. Require it to output: touch points, minimal plan, risks, test plan, and required verification commands.
2. Run Implementer as a subagent with Triage’s plan. It must implement + add tests + run:
   - npm run format
   - npm run lint
   - npm run test
   - npm run test:e2e:smoke
     If a command fails, fix and rerun until green (within reason), then report outcomes.
3. Run reviewer as a subagent on the final diff/result. If Reviewer returns Request-changes, run Implementer once more to address issues and rerun the required commands, then rerun Reviewer.

FINAL RESPONSE MUST INCLUDE:

- Summary of changes
- Files changed
- Test evidence (all required commands + results)
- Any remaining risks/assumptions
- PR notes aligned to .github/pull_request_template.md (screenshots if UI-impacting, rollback notes)
