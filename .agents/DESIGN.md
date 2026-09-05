# CodeFlow Design

`DESIGN.md` is the durable source of truth for CodeFlow interaction and visual design. `PROJECT.md` owns product behavior and scope; `CURRENT_ITERATION.md` owns temporary execution state.

## Canonical Direction

CodeFlow is a **compact graph-first developer tool**. It should feel closer to code navigation and call hierarchy tooling than a SaaS dashboard, analytics suite, free-form diagram editor, or AI wrapper.

The primary visual hierarchy is:

```text
1. semantic graph
2. current entry/focus and graph navigation
3. source/evidence inspector
4. contextual operations and metadata
```

The graph must never be reduced to a small panel between competing dashboards.

## Workspace Model

After analysis, desktop defaults to one bounded work surface:

```text
+--------------------------------------------------------------------------------+
| repository / revision     entry point      search                      actions |
+------------------+-----------------------------------------+-------------------+
| Navigate         |                                         | Inspector         |
| entry points     |             SEMANTIC GRAPH              | identity          |
| semantic level   |                                         | source            |
| relation lens    |     expand / focus / collapse paths     | relationships     |
|                  |                                         | evidence/change   |
+------------------+-----------------------------------------+-------------------+
```

Approximate desktop allocation:

- navigation rail: 180–230px;
- graph: remaining dominant width, normally 60–75%;
- inspector: 280–360px when open.

On narrower screens the navigation and inspector may become drawers, but the graph remains the primary surface.

## Graph Interaction

### Entry and focus

- analysis starts centered on the selected/detected entry point;
- choosing another entry point recenters/reanalyzes the relevant call projection when required;
- semantic search moves graph focus to the selected entity;
- current focus remains visually and textually explicit.

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

Expanding a node reveals only bounded neighboring relationships. Focus resets the local mental model around the selected entity without changing canonical truth.

### Semantic zoom

Architecture is expressed by graph level, not separate pages:

```text
Packages  -> workspace/package dependencies
Structure -> repository/module/file relationships
Code      -> class/type/function/method relationships and call paths
```

Changing level preserves orientation around the owning entity where evidence exists.

### Relationship lenses

Use compact filters for:

```text
All | Calls | References | Dependencies | Types
```

Only lenses backed by relationships actually present should be enabled. Lens state filters projection only.

### Impact

Impact is invoked from a selected entity with `Show dependents`. Direct/transitive dependent paths are added to the graph and visually distinguished. It is not a permanent top-level tab.

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

## Navigation Rail

The left rail exists only to support graph navigation:

- entry points;
- semantic level;
- relationship lens;
- bounded graph status.

Do not turn it into repository analytics or a second file explorer.

## Inspector

The inspector answers: **what is selected, where is it defined, how is it connected, and what proves that relationship?**

Node selection prioritizes:

```text
identity + kind
path/location
incoming/outgoing relationship counts
graph-native actions
source snippet
change state / behavior delta when applicable
```

Edge selection prioritizes:

```text
source -> target
relationship kind
trust/evidence kind
reason/provenance
source location
```

Static data/step detail may be shown contextually for functions but must not displace the core graph interaction.

## Acquisition

Repository visualization is the primary start action. Public GitHub repository input should be visually primary; local repository is secondary but direct.

Pull-request analysis is presented as **visualize changes on the code graph**, not as an equal product mode or review dashboard.

Avoid intent-selection ceremony when the primary product job is already known.

## Information Hierarchy

Use, in order:

1. typography;
2. alignment;
3. compact spacing;
4. 1px dividers;
5. neutral surface contrast;
6. semantic accent/state only when needed.

Do not create hierarchy through stacks of cards, excessive pills, oversized headings, or decorative iconography.

## Anti-Slop Invariants

Do not use:

- gradient backgrounds or borders;
- blue/purple glow;
- decorative glass panels;
- floating card stacks;
- giant rounded containers;
- decorative canvas patterns;
- shadows on ordinary nodes/panes/rows;
- saturated taxonomy colors;
- marketing-style whitespace;
- animation that moves graph topology without user intent.

Motion is limited to purposeful selection, expansion, panel transition, and focus changes.

## Accessibility

- every graph node and edge is keyboard focusable or has an equivalent list/navigation control;
- selection is not encoded by color alone;
- relationship direction and kind are available as text/accessible names;
- search works with keyboard navigation and Escape dismissal;
- all graph-native actions remain available without drag or hover;
- narrow layouts preserve task completion even when graph overflow is required.

## Themes

Both dark and light themes use the existing neutral token system and restrained steel-blue focus/accent. Theme changes must not change semantic meaning.
