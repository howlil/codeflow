import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, replacements) {
  let text = readFileSync(path, 'utf8');
  for (const [before, after] of replacements) {
    if (!text.includes(before)) {
      throw new Error(`M9 wiring target not found in ${path}: ${before.slice(0, 80)}`);
    }
    text = text.replace(before, after);
  }
  writeFileSync(path, text);
}

patch('apps/api/src/change.ts', [["  type AcquiredPullRequest,\n", '']]);
patch('packages/analysis-core/src/change-analysis.ts', [
  ["  RepositoryRelationshipKind,\n", ''],
]);

patch('apps/api/src/app.ts', [
  [
    "import { registerImpactRoute } from './impact.js';\n",
    "import { registerChangeRoute } from './change.js';\nimport { registerImpactRoute } from './impact.js';\n",
  ],
  [
    "  registerImpactRoute(app);\n",
    "  registerImpactRoute(app);\n  registerChangeRoute(app);\n",
  ],
]);

patch('apps/web/src/App.tsx', [
  [
    "} from './flow-client';\nimport { ArchitecturePanel } from './ArchitecturePanel';\n",
    "} from './flow-client';\nimport {\n  analyzeGitHubPullRequest,\n  type PullRequestAnalysis,\n} from './change-client';\nimport { ArchitecturePanel } from './ArchitecturePanel';\nimport { ChangeWorkspace } from './ChangeWorkspace';\n",
  ],
  [
    "import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';\n",
    "import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';\nimport { GitHubPullRequestPicker } from './GitHubPullRequestPicker';\n",
  ],
  [
    "  const [flow, setFlow] = useState<FlowProjection | null>(null);\n",
    "  const [flow, setFlow] = useState<FlowProjection | null>(null);\n  const [changeAnalysis, setChangeAnalysis] =\n    useState<PullRequestAnalysis | null>(null);\n",
  ],
  [
    "    setAnalyzing(true);\n    setError(null);\n    setSelectionSummary(summary);\n",
    "    setAnalyzing(true);\n    setError(null);\n    setChangeAnalysis(null);\n    setSelectionSummary(summary);\n",
  ],
  [
    "    setAnalyzing(true);\n    setError(null);\n    setGithubRepositoryUrl(repositoryUrl);\n",
    "    setAnalyzing(true);\n    setError(null);\n    setChangeAnalysis(null);\n    setGithubRepositoryUrl(repositoryUrl);\n",
  ],
  [
    "  function resetRepository() {\n    setFlow(null);\n",
    `  async function analyzePullRequest(pullRequestUrl: string) {\n    setAnalyzing(true);\n    setError(null);\n    setFlow(null);\n    setChangeAnalysis(null);\n    setSelectionSummary(null);\n    setGithubRepositoryUrl(null);\n    setSelectedNodeId(null);\n    setSelectedEdgeId(null);\n    setFocusMode(false);\n    setSourceSplitMode(false);\n    setInspectorTab('overview');\n    setInspectorOpen(false);\n    setRelationshipLens('ALL');\n    setQuery('');\n\n    try {\n      const loaded = await analyzeGitHubPullRequest(pullRequestUrl);\n      setChangeAnalysis(loaded);\n    } catch (caughtError: unknown) {\n      setError(\n        caughtError instanceof Error\n          ? caughtError.message\n          : 'Unable to analyze the public GitHub pull request.',\n      );\n    } finally {\n      setAnalyzing(false);\n    }\n  }\n\n  function openChangeFunction(\n    _snapshot: 'base' | 'head',\n    snapshotFlow: FlowProjection,\n    entityId: string,\n  ) {\n    const node = snapshotFlow.nodes.find((candidate) => candidate.id === entityId);\n    if (node === undefined) {\n      return;\n    }\n    setChangeAnalysis(null);\n    setFlow(snapshotFlow);\n    setGithubRepositoryUrl(null);\n    setSelectionSummary({\n      rootLabel: snapshotFlow.repository?.name ?? 'Pull request revision',\n      selectedFileCount: snapshotFlow.sources.length,\n      ignoredFileCount: snapshotFlow.analysis.ignoredFileCount,\n    });\n    setSelectedNodeId(node.id);\n    setSelectedEdgeId(null);\n    setFocusMode(true);\n    setSourceSplitMode(false);\n    setInspectorTab('overview');\n    setInspectorOpen(true);\n    setRelationshipLens('ALL');\n    setQuery('');\n  }\n\n  function resetRepository() {\n    setFlow(null);\n    setChangeAnalysis(null);\n`,
  ],
  [
    "      {flow === null && !analyzing ? (\n        <>\n          <GitHubRepositoryPicker\n",
    "      {flow === null && changeAnalysis === null && !analyzing ? (\n        <>\n          <GitHubPullRequestPicker busy={analyzing} onAnalyze={analyzePullRequest} />\n          <GitHubRepositoryPicker\n",
  ],
  [
    "          <strong>Analyzing selected TypeScript repository…</strong>\n          <span>\n            Building an evidence-backed projection without executing code.\n          </span>\n        </section>\n      ) : error !== null ? (\n",
    "          <strong>Analyzing selected TypeScript repository or pull request…</strong>\n          <span>\n            Building bounded evidence-backed projections without executing code.\n          </span>\n        </section>\n      ) : changeAnalysis !== null ? (\n        <ChangeWorkspace\n          analysis={changeAnalysis}\n          onOpenFunction={openChangeFunction}\n          onChangeRepository={resetRepository}\n        />\n      ) : error !== null ? (\n",
  ],
]);
