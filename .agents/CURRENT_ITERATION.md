# Current Iteration

Status: IN_PROGRESS

Active Milestone: M6 - Repository Architecture & Symbol Navigation

## Outcome

CodeFlow is extending the existing evidence-backed TypeScript flow workspace upward from function/data-flow understanding to repository-level architecture and symbol navigation.

Authorized M6 slices:

- S1 repository structural model: deterministic repository/module/file hierarchy from bounded analyzed source paths.
- S2 module/file dependency graph: source-backed `IMPORTS` and derived cross-module `DEPENDS_ON` relationships.
- S3 generic symbol model: bounded TypeScript functions, methods, classes, interfaces, types, enums, and variables with definition/export evidence.
- S4 definition/reference navigation: source-backed `DEFINES`, `EXPORTS`, `REFERENCES`, `EXTENDS`, and `IMPLEMENTS` relationships.
- S5 architecture to function-flow drill-down: architecture functions connect back into the existing M4/M5 semantic/data-flow workspace when a projected or suggested entry function is available.
- S6 architecture exploration UX: hierarchy expand/collapse, architecture search, relationship inspection, and focused direct-neighborhood exploration.
- S7 production acceptance: analysis-core and web interaction regression coverage plus the existing repository CI gate.

## Boundaries

- Preserve `apps/web -> apps/api -> packages/analysis-core` ownership.
- Existing `CALLS`, function data, static-flow relationships, source evidence, GitHub acquisition, and local repository analysis remain intact.
- No AI explanation, Go/multi-language expansion, private GitHub authentication, persistence, runtime tracing/execution, graph database, queues, collaboration, or framework-specific architecture inference.
- Architecture labels are structural/static only. Missing evidence remains missing rather than being fabricated into product semantics.
