# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M14 - Professional Graph Navigation

## Product Outcome Delivered

The semantic graph now behaves as a bounded professional code-navigation surface rather than a static diagram. Users can keep spatial orientation as the graph grows, selected entities create a clear attention neighborhood, dense relationships remain legible, and source evidence can be inspected without losing graph context.

The resulting comprehension loop is:

```text
FIND SYMBOL
-> CENTER FOCUS
-> EXPAND BOUNDED NEIGHBORHOOD
-> READ RELEVANT RELATIONSHIPS
-> INSPECT SOURCE / EVIDENCE
-> ZOOM / FIT / RECENTER AS NEEDED
-> CONTINUE TRACE
```

## Completed Slices

- S1 added compact graph viewport controls for Zoom out, Zoom in, Fit graph, and Center focus with a bounded 60–140% zoom range.
- S2 replaced alphabetical-only layer ordering with deterministic relationship-aware ordering, vertically centered smaller layers, and grouped unresolved/disconnected entities instead of assigning one horizontal column per entity.
- S3 added selection-driven attention neighborhoods so selected entities, their direct relationships, and impact paths remain prominent while unrelated visible content recedes without being removed.
- S4 added progressive edge-label disclosure for dense projections while retaining accessible relationship names and keyboard-selectable edges.
- S5 converted the inspector source snippet into a line-aware source peek that visibly marks the selected entity's source range while preserving surrounding context.
- S6 widened the desktop inspector to a source-readable 320–352px and moved it below the graph at a more appropriate constrained-layout breakpoint while retaining graph dominance.
- S7 updated the durable graph design contract and added focused viewport-control regression coverage.

## Evidence Direction

- VS Code Peek informed preserving graph/code context while inspecting definitions and references.
- Sourcegraph informed contextual symbol search, references/definitions, and evidence-oriented code navigation.
- JetBrains dependency diagrams informed direct diagram-to-source continuity.
- Sourcetrail informed entity-centered graph navigation with adjacent source inspection.

References informed interaction behavior only; CodeFlow retains its own compact neutral visual language and static-analysis truth model.

## Boundaries Preserved

- No analysis, API, or persistence contract changed.
- No graph database, physics simulation, minimap, free-form editing, AI feature, or new graph library was added.
- Layout remains deterministic and graph expansion remains bounded and user-directed.
- Selection and relationship meaning are not encoded by color alone.
- Existing neutral theme tokens and restrained steel-blue focus state remain authoritative.

## Verification

Canonical CI #260 on runtime head `4c6cbe1de55281e295eeab5129ccb740584a1dda` passed:

- formatting;
- lint;
- production build;
- web behavior tests, including focused viewport-control coverage.

Production Compose validation and smoke were correctly skipped because M14 changes only the frontend interaction/design layer and agent knowledge.
