# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M12 - Graph-First CodeFlow

## Outcome

CodeFlow is now graph-first: repository analysis lands directly in one navigable semantic graph where a developer can start from an entry point or symbol, progressively follow supported calls, references, type relationships, dependencies, source evidence, and dependents, and visualize pull-request changes without switching among separate Explore, Flow, Impact, Architecture, Package, or Change workspaces.

The core product loop is now:

```text
OPEN REPOSITORY
  -> DISCOVER OR SEARCH ENTRY POINT / SYMBOL
  -> CENTER GRAPH ON THAT ENTITY
  -> FOLLOW CALLS / TYPES / REFERENCES / DEPENDENCIES
  -> EXPAND OR COLLAPSE NEIGHBORHOODS
  -> INSPECT SOURCE + EVIDENCE
  -> MOVE FOCUS
  -> BUILD A MENTAL MODEL OF THE CODEBASE
```

## Completed Slices

- S1 reset `PROJECT.md` and `DESIGN.md` around the graph-first product invariant.
- S2 added one client semantic graph projection across code entities, repository structure, package topology, evidence, and pull-request change state.
- S3 replaced the Explore / Flow / Impact primary navigation with one graph shell.
- S4 made entry points and semantic search graph-navigation primitives.
- S5 added bounded progressive incoming/outgoing expansion, both-direction expansion, collapse, focus, and Code / Structure / Packages semantic zoom.
- S6 added All / Calls / References / Dependencies / Types relationship lenses over the same graph truth.
- S7 moved downstream impact into `Show dependents`, rendering bounded dependent paths on the graph.
- S8 moved pull-request analysis into a BASE/HEAD change overlay on the same graph, with selected-function behavior delta available contextually in the inspector.
- S9 removed superseded primary-surface Architecture, Package Topology, Impact, and Change workspaces and replaced their top-level regressions with graph-first behavior coverage.

## Verification Evidence

- PR #34 exact head `84af73824d3175fac080a14cf6ab2b692a690ef9` passed canonical GitHub Actions CI #245 (`33992668112`) before this completion-state update.
- `pnpm format:check` passed.
- `pnpm lint` passed.
- `pnpm build` passed across analysis-core, web, and API.
- web tests passed, including graph model projection, direct graph landing, progressive call expansion, semantic search, semantic zoom, graph-native dependents, pull-request change overlay, behavior-delta inspection, repository acquisition, and retained static-flow regressions.
- Deployment/Compose validation and smoke were correctly skipped because M12 changes product/UI composition rather than deployment surfaces.
- Temporary formatter/fix workflows were removed from the branch before the canonical gate.

## Boundaries Preserved

- Existing API and analysis-core semantic contracts remain authoritative.
- Static relationships remain static; CodeFlow does not claim observed runtime execution.
- Evidence kinds remain distinguishable and missing evidence remains explicit.
- Pull-request BASE/HEAD revision identity and existing semantic change contracts remain intact.
- Impact remains a bounded derived traversal rather than a fabricated canonical relationship.
- No AI, persistence, private auth, runtime execution, graph database, queue, or unrelated infrastructure was added.
- Large repositories remain bounded and progressively disclosed instead of rendering a complete graph by default.

## Next State

Select the next milestone only from a material gap in the graph-first core journey. Do not reintroduce separate analysis workspaces merely because their underlying semantic capabilities still exist.
