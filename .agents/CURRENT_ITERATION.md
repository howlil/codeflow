# Current Iteration

Status: COMPLETE

Active Milestone: M6 - Repository Architecture & Symbol Navigation

## Outcome

CodeFlow now supports evidence-backed repository orientation above the existing function/data-flow workspace. A developer can move from repository hierarchy and module/file dependencies into symbols, references, and supported function-flow drill-down without leaving the CodeFlow workspace.

All authorized M6 slices are implemented:

- S1 repository structural model: deterministic repository/module/file hierarchy from bounded analyzed source paths.
- S2 module/file dependency graph: source-backed `IMPORTS` and derived cross-module `DEPENDS_ON` relationships.
- S3 generic symbol model: bounded TypeScript functions, methods, classes, interfaces, types, enums, and variables with definition/export evidence.
- S4 definition/reference navigation: source-backed `DEFINES`, `EXPORTS`, `REFERENCES`, `EXTENDS`, and `IMPLEMENTS` relationships.
- S5 architecture to function-flow drill-down: architecture functions connect back into the existing M4/M5 semantic/data-flow workspace when a projected or suggested entry function is available.
- S6 architecture exploration UX: hierarchy expand/collapse, architecture search, relationship inspection, focused direct-neighborhood exploration, and explicit accessible entity labels.
- S7 production acceptance: analysis-core architecture coverage, web interaction regression coverage, and the existing repository CI gate.

## Verification Evidence

- PR #26 runtime verification: GitHub Actions CI #156.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- `pnpm test` passed, including repository architecture projection and architecture workspace interaction tests plus existing M4/M5 regressions.
- Deployment/Compose checks were correctly skipped because M6 does not modify deployment surfaces.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` ownership remains intact.
- Existing `CALLS`, function data, static-flow relationships, source evidence, GitHub acquisition, and local repository analysis remain intact.
- No AI explanation, Go/multi-language expansion, private GitHub authentication, persistence, runtime tracing/execution, graph database, queues, collaboration, or framework-specific architecture inference was added.
- Architecture labels remain structural/static. Missing evidence remains missing rather than being fabricated into product semantics.
