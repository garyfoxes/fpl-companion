---
name: performance-optimization
description: Keep changes aligned with this repo's loading, query, and bundle-performance conventions. Use when a task affects GraphQL query shape, list behavior, lazy-loading, caching, or perceived loading performance.
---

# Performance Optimization Skill

## Overview

Use this skill when a change could affect how quickly `fpl-companion` loads, fetches, or renders data.

In this repository, the most important performance concerns are:

- keeping page-level lazy-loading intact,
- avoiding over-fetching in GraphQL queries,
- preventing unbounded list/query behavior,
- preserving stable bundle splitting,
- avoiding unnecessary query waterfalls or duplicate fetches,
- keeping cache/readiness behavior sensible on the API side.

This skill is not about speculative micro-optimizations. It is about preserving the repo’s existing performance guardrails and spotting obvious regressions early.

Think of this as the "protect the loading path" skill. It is less about squeezing every millisecond out of the app and more about avoiding obvious regressions in query shape, route loading, and cache behavior.

## Use With

- `graphql-change` — when query documents, resolvers, or list behavior are changing.
- `playwright-smoke` — when a route or user-visible loading path changes.
- `pr-review` — when review needs a deeper performance pass than the default checklist.

## When to Use

- A task changes GraphQL query documents or resolver query behavior.
- A task affects list views, detail views, filters, or pagination.
- A task touches page loading, route loading, or `React.lazy()` behavior.
- A task changes caching, readiness, or upstream fetch behavior in the API.
- A reviewer needs a deeper performance pass than `pr-review` alone.

## When NOT to Use

- Pure documentation or copy changes.
- Small internal refactors with no behavior or data-flow impact.
- Changes where correctness and safety are the real concern and no loading/query behavior changes.

## Process

Start by identifying what kind of performance surface the task touches, then check only the conventions that matter for that surface.

### 1. Identify the Performance Surface

Decide what kind of performance-sensitive change this is:

- **Query shape**: fields requested, arguments added, duplicate queries introduced
- **List behavior**: filtering, limits, pagination, sorting
- **Route loading**: lazy-loaded pages, bundle splitting, preview/Lighthouse assumptions
- **API fetch behavior**: cache, stale fallback, repeated upstream calls

If the change does not touch any of these, note that and move on.

### 2. Check for Over-Fetching or Unbounded Work

For GraphQL and API changes, confirm:

- queries request only the fields the UI uses
- list-oriented behavior remains bounded
- resolver inputs do not allow accidentally unbounded fetch work
- no avoidable duplicate upstream or client queries were introduced

If a query or list became broader, make sure the change is intentional and justified.

### 3. Check Frontend Loading Behavior

For frontend changes, confirm:

- page-level `React.lazy()` loading remains intact
- named-export lazy-loading patterns are preserved
- no route was converted to an eager import without a good reason
- loading, error, and empty states still support perceived performance and avoid blank screens

### 4. Check Bundle and Dependency Impact

If a dependency or large feature was added, ask:

- does the existing stack already solve this?
- does this increase bundle size or runtime work?
- does it affect initial page load or route-level loading?

For repo-level performance conventions, confirm that Vite vendor chunking was not casually weakened.

### 5. Check API Cache and Fetch Behavior

For API-side changes, confirm:

- cache/readiness behavior still makes sense
- repeated upstream calls are not introduced where cached or shared behavior already exists
- stale fallback behavior is not accidentally broken

### 6. Record Performance-Relevant Notes

During triage:

- note whether the task changes query shape, list size, lazy-loading, or cache behavior

During implementation:

- preserve existing performance conventions unless the task explicitly changes them

During review:

- call out regressions in query shape, route loading, or unbounded behavior as findings

## Repo-Specific Focus Areas

### Frontend

- Page-level components should remain lazy-loaded.
- GraphQL query documents should stay minimal.
- Loading/error/empty states are part of perceived performance, not just UX polish.

### API

- Resolver inputs should remain bounded.
- Datasource and cache behavior should avoid redundant upstream work.
- Partial valid data and stale fallback behavior can improve resilience and perceived performance.

## Common Rationalizations

- "This query is small today, so performance is not a concern" — Over-fetching and unbounded behavior are easier to prevent than unwind later.
- "It only adds one more field" — Extra fields are fine when intentional, but query shape should still reflect what the UI actually needs.
- "Eager-loading this route is simpler" — Simpler code is not automatically better if it breaks established route-loading behavior.
- "The cache is probably still fine" — Cache and fallback behavior should be checked, not assumed.

## Red Flags

- GraphQL query requests fields the UI does not use
- List or resolver behavior becomes unbounded without a reason
- New duplicate query/fetch path for the same data
- Route-level component changed from lazy to eager loading without justification
- Vendor chunking or preview/Lighthouse assumptions weakened casually
- API cache or stale-fallback behavior changed without validation

## Verification

This skill is complete when:

- [ ] The affected performance surface has been identified.
- [ ] Query shape and list behavior remain appropriately bounded.
- [ ] Lazy-loading and route-loading conventions remain intact where relevant.
- [ ] No obvious duplicate fetches or unnecessary query waterfalls were introduced.
- [ ] Cache/readiness behavior still makes sense for API-side changes.
- [ ] Performance-relevant risks are called out in the plan, implementation notes, or review findings when applicable.
