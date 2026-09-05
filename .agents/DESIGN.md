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
-> CODEFLOW TOKENS + PRIMITIVES
-> VISUAL CRAFT
```

Visual novelty is not a goal. Product clarity is.

Primary hierarchy:

```text
1. semantic graph + current focus
2. repository / entry point / semantic search
3. graph projection controls
4. contextual source / relationship / evidence inspector
5. secondary graph operations and metadata
```

The graph must never be reduced to a small panel between competing navigation, analytics, or dashboard surfaces.

## Product References

Use shipped products as behavioral or visual evidence, never as a literal skin copy.

### GitHub code navigation

Borrow symbol search anchored to code reading, direct definition/reference navigation, and contextual information instead of separate analysis dashboards.

### Sourcegraph code navigation

Borrow symbol-centered navigation, contextual evidence without unnecessary context switching, and clear distinction between precise/static evidence and heuristic fallback.

### VS Code call hierarchy

Borrow selected-function anchoring, explicit incoming/outgoing calls, progressive drill-down, and source inspection without losing orientation.

### Anthropic / Claude product UI

Anthropic/Claude is the canonical **visual-language reference** for CodeFlow.

Borrow:

- warm paper-like light surfaces and warm charcoal dark surfaces;
- dark ink / warm off-white typography rather than cool blue-gray chrome;
- restrained terracotta/orange for focus, selection, and meaningful attention;
- soft but not inflated corner radii;
- quiet 1px borders and low-elevation surfaces;
- calm spacing and typography with clear hierarchy;
- rounded controls and menus that remain operational rather than decorative;
- editorial display typography only where it improves identity or acquisition hierarchy.

Do **not** copy Anthropic proprietary fonts, logos, illustrations, brand marks, or exact marketing compositions. CodeFlow uses its own token values and system-font fallbacks while preserving the observable product-language principles.

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

Desktop allocation:

- graph plane: normally 75–80% of usable width;
- inspector: normally 286–352px;
- context and projection controls: one compact row each where viewport width allows.

On narrower screens the inspector moves below the graph or becomes a bounded drawer. Source/evidence inspection must remain available.

## Core User Flow

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
- choosing another entry point recenters/reanalyzes the relevant projection when required;
- semantic search moves graph focus to the selected entity;
- current focus remains visually and textually explicit;
- search remains keyboard-first and supports Escape dismissal.

### Progressive disclosure

Never render the entire repository graph by default.

Selected-node actions, where applicable:

```text
Expand outgoing
Expand incoming
Show both
Collapse branch
Focus here
Trace calls from here
Show dependents
```

`Expand outgoing` and `Expand incoming` are primary trace actions. Other actions are quieter contextual operations. Expansion reveals only bounded neighboring relationships.

### Semantic zoom

Architecture is expressed by graph level, not separate pages:

```text
Packages  -> workspace/package dependencies
Structure -> repository/module/file relationships
Code      -> class/type/function/method relationships and call paths
```

Changing level preserves orientation around the owning entity where evidence exists.

### Relationship lenses

Relationship filtering is secondary to semantic level and uses one compact control:

```text
All | Calls | References | Dependencies | Types
```

Only lenses backed by relationships actually present should be enabled. Lens state filters projection only; it never changes semantic truth.

### Impact

Impact is invoked from a selected entity with `Show dependents`. Direct/transitive dependent paths are added to the graph and visually distinguished. It is not a permanent analytics panel.

### Pull-request overlay

Pull requests reuse the same graph. Change state is an overlay: added, modified, removed, unchanged. State must remain legible through text/symbol/border treatment, not color alone.

## Node Language

Nodes are compact semantic objects, not dashboard cards.

Prefer:

- rectangular geometry with approximately 8–10px radius;
- warm neutral 1px stroke;
- code identifier as strongest text;
- kind and repository-relative path as secondary metadata;
- no ordinary shadow;
- terracotta focus/selection stroke or inset rule;
- visible entry-point marker;
- subtle added/modified/removed marker when change overlay is active.

Avoid double borders, glow, saturated category colors, and decorative elevation.

## Edge Language

Relationship meaning must remain understandable without color:

```text
solid  -> verified/configured static evidence
dashed -> inferred static relationship
dotted -> evidence unavailable / change-only relationship
```

Edges carry concise relationship labels and explicit direction. Stable deterministic spatial orientation is more important than decorative physics or motion. Selected/focused edges may use the terracotta focus token.

## Canvas Plane

Use a quiet warm neutral plane with pane boundaries. No glow, gradient fog, decorative dot-grid wallpaper, giant empty margins, or generic node-editor chrome.

Overflow is acceptable for a graph larger than the viewport. The user must retain a stable focus anchor and a clear way to recenter.

## Graph Viewport & Attention

The graph is a navigable spatial surface, not a poster. Provide compact controls for zooming, fitting the visible projection, and recentering current focus.

Selection creates an attention neighborhood:

- selected entity remains strongest;
- directly connected nodes/edges retain normal prominence;
- unrelated graph content recedes but is not removed;
- impact paths remain legible when impact mode is active.

For dense projections, edge labels are progressively disclosed on hover/focus/selection. Accessible relationship names remain available regardless of visual label visibility.

Layered layout must remain deterministic and relationship-aware. Source peek should visibly mark the represented source range while preserving surrounding context.

## Context Bar

The top context bar owns only orientation and high-frequency navigation:

```text
repository / revision
entry point
semantic search
change repository
```

Repository metadata stays subordinate to the graph task.

## Projection Toolbar

The graph toolbar owns:

- current focus identity;
- current semantic level;
- current relationship lens;
- visible/available node count;
- bounded dependents status when active.

Semantic level is a compact switch. Relationship lens is one compact selector. Do not surface many equally weighted controls when fewer controls communicate the hierarchy.

## Inspector

The inspector answers: **what is selected, where is it defined, how is it connected, what can I trace next, and what proves the relationship?**

Node priority:

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

Edge priority:

```text
source -> target
relationship kind
change state when applicable
trust/evidence kind
reason/provenance
source location
```

The inspector is a narrow reading surface, not a dashboard. Avoid metric cards, equal-weight action grids, and decorative section containers.

## Typography & Density

Compact does not mean tiny.

Targets:

- body/control text: 11–12px;
- code identifiers: 11–12px monospace;
- meaningful metadata: 10–11px;
- secondary labels: 10px;
- avoid 8–9px operational text.

Use the system sans stack for product UI and the existing monospace stack for code/evidence. A system serif fallback may be used sparingly for the CodeFlow wordmark/acquisition heading to echo Anthropic's editorial warmth without introducing proprietary font assets.

Hierarchy should come from weight, alignment, spacing, and contrast before large font-size jumps.

## Acquisition

Repository visualization is the primary start action. Public GitHub repository input is visually primary; local repository is secondary but direct.

Pull-request analysis is presented as **visualize changes on the code graph**, not as an equal product mode or review dashboard.

The acquisition surface is setup, not marketing. It may use a quiet rounded panel and restrained editorial heading, but no hero-sized typography, feature-card grid, or promotional whitespace.

## Information Hierarchy

Use, in order:

1. typography;
2. alignment;
3. compact spacing;
4. 1px dividers/borders;
5. warm neutral surface contrast;
6. terracotta semantic focus/state only when needed.

Do not create hierarchy through stacks of cards, excessive pills, oversized headings, nested neutral cards, or decorative iconography.

## Canonical Visual Tokens

These are CodeFlow tokens adapted to the Anthropic/Claude visual language. They are not claimed to be Anthropic's internal or official token values.

### Light

| Token | Value | Role |
|---|---|---|
| `cs-bg` | `#F3F1EA` | warm paper canvas |
| `cs-panel` | `#FBFAF7` | primary pane |
| `cs-surface` | `#EEECE4` | secondary surface |
| `cs-raised` | `#E5E1D8` | raised/active neutral |
| `cs-border` | `#D8D3C8` | 1px structure |
| `cs-control` | `#FFFDF8` | inputs/controls |
| `cs-text` | `#2B2925` | ink text |
| `cs-muted` | `#6F6A62` | secondary text |
| `cs-subtle` | `#969086` | tertiary metadata |
| `cs-focus` | `#C96F4B` | terracotta focus/selection |
| `cs-primary` | `#2B2925` | primary action |

### Dark

| Token | Value | Role |
|---|---|---|
| `cs-bg` | `#171613` | warm charcoal canvas |
| `cs-panel` | `#1F1D1A` | primary pane |
| `cs-surface` | `#27241F` | secondary surface |
| `cs-raised` | `#302C26` | raised/active neutral |
| `cs-border` | `#3A3630` | 1px structure |
| `cs-control` | `#24211D` | inputs/controls |
| `cs-text` | `#EEE9DF` | warm off-white text |
| `cs-muted` | `#AAA397` | secondary text |
| `cs-subtle` | `#7D766C` | tertiary metadata |
| `cs-focus` | `#E08A68` | terracotta focus/selection |
| `cs-primary` | `#EEE9DF` | primary action |

Danger state remains semantically red and separate from the focus accent.

## Shape & Elevation

- control radius: ~8px;
- node radius: ~9px;
- panel/overlay radius: ~10px;
- workspace radius: up to 12px where the workspace is visibly bounded;
- ordinary panes, rows, nodes, and controls: no shadow;
- dropdowns/drawers/true overlays may use one restrained soft shadow.

Rounded geometry must not turn the interface into a card grid.

## Motion

Motion exists only to communicate state or spatial relationship:

- selection/focus transition;
- bounded expansion/collapse;
- inspector/pane transition when needed.

Use short 90–160ms transitions for controls. Do not animate graph topology for decoration. Respect `prefers-reduced-motion`.

## Responsive Behavior

Narrow layouts preserve completion of the same task.

- context controls may wrap vertically;
- projection controls may wrap/stack;
- graph remains the first and largest work surface;
- inspector moves below the graph or into a bounded drawer;
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
- animation that moves graph topology without user intent;
- proprietary Anthropic assets or fonts copied into the repository.

## Accessibility

- every graph node and edge is keyboard focusable or has an equivalent navigation path;
- focus and selection are not encoded by color alone;
- relationship direction and kind are available as text/accessible names;
- search works with keyboard navigation and Escape dismissal;
- all graph-native actions remain available without drag or hover;
- disabled projection/lens choices remain semantically disabled;
- narrow layouts preserve source/evidence task completion;
- focus ring contrast must remain legible in both warm light and warm dark themes.

## Themes

Both themes use the canonical warm-neutral token system with restrained terracotta focus/accent. Theme changes must not change semantic meaning.
