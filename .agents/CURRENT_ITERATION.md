# Current Iteration

Status: IN_PROGRESS

Active Milestone: M13 - Evidence-First Graph UI

## Product Outcome

Make the M12 graph-first product immediately legible as a compact developer tool: the semantic graph dominates the workspace, navigation controls stay contextual to the graph, source/evidence inspection remains readable, and narrow layouts preserve the complete comprehension task instead of hiding the inspector.

The target interaction hierarchy is:

```text
REPOSITORY + ENTRY + SEARCH
  -> GRAPH FOCUS
  -> CODE / STRUCTURE / PACKAGE PROJECTION
  -> RELATIONSHIP LENS
  -> SELECT NODE OR EDGE
  -> TRACE / SOURCE / RELATIONSHIPS / EVIDENCE
  -> REFOCUS OR ASSESS DEPENDENTS
```

## Slices

- S1 remove persistent navigation chrome that competes with the graph and move semantic level/lens controls into the graph toolbar.
- S2 strengthen repository, entry-point, focus, search, and projection hierarchy without creating new product modes.
- S3 make the inspector task-oriented: primary trace actions first, secondary operations quieter, source and evidence readable, relationship evidence explicit.
- S4 raise active-workspace typography to readable developer-tool density; remove 8–9px operational text where it carries meaning.
- S5 flatten surfaces around alignment, 1px dividers, neutral panes, and restrained steel-blue focus; no decorative cards, gradients, glow, or ordinary shadows.
- S6 preserve inspector/task completion on narrow layouts by moving it below the graph instead of hiding it.
- S7 align durable `DESIGN.md`, update focused UI regressions where the interaction contract changed, run canonical gates, and merge.

## Evidence / Reference Direction

- GitHub code navigation: symbol search and definition/reference navigation are anchored to the code-reading task rather than exposed as separate dashboards.
- Sourcegraph code navigation: selected symbols expose contextual navigation/reference evidence without forcing a context switch.
- VS Code call hierarchy: incoming/outgoing relationships are progressive and anchored on a selected function rather than rendering an unrestricted repository graph.

References are used for interaction evidence only; CodeFlow keeps its own neutral compact visual language and existing semantic truth model.

## Boundaries

- Preserve graph-first M12 product behavior and all analysis/API semantic contracts.
- Do not add product modes, analytics dashboards, AI, persistence, auth, runtime execution, graph database, or decorative visualization features.
- Keep source/evidence truth explicit and static-analysis boundaries visible.
- Do not make the canvas a free-form editor or auto-moving physics graph.
- Existing dark/light neutral tokens and restrained steel-blue focus remain authoritative.

## Done When

The post-analysis workspace has no persistent left navigation rail; the graph is the dominant plane; Code/Structure/Packages and relationship lenses remain directly accessible from graph context; selected entities expose readable trace/source/evidence detail; node/edge state remains understandable without color alone; inspector content remains available on narrow layouts; canonical format/lint/build/test gates are green.
