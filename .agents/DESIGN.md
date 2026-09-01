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

Search, focus, source inspection, relationship navigation, and future semantic zoom should move the user within one coherent mental model rather than opening disconnected surfaces.

### Interaction follows semantics

Coordinates, panels, selection, focus, source expansion, and animation are view state. Semantic entities, relationships, evidence, and source provenance remain product truth.

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

Observed runtime and active simulation may receive separate treatment later, but runtime evidence must remain distinguishable from static simulation.

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

Do not fill absent information with speculative copy.

Source expansion should increase source visibility without replacing the semantic workspace or losing the current semantic selection.

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
