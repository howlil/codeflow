# Current Iteration

Status: RELEASE READY

Active Milestone: M5 — GitHub-to-Understanding Workspace

Last Completed: M5 — GitHub-to-Understanding Workspace

Goal: Move CodeFlow from a sample-only semantic proof to an end-to-end workflow that takes a public GitHub repository to an evidence-backed understanding workspace without manual file acquisition.

## Product outcome

```text
GitHub URL
 -> validate and acquire bounded source
 -> deterministic repository orientation
 -> suggested entry point
 -> cross-file static analysis
 -> semantic flow workspace
 -> evidence/source inspection
 -> search and focused navigation
```

## Completed slices

### S1 — GitHub repository acquisition

- `POST /api/analyses` accepts only public `https://github.com/owner/repository` URLs.
- GitHub metadata/tree/source acquisition is request-scoped and in-memory.
- Bounds are enforced at 40 files, 800 KB per file, 4 MB total, and 8 seconds per request.
- Absolute/traversal paths, dependency/vendor/build/generated directories, and non-TypeScript files are excluded.
- Source bodies are capped while streamed; repository code is never executed.

### S2 — Repository orientation and entry discovery

- Exported TypeScript functions are discovered deterministically across the bounded source set.
- Conventional bootstrap names and locations are labelled `detected`; other exported symbols are `likely`.
- The workspace lets the user select a suggested entry point and reanalyze that entry.

### S3 — Full-height analysis workspace

- The initial screen is a single repository acquisition task.
- After analysis, the semantic canvas is the dominant surface.
- Compact context and a selection-driven inspector flank the canvas.
- The repository URL becomes breadcrumb/context rather than a persistent setup form.

### S4 — Evidence-centric inspection

- Node and relationship selection opens exact repository-relative source locations.
- `verified-static`, `inferred-static`, and unavailable evidence remain distinct.
- The workspace exposes `Verified`, `Inferred`, and `Unresolved` counts.
- Source inspection can expand without leaving the semantic workspace.

### S5 — Search, focus, and semantic navigation

- `Ctrl K` / `Cmd K` focuses repository search.
- Search matches symbol names and repository-relative source paths.
- `Focus neighborhood`, `Show callers`, and `Show callees` keep selection and context synchronized.
- Arrow-key caller/callee navigation remains available on canvas nodes.

### S6 — Truthful lifecycle

- Client progress distinguishes URL validation from repository acquisition/analysis without fake percentages.
- API errors distinguish invalid URL, unavailable repository, unsupported repository, and analysis failure.
- Ready/partial analysis is explicit; ignored files, TypeScript diagnostics, and unsupported dynamic imports become limitations.

### S7 — Production acceptance

- Cross-file TypeScript fixture covers entry, imported callee, local callee, source evidence, and deterministic IDs.
- API tests cover GitHub acquisition, filtering, partial response, invalid URL, and unsupported repository behavior.
- Web tests cover acquisition journey, no manual picker, entry/search/focus navigation, evidence, partial state, and local URL rejection.
- The sample endpoint remains available for regression fixtures but is no longer the primary web journey.

## Scope boundaries

Included: public GitHub repositories, TypeScript/TSX static analysis, bounded request-scoped source, deterministic `CALLS` semantics, evidence-backed projection, workspace navigation, and partial/error UX.

Excluded: private auth, accounts, persistence, saved analysis, database/queue/worker infrastructure, AI chat, runtime execution/tracing, additional languages, security scanning, PR impact analysis, and architecture dashboards.

## Verification evidence

- `pnpm --filter @codeflow/analysis-core typecheck`
- `pnpm --filter @codeflow/analysis-core build`
- `pnpm --filter @codeflow/analysis-core test`
- `pnpm --filter @codeflow/api typecheck`
- `pnpm --filter @codeflow/api test`
- `pnpm --filter @codeflow/web typecheck`
- `pnpm --filter @codeflow/web test`
- `pnpm check`

The final branch/remote/CI state is recorded in the delivery report after protected-master integration.
