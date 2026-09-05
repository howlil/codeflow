# Current Iteration

Status: IN_PROGRESS

Active Milestone: M12 - Graph-First CodeFlow

## Product Outcome

Replace the multi-workspace analysis-suite interaction with one graph-first CodeFlow experience where a developer can start from an entry point or symbol and progressively follow calls, references, type relationships, dependencies, source evidence, dependents, and pull-request changes without switching among Explore, Flow, Impact, Architecture, Package, or Change workspaces.

## Slices

- S1 product/design contract reset to the graph-first product definition.
- S2 unified client semantic graph projection across code, structure, packages, evidence, and change state.
- S3 single graph shell replacing Explore / Flow / Impact as primary surfaces.
- S4 first-class entry-point navigation and semantic search.
- S5 progressive incoming/outgoing expansion, focus, collapse, and semantic zoom.
- S6 Calls / References / Dependencies / Types relationship lenses.
- S7 graph-native downstream impact traversal.
- S8 pull-request changes as an overlay on the same graph plus selected-function change details.
- S9 remove superseded primary-surface UI, add graph-first regressions, run canonical gates, and merge.

## Boundaries

- Preserve existing API and analysis-core semantic contracts unless implementation evidence proves a change is necessary.
- Static relationships remain static; no runtime-execution claims.
- Evidence kinds remain distinguishable.
- Do not add AI, persistence, auth, graph database, runtime execution, or unrelated infrastructure.
- Large repositories remain bounded and progressively disclosed.

## Done When

A repository analysis lands directly in one semantic graph; entry points and search navigate it; graph nodes can expand incoming/outgoing relationships and refocus; semantic level and relationship lenses change projection without changing truth; dependents appear as graph paths; pull-request analysis appears as change state over the graph; source/evidence remains inspectable; legacy primary workspaces are no longer part of the user journey; canonical CI is green.
