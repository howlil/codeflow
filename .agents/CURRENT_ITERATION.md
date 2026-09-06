# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M15 - Product-Native UX Cleanup

## Product Outcome Delivered

CodeFlow now presents one coherent code-navigation instrument instead of layered aesthetic skins. Entry, graph focus, and inspector selection are visually distinct; acquisition is a compact launcher; inspector actions are progressive and contextual; and motion is reserved for state/spatial continuity rather than repeated selection polish.

The resulting comprehension loop is:

```text
OPEN CODEBASE
-> FIND / CHOOSE SYMBOL
-> FOLLOW CURRENT FOCUS
-> EXPAND ONLY THE NEEDED DIRECTION
-> SELECT NODE OR RELATIONSHIP
-> INSPECT SOURCE + EVIDENCE
-> REFOCUS / TRACE DEPENDENTS WHEN NEEDED
```

## Completed Slices

- S1 removed stacked `workbench.css` and Anthropic skin ownership from runtime, consolidated canonical neutral/terracotta tokens in `index.css`, and tightened shared control/node geometry.
- S2 made Entry, Focus, and Selected explicit independent states: Entry remains the origin marker, Focus is the spatial anchor, and Selected is inspector context.
- S3 reduced acquisition copy, removed redundant projection/relationship metrics, and changed the inspector from a permanent action buffet to contextual progressive actions.
- S4 removed high-frequency inspector slide motion and search scaling while preserving restrained cross-state and graph-node spatial transitions; legacy skin files were removed.

## Boundaries Preserved

- No analysis, API, persistence, graph truth, or repository-selection contract changed.
- No graph database, physics layout, AI feature, or new product capability was added.
- Layout remains deterministic and graph expansion remains bounded and user-directed.
- Selection and relationship meaning remain legible without relying on color alone.
- The visual system is CodeFlow-native: compact, code-oriented, direct, spatially stable, evidence-first, quiet, and precise.

## Verification

Implementation must pass formatting, lint, production build, and web behavior tests before integration. Production Compose validation is not required for this frontend-only milestone.
