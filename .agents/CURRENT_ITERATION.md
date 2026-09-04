# Current Iteration

Status: COMPLETE

Active Milestone: M7 - Workspace & Package Topology

## Outcome

CodeFlow now understands configured TypeScript workspace/package boundaries above the existing repository/module/file/symbol architecture. A developer can move from system topology and internal package dependencies into owned files, symbols, existing function/data flow, and source evidence without leaving the semantic workspace.

All authorized M7 slices are implemented:

- S1 metadata acquisition: bounded `package.json`, `pnpm-workspace.yaml`, and `tsconfig*.json` metadata is acquired separately from TypeScript source for both public GitHub and local repository analysis.
- S2 workspace boundary model: configured Workspace and Package entities are projected from repository metadata without inferring runtime services.
- S3 package identity and ownership: analyzed source files are deterministically mapped to their deepest configured package owner.
- S4 package dependency graph: internal manifest dependencies produce configured `DEPENDS_ON` relationships and supported static imports add verified-static evidence to the same relationship.
- S5 TypeScript alias resolution: bounded `baseUrl`/`paths` mappings can resolve supported source imports into package dependency evidence.
- S6 system topology UX: package topology is shown in the existing semantic workspace above M6 architecture rather than in a separate dashboard.
- S7 dependency exploration: selected packages expose incoming, outgoing, and declared external dependencies while internal topology remains primary.
- S8 cross-layer drill-down: topology opens at the active entry-point package and supports package -> file -> symbol -> existing function-flow navigation.
- S9 truthful partial metadata: invalid, unsupported, or over-limit topology metadata is reported as partial evidence without discarding otherwise valid source analysis.

## Verification Evidence

- PR #27 clean-head verification: GitHub Actions CI #172.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- `pnpm test` passed, including package topology, TypeScript alias evidence, API metadata-boundary coverage, topology workspace interaction, and existing M4-M6 regressions.
- Deployment/Compose checks were correctly skipped because M7 does not modify deployment surfaces.

## Boundaries Preserved

- `apps/web -> apps/api -> packages/analysis-core` ownership remains intact; analysis-core owns workspace/package semantics.
- Source budgets and metadata budgets remain independent and bounded; repository content remains request-scoped/in-memory.
- `configured` package/workspace evidence remains distinct from `verified-static` import evidence and from unavailable runtime evidence.
- Existing M4-M6 GitHub acquisition, repository architecture, symbol navigation, function/data flow, static steps, and source evidence remain intact.
- No AI explanation, Go/multi-language expansion, runtime tracing/execution, microservice inference, endpoint/database/event topology, private GitHub authentication, persistence, collaboration, graph database/queues, vulnerability analysis, CODEOWNERS semantics, or impact analysis was added.
