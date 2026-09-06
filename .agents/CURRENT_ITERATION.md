# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M16 - Detailed Interactive Codeflow Entry

## Product Outcome Delivered

CodeFlow's entry surface now explains the existing source-analysis model through one compact interactive flow before repository analysis starts. The repository action remains primary while the preview makes the path from source intake to evidence inspection understandable without adding another product mode.

The entry journey is:

```text
UNDERSTAND WHAT CODEFLOW TRACES
-> PASTE PUBLIC GITHUB REPOSITORY
-> START ANALYSIS
-> SEE HONEST ANALYSIS ACTIVITY
-> ENTER SEMANTIC GRAPH
```

The interactive preview now represents:

```text
PUBLIC REPOSITORY
-> SOURCE DISCOVERY
-> ENTRY POINTS + SYMBOL INDEX
-> RELATIONSHIP MAPPING
-> CALLS + DEPENDENCIES + TYPES / REFERENCES
-> SEMANTIC GRAPH
-> INSPECT SOURCE + EVIDENCE
```

## Completed Slices

- S1 tightened the landing information architecture around the public GitHub repository action and added a compact relationship capability strip without feature-card marketing UI.
- S2 replaced the three-node demo with a ten-node source-analysis flow. Every node is selectable, connected relationships are emphasized, and the inspector explains the selected stage and its outputs.
- S3 kept the surface compact and flat with 1px strokes, existing restrained steel-blue semantics, Lucide icons, and Motion limited to path drawing, active relationship emphasis, selection feedback, and inspector continuity.
- S4 added behavior coverage for the detailed preview and its animated inspector transition while preserving the absence of local-repository and pull-request acquisition from the initial surface.

## Boundaries Preserved

- Public GitHub repository analysis remains the only primary acquisition action.
- Repository-analysis APIs, analysis engine, graph truth, persistence, and repository-selection contracts are unchanged.
- No new runtime dependency was introduced; the implementation reuses `lucide-react` and `motion` already present in the web app.
- No fake numeric analysis progress was introduced.
- Local repository acquisition and pull-request visualization remain absent from the initial surface.
- No new product capability was added beyond explaining and starting the existing repository-analysis flow.

## Verification

Final integration requires formatting, lint, production build, and web behavior tests to pass on the PR head. Production Compose validation is intentionally skipped because this milestone does not change deployment/runtime infrastructure contracts.
