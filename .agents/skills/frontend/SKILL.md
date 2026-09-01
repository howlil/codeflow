# CodeFlow Frontend Engineering Skill

Use this skill for changes owned by `apps/web` or for user-facing slices that cross the semantic/API boundary into the web workspace.

## Objective

Build a precise, accessible, maintainable React interface that exposes CodeFlow semantic truth without duplicating domain logic or accumulating UI framework ceremony.

Optimize for:

```text
correct product behavior
-> clear ownership
-> accessible interaction
-> small coherent components
-> explicit async/error states
-> measured performance
-> minimal dependencies
```

## Stack Contract

Current installed web stack is authoritative from `apps/web/package.json`.

Preferred frontend technology family:

- React + TypeScript;
- Vite for the current SPA/build boundary;
- TanStack Router/Query when routing or server-state complexity justifies them;
- TanStack Start only when an explicitly approved product/architecture requirement needs its full-stack/SSR/server-function model;
- Tailwind CSS when utility-first styling is explicitly adopted for the web app;
- Radix Primitives for complex accessible interaction primitives when native HTML is insufficient.

Do not install TanStack, Tailwind, Radix, a component library, or helper dependency merely because it appears in this skill. Reuse the current stack first and add dependencies only for a current requirement with clear ownership and value.

TanStack Start is not a drop-in styling/router dependency. CodeFlow currently has a separate Vite web app and Fastify API; replacing that boundary with TanStack Start is a material architecture change and requires explicit user approval.

## Vertical Feature Delivery

User-facing product capability is delivered vertically by default:

```text
semantic/domain behavior
-> API/projection contract
-> web interaction/presentation
-> verification
```

A backend/semantic capability intended to be observable by the user is not complete merely because `analysis-core` or the API supports it.

The corresponding UI must expose the capability truthfully in the same milestone/slice unless the authorized work is explicitly infrastructure-only, contract-only, or an exploratory spike.

Do not build UI that invents semantic capability not supported by analysis/API truth. Do not accumulate hidden backend product features for a later generic "frontend phase".

## React Rules

- Prefer function components and composition.
- Keep state at the lowest owner that needs it; lift only when multiple owners coordinate.
- Derive values during render when possible; do not mirror derivable state with `useEffect`.
- Use effects only for synchronization with external systems, subscriptions, timers, DOM integration, or equivalent side effects.
- Keep event-driven work in event handlers rather than effects.
- Prefer explicit props over large generic context. Introduce context only for genuinely shared cross-tree state.
- Avoid premature `memo`, `useMemo`, and `useCallback`; add them only when identity or measured render cost matters.
- Avoid boolean-prop explosions. If a component develops multiple behavioral modes, reconsider its responsibility or model the state explicitly.
- Keep leaf components semantic: use `button`, `a`, `input`, headings, lists, and landmarks before generic `div` interaction.
- Do not split files solely because of line count. Extract when a durable responsibility, reusable primitive, or independently testable behavior emerges.

## Component Ownership

Prefer responsibility-oriented organization over generic folder taxonomies.

Current small codebase may remain flat. When ownership pressure appears, a good direction is:

```text
src/
  App.tsx
  flow-client.ts
  workspace/
    FlowCanvas.tsx
    Inspector.tsx
  ui/
    ...only repeated owned primitives
```

Do not create `components/common`, `utils`, `hooks`, or deep atomic-design hierarchies by default.

A helper belongs near the behavior it supports until repeated ownership proves a better home.

## Data and API Boundary

- Keep HTTP/API access behind a small client boundary such as `flow-client.ts`; leaf UI components should not scatter raw `fetch` calls.
- UI consumes semantic/projection contracts; it does not parse repository source or reconstruct missing relationships.
- Server state and view state are different concerns. Selection, focus, panels, layout coordinates, and search UI are view state; semantic entities/evidence are not.
- If TanStack Query is introduced, use it for remote/server state, caching, invalidation, and request lifecycle; do not use it as a generic local state store.
- Keep query keys stable and responsibility-based.
- Normalize transport errors at the client boundary into states the UI can present truthfully.

## TanStack Router / Start

When routing becomes non-trivial:

- prefer typed routes and route-owned data requirements;
- make URL/search params represent durable navigation state only when sharing/bookmarking/back-forward behavior benefits;
- do not move ephemeral canvas coordinates or incidental component state into the URL;
- keep route loaders/server functions thin and call owning domain/API behavior rather than recreating business rules.

TanStack Start may be considered when SSR, streaming, server functions, or unified full-stack routing is a deliberate requirement. Do not migrate from the current Vite SPA + Fastify boundary merely for framework fashion.

## Tailwind CSS

If Tailwind is adopted:

- prefer the current official Vite integration rather than legacy PostCSS ceremony unless a concrete build constraint requires otherwise;
- keep design values behind semantic CSS variables/tokens where CodeFlow design semantics matter;
- use utilities for local layout/spacing/state styling and avoid turning every repeated class list into an abstraction;
- create a reusable component/variant only when repeated behavior and ownership justify it;
- avoid arbitrary values when an existing token or standard scale communicates the intent;
- avoid excessive `@apply` or custom CSS wrappers that simply rename utility bundles;
- keep responsive behavior intentional and derived from task hierarchy, not breakpoint proliferation.

Do not introduce a class-merging/variant dependency until the code has real repeated conditional-class pressure.

## Radix Primitives

Use Radix when it removes difficult interaction/accessibility work for patterns such as dialogs, menus, popovers, tooltips, tabs, select, or similar widgets.

- Prefer native HTML when native behavior is sufficient.
- Treat Radix as behavior/accessibility primitives, not a visual design system.
- Style primitives through CodeFlow-owned tokens/styles.
- Preserve keyboard navigation, focus management, labels, and accessible names.
- When using `asChild`, the child must remain semantically correct, spread required props, and accept the ref/behavior Radix needs.
- Do not wrap every primitive in a local abstraction before repeated product ownership exists.

## Styling and Design

`.agents/DESIGN.md` is authoritative for durable visual/interaction behavior.

- Information hierarchy before decoration.
- Evidence state must not depend on color alone.
- Use semantic tokens instead of scattered literals when a value represents a durable role.
- Avoid decorative gradients, glow, glassmorphism everywhere, card-on-card dashboards, and animation without interaction meaning.
- Preserve `:focus-visible`, readable contrast, and reduced-motion behavior where animation exists.

## Clean Code

Prefer:

```text
clear name
-> direct implementation
-> small local helper
-> owned reusable component
-> abstraction only after repetition/pressure
```

Avoid:

- speculative design-system layers;
- generic wrappers with one caller;
- duplicated semantic/API types that can drift without a deliberate contract boundary;
- mixed data fetching, semantic transformation, layout, and presentation in one helper when they have distinct owners;
- comments that narrate obvious code; document constraints, invariants, and non-obvious reasons instead;
- hidden fallback data that makes incomplete analysis look successful.

## Testing

Test observable behavior at the closest useful boundary.

- Use Testing Library semantics/roles rather than implementation selectors where practical.
- Protect user flows such as selection, source/evidence inspection, search/focus, keyboard navigation, and explicit loading/empty/partial/error states.
- Add regression tests for bugs that could recur.
- Do not add brittle snapshot tests for ordinary markup/styling.
- Presentation-only changes do not require a new test when existing behavior tests plus direct visual/diff verification provide enough confidence.

Run focused web tests first, then the repository gate required by `.agents/QUALITY.md`.

## Performance

Do not optimize hypothetical scale.

Prefer in order:

1. bounded semantic projections;
2. avoid unnecessary duplicated derived state;
3. keep expensive computation out of repeated render paths;
4. lazy-load genuinely heavy detail surfaces;
5. measure render/interaction pressure;
6. only then add memoization, virtualization, renderer specialization, or more complex state machinery.

## Done Criteria

Frontend work is complete when:

- the authorized user-visible behavior is present;
- semantic/API truth and UI representation agree;
- loading/empty/partial/error behavior is truthful where applicable;
- keyboard/accessibility behavior is preserved;
- no unnecessary dependency or abstraction was introduced;
- relevant focused tests pass;
- repository quality gates pass when required.
