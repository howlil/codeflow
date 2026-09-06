# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M15 - Product-Native UX Cleanup

## Product Outcome Delivered

CodeFlow now behaves and reads as one code-navigation instrument instead of a sequence of aesthetic/demo layers. The landing is a compact repository launcher, Entry/Focus/Selected are independent states, inspector actions are progressive and contextual, and motion is reserved for orientation/state continuity.

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

- S1 removed stacked workbench/Anthropic skin ownership from runtime, reduced global CSS to canonical tokens/shell responsibilities, and tightened technical geometry.
- S2 made Entry, Focus, and Selected explicit independent graph states with separate markers/treatments.
- S3 replaced marketing/demo acquisition with a compact launcher, removed redundant graph metadata, and changed inspector actions from a permanent buffet to contextual progressive actions.
- S4 removed high-frequency inspector/search polish while preserving graph spatial transitions and the honest analysis activity state; superseded skin files were removed.

## Boundaries Preserved

- Public-repository analysis behavior and API contracts are unchanged.
- No graph truth, persistence, analysis engine, or repository-selection contract changed.
- No graph database, physics layout, AI feature, or new product capability was added.
- Deterministic bounded graph expansion remains the core interaction.
- The visual system is CodeFlow-native: compact, code-oriented, direct, spatially stable, evidence-first, quiet, and precise.

## Verification

Formatting, lint, production build, and web behavior tests are required before integration. Production Compose validation is not required for this frontend-only milestone.
