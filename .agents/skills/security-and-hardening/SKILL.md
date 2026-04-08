---
name: security-and-hardening
description: Review and implement changes with safe boundaries, input limits, dependency hygiene, and untrusted-data handling in mind. Use when a task touches API boundaries, config, dependencies, or external data.
---

# Security and Hardening Skill

## Overview

Use this skill when a change affects trust boundaries in `fpl-companion`.

This repository is a read-only MVP, so the most important security concerns are not login flows or PII handling. They are:

- keeping the web app behind the GraphQL BFF,
- treating upstream FPL data as untrusted,
- validating and bounding API inputs,
- returning safe, machine-readable errors,
- avoiding risky dependency and shared-config changes.

Refer to **AGENTS.md** for the canonical repo rules. Use this skill to apply those rules consistently during planning, implementation, and review.

Think of this as the "protect the boundaries" skill. In this repo, that mostly means API/input safety, dependency/config hygiene, and not letting untrusted upstream behavior leak through the system unchecked.

## Use With

- `graphql-change` — when resolver inputs, mapper behavior, or error handling are changing.
- `planning-and-task-breakdown` — when boundary-sensitive work should be explicit in the plan.
- `pr-review` — when review needs a deeper safety pass than the default checklist.

## When to Use

- A task changes GraphQL resolver inputs or query arguments.
- A task touches API boundaries, upstream transport, mappers, or error handling.
- A task adds or changes a dependency.
- A task changes shared repo config, scripts, or environment-variable behavior.
- A reviewer needs a deeper boundary-safety pass than `pr-review` alone.

## When NOT to Use

- Pure copy or documentation edits with no config or behavior change.
- UI-only styling changes that do not affect data flow, dependencies, or shared config.
- Performance-only work where the main concern is loading behavior rather than trust boundaries.

## Process

Work from the boundary inward: identify the trust edge first, then confirm the change still respects it.

### 1. Identify the Boundary

First decide what boundary the change touches:

- **Web -> API**: frontend must stay behind GraphQL
- **Resolver -> datasource**: validate and bound inputs before I/O
- **Datasource -> upstream**: treat upstream responses as untrusted
- **Repo -> contributor environment**: shared config and dependencies affect everyone

If the change does not touch a meaningful boundary, note that and move on.

### 2. Check Input and Query Safety

For API-facing changes, confirm:

- resolver inputs are validated before I/O
- array inputs are de-duplicated and capped
- exceed-limit behavior returns `BAD_USER_INPUT`
- query shape does not allow accidental unbounded work

For frontend changes, confirm:

- `apps/web` still uses GraphQL only
- no direct upstream access is introduced
- no client-side code takes on upstream-shape normalization that belongs in the API

### 3. Check Untrusted Data Handling

For upstream-facing changes, confirm:

- upstream payloads are normalized in mappers before downstream use
- malformed data is dropped where partial valid data is allowed
- raw upstream/internal errors do not leak directly through GraphQL responses
- existing error-code mapping remains intact

### 4. Check Dependency and Config Safety

If the change adds or modifies a dependency:

- ask whether the existing stack already solves the problem
- check whether the dependency increases bundle size or runtime surface area
- check whether the dependency is justified for this MVP

If the change modifies shared config:

- confirm it reflects a repo-wide need rather than a personal preference
- confirm docs are updated if contributors need to know about it

### 5. Record Security-Relevant Notes

During triage:

- call out boundary-sensitive areas in the plan
- note dependency or config risk explicitly

During implementation:

- preserve existing boundary rules
- keep fixes minimal and explicit

During review:

- raise a finding when a boundary is weakened, not just when code “looks risky”

## Repo-Specific Focus Areas

### GraphQL Boundary

- `apps/web` should consume data only through GraphQL.
- Public GraphQL field names are contract surface.
- Resolver input limits are part of the security posture, not just a performance optimization.

### Upstream Data

- Upstream FPL data is not a trusted internal source.
- Mappers should remain the normalization point.
- Invalid upstream payloads should map to the documented error contract or be dropped where partial valid data is expected.

### Shared Config and Dependencies

- `.vscode/settings.json`, workflow files, scripts, and repo-level config affect every contributor.
- New dependencies should be rare and justified.

## Common Rationalizations

- "This app is read-only, so security is not relevant" — Boundary validation, dependency hygiene, and safe error behavior still matter.
- "The upstream API is trusted enough" — External data should still be treated as untrusted at the boundary.
- "This config tweak is just for convenience" — Shared config changes affect every contributor and deserve review.
- "The limit is only a performance concern" — Input caps are also protection against accidental abuse and contract drift.

## Red Flags

- Direct upstream calls from `apps/web`
- Resolver array inputs without de-duplication and caps
- Raw upstream/internal errors leaking without the repo error contract
- Normalization logic moving out of mappers into ad hoc downstream code
- New dependency added without a clear repo-level justification
- Shared config change that looks like a personal preference rather than a repo need

## Verification

This skill is complete when:

- [ ] The affected trust boundary has been identified.
- [ ] Resolver inputs remain validated, de-duplicated, and bounded where required.
- [ ] Upstream data remains normalized at the API boundary.
- [ ] Error handling still matches the repo contract.
- [ ] Any new dependency or shared-config change is explicitly justified.
- [ ] Security-relevant risks are called out in the plan, implementation notes, or review findings when applicable.
