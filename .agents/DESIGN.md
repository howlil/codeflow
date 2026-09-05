# CodeFlow Design

`DESIGN.md` is the durable source of truth for CodeFlow interaction and visual design. `PROJECT.md` owns product behavior and scope; `CURRENT_ITERATION.md` owns temporary execution state.

## Canonical Direction

CodeFlow is a **compact evidence-first graph navigator for developers**. It should feel closer to code navigation, call hierarchy, symbol search, and contextual source inspection than a SaaS dashboard, analytics suite, free-form diagram editor, or AI wrapper.

Design decisions follow this order:

```text
PRODUCT PROBLEM
-> SHIPPED-PRODUCT INTERACTION EVIDENCE
-> REAL CODE-COMPREHENSION FLOW
-> COMPONENT / ACCESSIBILITY CONVENTIONS
-> EXISTING CODEFLOW DESIGN TOKENS
-> VISUAL CRAFT
```

Visual novelty is not a goal. Product clarity is.

The primary visual hierarchy is:

```text
1. semantic graph + current focus
2. repository / entry point / semantic search
3. graph projection controls
4. contextual source / relationship / evidence inspector
5. secondary graph operations and metadata
```

The graph must never be reduced to a small panel between competing navigation, analytics, or dashboard surfaces.

## Product References

Use shipped products as behavioral evidence, not as skins to copy.

### GitHub code navigation

Borrow:

- symbol search anchored to the code-reading task;
- direct navigation to definitions/references;
- contextual information instead of separate analysis dashboards.

### Sourcegraph code navigation

Borrow:

- symbol-centered navigation;
- contextual references/evidence without unnecessary context switching;
- clear distinction between precise/static evidence and heuristic fallback.

### VS Code call hierarchy

Borrow:

- selected-function anchoring;
- explicit incoming vs outgoing calls;
- progressive drill-down instead of rendering an unrestricted repository graph;
- source peek/inspection without losing orientation.

Do not copy their branding, chrome density, colors, or layout literally.

## Workspace Model

After analysis, desktop defaults to one bounded operational work surface:

```text
+--------------------------------------------------------------------------------+
| repository / revision     entry point        semantic search           actions |
+---------------------------------------------------------------+----------------+
| focus + projection controls                                  | Inspector      |
|                                                               | identity       |
|                       SEMANTIC GRAPH                          | trace actions  |
|                                                               | source         |
|        bounded expand / collapse / focus / dependents         | relationships  |
|                                                               | evidence/change|
+---------------------------------------------------------------+----------------+
```

There is **no permanent left navigation rail**. Entry point, semantic level, and relationship lens are graph context, not separate navigation destinations.

Approximate desktop allocation:

- graph plane: normally 75–80% of usable width;
- inspector: normally 286–320px;
- context and projection controls: one compact row each where viewport width allows.

On narrower screens the inspector moves below the graph. It must not disappear because source/evidence inspection is part of the core task.

## Core User Flow

The default comprehension loop is:

```text
OPEN REPOSITORY
-> CHOOSE / ACCEPT ENTRY POINT
-> SEARCH OR FOLLOW CURRENT FOCUS
-> EXPAND INCOMING / OUTGOING RELATIONSHIPS
-> SELECT NODE OR EDGE
-> INSPECT SOURCE + RELATIONSHIP + EVIDENCE
-> FOCUS OR SHOW DEPENDENTS
-> CONTINUE BUILDING THE MENTAL MODEL
```

Controls should be placed where they answer the next question in that loop.

## Graph Interaction

### Entry and focus

- analysis starts centered on the selected/detected entry point;
- choosing another entry point recenters/reanalyzes the relevant call projection when required;
- semantic search moves graph focus to the selected entity;
- current focus remains visually and textually explicit;
- search remains keyboard-first and supports Escape dismissal.

### Progressive disclosure

Never render the entire repository graph by default.

A selected node supports graph-native actions where applicable:

```text
Expand outgoing
Expand incoming
Show both
Collapse branch
Focus here
Trace calls from here
Show dependents
```

`Expand outgoing` and `Expand incoming` are primary trace actions. `Show both`, `Collapse branch`, focus, impact, and re-tracing are quieter contextual operations.

Expanding a node reveals only bounded neighboring relationships. Focus resets the local mental model around the selected entity without changing canonical truth.

### Semantic zoom

Architecture is expressed by graph level, not separate pages:

```text
Packages  -> workspace/package dependencies
Structure -> repository/module/file relationships
Code      -> class/type/function/method relationships and call paths
```

The three levels are directly accessible in the graph toolbar. Changing level preserves orientation around the owning entity where evidence exists.

### Relationship lenses

Relationship filtering is secondary to semantic level and should use one compact control:

```text
All | Calls | References | Dependencies | Types
```

Only lenses backed by relationships actually present should be enabled. Lens state filters projection only; it never changes semantic truth.

### Impact

Impact is invoked from a selected entity with `Show dependents`. Direct/transitive dependent paths are added to the graph and visually distinguished. It is not a permanent top-level tab or analytics panel.

### Pull-request overlay

Pull requests reuse the same graph. Change state is an overlay:

- added;
- modified;
- removed;
- unchanged.

Change state must be legible through text/symbol/border treatment, not color alone. Selecting a changed function may expose its BASE -> HEAD behavior delta in the inspector. Do not switch to an analytics dashboard merely because change metadata exists.

## Node Language

Nodes are compact semantic objects, not cards.

Prefer:

- rectangular geometry with 3–5px radius;
- neutral 1px stroke;
- code identifier as the strongest text;
- kind and repository-relative path as secondary metadata;
- no ordinary shadow;
- restrained selected/focus treatment using the steel-blue accent;
- visible entry-point marker;
- subtle added/modified/removed marker when a change overlay is active.

Focus and selection may use a steel-blue border/inset rule. Impact may use a quiet active neutral surface. Avoid double borders, glow, and saturated category colors.

## Edge Language

Relationship meaning must remain understandable without color:

```text
solid  -> verified/configured static evidence
dashed -> inferred static relationship
dotted -> evidence unavailable / change-only relationship
```

Edges carry concise relationship labels. Direction is explicit. Avoid arbitrary physics layouts that move continuously; stable deterministic spatial orientation is more important than decorative graph motion.

## Canvas Plane

Use a quiet neutral plane with pane boundaries. No glow, gradient fog, decorative dot-grid wallpaper, giant empty margins, or generic node-editor chrome.

Horizontal/vertical overflow is acceptable for a graph larger than the viewport. The user must retain a stable focus anchor and a clear way to recenter.

## Context Bar

The top context bar owns only orientation and high-frequency navigation:

```text
repository / revision
entry point
semantic search
change repository
```

Do not duplicate entry points or graph projection controls in a permanent side rail.

Repository metadata stays subordinate to the current graph task.

## Projection Toolbar

The graph toolbar owns:

- current focus identity;
- current semantic level;
- current relationship lens;
- visible/available node count;
- bounded dependents status when active.

Semantic level is a compact three-option switch. Relationship lens is one compact selector. Do not surface eight equally weighted toolbar buttons when two controls communicate the hierarchy more clearly.

## Inspector

The inspector answers: **what is selected, where is it defined, how is it connected, what can I trace next, and what proves the relationship?**

Node selection prioritizes:

```text
identity + kind
path/location
incoming/outgoing counts
primary trace actions
secondary focus/impact operations
source snippet
behavior delta when applicable
relationships
evidence
```

Edge selection prioritizes:

```text
source -> target
relationship kind
change state when applicable
trust/evidence kind
reason/provenance
source location
```

Relationship rows are selectable because evidence belongs to a specific relationship. Node-level evidence should also be shown when available.

The inspector is a narrow reading surface, not a dashboard. Avoid metric cards, equal-weight action grids, and decorative section containers.

## Typography & Density

Compact does not mean tiny.

Default active-workspace targets:

- body/control text: 11–12px;
- code identifiers: 11–12px monospace;
- meaningful metadata: 10–11px;
- section labels: 10px when uppercase is necessary;
- avoid 8–9px text for operational information.

Hierarchy should come from weight, alignment, spacing, and contrast before font-size jumps.

## Acquisition

Repository visualization is the primary start action. Public GitHub repository input should be visually primary; local repository is secondary but direct.

Pull-request analysis is presented as **visualize changes on the code graph**, not as an equal product mode or review dashboard.

The acquisition surface is setup, not marketing: no hero-sized typography, feature-card grid, or promotional whitespace.

## Information Hierarchy

Use, in order:

1. typography;
2. alignment;
3. compact spacing;
4. 1px dividers;
5. neutral surface contrast;
6. semantic accent/state only when needed.

Do not create hierarchy through stacks of cards, excessive pills, oversized headings, nested neutral cards, or decorative iconography.

## Visual Language

CodeFlow is technical, dense but calm, precise, spatial, and evidence-oriented.

- dark/light neutral themes;
- restrained steel-blue focus/accent;
- flat first-level panes;
- true overlays may use a shadow;
- ordinary panes, nodes, rows, and controls do not use elevation;
- no rainbow semantics;
- no decorative gradients or glow;
- no glass treatment on ordinary workspace chrome.

## Motion

Motion exists only to communicate state or spatial relationship:

- selection/focus transition;
- bounded expansion/collapse;
- inspector/pane transition when needed.

Do not animate graph topology for decoration. Respect `prefers-reduced-motion`.

## Responsive Behavior

Narrow layouts preserve completion of the same task.

- context controls may wrap vertically;
- projection controls may wrap/stack;
- graph remains the first and largest work surface;
- inspector moves below the graph with bounded height and its own scroll;
- never hide source/evidence inspection solely because viewport width is narrow.

## Anti-Slop Invariants

Do not use:

- generic SaaS dashboard/card grids;
- nested cards for ordinary sections;
- gradient backgrounds or borders;
- blue/purple glow;
- decorative glass panels;
- floating card stacks;
- giant rounded containers;
- decorative canvas patterns;
- shadows on ordinary nodes/panes/rows;
- saturated taxonomy colors;
- marketing-style whitespace;
- fake metrics or activity widgets;
- ornamental animation;
- animation that moves graph topology without user intent.

## Accessibility

- every graph node and edge is keyboard focusable or has an equivalent navigation path;
- selection is not encoded by color alone;
- relationship direction and kind are available as text/accessible names;
- search works with keyboard navigation and Escape dismissal;
- all graph-native actions remain available without drag or hover;
- disabled projection/lens choices remain semantically disabled;
- narrow layouts preserve source/evidence task completion.

## Themes

Both dark and light themes use the existing neutral token system and restrained steel-blue focus/accent. Theme changes must not change semantic meaning.
