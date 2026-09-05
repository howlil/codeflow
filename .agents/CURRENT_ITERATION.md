# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M13 - Evidence-First Graph UI

## Product Outcome Delivered

The M12 graph-first product now reads as a compact developer workbench rather than a multi-pane analysis dashboard. The semantic graph is the dominant plane, graph projection controls are contextual, source/evidence inspection remains readable, and narrow layouts preserve the complete comprehension task instead of hiding the inspector.

The resulting interaction hierarchy is:

```text
REPOSITORY + ENTRY + SEARCH
  -> GRAPH FOCUS
  -> CODE / STRUCTURE / PACKAGE PROJECTION
  -> RELATIONSHIP LENS
  -> SELECT NODE OR EDGE
  -> TRACE / SOURCE / RELATIONSHIPS / EVIDENCE
  -> REFOCUS OR ASSESS DEPENDENTS
```

## Completed Slices

- S1 removed the persistent graph navigation rail and moved semantic level/lens controls into the graph toolbar.
- S2 strengthened repository, entry-point, focus, search, and projection hierarchy without creating new product modes.
- S3 made the inspector task-oriented: primary incoming/outgoing trace actions first, quieter secondary operations, readable source, relationship evidence, and node-level evidence.
- S4 raised active-workspace typography to readable developer-tool density and removed 8–9px operational text from the graph work surface.
- S5 flattened the graph workspace around alignment, 1px dividers, neutral panes, and restrained steel-blue focus; ordinary graph surfaces no longer depend on card/elevation treatment.
- S6 preserved inspector/task completion on narrow layouts by placing the inspector below the graph instead of hiding it.
- S7 aligned durable `DESIGN.md` with the evidence-first graph interaction model and verified the existing graph-first regression contract.

## Evidence / Reference Direction

- GitHub code navigation: symbol search and definition/reference navigation stay anchored to the code-reading task rather than becoming separate dashboards.
- Sourcegraph code navigation: selected symbols expose contextual navigation/reference evidence without forcing a context switch.
- VS Code call hierarchy: incoming/outgoing relationships are progressive and anchored on a selected function rather than rendering an unrestricted repository graph.

References informed interaction behavior only; CodeFlow retains its own compact neutral visual language and semantic truth model.

## Boundaries Preserved

- Existing graph-first M12 product behavior and analysis/API semantic contracts remain unchanged.
- No new product modes, analytics dashboards, AI, persistence, auth, runtime execution, graph database, or decorative visualization features were added.
- Source/evidence truth and static-analysis boundaries remain explicit.
- The canvas remains a bounded semantic navigator, not a free-form editor or physics graph.
- Existing dark/light neutral tokens and restrained steel-blue focus remain authoritative.

## Verification

Canonical CI #257 on exact runtime head `32c0e1a2e93c6adca6be33faf8c02a4a6c9ea5af` passed:

- formatting;
- lint;
- production build;
- 15/15 web behavior tests.

Production Compose gates were correctly skipped because the milestone changes only the frontend interaction/design layer and agent knowledge.
