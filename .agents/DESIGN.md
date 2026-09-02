# CodeFlow Design

`DESIGN.md` is the canonical source of truth for durable CodeFlow visual, interaction, workspace, and interface behavior.

Product behavior belongs in `.agents/PROJECT.md`; system boundaries belong in `.agents/ARCHITECTURE.md`; active work belongs in `.agents/CURRENT_ITERATION.md`.

## Design Intent

CodeFlow is a calm, precise engineering workspace for understanding complex software.

The interface should recede behind semantic information while structure, provenance, uncertainty, navigation, and source evidence remain immediately legible.

It should feel like a serious developer tool rather than an AI marketing dashboard or free-form diagram editor.

## Design Order

```text
User Goal
 -> Information
 -> Task
 -> Flow
 -> Hierarchy
 -> Interaction
 -> State
 -> Layout
 -> Visual Language
 -> Implementation
```

Do not reverse this into component-first or aesthetic-first design.

## Experience Principles

### Meaning before files

File navigation is supporting context. The primary workspace helps users reason about responsibilities, entry points, semantic relationships, state, dependencies, and evidence.

### Evidence before decoration

Visual treatment must help users understand what CodeFlow knows and how it knows it. Inferred or unavailable information must not look equivalent to verified evidence.

### Progressive disclosure

Show the smallest meaningful projection for the current task and reveal detail on demand. A large graph is not useful merely because it is complete.

### Preserve orientation

Search, focus, source inspection, relationship navigation, data-flow inspection, and future semantic zoom should move the user within one coherent mental model rather than opening disconnected surfaces.

### Interaction follows semantics

Coordinates, panels, selection, focus, source expansion, relationship lenses, static-step position, and animation are view state. Semantic entities, relationships, evidence, and source provenance remain product truth.

## Workspace Model

Desktop default:

```text
+----------------------+--------------------------------------+----------------------+
| Repository / Scope   | Semantic Workspace                   | Inspector / Source   |
| context              | selected projection                  | selected entity      |
| entry points         | nodes + relationships                | source + provenance  |
+----------------------+--------------------------------------+----------------------+
```

The semantic workspace is primary. Side regions support orientation and inspection without overpowering it.

Avoid dashboard-style collections of unrelated cards.

## Navigation

### Search

Search is spatial navigation. Selecting a result should select/focus the semantic entity and keep source/evidence inspection synchronized.

### Focus / Neighborhood

Focus reduces irrelevant context without changing canonical semantic relationships.

Depth/extra controls should only be introduced when graph complexity makes them useful.

### Relationship Lenses

A relationship lens reduces the visible inspection set without creating or reclassifying semantics.

Only offer a lens for semantic relationship kinds that actually exist in the current projection. Do not show fixed no-op categories merely for visual consistency.

Changing a lens should preserve the selected function and surrounding workspace context. Relationship evidence/provenance remains inspectable under every lens.

### Semantic Zoom

Target abstraction model:

```text
L0 System / Ecosystem
L1 Applications / Services
L2 Modules / Features
L3 Types / Functions
L4 Control / Data Flow
L5 Source
```

Camera scale alone must not silently determine semantic abstraction. Combine explicit drill-down/context with scale when semantic zoom is implemented.

## Canvas Language

### Canvas Role

The canvas is a semantic exploration surface, not a free-form diagram editor.

Manual node position may aid local comprehension but coordinates never become semantic truth.

### Nodes

Nodes are compact, information-dense representations of semantic entities.

Prefer hierarchy through role/kind, name, small supporting metadata, typography, spacing, shape, and border treatment before decorative color.

Avoid per-node gradients, oversized illustrative icons, and rainbow taxonomy by default.

### Relationships

Relationship semantics must remain legible without color.

Current evidence treatment:

```text
solid   -> verified/static/configured relationship
 dashed -> inferred relationship
```

Multiple static semantic kinds such as calls, reads, writes, mutations, argument passing, returns, and value flow should be distinguished primarily through explicit labels/kinds and evidence—not a rainbow palette.

Observed runtime and static simulation may receive separate treatment later, but runtime evidence must remain distinguishable from static simulation.

### Selection

Selection should be obvious but restrained. Prefer border/ring/weight changes over glow, bloom, or saturated fills.

Selection never changes evidence semantics.

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

Function input/output data and argument mappings belong in the inspector because they explain the selected semantic entity rather than changing the canvas graph.

Do not fill absent information with speculative copy.

Source expansion should increase source visibility without replacing the semantic workspace or losing the current semantic selection.

## Static Step-through

Static step-through is an evidence-oriented navigation aid over deterministic source-backed steps. It is not a runtime debugger or execution playback UI.

The interaction should:

- expose current step kind, concise value/source expression when available, provenance, and source location;
- allow forward/reverse navigation without replacing the canvas or source context;
- synchronize the selected function when a step crosses a supported function boundary;
- label branches and failures as **possible static paths**, never as executed outcomes;
- avoid fabricated runtime values, timing, frequency, probability, or confidence percentages.

Do not use playback metaphors, live pulses, animated traces, or runtime-looking status treatments unless actual runtime evidence is later introduced and visibly distinguished from static analysis.

## Interaction States

Primary surfaces should deliberately represent applicable states:

- default;
- hover;
- focus-visible;
- selected/pressed;
- disabled;
- loading;
- empty;
- partial/unsupported;
- error.

Partial analysis should look useful-but-incomplete, not equivalent to complete success or total failure.

## Responsive Behavior

Desktop favors the three-region workspace with the semantic workspace receiving most space.

Narrow layouts preserve the reading/task order:

```text
context
 -> semantic workspace
 -> inspector/source
```

Simplify layout before removing information. Primary navigation must not depend solely on desktop pointer interaction.

## Visual Language

Product character:

```text
technical
calm
precise
neutral
spatial
evidence-oriented
```

Use a restrained monochrome/neutral hierarchy with thin borders, minimal functional elevation, and transparency/blur only for genuinely floating UI.

Avoid:

- decorative gradient blobs;
- glowing AI-style cards;
- glassmorphism everywhere;
- card-on-card composition;
- rainbow semantic palettes without necessity;
- oversized marketing typography in the workspace;
- decorative animation;
- color-only evidence meaning.

## Semantic Tokens

Implementation should prefer semantic tokens over scattered literal visual values.

Current token roles include surfaces, text hierarchy, borders/focus, graph edges/grid, elevation, and shape/radius. Token naming should describe responsibility rather than literal color.

A future theme may remap tokens; do not introduce another theme until product behavior explicitly requires it.

## Accessibility

- primary controls are keyboard reachable;
- visible `:focus-visible` treatment is required;
- text/boundary contrast must remain readable;
- relationship/evidence meaning cannot depend only on color;
- native semantics are preferred when native controls are sufficient;
- disabled previous/next step controls must reflect actual static-step bounds;
- reduced-motion behavior is required when animated traces are introduced.

## Implementation Ownership

Prefer:

```text
existing design token / interaction pattern
 -> extend existing pattern
 -> small local rule
 -> reusable primitive only after repeated ownership exists
```

Update this document only when durable interaction or visual language changes. One-off implementation details stay in code.
