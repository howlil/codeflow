# Current Iteration

Status: IN_PROGRESS

Active Milestone: M14 - Professional Graph Navigation

## Product Outcome

Make the semantic graph behave like a professional code-navigation surface rather than a static diagram: users can keep spatial orientation as the graph grows, selected entities create a clear attention neighborhood, dense relationships remain legible, and source evidence can be inspected without losing graph context.

Target loop:

```text
FIND SYMBOL
-> CENTER FOCUS
-> EXPAND BOUNDED NEIGHBORHOOD
-> READ ONLY RELEVANT RELATIONSHIPS
-> INSPECT SOURCE / EVIDENCE
-> ZOOM / FIT / RECENTER AS NEEDED
-> CONTINUE TRACE
```

## Audit Findings

- The current graph viewport is still primarily `overflow: auto`; it lacks zoom, fit-to-view, and recenter controls.
- Layer ordering is alphabetical rather than relationship-aware, which can create avoidable edge crossing.
- Disconnected nodes are currently assigned one new depth each, producing unnecessary horizontal sprawl.
- All edge labels have equal visibility even when the graph becomes dense.
- Node/edge selection changes border state but does not reduce prominence of unrelated graph content.
- Source snippets show line numbers but do not visually mark the selected entity's source range.

## Evidence Direction

- VS Code Peek deliberately preserves context while inspecting definitions/references instead of forcing a full navigation switch.
- Sourcegraph keeps symbol search, references, definitions, and precise-vs-search-based evidence contextual to the code-reading task.
- JetBrains dependency diagrams support direct movement from diagram entities back to source.
- Sourcetrail is used as a graph-specific shipped reference for central graph + adjacent source inspection and entity-centered exploration.

## Slices

- S1 add compact graph viewport controls for zoom in/out, fit-to-view, and recenter on focus.
- S2 replace naive layer ordering with stable relationship-aware layered ordering and group disconnected entities rather than creating one column per entity.
- S3 add selection-driven neighborhood emphasis so unrelated nodes/edges recede without being removed.
- S4 progressively disclose edge labels in dense graphs while retaining accessible relationship names.
- S5 render source snippets as line-aware source peek with the selected source range visibly marked.
- S6 tune inspector width/responsive breakpoint around readable source inspection while retaining graph dominance.
- S7 update the durable graph design contract, add focused regression coverage for viewport controls, run canonical gates, and merge.

## Boundaries

- No analysis/API/persistence contract changes.
- No graph database, physics simulation, minimap, free-form editing, AI features, or new graph library.
- Preserve deterministic layout and bounded progressive disclosure.
- Do not encode semantic meaning by color alone.
- Continue using existing neutral theme tokens and restrained steel-blue focus state.
