# CodeFlow Project

`PROJECT.md` is the canonical source of truth for CodeFlow product intent, observable behavior, scope, constraints, non-goals, and open product questions. Active execution state belongs only in `CURRENT_ITERATION.md`.

## Product Definition

CodeFlow is an **interactive code graph explorer** that transforms a software repository into a navigable semantic map.

A developer opens a repository and first receives a system-level mental model of the analyzed codebase. From that map they can follow entry points, responsibilities, calls, references, dependencies, types, and supported static data relationships down to exact source evidence.

The graph is the primary product surface. System architecture, call hierarchy, dependency analysis, test relationships, impact exploration, source evidence, static data flow, and pull-request change visualization are **views or operations over the same semantic graph**, not separate products or top-level workspaces.

```text
source code
  -> deterministic semantic analysis
  -> repository semantic graph = product truth
  -> concern + task projection = navigation aid
  -> interactive graph = primary UX
  -> evidence/source inspection = verification
```

CodeFlow's primary job is to answer five questions:

```text
WHERE DOES IT START?
        ->
HOW IS THE SYSTEM SEPARATED?
        ->
WHERE CAN DATA / CONTROL GO?
        ->
WHAT DOES IT DEPEND ON?
        ->
WHAT DEPENDS ON IT?
```

If a capability does not materially help one of those questions, it is not core CodeFlow by default.

## Intended User

A developer entering an unfamiliar or complex codebase who wants to build a mental model of code relationships faster than reconstructing the system manually file by file.

## Core Product Journey

```text
OPEN REPOSITORY
  -> ANALYZE
  -> SEE SYSTEM MAP WITH PRIMARY ENTRY + RESPONSIBILITY LANES
  -> FOLLOW CALLS / TYPES / REFERENCES / DEPENDENCIES
  -> SWITCH TO DATA / TEST / DEPENDENCY LENS WHEN NEEDED
  -> INSPECT SOURCE + EVIDENCE
  -> MOVE FOCUS / SEARCH
  -> BUILD A MENTAL MODEL OF THE CODEBASE
```

Repository acquisition is setup, not the product. Entry-point discovery is analysis output, not a required user decision before the graph becomes useful. After analysis succeeds, the graph owns the work surface.

## Product Interaction Invariants

- The system map is the default post-analysis projection of the semantic graph.
- CodeFlow chooses the analyzed primary entry point as the initial runtime anchor; alternate detected entry points remain navigable rather than becoming a blocking picker.
- Entry points are first-class navigation anchors.
- Search navigates the graph; it does not open a detached result page.
- The default map separates runtime concerns from supporting test code and package dependencies.
- UI/interface, reusable component, application logic, core/domain, infrastructure, and test labels are deterministic **navigation classifications**. They must expose their inference basis and must not be represented as verified architectural intent unless source evidence supports that stronger claim.
- Exact graph relationships remain source-backed semantic facts. Concern classification never fabricates a relationship.
- Tests are supporting verification relationships, not part of the primary runtime execution lane.
- External dependencies remain package/topology evidence and do not masquerade as business/domain nodes.
- Large repositories are explored progressively. A system projection may bound visible entities per concern; search, focus, and semantic zoom reach the underlying graph without claiming the projection is repository-complete.
- Incoming, outgoing, both-direction expansion, focus, collapse, and dependent traversal remain graph-native operations where exposed.
- Architecture is semantic zoom/projection over the graph, not a separate architecture dashboard.
- Package topology is a zoomed-out graph projection, not a separate package dashboard.
- Impact is inverse/transitive graph traversal, not a top-level workspace.
- Pull-request analysis is a change overlay on the graph. Added, modified, and removed semantic entities/relationships remain grounded in frozen BASE/HEAD revisions.
- Source/evidence inspection explains why a node or edge exists and remains secondary to graph navigation.
- Static data flow and deterministic static steps are contextual lenses/inspection modes; they are not runtime execution.

## Canonical Semantic Surfaces

### System concern projection

The default system map makes responsibility boundaries legible without replacing canonical semantic identity:

```text
UI / INTERFACE
  -> COMPONENTS
  -> APPLICATION LOGIC
  -> CORE / DOMAIN
  -> INFRASTRUCTURE

TESTING -------------------------------- supporting verification
DEPENDENCIES ---------------------------- package / external boundary
```

A repository does not need every lane. Missing evidence remains absent rather than being filled for visual symmetry.

### Semantic zoom

The same repository truth may be projected at different abstraction levels:

```text
Packages / workspace
  -> files / modules
  -> classes / interfaces / types
  -> functions / methods
```

Zooming or changing level changes the projection, not canonical repository truth.

### Relationship lenses

Supported relationships may be filtered by task:

```text
Calls        -> CALLS
References   -> REFERENCES
Dependencies -> IMPORTS / DEPENDS_ON
Types        -> EXTENDS / IMPLEMENTS
Data         -> supported source-backed static data-flow relationships
Tests        -> source-backed relationships involving detected test/spec/e2e code
```

A lens filters what is visible; it must never fabricate missing relationships.

### Static data-flow lens

When function-level data facts are available, CodeFlow may project parameters, argument mappings, reads, writes, mutations, transforms, returns, branches, and failures. This projection must remain explicitly static:

```text
SOURCE FACTS != OBSERVED RUNTIME EXECUTION
```

No runtime branch choice, concrete value, timing, frequency, or probability may be inferred from static steps alone.

### Change overlay

A pull request overlays semantic change state on the same graph:

```text
added / modified / removed / unchanged
```

A change observation is not itself relationship evidence. Existing static evidence rules remain authoritative.

## Current Analysis Capability

The implemented TypeScript path already provides the semantic material required by the graph-first product:

- bounded public GitHub repository analysis and explicit browser-selected local repository input;
- deterministic entry-point discovery with detected/likely/manual confidence;
- request-scoped multi-file TypeScript analysis without executing arbitrary repository code;
- functions and supported cross-file CALLS relationships;
- repository/module/file architecture with functions, methods, classes, interfaces, types, enums, variables, definitions, imports, references, inheritance, and implementation relationships where supported;
- configured workspace/package topology and internal dependency relationships;
- source/evidence provenance for projected semantic relationships;
- parameters, return paths, argument mapping, reads, writes, mutations, transforms, value flow, and deterministic static steps where supported;
- bounded downstream impact derived from canonical relationships;
- public GitHub pull-request BASE/HEAD analysis, diff mapping, semantic entity changes, behavior deltas, relationship deltas, and bounded impact;
- explicit complete/partial/unsupported/error states.

These capabilities support the graph. They do not each require a separate top-level UI.

## Product Constraints

- Evidence precedes explanation.
- Verified, inferred, configured, observed-runtime, and user-asserted evidence remain distinguishable.
- Missing evidence remains missing/partial; visual completeness must not fabricate semantics.
- Static analysis must not claim observed runtime execution, chosen branch outcome, concrete runtime value, timing, frequency, latency, risk, breakage, safety, or probability.
- Ordinary analysis does not execute arbitrary repository code.
- Pull-request analysis preserves exact BASE/HEAD revision identity.
- Impact is a bounded derived traversal over canonical semantic facts; empty impact results do not prove safety.
- Source-location movement alone is not a semantic behavior change.
- Repository source, metadata, pull-request revisions, diffs, and analysis remain request-scoped/in-memory unless persistence is explicitly authorized.
- Large repositories use bounded projections, semantic zoom, progressive expansion, search, and focus rather than graph completeness by default.

## Non-Goals Unless Explicitly Authorized

- generic diagram editing;
- documentation generation as a primary product;
- generic pull-request dashboard/reviewer workflow;
- AI code review, risk scores, or automated refactor recommendations;
- repository-wide LLM ingestion;
- runtime repository execution without a separately approved sandbox;
- universal language/framework coverage;
- private Git-host authentication/import;
- saved analyses or durable persistence;
- collaboration, billing, organization permissions, graph databases, queues, or distributed infrastructure.

## Deferred Product Directions — Not a Roadmap

- another language adapter such as Go after the graph interaction proves useful;
- grounded AI explanation over selected graph/evidence context;
- observed-runtime traces as a distinct evidence layer over stable semantic identities;
- cross-application/service relationships when real repositories justify them;
- private Git-host acquisition or saved analyses if an explicit product requirement appears.

## Material Open Questions

- how concern classification should evolve when framework-specific semantic evidence becomes available;
- private repository authentication and retention;
- runtime trace acquisition and sandboxing;
- AI/private-source handling;
- multi-user isolation/collaboration;
- framework-specific runtime/persistence/event semantics.
