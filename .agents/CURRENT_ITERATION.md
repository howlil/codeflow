# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M10 - Static Behavior Delta Explorer

## Outcome

CodeFlow can now explain how supported static function behavior changes between a frozen pull-request BASE and HEAD revision, connecting actual diff hunks to function contract, static execution/data-flow deltas, downstream impact, and source evidence without claiming runtime equivalence, breakage, safety, or probability.

M10 is integrated on `master`:

- S1 behavior-delta contract: `packages/analysis-core` owns a derived `FunctionBehaviorDelta` projection; no new canonical semantic relationship or evidence kind was introduced.
- S2 function contract delta: declared parameters/types and explicit return expressions are compared across BASE and HEAD.
- S3 static-step delta: supported branch, failure, declaration, alias, read/write, transform, mutation, call, argument, and related static steps are compared as semantic facts.
- S4 data-flow delta: supported static relationships including `READS`, `WRITES`, `MUTATES`, `PASSES_ARGUMENT`, `FLOWS_TO`, and `RETURNS_TO` are compared with their source evidence.
- S5 stable semantic comparison: source-line movement and stable-ID churn do not by themselves create behavior deltas; facts are compared as deterministic semantic multisets.
- S6 added/removed functions: one-sided functions expose only facts from the revision where they exist rather than fabricating a counterpart.
- S7 change workspace: the existing pull-request workspace shows the selected function's BASE → HEAD behavior delta before downstream impact, including evidence and revision-specific source location.
- S8 truthful zero state: no supported static delta is explicitly distinguished from runtime equivalence; unsupported/missing analysis remains governed by existing partial coverage.

## Verification Evidence

- PR #30 exact head `7ade6b76155bf5a42cef70794d5eb412ca089bd9` passed canonical GitHub Actions CI #202 (`33942236475`).
- PR #30 was squash-merged to `master` as `46c37bf0ffe5f6946c7ea3678f14d1139cae88a2`.
- Post-merge canonical GitHub Actions CI #203 (`33942307104`) passed on the exact merge SHA.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- analysis-core: 6 test files / 14 tests passed, including contract, static-flow, location-insensitive comparison, and one-sided function behavior-delta coverage.
- web: 7 test files / 24 tests passed, including the M10 change workspace and M4-M9 regressions.
- API: 5 test files / 18 tests passed, including M7-M9 regressions.
- Total automated regression surface: 56 tests passed.
- Deployment/Compose validation and smoke were correctly skipped because M10 did not modify deployment surfaces.
- Temporary M10 wiring helper and workflow were removed before the canonical PR gate; only canonical `ci.yml` remains.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` remains authoritative; behavior-delta semantics live in analysis-core.
- Behavior delta is a derived comparison of supported static facts from frozen revisions, not observed runtime behavior.
- Location-only movement does not become a semantic behavior change.
- An empty static behavior delta does not mean runtime-equivalent or safe.
- Existing M4-M9 acquisition, topology, architecture, function/data flow, static steps, impact, diff mapping, and relationship delta behavior remain intact.
- No private GitHub auth, AI review/summary, risk score, breakage prediction, runtime tracing/execution, test/deployment prediction, Go/multi-language expansion, persistence, collaboration, CODEOWNERS, vulnerability scanning, or new graph infrastructure was added.

## Next State

Select the next milestone from the highest-value remaining gap in the core program-understanding journey. Do not auto-activate deferred directions merely because they are listed in `PROJECT.md`.
