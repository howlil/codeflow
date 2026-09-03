# Current Iteration

Status: ACTIVE

Active Milestone: None

Active Engineering Outcome: Fast, high-signal, risk-proportional CI verification.

Last Integrated Product Outcome: Chatspace-derived CodeFlow design-system foundations and semantic-workbench reshaping merged to `master` in PR #24 (`29ed692f5ca5cc3c5062896bd419927f4cd06d44`).

## Current Position

CodeFlow already has the evidence-backed TypeScript semantic-analysis path, bounded local repository input, semantic workspace, production Compose packaging, and Chatspace-aligned UI foundation.

The current authorized work is reliability/engineering-enabler work, not a new product milestone. Its purpose is to reduce verification latency without reducing confidence.

The first CI optimization commit (`502944ab8c080c1728414a877b25c1deeaf3b41e`) already proved the value of named failure boundaries: dependency install, formatting, lint, and build passed, while `Test` failed. The former aggregate `pnpm check` step did not expose that distinction directly.

## CI Shape Being Established

The target repository CI provides:

- complete-change-set scope detection for both PRs and pushes;
- conservative full verification when scope cannot be established safely;
- lightweight verification for `AGENTS.md` / `.agents/**`-only changes;
- build/static verification without Vitest for pure CSS/token styling changes;
- focused `@codeflow/web` tests for web-owned runtime/interaction changes;
- full repository tests for API, analysis-core, root dependency/toolchain/workflow, and mixed-ownership changes;
- separate format, lint, build, and test failure boundaries;
- pnpm dependency caching;
- cancellation of superseded CI runs on the same ref;
- failure-only test diagnostics artifact retained for one day;
- Compose validation/smoke only when deployment surfaces change;
- full Compose verification when the CI workflow that owns deployment detection changes.

## Verification State

The engineering outcome is **not yet VERIFIED**.

Known evidence from the previous CI shape:

- frozen dependency installation: passed;
- formatting: passed;
- lint: passed;
- build: passed;
- test: failed;
- deployment smoke did not run because the failed test stopped downstream steps.

The concrete test assertion was not retrievable from the previous GitHub job output through the available connector. The new workflow therefore preserves the failing test gate and adds a failure-only artifact instead of guessing a patch or weakening coverage.

Because `.github/workflows/ci.yml` changes in the corrective commit, its CI run must take the conservative/full path and exercise full runtime verification plus production Compose smoke after tests pass.

## Delta

- integrate complete-range scope detection and failure diagnostics;
- retrieve the concrete test failure from the diagnostic artifact if the test gate still fails;
- fix only the actual failing behavior/test boundary;
- obtain green format/lint/build/test and required Compose evidence;
- then return repository state to idle with truthful verification evidence.

## Blockers

- existing repository test suite is failing after the design-system integration;
- exact failing assertion remains the only implementation-level blocker; do not infer it from prior Radix hypotheses.

## Next Move

Run CI with the corrected workflow. If `Test` fails, download `test-output.log`, patch the concrete failure, and rerun the focused test plus required integration scope. If the full workflow becomes green, advance state truthfully and verify the lightweight agent-only path with the final state-only update.
