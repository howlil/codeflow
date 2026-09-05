# Current Iteration

Status: VERIFYING

Active Milestone: M10 - Static Behavior Delta Explorer

Last Completed Milestone: M9 - Diff-Aware Change Understanding

## Outcome

CodeFlow can now explain how supported static function behavior changes between a frozen pull-request BASE and HEAD revision, connecting actual diff hunks to function contract, static execution/data-flow deltas, downstream impact, and source evidence without claiming runtime equivalence, breakage, safety, or probability.

M10 is implemented on the milestone branch:

- S1 behavior-delta contract: `packages/analysis-core` owns a derived `FunctionBehaviorDelta` projection; no new canonical semantic relationship or evidence kind was introduced.
- S2 function contract delta: declared parameters/types and explicit return expressions are compared across BASE and HEAD.
- S3 static-step delta: supported branch, failure, declaration, alias, read/write, transform, mutation, call, argument, and related static steps are compared as semantic facts.
- S4 data-flow delta: supported static relationships including `READS`, `WRITES`, `MUTATES`, `PASSES_ARGUMENT`, `FLOWS_TO`, and `RETURNS_TO` are compared with their source evidence.
- S5 stable semantic comparison: source-line movement and stable-ID churn do not by themselves create behavior deltas; facts are compared as deterministic semantic multisets.
- S6 added/removed functions: one-sided functions expose only facts from the revision where they exist rather than fabricating a counterpart.
- S7 change workspace: the existing pull-request workspace shows the selected function's BASE → HEAD behavior delta before downstream impact, including evidence and revision-specific source location.
- S8 truthful zero state: no supported static delta is explicitly distinguished from runtime equivalence; unsupported/missing analysis remains governed by existing partial coverage.

## Verification Evidence

- Temporary M10 integration run #3 (`33942107355`) passed formatting, lint, build, and full automated tests before helper cleanup.
- analysis-core: 6 test files / 14 tests passed, including contract, static-flow, location-insensitive comparison, and one-sided function behavior-delta coverage.
- web: 7 test files / 24 tests passed, including the M10 change workspace and M4-M9 regressions.
- API regression suite remained part of the recursive repository test gate after web/core success.
- Temporary M10 wiring helper and workflow were removed after the green integration pass.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` remains authoritative; behavior-delta semantics live in analysis-core.
- Behavior delta is a derived comparison of supported static facts from frozen revisions, not observed runtime behavior.
- Location-only movement does not become a semantic behavior change.
- An empty static behavior delta does not mean runtime-equivalent or safe.
- Existing M4-M9 acquisition, topology, architecture, function/data flow, static steps, impact, diff mapping, and relationship delta behavior remain intact.
- No private GitHub auth, AI review/summary, risk score, breakage prediction, runtime tracing/execution, test/deployment prediction, Go/multi-language expansion, persistence, collaboration, CODEOWNERS, vulnerability scanning, or new graph infrastructure was added.

## Next State

Run canonical pull-request CI on the clean exact M10 branch. If green, squash-merge, verify `master`, then mark the repository `READY_FOR_MILESTONE`.
