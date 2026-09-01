# CodeFlow Decisions

`DECISIONS.md` records durable material decisions whose rationale would otherwise be expensive to reconstruct. It is not a task diary or implementation history.

## D-001 — Universal semantic model is the central boundary

**Decision:** Language, framework, infrastructure, and future runtime analysis converge on one shared semantic entity/relationship/evidence model.

**Why:** Consumers should reason about software semantics rather than parser-specific AST shapes, and adding another language should not require a separate UI/product architecture.

**Consequences:** Parser-specific structures stay behind adapters/analysis boundaries. API/UI consume semantic projections.

## D-002 — Evidence provenance is first-class

**Decision:** Semantic relationships that can be uncertain retain explicit provenance and evidence classification.

**Why:** CodeFlow must distinguish what is verified, inferred, configured, runtime-observed, or explicitly user-asserted instead of presenting a visually complete but misleading graph.

**Consequences:** Missing/partial evidence remains explicit. AI/generated prose cannot silently become canonical semantic truth.

## D-003 — TypeScript modular monolith for the current product

**Decision:** The current product uses a TypeScript monorepo with `apps/web`, `apps/api`, and `packages/analysis-core` rather than independent services per concern/language.

**Why:** This keeps early product iteration, debugging, shared contracts, and deployment simple while the primary risk remains semantic correctness and product understanding.

**Consequences:** New services/distributed boundaries are not the default and require a measured current need plus approval when they materially change architecture.

## D-005 — Fastify is the HTTP boundary

**Decision:** `apps/api` uses Fastify as a narrow HTTP/orchestration layer over semantic analysis.

**Why:** Fastify provides a small TypeScript-friendly transport boundary without requiring a broader application framework.

**Consequences:** Analysis/domain behavior remains in `analysis-core`; transport-specific concerns should not become semantic ownership.

## D-006 — No graph database, Redis, or queue by default

**Decision:** Current analysis does not require graph-specific persistence, Redis, or asynchronous queue infrastructure.

**Why:** Those systems add operational and architectural cost before demonstrated query, duration, failure-isolation, or concurrency pressure exists.

**Consequences:** Introduce them only for a current measured requirement. Durable persistence, if introduced, is a new material architecture/data decision.

## D-007 — Static analysis does not execute arbitrary repository code

**Decision:** Ordinary analysis reads/parses repository source/config without executing the analyzed repository.

**Why:** Repository contents are untrusted and may be confidential; arbitrary execution creates a substantially different security boundary.

**Consequences:** Future runtime execution requires a separately approved sandbox architecture covering resource, filesystem, process, network, timeout, and secret isolation.

## D-008 — Canvas/view state is not canonical repository state

**Decision:** Canvas coordinates, visual grouping, search/focus, selection, and inspector state are projections/view state rather than semantic truth.

**Why:** Product truth must remain reproducible from repository analysis/evidence and should not depend on how a user arranged or inspected the graph.

**Consequences:** UI interaction can change presentation and inspection context but cannot create or reclassify semantic relationships by itself.

## D-009 — M3 repository input is local, bounded, and in-memory

**Decision:** The first real-repository input path uses browser local-directory/file selection. The web client sends only the bounded supported source set plus the selected exported entry point to `apps/api`, which validates the request again and performs in-memory static analysis.

**Why:** This proves the real-repository product path without introducing Git-host authentication, server-side clone/process execution, persistence, or a wider remote-network trust boundary before those capabilities are required.

**Consequences:** Repository source remains user-selected and ephemeral for M3; both client and API apply scope/resource limits; API path validation is authoritative; ordinary analysis does not execute repository code. Public/private Git import, repository auth, saved analyses, and server-side repository acquisition remain separate future product/security decisions.
