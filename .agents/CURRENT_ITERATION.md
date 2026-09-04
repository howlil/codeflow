# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M8 - Evidence-Backed Change Impact Explorer

## Outcome

CodeFlow can now turn an explicitly selected package/module/file/symbol/function change scope into bounded, evidence-backed downstream impact without inventing breakage predictions or risk probabilities.

M8 is fully integrated:

- impact scope accepts up to 8 repository/package/code entities;
- direct and bounded transitive impact is derived from existing semantic relationships rather than stored as a new canonical `IMPACTS` relationship;
- traversal is cycle-safe and bounded to depth 1-4;
- multi-seed results are deduplicated while retaining contributing seed identity;
- impact paths preserve the underlying relationship kinds and evidence that justify each result;
- results aggregate affected files, modules, and packages where repository ownership evidence exists;
- the API exposes impact analysis as a thin request-scoped route while `packages/analysis-core` remains the semantic owner;
- the existing semantic workspace supports scope selection, direct/transitive filtering, entity-kind filtering, search, path focus, evidence inspection, and function-flow drill-down;
- partial analysis remains explicit, including the zero-result case: absence from the result set is not presented as a safety guarantee.

## Verification Evidence

- PR #28 clean-head verification: GitHub Actions CI #195 passed on exact head `82c5de38ac93ecf807dc7850048091f0698f0cc5`.
- PR #28 squash-merged to `master` as `ed9ba9d298b0f5dafeef2e7919579fd9a4fe7936`.
- Post-merge GitHub Actions CI #196 passed on `master`.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- `pnpm test` passed across the M4-M8 regression surface, including impact traversal/evidence, impact workspace interaction, API impact routing/bounds, package topology, repository architecture, function/data flow, and existing acquisition behavior.
- Deployment/Compose checks remained skipped because M8 did not modify deployment surfaces.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` ownership remains intact; impact semantics live in analysis-core.
- Impact is a derived query over canonical semantic facts, not a fabricated canonical relationship.
- Repository source and semantic projections remain request-scoped/in-memory.
- Impact results are bounded by known static/configured evidence and never claim runtime breakage, probability, safety, or completeness beyond available evidence.
- Existing M4-M7 repository acquisition, topology, architecture, symbol navigation, function/data flow, static steps, and source evidence remain intact.
- No Git diff/PR ingestion, AI explanation/review, risk score, Go/multi-language expansion, runtime tracing/execution, private GitHub authentication, persistence, CODEOWNERS semantics, vulnerability/deployment impact, collaboration, or new graph infrastructure was added.

## Next State

There is no active implementation milestone. The repository is ready for the next product milestone to be selected from the highest-value remaining gap in the core developer-understanding journey.
