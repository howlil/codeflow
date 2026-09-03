# Current Iteration

Status: COMPLETE

Active Milestone: M5 - GitHub-to-Understanding Workspace

## Outcome

CodeFlow now takes a public GitHub repository URL as the primary entry journey, acquires a bounded TypeScript/TSX source set in memory, discovers deterministic entry-point candidates, and opens the existing evidence-backed semantic workspace. The local repository picker remains available as an explicit secondary path.

All authorized M5 slices are implemented:

- S1 GitHub acquisition: strict public repository URL parsing, metadata/tree/raw-source retrieval, supported-source filtering, traversal rejection, timeout handling, file/byte bounds, and safe error categories.
- S2 orientation and entry discovery: exported TypeScript functions are surfaced with deterministic detected/likely confidence labels and repository-relative paths.
- S3 full-height workspace: the existing M4 semantic workspace is the post-acquisition destination, with repository context and analysis status visible above the canvas.
- S4 evidence inspection: source-backed nodes, edges, evidence locations, data projections, static-flow steps, and partial-analysis issues remain available for GitHub-acquired sources.
- S5 search and focus: existing search, focus mode, keyboard navigation, relationship lenses, and inspector behavior are preserved for acquired repositories.
- S6 lifecycle: change repository, loading, invalid, unavailable, unsupported, bounded, and partial states are explicit; source remains request-scoped and is never persisted or executed.
- S7 production acceptance: the GitHub route is covered at the API boundary and the primary picker/discovery behavior has focused regression coverage; the existing Compose/CI packaging path remains intact.

## Verification Evidence

- `pnpm format:check`
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm check`
- Pull request verification on the protected `master` branch
- Post-merge `HEAD`, `origin/master`, and clean-worktree synchronization check

The remote `master` advanced with M4 while this slice was in progress. That revision was integrated before final verification so the M5 adapter composes with the current local-analysis and semantic-workspace contracts.

## Boundaries Preserved

- Public GitHub repositories only; no private-auth flow or credential storage.
- TypeScript/TSX only for this iteration; unsupported files are reported rather than fabricated into the model.
- Bounded request-scoped/in-memory analysis; no persistence, arbitrary repository execution, runtime tracing, or AI explanation was added.
- Static evidence and inferred entry-point confidence remain distinct from observed runtime behavior.
