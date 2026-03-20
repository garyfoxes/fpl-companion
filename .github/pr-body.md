## Summary

- **F1 — Players column sort**: Added `PlayerOrderField` enum and `PlayerOrderBy` input to the GraphQL schema. Wired `sortPlayers` helper into the `players` resolver. `PlayersPage` grows `TableSortLabel` headers on Total Points, Form, and Price columns; sort state is persisted to URL (`sortField`/`sortDir` params).
- **F2 — Fixture Difficulty Rating (FDR) visualization**: Added `DifficultyChip` component with colour-coded backgrounds (green → red, FDR 1–5). New "H Diff" and "A Diff" columns on the Fixtures table.
- **F3 — Player comparison panel**: Added `playersByIds(ids: [Int!]!)` GraphQL query. New `ComparisonPanel` component shows a side-by-side stat table for up to 3 players. Players are selected via checkbox on the Players table; selection persisted to URL (`compare` param). Added `readIntArrayParam` URL-state helper.
- **F4 — Dashboard "this gameweek" widgets**: `DASHBOARD_QUERY` now fetches aliased `topScorers` and `mostTransferred` player lists. `DashboardPage` renders two new cards below the gameweek summary.
- **F5 — Richer Team detail panel**: `TEAM_QUERY` extended to fetch W/D/L/points and all six FPL strength ratings. `TeamsPage` detail panel shows Played (computed), Win, Draw, Loss, Points, and all Strength rows.
- **ESLint hardening**: Added `no-nested-ternary`, `no-negated-condition`, and `prefer-optional-chain` rules. Fixed all pre-existing violations. Corrected `Linter.FlatConfig[]` → `Linter.Config[]` JSDoc annotation.
- **Docs / agent improvements**: Updated `AGENTS.md` (no-duplicate-exports convention), `implementer.agent.md` (file-integrity self-check step), and three `SKILL.md` files (Apollo mock variable matching, `responseFor` new-query pattern, PR review Apollo mock check).

## Linked Issue

Closes #

## Screenshots (if UI changes)

> UI changes affect: Players table (sort labels + comparison panel + checkbox column), Fixtures table (H Diff / A Diff columns with coloured chips), Dashboard page (Top Scorers / Most Transferred cards), Teams detail panel (W/D/L/Points/Strength rows).
> Please add before/after screenshots or a short screen recording before merging.

## How To Test

- [ ] `npm run format`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:e2e:smoke`
- [ ] Documentation impact reviewed; updated `README.md` and/or `AGENTS.md` when scripts, env vars, architecture, or conventions changed
- [ ] Manual validation notes added below

**Manual steps:**

1. `npm run dev` (or `npm run preview`) → navigate to `/players` → click "Total Points" header → confirm rows re-order and `aria-sort` attribute updates.
2. On `/players` check two player checkboxes → click Compare button → confirm comparison panel renders.
3. Navigate to `/fixtures` → confirm "H Diff" and "A Diff" columns appear with coloured chips.
4. Navigate to `/` → confirm "Top Scorers this Gameweek" and "Most Transferred In" cards are visible.
5. Navigate to `/teams` → click a team → confirm Win, Draw, Loss, Points, and Strength Attack (H) rows appear in the detail panel.

## Risk Assessment

- **User impact**: Additive-only changes (new columns, new cards, new detail rows). Existing layouts are not removed.
- **Rollback strategy**: Revert this PR. No schema migrations or persistent storage changes; the API remains stateless.
- **Known limitations**: Comparison panel supports up to 3 players (enforced client-side). FDR chips use static FPL colour values — if FPL changes the scale the chip colours will need updating.

## Reviewer Checklist

- [ ] Scope matches linked issue
- [ ] Tests cover happy path + edge cases
- [ ] Error states and empty states are handled
- [ ] Documentation updated (`README.md`, `AGENTS.md`) when needed
