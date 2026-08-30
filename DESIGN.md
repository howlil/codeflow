# CodeFlow Product Design System

## Status

Canonical source of truth for durable CodeFlow visual, interaction, workspace, and interface behavior.

This document supersedes the **Canvas UX** and **Visual Design System** guidance inside `.agent/specs/2026-08-25-codeflow-foundation-design.md` where they conflict. The foundation spec remains authoritative for product thesis, semantic architecture, IR, adapters, projections, API, security, and other material system decisions.

Feature-specific behavior still belongs in requirements/specs. Current iteration state still belongs in `.agent/plan.md`.

## Design Intent

CodeFlow is a calm, precise engineering workspace for understanding complex software.

The interface should recede behind the information while structure, provenance, uncertainty, and navigation remain immediately legible.

CodeFlow is not styled as an AI dashboard, marketing surface, or diagram editor. It should feel like a serious developer tool: technical, dense where useful, spatial, restrained, and evidence-oriented.

## Design Order

Design decisions follow this order:

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

A file tree is supporting navigation. The primary workspace should help users reason about responsibilities, entry points, flows, dependencies, state, and evidence.

### Evidence before decoration

Visual treatment must help users distinguish what CodeFlow knows, how it knows it, and how certain that relationship is.

Do not use styling that makes inferred information look equivalent to verified information.

### Progressive disclosure

Large graphs are not useful merely because they are complete. Show the smallest meaningful projection for the current task and reveal detail on demand.

### Preserve orientation

Navigation should preserve where the user is in the software system.

Search, drill-down, focus, source inspection, and semantic zoom should move the user within one mental model rather than opening disconnected result surfaces.

### Interaction follows semantics

Coordinates, cards, panels, and animations are view state. Semantic entities, relationships, evidence, and source provenance remain product truth.

## Workspace Model

Desktop default:

```text
+----------------------+--------------------------------------+----------------------+
| Repository / Scope   | Semantic Workspace                   | Inspector / Source   |
|                      |                                      |                      |
| context              | selected projection                  | selected entity      |
| entry points         | nodes + relationships                | source               |
| evidence legend      | search + focus                       | provenance           |
+----------------------+--------------------------------------+----------------------+
```

The center workspace is primary. Side panels support orientation and inspection; they must not visually overpower the graph.

Avoid dashboard-style collections of unrelated cards.

## Information Hierarchy

Prefer hierarchy through:

1. position and grouping
2. typography
3. spacing
4. line weight
5. opacity
6. shape
7. color only when it adds semantic value

The workspace should remain understandable in a mostly monochrome presentation.

## Navigation Model

### Search

Search is spatial navigation, not a separate search-results destination.

A result should select the semantic entity and move/focus the active projection around it while keeping source/evidence inspection synchronized.

### Focus

Focus mode reduces irrelevant context without changing canonical semantic relationships.

Default behavior should favor a bounded immediate neighborhood. Additional depth controls should only be introduced when graph size makes them necessary.

### Semantic zoom

Target abstraction model:

```text
L0 System / Ecosystem
L1 Applications / Services
L2 Modules / Features
L3 Types / Functions
L4 Control / Data Flow
L5 Source
```

Camera scale alone must not blindly determine abstraction. Combine scale with explicit drill-down and selected context so users remain oriented.

## Canvas Language

### Canvas role

The canvas is a semantic exploration surface, not a free-form diagram editor.

Manual node position may help local comprehension, but coordinates never become semantic truth.

### Nodes

Nodes are compact, information-dense representations of semantic entities.

Use a stable hierarchy:

```text
kind / role
name
small supporting metadata
```

Rules:

- compact before decorative
- clear selected state
- restrained hover state
- no per-node gradient treatments
- no large illustrative icons
- no rainbow taxonomy by default
- do not encode entity kind using color alone

### Edges

Relationship semantics must remain legible without color.

Default evidence treatment:

```text
solid   -> verified/static/configured relationship
 dashed -> inferred relationship
```

Observed runtime and active simulation may receive separate emphasis later, but runtime evidence must remain distinguishable from static simulation.

Relationship labels should be concise and semantic (`CALLS`, `READS`, `WRITES`, etc.).

### Selection

Selection should be obvious but quiet.

Prefer stronger border/ring/weight over glow, bloom, or saturated fill.

Selection does not change evidence semantics.

### Evidence

Evidence styling should consistently expose:

- evidence kind
- source/provenance
- supporting source range when available
- concise reason for inference or verification

Trust semantics must never depend only on hue.

## Inspector

The inspector explains the selected semantic context.

Prioritize available information in this order:

```text
identity / kind
source location
source snippet
relationship evidence
inputs / outputs
callers / callees
reads / writes / side effects
failure paths
other derived metadata
```

Do not fill absent information with speculative copy.

Source and evidence are more important than decorative summaries.

## Interaction States

Every primary interactive surface should have deliberate states where relevant:

- default
- hover
- focus-visible
- selected / pressed
- disabled
- loading
- empty
- partial / unsupported
- error

State styling should communicate behavior before decoration.

Partial analysis must look usable-but-incomplete, not equivalent to complete success or total failure.

## Layout

### Desktop

Use a three-region workspace with the semantic canvas receiving most horizontal space.

Keep major panels aligned and avoid unnecessary nested card boundaries.

### Narrow screens

Collapse into a reading/task order that preserves comprehension:

```text
context
 -> semantic workspace
 -> inspector/source
```

Controls may stack vertically. The canvas should not require desktop-only pointer interactions for primary navigation.

Responsive behavior should simplify layout before removing information.

## Visual Language

### Product character

```text
technical
calm
precise
neutral
spatial
evidence-oriented
```

### Surfaces

Use a small neutral surface hierarchy:

- app/background
- workspace
- canvas
- muted/source surface
- floating overlay
- node

Floating treatment is reserved for genuinely floating UI such as search results. Persistent panels should normally use borders and surface contrast rather than glass effects.

### Typography

Use system-oriented sans-serif typography for interface text and a readable monospace context for source when introduced.

Typography should be compact enough for engineering information. Avoid oversized marketing typography inside the workspace.

### Borders

Thin borders are the primary structural separator.

Use stronger borders for selection/focus, not decorative emphasis.

### Radius

Radius should communicate grouping without turning every surface into a soft card.

Use fewer radii with consistent roles rather than arbitrary values per component.

### Elevation

Elevation is functional:

- persistent workspace regions: normally flat
- nodes: minimal lift only when it improves separation from canvas
- transient overlays: stronger but restrained shadow

Avoid glowing elevation.

### Motion

Motion must explain state or direction.

Do not animate static graphs merely to make the interface feel active.

Honor reduced-motion preferences when animated traces are introduced.

## Semantic Design Tokens

Implementation should consume semantic tokens instead of scattering raw visual values through components.

Current token contract:

```text
Surfaces
--surface-app
--surface-workspace
--surface-canvas
--surface-muted
--surface-overlay
--surface-node

Text
--text-primary
--text-secondary
--text-muted
--text-subtle
--text-body

Borders / state
--border-default
--border-subtle
--border-muted
--border-strong
--focus-ring

Graph
--edge-default
--canvas-grid

Elevation
--shadow-node
--shadow-overlay
--shadow-selected

Shape
--radius-workspace
--radius-panel
--radius-node
--radius-control
--radius-overlay
--radius-pill
```

Token names describe semantic responsibility, not a literal color such as `gray-500`.

A future theme may remap these tokens. Do not implement a second theme until product behavior explicitly requires it.

## Accessibility

- primary controls must be keyboard reachable
- use visible `:focus-visible` treatment
- preserve sufficient text and boundary contrast
- primary touch targets must remain practical on touch surfaces
- relationship/evidence meaning must not depend only on color
- do not remove native semantics when a native control is sufficient
- reduced-motion behavior is required for future animated traces

## Anti-Patterns

Do not introduce:

- decorative gradient blobs
- glowing AI-style cards
- glassmorphism by default
- card-on-card-on-card composition
- rainbow node taxonomies without semantic necessity
- oversized workspace typography
- dashboard widgets unrelated to the active comprehension task
- decorative animations
- color-only evidence semantics
- raw parser/AST visual language leaking into user-facing semantics
- visual treatment that implies confidence not supported by evidence

## Implementation Contract

UI implementation should follow this preference order:

```text
existing semantic token / pattern
 -> extend existing pattern
 -> add one local token or component rule
 -> introduce a new reusable primitive only when repeated ownership exists
```

Do not create a broad component library ahead of actual product needs.

When a feature changes durable interaction or visual language, update this document in the same change. Feature-specific one-off layout details should remain in implementation unless they establish a durable product rule.
