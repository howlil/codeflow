# CodeFlow Design

`DESIGN.md` is the repository-level source of truth for durable CodeFlow product-experience, interaction, and visual-design decisions.

It defines how CodeFlow should feel, behave, and present semantic information without depending on chat history, temporary implementation choices, or the active iteration.

It is not a feature spec, milestone plan, task checklist, changelog, or component inventory.

## Authority Boundaries

- `.agents/PROJECT.md` owns WHY, WHAT, product/domain behavior, feature scope, contracts, non-goals, and product constraints.
- `.agents/DESIGN.md` owns durable experience principles, information hierarchy, navigation principles, interaction behavior, UI-state behavior, responsive behavior, accessibility expectations, visual language, design tokens, component styling principles, and theme behavior.
- `.agents/CURRENT_ITERATION.md` owns temporary/current design delta, active work, verification evidence, and next action.

## Canonical Direction

CodeFlow is a **compact operational developer workbench**.

It should feel closer to an IDE/code-intelligence surface than a SaaS dashboard, marketing page, AI chat wrapper, or free-form diagram editor.

Canonical qualities:

- operational over promotional;
- compact over spacious;
- flat over elevated;
- code/content first;
- monochrome by default;
- explicit evidence hierarchy;
- low-chroma semantic accent only;
- direct, fast interaction;
- bounded work surfaces rather than document-like scrolling.

Priorities, in order:

1. semantic comprehension and information clarity;
2. evidence hierarchy and navigation speed;
3. compact but readable information density;
4. stable spatial orientation across repository, code, and change views;
5. interaction quality and keyboard efficiency;
6. accessibility and responsive task completion;
7. visual refinement.

Distinctiveness comes from composition, typography, proportion, semantic graph treatment, evidence presentation, and disciplined pane structure. Ornament is not a source of product identity.

## Anti-Slop Invariants

The following are not part of the ordinary CodeFlow interface:

- gradient page backgrounds;
- blue/purple glow;
- gradient borders;
- decorative glass panels;
- floating card stacks;
- giant rounded containers;
- excessive pills/chips;
- decorative dotted/radial canvas backgrounds;
- oversized headings;
- marketing-style whitespace;
- iconography used as decoration rather than affordance;
- shadows on ordinary panels, nodes, rows, or controls;
- color used to compensate for weak hierarchy.

Shadows are reserved for true overlays such as search/select popovers. Translucency is reserved for a real layered/sticky surface when it improves spatial continuity.

## Product Experience

The primary CodeFlow job is repository comprehension and evidence-backed change reasoning.

The interface should let a developer move between repository context, package/module/file/symbol structure, semantic relationships, pull-request changes, source evidence, data flow, impact, and deterministic static step-through without losing orientation.

Repository acquisition is setup. After analysis succeeds, work content owns the viewport.

## Information Hierarchy

Use hierarchy through:

1. typography;
2. alignment;
3. compact spacing;
4. pane boundaries and 1px dividers;
5. controlled neutral surface contrast;
6. semantic accent only when it communicates state.

Do not create hierarchy by wrapping each concept in a card.

Primary code/semantic work dominates. Repository statistics, legends, limits, metadata, and secondary controls remain subordinate and contextual.

## Workspace Model

### Before analysis

Repository acquisition is a compact setup surface, not a landing page.

```text
source type
repository / pull request / local selection
entry source when required
analyze
```

Avoid hero copy, giant form cards, promotional illustration, and large empty margins.

### After analysis

Desktop default:

```text
+--------------------------------------------------------------------+
| CodeFlow / repository / revision or entry     search       actions |
+--------------------------------------------------------------------+
| compact repository/change context                                  |
+----------------------------------------------+---------------------+
|                                              | selected entity     |
|                                              | source location     |
|             Primary work surface             |                     |
|     semantic graph / diff / structure        | Overview Data       |
|                                              | Evidence Steps      |
|                                              |                     |
+----------------------------------------------+---------------------+
| contextual filters / relationship lenses                           |
+--------------------------------------------------------------------+
```

The ordinary desktop semantic split is approximately 70–75% primary work area and 25–30% inspector. The shell uses the viewport intentionally and should not look like a centered website card.

### Pane rule

A first-level work surface is a pane, not a floating card.

Use:

- shared background plane;
- 1px separators;
- small or zero outer radius;
- independently bounded overflow;
- no ordinary pane shadow.

Nested groups should use rows/dividers before bordered containers.

## Navigation Principles

- navigation state is immediately understandable;
- selected/active context is clear but visually quiet;
- search is semantic/spatial navigation, not a detached results page;
- selecting a search result selects and focuses the semantic entity while keeping inspector/source context synchronized;
- search supports keyboard navigation and dismissal;
- focus/neighborhood reduces visible context without changing canonical relationships;
- terminology describes actual behavior and evidence scope;
- relationship lenses expose only semantic kinds actually present;
- repeated actions behave consistently across pointer and keyboard interaction;
- secondary controls appear when relevant rather than permanently occupying space.

A permanent navigation rail must be earned by actual navigation capability such as package/module/file/symbol/entry traversal. Metadata alone does not justify a rail.

## Inspector Model

The inspector is a task-oriented work surface, not a long settings/document panel.

Use a stable selected-context header and distinct modes:

```text
Overview | Data | Evidence | Steps
```

Tabs use a compact underline/rail active treatment. Avoid rounded segmented-control styling for ordinary inspector modes.

### Overview

Prioritize:

```text
identity / kind
source location
source snippet
concise relationship summary
```

### Data

Expose function inputs, outputs, argument mappings, reads/writes, and related source-backed data as compact rows/dividers. Do not wrap every datum in a separate bordered card.

### Evidence

Prioritize semantic relationship kind, evidence kind, relationship identity, reason/provenance, and source location. Unavailable evidence remains explicit; never fill gaps with speculative copy.

### Steps

Static step-through is evidence-oriented navigation over deterministic source-backed possibilities. It is not a runtime debugger or execution playback UI.

Expose step kind, concise value/source expression where available, provenance, and source location. Allow forward/reverse navigation while synchronizing selected function context.

Never fabricate runtime values, chosen branch outcomes, timing, frequency, latency, probability, or confidence percentages.

## Canvas Language

The canvas is a semantic exploration surface, not canonical model storage and not a decorative diagram background.

### Canvas plane

The ordinary canvas background is a quiet neutral plane. Do not use decorative dot grids, radial patterns, glow, gradient fog, or simulated infinite-canvas ornament unless a future interaction genuinely requires spatial grid cues.

### Nodes

Nodes are compact semantic entities.

Prefer:

- small rectangular geometry;
- 1px neutral border;
- no ordinary shadow;
- monospace for code identifiers where useful;
- role/kind + name + source metadata;
- minimal padding;
- small radius, typically 3–5px.

Avoid giant rounded cards, illustrative icons, colored header bands, glow, and rainbow taxonomy.

### Relationships

Relationship meaning remains legible without color.

```text
solid   -> verified/static/configured relationship
dashed  -> inferred relationship
dotted  -> unavailable/unsupported evidence
```

Calls, reads, writes, mutations, argument passing, returns, and value flow are distinguished primarily through explicit labels/kinds and evidence.

Use stable spatial direction and bounded topology where it improves comprehension. Do not introduce arbitrary physics layout or generic node-editor behavior without product need.

### Selection

Selection is obvious but restrained.

Preferred treatment:

- steel-blue border or 1–2px side rail;
- subtle active neutral surface where needed;
- typography/weight change only when useful.

Do not use bloom, glow, saturated fill, or large tinted cards.

Selection never changes semantic or evidence truth.

## Pull-Request / Diff Surface

The change workspace should resemble a code-review workbench, not an analytics dashboard.

Prefer:

```text
changed entities/files | source diff | behavior/impact/evidence
```

Rules:

- diff/code receives the highest visual weight;
- change counts are inline metadata, not a chip cloud;
- added/removed markers may use semantic state, but text and symbols must remain sufficient without color;
- behavior delta, impact, and evidence use rows/dividers rather than card stacks;
- BASE/HEAD/revision identifiers use monospace where practical;
- relationship/impact wording must preserve the existing truth boundaries.

## Typography

Use system/Inter-style sans for application chrome and prose. Use monospace intentionally for:

- code identifiers;
- file paths;
- revision/SHA identity;
- source locations;
- compact technical metrics where scanning improves;
- patch/code content.

Normal reading text must remain readable. Compact does not mean microscopic.

Recommended working scale:

- primary chrome/body: 11–12px;
- technical metadata: 9–10px;
- section title: 12–13px;
- product mark: approximately 13px;
- avoid routine headings larger than needed for operational hierarchy.

## Geometry and Depth

Default geometry:

- pane radius: 0–4px;
- ordinary control radius: about 4px;
- semantic node radius: about 4px;
- popover radius: about 5–6px;
- pills only for semantics that are genuinely tag/status-like.

Default depth:

- ordinary pane: no shadow;
- ordinary node: no shadow;
- ordinary control: no shadow;
- selected state: border/rail, not shadow;
- overlay/popover: restrained shadow allowed.

## Color

CodeFlow is neutral-first.

The canonical accent is **desaturated steel blue** over neutral surfaces. Use it for selected/active context, focus treatment, graph/reference emphasis, and similar meaningful state—not as a wash over ordinary panels.

Reference semantic values:

- dark focus: `#7fa6c9`;
- light focus: `#4f7396`.

Do not introduce saturated electric blue, purple-blue gradients, blue glow, or feature-specific rainbow colors.

Error/destructive state may use the semantic danger tokens. Other states should stay neutral unless color carries information that cannot be expressed as clearly by structure/text.

## Tokens and Theming

Use the canonical Tailwind-backed CSS variables emitted from semantic `cs-*` tokens:

```text
--color-cs-bg
--color-cs-panel
--color-cs-surface
--color-cs-raised
--color-cs-border
--color-cs-control
--color-cs-hover
--color-cs-active
--color-cs-focus
--color-cs-primary
--color-cs-primary-contrast
--color-cs-text
--color-cs-muted
--color-cs-subtle
--color-cs-danger
--color-cs-danger-surface
--color-cs-danger-border
```

Do not maintain feature-local `--cs-*` aliases or another parallel theme vocabulary. Token names describe responsibility; feature CSS consumes the canonical variables directly.

Dark and light are both designed surfaces. Support explicit user selection, persist that explicit preference, and use system preference only as the initial fallback when the user has not chosen a theme.

## Component Styling Principles

- Tailwind CSS v4 is the utility/token implementation layer;
- Radix UI Primitives is the default behavior foundation for reusable complex controls;
- Radix provides behavior, not a generic visual theme;
- reusable ordinary controls live under `apps/web/src/ui/` and remain product-specific in appearance;
- controls default to compact height, 3–4px radius, neutral background, 1px border, and 1px focus treatment;
- generic controls reuse shared primitives; semantic graph nodes/relationships remain product components rather than being forced into generic controls;
- Lucide is the standard UI affordance icon set;
- icon-only controls require accessible names/tooltips;
- controls with the same semantic action share behavior and visual language;
- avoid one-off shadows, gradients, radii, or colors when semantic tokens can express intent.

## Interaction and Motion

Interactions should feel direct and fast.

- avoid unnecessary modal or multi-step friction;
- use motion only to preserve causal/spatial continuity;
- ordinary hover/selection transitions should be short, typically around 80–140ms;
- loading, unavailable, empty, partial, error, recovery, disabled, selected, and focused states remain explicit;
- no important action depends only on hover;
- motion is interruptible and never required to understand state;
- do not animate decoration merely because a motion library exists.

## Responsive Behavior

Desktop favors bounded work panes.

On narrow layouts:

- preserve the primary semantic/diff task first;
- simplify or collapse secondary context before shrinking everything;
- inspector may move below or into a bounded drawer/collapsible surface;
- avoid permanently tiny multi-column layouts;
- horizontal code overflow remains preferable to wrapping source code incorrectly.

Task order remains:

```text
repository/change context
 -> primary work surface
 -> inspector/source/evidence
```

## Accessibility

Minimum durable expectations:

- keyboard-reachable core workflows;
- visible focus treatment stronger than hover treatment;
- semantic controls and labels;
- accessible names for icon-only controls;
- understandable pressed/selected/tab states;
- sufficient contrast in light and dark token sets;
- no required hover-only interaction;
- relationship/evidence meaning does not depend only on color;
- motion is not required to understand state.

Reserve the lowest-contrast text token for non-essential hints, disabled context, and separators rather than primary metadata.

## Product Copy

Prefer literal product language over milestone terminology or marketing language.

- user-facing limits and failures refer to CodeFlow behavior, not internal milestone names;
- preserve explicit trust boundaries such as `Evidence first · static analysis only` where they clarify real behavior;
- avoid broad promotional labels such as `repository intelligence` when repository/function/change context communicates more directly;
- concise technical labels are preferred to explanatory paragraph copy inside dense work surfaces.

## Design Quality Rule

A design change is complete when the affected surface:

- improves or preserves task clarity;
- preserves semantic/evidence truth;
- keeps code/semantic work visually dominant;
- removes unnecessary framing rather than adding another visual layer;
- has explicit interaction and UI states;
- remains keyboard/accessibility sound;
- works intentionally in light and dark themes;
- remains task-completable on narrow layouts;
- uses depth only for actual layered surfaces;
- uses one canonical token vocabulary;
- does not add decorative complexity without product value.
