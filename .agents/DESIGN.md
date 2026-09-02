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

The product should feel like a focused modern engineering workspace rather than a decorative AI dashboard or free-form diagram editor.

Priorities, in order:

1. usability and information clarity;
2. semantic/evidence hierarchy and navigation speed;
3. compact information density;
4. interaction quality and spatial continuity;
5. visual refinement;
6. selective glass/depth effects.

Distinctiveness comes primarily from composition, typography, proportion, spacing, interaction quality, semantic graph treatment, and disciplined surfaces—not generic glow, gradients, or ornament.

## Product Experience

The primary CodeFlow job is repository comprehension. The workspace should let a developer move from repository context to semantic relationships, source evidence, data flow, and static step-through without losing orientation.

The semantic workspace must dominate. Repository context, metadata, controls, inspectors, and status remain subordinate.

## Information Hierarchy

Use hierarchy through:

1. typography;
2. spacing;
3. grouping and alignment;
4. dividers/borders;
5. controlled surface contrast;
6. restrained elevation/glass treatment;
7. semantic color only when it adds meaning.

Do not use color, glow, blur, cards, or oversized typography to compensate for weak structure.

## Navigation Principles

- navigation state is immediately understandable;
- selected/active context is clear but not visually loud;
- search acts as semantic/spatial navigation, not a detached results page;
- focus/neighborhood changes the visible projection, never canonical relationships;
- relationship lenses expose only semantic kinds actually present;
- source inspection remains synchronized with semantic selection;
- repeated actions behave consistently across pointer and keyboard interaction;
- secondary controls appear when relevant rather than permanently occupying space.

## Interaction Behavior

Interactions should feel direct and smooth.

- avoid unnecessary modal or multi-step friction;
- use motion to preserve spatial/causal continuity, not decoration;
- state changes should be fast and visually legible;
- loading, unavailable, empty, partial, error, recovery, disabled, selected, and focused states must be explicit;
- no important action may depend only on hover;
- motion should be short, restrained, interruptible, and unnecessary for understanding state.

## Workspace Model

Desktop default:

```text
+----------------------+--------------------------------------+----------------------+
| Repository / Scope   | Semantic Workspace                   | Inspector / Source   |
| context              | selected projection                  | selected entity      |
| entry points         | nodes + relationships                | source + provenance  |
+----------------------+--------------------------------------+----------------------+
```

The semantic workspace is primary. Avoid dashboard-style collections of unrelated cards.

Narrow layouts preserve task order:

```text
context
 -> semantic workspace
 -> inspector/source
```

Simplify layout before removing information. Prefer stacking/overflow over permanently tiny columns.

## Canvas Language

The canvas is a semantic exploration surface, not canonical model storage and not a free-form diagram editor.

### Nodes

Nodes are compact, information-dense semantic entities. Prefer role/kind, name, source metadata, typography, spacing, shape, and border treatment before decorative color.

Avoid per-node gradients, giant rounded cards, oversized icons, glow, and rainbow taxonomy.

### Relationships

Relationship meaning must remain legible without color.

```text
solid   -> verified/static/configured relationship
dashed  -> inferred relationship
dotted  -> unavailable/unsupported evidence
```

Calls, reads, writes, mutations, argument passing, returns, and value flow are distinguished primarily through explicit labels/kinds and evidence—not a rainbow palette.

### Selection

Selection is obvious but restrained. Use the steel-blue active/focus system through border, subtle active surface, and weight—not bloom or saturated fill.

Selection never changes semantic or evidence truth.

## Inspector / Source

Prioritize available information in this order:

```text
identity / kind
source location
source snippet
relationship evidence / provenance
inputs / outputs
callers / callees
reads / writes / side effects
failure paths
other derived metadata
```

Do not fill absent information with speculative copy.

Source expansion increases source visibility without replacing the semantic workspace or losing the current selection.

## Static Step-through

Static step-through is evidence-oriented navigation over deterministic source-backed possibilities. It is not a runtime debugger or execution playback UI.

- expose step kind, concise value/source expression where available, provenance, and source location;
- allow forward/reverse navigation while keeping semantic/source context;
- synchronize selected function when supported steps cross function boundaries;
- label branch/failure paths as static possibilities;
- never fabricate runtime values, chosen branch outcomes, timing, frequency, latency, probability, or confidence percentages;
- avoid playback/pulse/live-trace metaphors unless real runtime evidence is later introduced and visibly distinguished.

## Accessibility

Minimum durable expectations:

- keyboard-reachable core workflows where applicable;
- visible focus treatment;
- semantic controls and labels;
- accessible names for icon-only controls;
- understandable toggle/pressed/selected states;
- sufficient contrast in light and dark token sets;
- no required hover-only interactions;
- relationship/evidence meaning does not depend only on color;
- motion is not required to understand state.

## Visual Language

Use the restrained Chatspace workspace language:

- compact spacing;
- clean geometry;
- consistent small radii;
- thin borders/dividers;
- subtle depth;
- crisp typography;
- limited accent usage;
- selective translucent/glass surfaces only where layering benefits comprehension.

The canonical secondary/accent direction is **desaturated steel blue** over neutral surfaces. Use it for selected/active context, focus treatment, graph/reference emphasis, and similar meaningful state—not as a wash over ordinary panels.

Current reference values:

- dark: `cs-hover #19202a`, `cs-active #1b2636`, `cs-focus #7fa6c9`;
- light: `cs-hover #f0f4f8`, `cs-active #e8eef6`, `cs-focus #4f7396`.

Do not introduce saturated electric blue, purple-blue gradients, or blue glow to amplify this accent.

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

Canonical semantic primitives:

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
```

Dark reference palette:

```text
cs-bg               #0b0b0c
cs-panel            #101012
cs-surface          #151517
cs-raised           #1b1b1e
cs-border           #29292d
cs-control          #171719
cs-hover            #19202a
cs-active           #1b2636
cs-focus            #7fa6c9
cs-primary          #eeeeef
cs-primary-contrast #111113
cs-text             #eeeeef
cs-muted            #9999a2
cs-subtle           #686872
cs-danger           #efaaaa
```

Light reference palette:

```text
cs-bg               #f7f7f8
cs-panel            #ffffff
cs-surface          #f1f1f3
cs-raised           #e9e9ec
cs-border           #d8d8dd
cs-control          #ffffff
cs-hover            #f0f4f8
cs-active           #e8eef6
cs-focus            #4f7396
cs-primary          #18181b
cs-primary-contrast #fafafa
cs-text             #18181b
cs-muted            #60606a
cs-subtle           #8a8a94
cs-danger           #b42318
```

Both palettes are designed surfaces; light is not a mechanical inversion. Components express semantic intent and allow the theme layer to provide concrete values.

## Component Styling Principles

- Tailwind CSS v4 is the utility/token implementation layer for the web workspace;
- Radix UI Primitives is the default interaction foundation for reusable complex controls;
- use Radix behavior without importing a generic visual theme that overrides CodeFlow hierarchy or `cs-*` tokens;
- reusable controls live under `apps/web/src/ui/` and remain product-specific;
- reuse existing tokens/primitives before adding visual concepts;
- Lucide is the standard UI affordance icon set;
- icon-only controls require accessible names/tooltips;
- controls with the same semantic action share behavior and visual language;
- avoid permanent action chrome on every row when contextual discovery is sufficient;
- do not introduce one-off shadows, gradients, radii, or colors when semantic tokens can express intent.

## Design Quality Rule

A design change is complete when the affected surface:

- improves or preserves task clarity;
- preserves semantic/evidence truth;
- keeps the primary workspace dominant;
- has clear interaction and UI states;
- remains keyboard/accessibility sound where applicable;
- works intentionally with the canonical token palettes;
- uses glass/depth only where hierarchy benefits;
- does not add decorative complexity without product value.
