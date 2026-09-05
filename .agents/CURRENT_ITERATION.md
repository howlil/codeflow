# Current Iteration

Status: COMPLETE

Last Completed Milestone: M11 - Clear Entry Intent & Truthful Static Flow

## Outcome

CodeFlow now makes the user's task explicit before acquisition and presents function exploration with terminology that matches the static-analysis contract. Repository comprehension and pull-request review no longer compete as simultaneous setup surfaces, and function relationships are presented as a bounded static call neighborhood rather than implying runtime request execution.

## Delivered

### S1 - Intent-first acquisition

- Initial setup asks `What do you need to understand?` before showing any repository or pull-request form.
- User explicitly chooses `Understand repository` or `Review change`.
- Only the form required for the selected task is rendered.
- Local repository input remains a secondary option scoped to repository comprehension.
- `Choose another task` returns to intent selection without introducing another navigation surface.

### S2 - Truthful static flow

- Function exploration is named `Static call neighborhood` / `<entry> call neighborhood` instead of `request flow`.
- The Flow surface explicitly states that relationships are projected static evidence and not runtime execution.
- `Verified static`, `Inferred static`, and `No evidence` are visible in human-readable form.
- Solid/dashed relationship semantics remain aligned with the existing evidence contract.
- Focus recovery is described as `Back to entry neighborhood`.

### S3 - Contract verification

- App regression coverage verifies intent gating, task-specific acquisition, truthful flow terminology, and visible evidence trust states.
- Existing repository exploration, inspector, source evidence, keyboard navigation, empty/partial analysis, and local repository failure behavior remain covered.
- No backend, API, persistence, analysis-core, or canonical semantic relationship/evidence contracts changed.

## Verification Evidence

- PR #33 canonical GitHub Actions CI #225 (`33989081334`) passed on head `17ddee05d1615b767c14fa5e4753dd0c098c9989` before this iteration-state-only update.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed.
- Web regression tests passed.
- Deployment/Compose validation and smoke were correctly skipped because M11 does not modify deployment surfaces.
- Temporary implementation/test helper workflows were removed before the canonical behavior gate.

## Boundaries Preserved

- Evidence remains authoritative.
- Static analysis does not imply observed runtime execution, branch outcome, safety, breakage, probability, or completeness.
- `apps/web -> apps/api -> packages/analysis-core` ownership remains unchanged.
- Existing Explore / Flow / Impact and pull-request Change Workspace capabilities remain intact.
- No new product capability, backend contract, graph primitive, persistence model, or architecture boundary was introduced.

## Next State

M11 is complete. Select the next milestone only from a material remaining gap in the core program-understanding journey.
