# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M9 - Diff-Aware Change Understanding

## Outcome

CodeFlow can now take a public GitHub pull request, freeze its exact base/head repository revisions, map the actual diff onto supported TypeScript semantic entities, and reuse the existing evidence-backed impact engine to explain known downstream relationships and relationship deltas without claiming breakage, safety, risk, or runtime behavior.

All authorized M9 product slices are integrated on `master`:

- S1 public GitHub PR acquisition: exact public PR URLs are validated and read-only metadata, changed files, bounded patches, and immutable base/head SHAs are acquired.
- S2 dual revision analysis: BASE and HEAD are acquired and analyzed independently with existing repository/source/metadata bounds; changed TypeScript paths are prioritized inside the bounded source projection.
- S3 diff-to-semantic mapping: supported unified diff hunks map to analyzed TypeScript/TSX file/symbol locations, with explicit file-level fallback when precise semantic mapping is unavailable.
- S4 automatic impact scope: changed semantic entities become bounded seeds for the existing M8 impact engine; added/current entities use HEAD, removed/previous entities use BASE, and modified entities preserve both revision identities.
- S5 change workspace: the existing product entry flow can open a compact pull-request change workspace instead of introducing a generic PR dashboard.
- S6 dependency-oriented grouping: changed semantic entities are grouped by configured package ownership when available, otherwise by repository directory context.
- S7 diff/evidence/flow drill-down: actual patch text, changed semantic entities, downstream results, evidence paths, and existing function-flow exploration are connected in one user journey.
- S8 relationship delta: supported `CALLS`, `REFERENCES`, `IMPORTS`, `DEPENDS_ON`, `EXTENDS`, and `IMPLEMENTS` relationships are compared across frozen BASE/HEAD snapshots and reported only as added/removed semantic facts.
- S9 truthful partial handling: missing GitHub patches, unsupported changed files, bounded source/tree/diff coverage, and bounded automatic impact scope remain explicit rather than being treated as complete or safe.

## Verification Evidence

- PR #29 exact head `0992327525d3f2e515a538a499b137fc77fc6346` passed canonical GitHub Actions CI #199.
- PR #29 was squash-merged as `dc927761bde4e96b9f4d64c9387b46b805e063d1`.
- Post-merge `master` GitHub Actions CI #200 passed.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- analysis-core: 5 test files / 11 tests passed.
- web: 7 test files / 24 tests passed, including the M9 change workspace and M4-M8 regressions.
- API: 5 test files / 18 tests passed, including public PR acquisition/frozen-revision M9 coverage and M7-M8 regressions.
- Deployment/Compose validation and smoke were correctly skipped because M9 did not modify deployment surfaces.
- Temporary M9 wiring automation was removed before the canonical PR gate; only canonical `ci.yml` remains.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` ownership remains intact; repository-change semantics and impact traversal stay in analysis-core.
- Git diff state is a separate `RepositoryChangeProjection`, not a new semantic `EvidenceKind` and not a fabricated canonical relationship.
- M9 reuses M8 impact semantics instead of creating a second impact engine.
- Public PR acquisition is read-only, bounded, and frozen to immutable base/head SHAs for the analyzed result.
- Repository source, metadata, diff, and both semantic snapshots remain request-scoped/in-memory.
- Unsupported or missing evidence remains partial; no rename heuristic, breakage prediction, risk score, safety claim, runtime observation, or test/deployment prediction is fabricated.
- Existing M4-M8 repository acquisition, topology, architecture, symbol navigation, function/data flow, static steps, source evidence, and hypothetical impact exploration remain intact.
- No private GitHub auth, PR comments/approvals, CODEOWNERS, AI review/summary, Go/multi-language expansion, runtime tracing/execution, persistence, collaboration, vulnerability scanning, or new graph infrastructure was added.

## Next State

Select the next milestone from the highest-value remaining gap in the core program-understanding journey. Do not auto-activate deferred directions merely because they are listed in `PROJECT.md`.
