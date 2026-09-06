# Current Iteration

Status: IN_PROGRESS

Milestone: M16 - Detailed Interactive Codeflow Entry

## Product Outcome

CodeFlow's entry surface should explain the product by letting the user interact with a compact but detailed representation of the analysis pipeline before opening a repository. The landing must stay task-first: one repository action, one source-backed flow model, and no decorative SaaS feature buffet.

The intended entry journey is:

```text
UNDERSTAND WHAT CODEFLOW TRACES
-> PASTE PUBLIC GITHUB REPOSITORY
-> START ANALYSIS
-> SEE HONEST ANALYSIS ACTIVITY
-> ENTER SEMANTIC GRAPH
```

The preview should explain the internal navigation model as:

```text
PUBLIC REPOSITORY
-> SOURCE DISCOVERY
-> ENTRY POINTS + SYMBOL INDEX
-> RELATIONSHIP MAPPING
-> CALLS + DEPENDENCIES + TYPES / REFERENCES
-> SEMANTIC GRAPH
-> INSPECT SOURCE + EVIDENCE
```

## Slices

### S1 - Entry information architecture

- Keep public GitHub repository analysis as the only primary acquisition action.
- Tighten landing copy and spacing around the repository action.
- Add a compact capability strip that names the relationship categories CodeFlow can expose without turning them into marketing cards.
- Preserve the existing product boundary: static source analysis only, no repository code execution.

### S2 - Detailed interactive flow graph

- Replace the three-node preview with a detailed source-analysis flow from repository intake through semantic graph output and evidence inspection.
- Use semantic Lucide icons already available in the repo rather than adding another icon package.
- Make every graph node keyboard/click selectable.
- Highlight the selected node and its directly connected relationships.
- Show concise node-specific explanation and outputs in an inspector region.

### S3 - Compact visual and motion treatment

- Keep the surface flat, compact, neutral, and information-dense with 1px strokes and restrained steel-blue semantic emphasis.
- Use Motion only for path drawing, active relationship emphasis, node selection feedback, and inspector continuity.
- Respect reduced-motion behavior already provided by the app-level MotionConfig.
- Ensure the diagram collapses cleanly on narrow viewports without replacing it with unrelated mobile UI.

### S4 - Verification and milestone closure

- Update behavior tests for the detailed interactive preview and selection state.
- Preserve tests proving local-repository and pull-request acquisition are absent from the initial surface.
- Run repository quality gates: formatting, lint, production build, and web tests.
- Production Compose validation remains unnecessary because this milestone changes only frontend presentation/interaction and no deployment contract.

## Acceptance Criteria

- Initial landing exposes one public GitHub repository action.
- The landing diagram represents repository, source discovery, entry points, symbols, relationship mapping, calls, dependencies, types/references, semantic graph, and evidence inspection.
- Each diagram node is interactive and updates the detail inspector without triggering network analysis.
- Selected relationships are visibly traceable without continuous decorative animation.
- No new runtime dependency is introduced for icons or animation.
- Existing repository-analysis API behavior remains unchanged.
- Formatting, lint, build, and web behavior tests pass before merge.

## Boundaries

- No analysis-engine, persistence, graph-truth, API, or repository-selection contract changes.
- No fake numeric analysis progress.
- No local repository acquisition or pull-request visualization added back to the entry surface.
- No new product capability beyond explaining and starting the existing repository-analysis flow.
