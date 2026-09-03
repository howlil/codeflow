# Current Iteration

Status: ACTIVE

Active Milestone: None

Active Engineering Outcome: Fast, high-signal, risk-proportional CI verification.

Last Integrated Product Outcome: Chatspace-derived CodeFlow design-system foundations and semantic-workbench reshaping merged to `master` in PR #24 (`29ed692f5ca5cc3c5062896bd419927f4cd06d44`).

## Current Position

CodeFlow already has the evidence-backed TypeScript semantic-analysis path, bounded local repository input, semantic workspace, production Compose packaging, and Chatspace-aligned UI foundation.

The current authorized work is reliability/engineering-enabler work, not a new product milestone. Its purpose is to reduce verification latency without reducing confidence.

## CI Shape Being Established

The repository CI should now provide:

- deterministic change-scope detection before expensive setup;
- lightweight verification for `AGENTS.md` / `.agents/**`-only changes;
- full runtime verification for code, dependency, toolchain, workflow, or other runtime-relevant changes;
- separate `format`, `lint`, `build`, and `test` failure boundaries instead of one opaque `pnpm check` step;
- pnpm dependency caching;
- cancellation of superseded CI runs on the same ref;
- Compose validation/smoke only when deployment surfaces change;
- full Compose verification when the CI workflow that owns deployment detection changes.

## Verification State

The prior design merge (`29ed692f5ca5cc3c5062896bd419927f4cd06d44`) was integrated while its `master` CI failed inside the former aggregate `Verify repository` step. That failure is one reason the CI is being made more diagnostic; the gate itself must not be weakened.

This CI optimization is not `VERIFIED` until its own GitHub Actions run proves the new workflow executes successfully. Because `.github/workflows/ci.yml` changes, that run must exercise the full runtime gate and production Compose smoke path.

## Delta

- integrate the optimized CI workflow and canonical testing rules;
- inspect the resulting named CI phase if verification fails;
- fix only the concrete failing boundary without disabling relevant coverage;
- advance state only after green evidence exists.

## Blockers

None before execution. Any failure in the new named steps becomes the concrete blocker to resolve.

## Next Move

Run the new CI on `master`. If green, mark the engineering outcome verified and return repository state to idle. If a named phase fails, fix that exact failure boundary and rerun the focused check plus required integration scope.
