import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import {
  AnalysisRequestError,
  loadAnalysis,
  type FlowEdge,
  type FlowNode,
  type FlowProjection,
} from './flow-client';

type AnalysisPhase = 'idle' | 'VALIDATING' | 'FETCHING' | 'READY' | 'PARTIAL';
type FocusDirection = 'neighborhood' | 'callers' | 'callees';

export function App() {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focusDirection, setFocusDirection] =
    useState<FocusDirection>('neighborhood');
  const [sourceSplitMode, setSourceSplitMode] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const selectedNode = useMemo(
    () => flow?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [flow, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => flow?.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [flow, selectedEdgeId],
  );

  async function analyze(entryPoint?: { filePath: string; name: string }) {
    setError(null);
    setPhase('VALIDATING');
    if (!isGitHubRepositoryUrl(repositoryUrl)) {
      setError(
        new AnalysisRequestError(
          'INVALID_REPOSITORY_URL',
          'Enter a public GitHub repository URL such as https://github.com/owner/repository.',
        ),
      );
      setPhase('idle');
      return;
    }

    setPhase('FETCHING');
    try {
      const loadedFlow = await loadAnalysis(repositoryUrl, entryPoint);
      setFlow(loadedFlow);
      setSelectedNodeId(loadedFlow.entryPointId);
      setSelectedEdgeId(null);
      setFocusDirection('neighborhood');
      setQuery('');
      setPhase(loadedFlow.analysis?.state === 'PARTIAL' ? 'PARTIAL' : 'READY');
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error('The repository could not be analyzed.'),
      );
      setPhase('idle');
    }
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function focusOn(direction: FocusDirection) {
    setFocusDirection((current) =>
      current === direction ? 'neighborhood' : direction,
    );
    setSelectedEdgeId(null);
  }

  if (flow === null) {
    return (
      <main className="app-shell">
        <header className="landing-header">
          <div>
            <p className="eyebrow">Evidence-backed program understanding</p>
            <h1>CodeFlow</h1>
          </div>
          <span className="trust-note">
            Static analysis only · no code execution
          </span>
        </header>
        <section
          className="acquisition-panel"
          aria-labelledby="acquisition-title"
        >
          <div className="acquisition-copy">
            <p className="panel-kicker">Start with a repository</p>
            <h2 id="acquisition-title">Understand an unfamiliar codebase</h2>
            <p>
              Paste a public GitHub URL and CodeFlow will surface entry points,
              semantic relationships, and the source evidence behind them.
            </p>
          </div>
          <form
            className="acquisition-form"
            onSubmit={(event) => {
              event.preventDefault();
              void analyze();
            }}
          >
            <label htmlFor="repository-url">Public GitHub repository URL</label>
            <div className="acquisition-input-row">
              <input
                id="repository-url"
                type="url"
                value={repositoryUrl}
                placeholder="https://github.com/owner/repository"
                autoComplete="url"
                onChange={(event) => setRepositoryUrl(event.target.value)}
              />
              <button
                className="primary-action"
                type="submit"
                disabled={phase !== 'idle'}
              >
                {phase === 'VALIDATING'
                  ? 'Validating…'
                  : phase === 'FETCHING'
                    ? 'Analyzing…'
                    : 'Analyze repository'}
              </button>
            </div>
            <p className="field-note">
              Public repositories · bounded TypeScript source · request-scoped
            </p>
          </form>
          {phase !== 'idle' ? <AnalysisProgress phase={phase} /> : null}
          {error !== null ? <AnalysisErrorPanel error={error} /> : null}
        </section>
      </main>
    );
  }

  const searchResults = getSearchResults(flow, query);
  const verifiedCount = flow.edges.filter(
    (edge) => edge.evidence[0]?.kind === 'verified-static',
  ).length;
  const inferredCount = flow.edges.filter(
    (edge) => edge.evidence[0]?.kind === 'inferred-static',
  ).length;
  const unresolvedCount =
    flow.analysis?.unresolvedReferences ??
    flow.edges.filter((edge) => edge.evidence.length === 0).length;

  return (
    <main className="app-shell workspace-app">
      <header className="workspace-topbar">
        <div className="brand-lockup">
          <p className="eyebrow">Repository understanding</p>
          <h1>CodeFlow</h1>
        </div>
        <div className="repository-breadcrumb" aria-label="Repository context">
          <button
            className="text-button"
            type="button"
            onClick={() => setFlow(null)}
          >
            {flow.repository?.name ?? 'Repository'}
          </button>
          <span>/</span>
          <span>{flow.repository?.branch ?? 'default branch'}</span>
          <span>/</span>
          <strong>{selectedNode?.label ?? 'entry point'}</strong>
        </div>
        <button
          className="secondary-action"
          type="button"
          onClick={() => setFlow(null)}
        >
          New repository
        </button>
      </header>

      <div
        className={`workspace-layout${sourceSplitMode ? ' source-split' : ''}`}
      >
        <aside className="context-panel" aria-label="Repository context">
          <p className="panel-kicker">Repository context</p>
          <h2>{flow.repository?.name ?? 'Analyzed repository'}</h2>
          <p className="context-url">{flow.repository?.url ?? repositoryUrl}</p>
          <div className="context-stats">
            <Stat
              label="Source files"
              value={flow.analysis?.filesAnalyzed ?? flow.sources?.length ?? 1}
            />
            <Stat
              label="Functions"
              value={flow.analysis?.functions ?? flow.nodes.length}
            />
            <Stat
              label="Relationships"
              value={flow.analysis?.relationships ?? flow.edges.length}
            />
          </div>
          <div className="entry-section">
            <div className="section-heading">
              <p className="panel-kicker">Suggested entry points</p>
              <span>{flow.entryPoints?.length ?? 0}</span>
            </div>
            {flow.entryPoints?.length ? (
              <div className="entry-list" aria-label="Suggested entry points">
                {flow.entryPoints.slice(0, 8).map((entryPoint) => (
                  <button
                    className={`entry-item${entryPoint.id === flow.entryPointId ? ' selected' : ''}`}
                    key={entryPoint.id}
                    type="button"
                    onClick={() =>
                      void analyze({
                        filePath: entryPoint.filePath,
                        name: entryPoint.name,
                      })
                    }
                  >
                    <strong>{entryPoint.name}</strong>
                    <span>{entryPoint.filePath}</span>
                    <small>{entryPoint.confidence}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="panel-copy">
                No exported entry points were found in the bounded source set.
              </p>
            )}
          </div>
          {flow.analysis?.limitations.length ? (
            <div className="limitations" role="status">
              <p className="panel-kicker">Analysis limitations</p>
              <ul>
                {flow.analysis.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <section
          className="semantic-workspace"
          aria-label="Semantic flow workspace"
        >
          <div className="workspace-heading">
            <div>
              <p className="panel-kicker">Semantic flow</p>
              <h2>{selectedNode?.label ?? 'Repository flow'}</h2>
            </div>
            <div
              className="uncertainty-summary"
              aria-label="Analysis certainty summary"
            >
              <span>
                <i className="certainty-dot verified" />
                Verified <strong>{verifiedCount}</strong>
              </span>
              <span>
                <i className="certainty-dot inferred" />
                Inferred <strong>{inferredCount}</strong>
              </span>
              <span>
                <i className="certainty-dot unresolved" />
                Unresolved <strong>{unresolvedCount}</strong>
              </span>
            </div>
          </div>
          <div className="workspace-controls">
            <div className="search-control">
              <label htmlFor="symbol-search">
                Search repository <kbd>Ctrl K</kbd>
              </label>
              <input
                ref={searchRef}
                id="symbol-search"
                type="search"
                value={query}
                placeholder="Symbol, file, relationship…"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              {query.trim() !== '' ? (
                <div
                  className="search-results"
                  aria-label="Repository search results"
                >
                  {searchResults.length === 0 ? (
                    <p>No matching symbols or files.</p>
                  ) : (
                    searchResults.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => {
                          selectNode(node.id);
                          setFocusDirection('neighborhood');
                          setQuery('');
                        }}
                      >
                        <strong>{node.label}</strong>
                        <span>{node.location.filePath}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            <div className="focus-actions" aria-label="Semantic navigation">
              <button
                className={focusDirection === 'neighborhood' ? 'active' : ''}
                type="button"
                onClick={() => focusOn('neighborhood')}
              >
                Focus neighborhood
              </button>
              <button
                className={focusDirection === 'callers' ? 'active' : ''}
                type="button"
                onClick={() => focusOn('callers')}
                disabled={selectedNode === null}
              >
                Show callers
              </button>
              <button
                className={focusDirection === 'callees' ? 'active' : ''}
                type="button"
                onClick={() => focusOn('callees')}
                disabled={selectedNode === null}
              >
                Show callees
              </button>
            </div>
          </div>
          {phase === 'PARTIAL' ? <PartialNotice flow={flow} /> : null}
          <FlowCanvas
            flow={flow}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            direction={focusDirection}
            onSelectNode={selectNode}
            onSelectEdge={setSelectedEdgeId}
          />
        </section>

        <aside className="inspector-panel" aria-label="Evidence inspector">
          <Inspector
            flow={flow}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            sourceSplitMode={sourceSplitMode}
            onToggleSourceSplit={() =>
              setSourceSplitMode((current) => !current)
            }
          />
        </aside>
      </div>
    </main>
  );
}

function AnalysisProgress({ phase }: { phase: AnalysisPhase }) {
  return (
    <div className="analysis-progress" role="status" aria-live="polite">
      <strong>
        {phase === 'VALIDATING'
          ? 'Validating repository URL…'
          : 'Fetching repository and building semantic model…'}
      </strong>
      <span>
        No percentage is shown because acquisition and analysis are bounded by
        source limits, not a fake time estimate.
      </span>
    </div>
  );
}

function AnalysisErrorPanel({ error }: { error: Error }) {
  const message =
    error instanceof AnalysisRequestError &&
    error.code === 'UNSUPPORTED_REPOSITORY'
      ? 'No supported TypeScript source found.'
      : error.message;
  return (
    <div className="analysis-error" role="alert">
      <strong>Analysis unavailable</strong>
      <span>{message}</span>
    </div>
  );
}

function PartialNotice({ flow }: { flow: FlowProjection }) {
  return (
    <div className="partial-notice" role="status">
      <strong>Analysis completed with limitations</strong>
      <span>
        {flow.analysis?.limitations.join(' ') ??
          'Some source was outside the bounded projection.'}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FlowCanvas({
  flow,
  selectedNodeId,
  selectedEdgeId,
  direction,
  onSelectNode,
  onSelectEdge,
}: {
  flow: FlowProjection;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  direction: FocusDirection;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
}) {
  const selectedNode = flow.nodes.find((node) => node.id === selectedNodeId);
  const entryPoint = flow.nodes.find((node) => node.id === flow.entryPointId);
  const focalNode = selectedNode ?? entryPoint;
  if (focalNode === undefined)
    return (
      <p className="canvas-empty" role="status">
        No focal function is available. Choose an entry point to continue.
      </p>
    );
  const relatedEdges = flow.edges.filter((edge) =>
    direction === 'callers'
      ? edge.targetId === focalNode.id
      : direction === 'callees'
        ? edge.sourceId === focalNode.id
        : edge.sourceId === focalNode.id || edge.targetId === focalNode.id,
  );
  function handleNodeKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    nodeId: string,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const candidateIds = new Set(
      flow.edges.flatMap((edge) =>
        event.key === 'ArrowRight' && edge.sourceId === nodeId
          ? [edge.targetId]
          : event.key === 'ArrowLeft' && edge.targetId === nodeId
            ? [edge.sourceId]
            : [],
      ),
    );
    const nextNode = flow.nodes
      .filter((node) => candidateIds.has(node.id))
      .sort(compareFlowNodes)[0];
    if (nextNode === undefined) return;
    event.preventDefault();
    onSelectNode(nextNode.id);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(
          `[data-flow-node-id="${CSS.escape(nextNode.id)}"]`,
        )
        ?.focus(),
    );
  }
  return (
    <div className="semantic-canvas">
      <p className="focus-status" role="status">
        {direction === 'neighborhood'
          ? 'Focused neighborhood'
          : direction === 'callers'
            ? 'Callers of'
            : 'Callees of'}{' '}
        <strong>{focalNode.label}</strong>
      </p>
      <NodeButton
        node={focalNode}
        selected={selectedNodeId === focalNode.id && selectedEdgeId === null}
        onSelect={onSelectNode}
        onKeyDown={handleNodeKeyDown}
      />
      <div className="edge-lanes">
        {relatedEdges.length === 0 ? (
          <p className="canvas-empty">No relationships in this focus.</p>
        ) : (
          relatedEdges.map((edge) => {
            const outgoing = edge.sourceId === focalNode.id;
            const neighborId = outgoing ? edge.targetId : edge.sourceId;
            const neighbor = flow.nodes.find((node) => node.id === neighborId);
            if (neighbor === undefined) return null;
            const evidenceKind =
              edge.evidence[0]?.kind ?? 'evidence-unavailable';
            const sourceNode = flow.nodes.find(
              (node) => node.id === edge.sourceId,
            );
            const targetNode = flow.nodes.find(
              (node) => node.id === edge.targetId,
            );
            return (
              <div className="edge-lane" key={edge.id}>
                <button
                  className={`flow-edge flow-edge--${evidenceKind}${selectedEdgeId === edge.id ? ' selected' : ''}`}
                  type="button"
                  aria-label={`Inspect ${edge.kind} relationship from ${sourceNode?.label ?? edge.sourceId} to ${targetNode?.label ?? edge.targetId}`}
                  aria-pressed={selectedEdgeId === edge.id}
                  onClick={() => onSelectEdge(edge.id)}
                >
                  <span>{outgoing ? '→' : '←'}</span>
                  <strong>{edge.kind}</strong>
                  <small>{evidenceKind}</small>
                </button>
                <NodeButton
                  node={neighbor}
                  selected={
                    selectedNodeId === neighbor.id && selectedEdgeId === null
                  }
                  onSelect={onSelectNode}
                  onKeyDown={handleNodeKeyDown}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function NodeButton({
  node,
  selected,
  onSelect,
  onKeyDown,
}: {
  node: FlowNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void;
}) {
  return (
    <button
      className={`flow-node${selected ? ' selected' : ''}`}
      type="button"
      data-flow-node-id={node.id}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => onKeyDown(event, node.id)}
    >
      <span className="node-kind">
        {node.entryPoint ? 'Entry function' : node.kind}
      </span>
      <strong>{node.label}</strong>
      <span>
        {node.location.filePath}:L{node.location.startLine}
      </span>
    </button>
  );
}

function Inspector({
  flow,
  selectedNode,
  selectedEdge,
  sourceSplitMode,
  onToggleSourceSplit,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  sourceSplitMode: boolean;
  onToggleSourceSplit: () => void;
}) {
  if (selectedEdge !== null) {
    const sourceNode = flow.nodes.find(
      (node) => node.id === selectedEdge.sourceId,
    );
    const targetNode = flow.nodes.find(
      (node) => node.id === selectedEdge.targetId,
    );
    const evidence = selectedEdge.evidence[0];
    return (
      <InspectorFrame
        label="Relationship evidence"
        sourceSplitMode={sourceSplitMode}
        onToggleSourceSplit={onToggleSourceSplit}
      >
        <h2>
          {sourceNode?.label ?? selectedEdge.sourceId} →{' '}
          {targetNode?.label ?? selectedEdge.targetId}
        </h2>
        {evidence === undefined ? (
          <EvidenceUnavailable edge={selectedEdge} />
        ) : (
          <>
            <p className="source-location">
              {evidence.location.filePath}:L{evidence.location.startLine}
            </p>
            <SourceBlock
              flow={flow}
              filePath={evidence.location.filePath}
              startLine={evidence.location.startLine}
              endLine={evidence.location.endLine}
            />
            <EvidenceItem edge={selectedEdge} />
          </>
        )}
      </InspectorFrame>
    );
  }
  if (selectedNode === null)
    return (
      <p className="panel-copy">
        Select a function or relationship to inspect its evidence.
      </p>
    );
  const relatedEdges = flow.edges.filter(
    (edge) =>
      edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id,
  );
  return (
    <InspectorFrame
      label="Function inspector"
      sourceSplitMode={sourceSplitMode}
      onToggleSourceSplit={onToggleSourceSplit}
    >
      <span className="inspector-kind">FUNCTION</span>
      <h2>{selectedNode.label}</h2>
      <p className="source-location">
        {selectedNode.location.filePath}:L{selectedNode.location.startLine}–
        {selectedNode.location.endLine}
      </p>
      <SourceBlock
        flow={flow}
        filePath={selectedNode.location.filePath}
        startLine={selectedNode.location.startLine}
        endLine={selectedNode.location.endLine}
      />
      <div className="inspector-section">
        <p className="panel-kicker">Relationships</p>
        {relatedEdges.length === 0 ? (
          <p className="panel-copy">No projected relationships.</p>
        ) : (
          relatedEdges.map((edge) => <EvidenceItem edge={edge} key={edge.id} />)
        )}
      </div>
    </InspectorFrame>
  );
}

function InspectorFrame({
  label,
  sourceSplitMode,
  onToggleSourceSplit,
  children,
}: {
  label: string;
  sourceSplitMode: boolean;
  onToggleSourceSplit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="inspector-content">
      <div className="inspector-heading">
        <p className="panel-kicker">{label}</p>
        <button
          className="text-button"
          type="button"
          aria-pressed={sourceSplitMode}
          onClick={onToggleSourceSplit}
        >
          {sourceSplitMode ? 'Restore workspace' : 'Expand source'}
        </button>
      </div>
      {children}
    </div>
  );
}

function SourceBlock({
  flow,
  filePath,
  startLine,
  endLine,
}: {
  flow: FlowProjection;
  filePath: string;
  startLine: number;
  endLine: number;
}) {
  const source =
    flow.sources?.find((candidate) => candidate.filePath === filePath) ??
    (flow.source.filePath === filePath ? flow.source : null);
  if (source === null)
    return (
      <p className="panel-copy">
        Source text is unavailable for this location.
      </p>
    );
  return (
    <pre className="source-snippet">
      <code>{getSourceSnippet(source.text, startLine, endLine)}</code>
    </pre>
  );
}

function EvidenceItem({ edge }: { edge: FlowEdge }) {
  const evidence = edge.evidence[0];
  if (evidence === undefined) return <EvidenceUnavailable edge={edge} />;
  return (
    <article className="evidence-item">
      <div>
        <span className={`evidence-chip ${evidence.kind}`}>
          {evidence.kind}
        </span>
        <span className="relationship-label">{edge.kind}</span>
      </div>
      <p>{evidence.reason}</p>
      <small>
        {evidence.source} · L{evidence.location.startLine}
      </small>
    </article>
  );
}

function EvidenceUnavailable({ edge }: { edge: FlowEdge }) {
  return (
    <article className="evidence-item unavailable">
      <span className="evidence-chip unresolved">evidence-unavailable</span>
      <span className="relationship-label">{edge.kind}</span>
      <p>No supporting provenance was projected for this relationship.</p>
    </article>
  );
}

function getSearchResults(flow: FlowProjection, query: string): FlowNode[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return [];
  return flow.nodes.filter((node) =>
    `${node.label} ${node.location.filePath}`
      .toLowerCase()
      .includes(normalized),
  );
}

function isGitHubRepositoryUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    const segments = url.pathname.split('/').filter(Boolean);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      segments.length === 2
    );
  } catch {
    return false;
  }
}

function compareFlowNodes(left: FlowNode, right: FlowNode): number {
  return (
    left.location.filePath.localeCompare(right.location.filePath) ||
    left.location.startLine - right.location.startLine ||
    left.id.localeCompare(right.id)
  );
}

function getSourceSnippet(
  source: string,
  startLine: number,
  endLine: number,
): string {
  return source
    .split('\n')
    .slice(startLine - 1, endLine)
    .join('\n');
}
