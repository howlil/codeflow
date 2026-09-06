# Current Iteration

Status: IN_PROGRESS

Current Milestone: M17 - System Map as Default Mental Model

## Product Outcome

After repository analysis, a developer should immediately see a connected whole-system map rather than having to choose among many entry points or reconstruct the architecture file by file.

The default post-analysis journey becomes:

```text
OPEN REPOSITORY
  -> ANALYZE
  -> SYSTEM MAP
  -> PRIMARY ENTRY + RESPONSIBILITY LANES
  -> FOLLOW SOURCE-BACKED RELATIONSHIPS
  -> SWITCH TO DATA / TEST / DEPENDENCY LENS AS NEEDED
  -> INSPECT SOURCE + EVIDENCE
```

The map must make separation of concerns visible:

```text
UI / INTERFACE
  -> COMPONENTS
  -> APPLICATION LOGIC
  -> CORE / DOMAIN
  -> INFRASTRUCTURE

TESTING -------------------------------- supporting verification
DEPENDENCIES ---------------------------- package / external boundary
```

Concern labels are deterministic navigation inference; exact semantic relationships and data facts remain source-backed.

## Vertical Slices

### S1 - Semantic concern projection

- Classify graph entities into UI, component, application, core, infrastructure, or test using deterministic source/name signals.
- Keep entry-point identity orthogonal to concern classification.
- Preserve evidence and canonical graph IDs.
- Keep external dependencies in topology rather than pretending they are application nodes.

### S2 - Automatic system-map entry

- Replace the post-analysis entry picker journey with an immediate System Map.
- Use the analyzed primary entry point as the initial runtime anchor.
- Show alternate entry-point count without requiring a blocking choice.
- Preserve graph search as direct navigation.

### S3 - Task lenses over one graph truth

- System Map: concern-oriented overview with bounded progressive detail.
- Runtime Path: production concerns without test/dependency noise.
- Data Flow: supported static function steps and relationships with explicit non-runtime semantics.
- Tests: test/spec/e2e entities separated from runtime and connected back to production code where source relationships exist.
- Dependencies: configured package and external dependency topology.

### S4 - Inspector and visual grammar

- Distinguish concerns by labels, structure, and stroke treatment rather than color alone.
- Keep testing in a visually separate lane.
- Show inferred responsibility reason, incoming/outgoing relationships, related tests, data facts, package dependencies, and source snippet in one inspector.
- Keep Motion limited to continuity/selection and honor reduced-motion preference.

### S5 - Verification and integration

- Unit-test concern classification, map projection, test separation, dependency grouping, and edge semantics.
- Component-test default System Map, absence of blocking entry selection, and Data/Test/Dependency lenses.
- Run formatting, lint, build, and relevant tests on the PR head.
- Update canonical product/iteration docs and squash-merge to `master` only after the integration gate is green.

## Boundaries

- No server/API analysis contract change.
- No repository persistence, LLM classification, or runtime code execution.
- No claim that concern inference is verified architectural intent.
- No claim that static data flow is observed runtime behavior.
- No new runtime dependency.
- Pull-request/impact analysis semantics remain unchanged.
