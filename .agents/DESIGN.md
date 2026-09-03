# CodeFlow Design

`DESIGN.md` is the repository-level source of truth for durable CodeFlow product-experience, interaction, and visual-design decisions.

It defines how CodeFlow should feel, behave, and present semantic information without depending on chat history, temporary implementation choices, or the active iteration.

It is not a feature spec, milestone plan, task checklist, changelog, or component inventory.

## Authority Boundaries

- `.agents/PROJECT.md` owns WHY, WHAT, product/domain behavior, feature scope, contracts, non-goals, and product constraints.
- `.agents/DESIGN.md` owns durable experience principles, information hierarchy, navigation principles, interaction behavior, UI-state behavior, responsive behavior, accessibility expectations, visual language, design tokens, component styling principles, and theme behavior.
- `.agents/CURRENT_ITERATION.md` owns temporary/current design delta, active work, verification evidence, and next action.

## Canonical Direction

CodeFlow follows the Chatspace workspace design language:

**compact, clean, minimalist, smooth, and selectively glassmorphic.**

CodeFlow should feel like a focused engineering workbench for program understanding, not a decorative AI dashboard, form-driven administration page, or free-form diagram editor.

Priorities, in order:

1. semantic comprehension and information clarity;
2. evidence hierarchy and navigation speed;
3. compact but readable information density;
4. interaction quality and spatial continuity;
5. accessibility and responsive task completion;
6. visual refinement;
7. selective depth/glass effects.

Distinctiveness comes from composition, typography, proportion, spacing, semantic graph treatment, evidence presentation, and disciplined surfaces—not generic glow, gradients, or ornament.

## Product Experience

The primary CodeFlow job is repository comprehension.

The interface should let a developer move from repository context to semantic relationships, source evidence, data flow, and deterministic static step-through without losing orientation.

After analysis succeeds, the semantic workspace owns the viewport. Repository acquisition is setup, not permanent application chrome.

## Information Hierarchy

Use hierarchy through:

1. typography;
2. spacing;
3. grouping and alignment;
4. dividers/borders;
5. controlled surface contrast;
6. restrained elevation;
7. semantic color only when it adds meaning.

Do not use color, glow, blur, cards, or oversized typography to compensate for weak structure.

Primary semantic work content must dominate. Metadata, repository statistics, legends, status, and secondary controls remain subordinate and contextual.

## Workspace Model

### Before analysis

Repository acquisition is an explicit setup surface:

```text
repository directory
entry source
entry function
analyze
```

### After analysis

Desktop default:

```text
+--------------------------------------------------------------------+
| CodeFlow / repository / entry          search        theme / more  |
+----------------------------------------------+---------------------+
|                                              | selected entity     |
|                                              | source location     |
|             Semantic Workspace               |                     |
|                                              | Overview Data       |
|           bounded semantic graph             | Evidence Steps      |
|                                              |                     |
|                                              | inspector content   |
+----------------------------------------------+---------------------+
| relationship lenses / contextual evidence                          |
+--------------------------------------------------------------------+
```

The default desktop split is approximately 70–75% semantic workspace and 25–30% inspector.

Do not keep a permanent repository rail merely for repository name, file counts, ignored-file counts, or evidence legend. A permanent navigation surface must be earned by real navigation capability such as repository/module/application/entry-point navigation.

The application shell should use the viewport intentionally. Prefer a `100dvh` workbench with independently bounded canvas and inspector regions over document-style page scrolling.

## Navigation Principles

- navigation state is immediately understandable;
- selected/active context is clear but not visually loud;
- search is semantic/spatial navigation, not a detached results page;
- selecting a search result selects and focuses the semantic entity while keeping inspector/source context synchronized;
- search supports keyboard navigation and dismissal;
- focus/neighborhood reduces visible context without changing canonical relationships;
- terminology must describe actual behavior; do not label an entry neighborhood as a full graph;
- relationship lenses expose only semantic kinds actually present;
- relationship lens changes preserve selected semantic context;
- repeated actions behave consistently across pointer and keyboard interaction;
- secondary controls appear when relevant rather than permanently occupying space.

## Inspector Model

The inspector is a task-oriented work surface, not a long document of every available detail.

Use a stable selected-context header and distinct modes:

```text
Overview | Data | Evidence | Steps
```

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

The canvas is a semantic exploration surface, not canonical model storage and not a free-form diagram editor.

### Nodes

Nodes are compact, information-dense semantic entities. Prefer role/kind, name, source metadata, typography, spacing, shape, and border treatment before decorative color.

Avoid per-node gradients, giant rounded cards, oversized illustrative icons, glow, and rainbow taxonomy.

### Relationships

Relationship meaning must remain legible without color.

```text
solid   -> verified/static/configured relationship
dashed  -> inferred relationship
dotted  -> unavailable/unsupported evidence
```

Calls, reads, writes, mutations, argument passing, returns, and value flow are distinguished primarily through explicit labels/kinds and evidence—not a rainbow palette.

Use stable spatial direction and bounded topology where it improves comprehension. Do not introduce arbitrary physics layout or generic node-editor behavior without product need.

### Selection

Selection is obvious but restrained. Use the steel-blue active/focus system through border, subtle active surface, and weight—not bloom or saturated fill.

Selection never changes semantic or evidence truth.

## Interaction Behavior

Interactions should feel direct and smooth.

- avoid unnecessary modal or multi-step friction;
- use motion to preserve spatial/causal continuity, not decoration;
- state changes should be fast and visually legible;
- loading, unavailable, empty, partial, error, recovery, disabled, selected, and focused states must be explicit;
- no important action may depend only on hover;
- motion should be short, restrained, interruptible, and unnecessary for understanding state.

## Responsive Behavior

Desktop favors the semantic workspace + inspector split.

On narrow layouts, preserve the primary semantic canvas and move secondary inspection into a bounded collapsible/drawer surface rather than stacking an unbounded inspector document below the graph.

Task order remains:

```text
repository context
 -> semantic workspace
 -> inspector/source
```

Simplify layout before removing information. Prefer bounded overflow and contextual surfaces over permanently tiny columns.

## Accessibility

Minimum durable expectations:

- keyboard-reachable core workflows;
- visible focus treatment that is stronger than hover treatment;
- semantic controls and labels;
- accessible names for icon-only controls;
- understandable toggle/pressed/selected/tab states;
- sufficient contrast in light and dark token sets;
- no required hover-only interactions;
- relationship/evidence meaning does not depend only on color;
- motion is not required to understand state.

Normal reading text should not use microscopic type merely to appear compact. Reserve the lowest-contrast text token for non-essential hints, disabled context, and separators rather than primary metadata.

## Visual Language

Use the restrained Chatspace workspace language:

- compact spacing;
- readable dense typography;
- clean geometry;
- consistent small radii;
- thin borders/dividers;
- subtle depth;
- limited accent usage;
- selective translucent/glass surfaces only where layering benefits comprehension.

The canonical accent is **desaturated steel blue** over neutral surfaces. Use it for selected/active context, focus treatment, graph/reference emphasis, and similar meaningful state—not as a wash over ordinary panels.

Reference values:

- dark: `cs-hover #19202a`, `cs-active #1b2636`, `cs-focus #7fa6c9`;
- light: `cs-hover #f0f4f8`, `cs-active #e8eef6`, `cs-focus #4f7396`.

Do not introduce saturated electric blue, purple-blue gradients, or blue glow.

Glassmorphism is an accent, not the interface. Use it only for genuinely layered shell/overlay/floating contexts where translucency communicates hierarchy.

Avoid AI-slop styling:

- purple/blue gradient backgrounds;
- neon glow;
- shiny gradient borders;
- giant rounded cards without structural purpose;
- excessive pills;
- decorative blobs/orbs/sparkles;
- card-on-card composition;
- decorative animation;
- excessive whitespace that reduces workspace density.

## Tokens and Theming

Use semantic `cs-*` tokens rather than feature-local hard-coded theme colors.

Canonical semantic primitives include:

```text
cs-bg
cs-panel
cs-surface
cs-raised
cs-border
cs-control
cs-hover
cs-active
cs-focus
cs-primary
cs-primary-contrast
cs-text
cs-muted
cs-subtle
cs-danger
cs-danger-surface
cs-danger-border
```

Token names describe responsibility. Do not maintain a parallel legacy token vocabulary once migration is complete.

Dark and light are both designed surfaces. Support explicit user selection, persist that explicit preference, and use system preference only as the initial fallback when the user has not chosen a theme.

## Component Styling Principles

- Tailwind CSS v4 is the utility/token implementation layer;
- Radix UI Primitives is the default interaction foundation for reusable complex controls;
- use Radix behavior without importing a generic visual theme that overrides CodeFlow hierarchy or `cs-*` tokens;
- reusable ordinary controls live under `apps/web/src/ui/` and remain product-specific in appearance;
- generic controls reuse shared primitives; semantic graph nodes/relationships remain product components rather than being forced into generic controls;
- Lucide is the standard UI affordance icon set;
- icon-only controls require accessible names/tooltips;
- controls with the same semantic action share behavior and visual language;
- `cs-panel` represents application panels, `cs-surface` nested content surfaces, and `cs-control` interactive control surfaces;
- avoid one-off shadows, gradients, radii, or colors when semantic tokens can express intent.

## Product Copy

Prefer literal product language over internal milestone terminology or generic marketing language.

- user-facing limits and failures refer to CodeFlow behavior, not internal milestone names;
- preserve explicit trust boundaries such as `Evidence first · static analysis only` where they clarify real behavior;
- do not use broad labels such as `repository intelligence` when repository/function context communicates more directly.

## Design Quality Rule

A design change is complete when the affected surface:

- improves or preserves task clarity;
- preserves semantic/evidence truth;
- keeps the semantic workspace dominant after setup;
- has clear interaction and UI states;
- remains keyboard/accessibility sound;
- works intentionally in light and dark themes;
- remains task-completable on narrow layouts;
- uses depth only where hierarchy benefits;
- does not add decorative complexity without product value.
