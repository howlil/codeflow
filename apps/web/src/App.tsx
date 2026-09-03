import { Moon, PanelRightOpen, Sun, X } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

import {
  analyzeRepositoryFlow,
  type FlowEdge,
  type FlowNode,
  type FlowProjection,
  type RepositoryAnalysisRequest,
} from './flow-client';
import {
  RepositoryPicker,
  type RepositorySelectionSummary,
} from './RepositoryPicker';
import {
  FunctionDataPanel,
  RelationshipEvidencePanel,
  StaticStepPanel,
  type RelationshipLens,
} from './StaticFlowPanel';
import {
  Button,
  IconButton,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/primitives';

type ProjectionStatus =
  | { kind: 'ready' }
  | { kind: 'empty'; message: string }
  | { kind: 'partial'; reasons: string[] };
type InspectorTab = 'overview' | 'data' | 'evidence' | 'steps';
type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'codeflow-theme';

export function App() {
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [sourceSplitMode, setSourceSplitMode] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('overview');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [relationshipLens, setRelationshipLens] =
    useState<RelationshipLens>('ALL');
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectionSummary, setSelectionSummary] =
    useState<RepositorySelectionSummary | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const projectionStatus = useMemo(
    () => (flow === null ? null : getProjectionStatus(flow)),
    [flow],
  );
  const selectedNode = useMemo(
    () => flow?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [flow, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => flow?.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [flow, selectedEdgeId],
  );
  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery === '' || flow === null) {
      return [];
    }

    return flow.nodes.filter((node) =>
      node.label.toLowerCase().includes(normalizedQuery),
    );
  }, [flow, query]);
  const availableLenses = useMemo<RelationshipLens[]>(() => {
    if (flow === null) {
      return ['ALL'];
    }
    const kinds = new Set<RelationshipLens>();
    if (flow.edges.length > 0) {
      kinds.add('CALLS');
    }
    for (const relationship of flow.staticFlow?.relationships ?? []) {
      kinds.add(relationship.kind);
    }
    return ['ALL', ...Array.from(kinds).sort()];
  }, [flow]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme remains applied even when storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    function handleGlobalShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut);
    return () => window.removeEventListener('keydown', handleGlobalShortcut);
  }, []);

  async function analyzeRepository(
    request: RepositoryAnalysisRequest,
    summary: RepositorySelectionSummary,
  ) {
    setAnalyzing(true);
    setError(null);
    setSelectionSummary(summary);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setFocusMode(false);
    setSourceSplitMode(false);
    setInspectorTab('overview');
    setInspectorOpen(false);
    setRelationshipLens('ALL');
    setQuery('');

    try {
      const loadedFlow = await analyzeRepositoryFlow(request);
      setFlow(loadedFlow);
      setSelectedNodeId(loadedFlow.entryPointId);
    } catch (caughtError: unknown) {
      setFlow(null);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to analyze the selected repository.',
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function resetRepository() {
    setFlow(null);
    setSelectionSummary(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setFocusMode(false);
    setSourceSplitMode(false);
    setInspectorTab('overview');
    setInspectorOpen(false);
    setRelationshipLens('ALL');
    setQuery('');
    setError(null);
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function inspectNode(nodeId: string) {
    selectNode(nodeId);
    setInspectorTab('overview');
    setInspectorOpen(true);
  }

  function navigateToNode(nodeId: string) {
    inspectNode(nodeId);
    setFocusMode(true);
    setQuery('');
  }

  function selectEdge(edgeId: string) {
    setSelectedEdgeId(edgeId);
    setInspectorTab('evidence');
    setInspectorOpen(true);
  }

  function toggleFocusMode() {
    setFocusMode((current) => !current);
    setSelectedEdgeId(null);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setQuery('');
      event.currentTarget.blur();
      return;
    }
    if (searchResults.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((current) =>
        Math.min(current + 1, searchResults.length - 1),
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const result = searchResults[activeSearchIndex];
      if (result !== undefined) {
        navigateToNode(result.id);
      }
    }
  }

  const entryPoint = flow?.nodes.find((node) => node.id === flow.entryPointId);

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-brand">
          <h1>CodeFlow</h1>
          <span>Evidence first · static analysis only</span>
        </div>
        <IconButton
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={() =>
            setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
          }
        >
          {theme === 'dark' ? (
            <Sun size={14} aria-hidden="true" />
          ) : (
            <Moon size={14} aria-hidden="true" />
          )}
        </IconButton>
      </header>

      {flow === null && !analyzing ? (
        <RepositoryPicker busy={analyzing} onAnalyze={analyzeRepository} />
      ) : null}

      {analyzing ? (
        <section className="state-panel" role="status">
          <strong>Analyzing selected TypeScript repository…</strong>
          <span>
            Building an evidence-backed projection without executing code.
          </span>
        </section>
      ) : error !== null ? (
        <section className="state-panel state-panel--error" role="alert">
          <strong>Repository analysis unavailable</strong>
          <span>{error}</span>
        </section>
      ) : flow === null || projectionStatus === null ? (
        <section className="state-panel" role="status">
          <strong>Select a local TypeScript repository</strong>
          <span>
            Choose an exported entry function to build an evidence-backed flow
            without executing repository code.
          </span>
        </section>
      ) : projectionStatus.kind === 'empty' ? (
        <>
          <WorkspaceContext
            flow={flow}
            selectionSummary={selectionSummary}
            entryPoint={entryPoint ?? null}
            onChangeRepository={resetRepository}
          />
          <section className="state-panel" role="status">
            <strong>No functions projected</strong>
            <span>{projectionStatus.message}</span>
          </section>
        </>
      ) : (
        <>
          <WorkspaceContext
            flow={flow}
            selectionSummary={selectionSummary}
            entryPoint={entryPoint ?? null}
            onChangeRepository={resetRepository}
          />
          <div
            className={`workspace-grid${
              sourceSplitMode ? ' workspace-grid--source-split' : ''
            }`}
          >
            <section className="canvas-panel" aria-label="Semantic flow canvas">
              <AnalysisNotice status={projectionStatus} />
              <div className="canvas-toolbar">
                <div>
                  <p className="panel-kicker">Semantic workspace</p>
                  <h2>{entryPoint?.label ?? 'Selected entry'} request flow</h2>
                </div>
                <span>{flow.nodes.length} functions</span>
              </div>

              <div className="comprehension-toolbar">
                <div className="search-control">
                  <Input
                    ref={searchInputRef}
                    aria-label="Search functions"
                    type="search"
                    value={query}
                    placeholder="Search functions…"
                    autoComplete="off"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveSearchIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                  />
                  {query.trim() !== '' ? (
                    <div
                      className="search-results"
                      aria-label="Function search results"
                      role="listbox"
                    >
                      {searchResults.length === 0 ? (
                        <p>No matching functions.</p>
                      ) : (
                        searchResults.map((node, index) => (
                          <button
                            key={node.id}
                            type="button"
                            role="option"
                            aria-selected={activeSearchIndex === index}
                            onMouseEnter={() => setActiveSearchIndex(index)}
                            onClick={() => navigateToNode(node.id)}
                          >
                            <strong>{node.label}</strong>
                            <span>
                              {node.location.filePath}:L
                              {node.location.startLine}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="toolbar-actions">
                  <Button
                    aria-pressed={focusMode}
                    disabled={selectedNode === null}
                    onClick={toggleFocusMode}
                  >
                    {focusMode ? 'Back to entry flow' : 'Focus selected'}
                  </Button>
                  <Button
                    className="inspector-open-button"
                    aria-label="Open inspector"
                    onClick={() => setInspectorOpen(true)}
                  >
                    <PanelRightOpen size={13} aria-hidden="true" />
                    Inspector
                  </Button>
                </div>
              </div>

              <div className="lens-toolbar" aria-label="Relationship lens">
                <div className="lens-options">
                  {availableLenses.map((kind) => (
                    <Button
                      key={kind}
                      variant="ghost"
                      aria-pressed={relationshipLens === kind}
                      className="lens-button"
                      onClick={() => {
                        setRelationshipLens(kind);
                        setInspectorTab('evidence');
                      }}
                    >
                      {relationshipLabel(kind)}
                    </Button>
                  ))}
                </div>
                <EvidenceLegend />
              </div>

              <FlowCanvas
                flow={flow}
                selectedNodeId={selectedNodeId}
                selectedEdgeId={selectedEdgeId}
                focusMode={focusMode}
                onSelectNode={inspectNode}
                onKeyboardNavigate={(nodeId) => {
                  selectNode(nodeId);
                  setInspectorTab('overview');
                }}
                onSelectEdge={selectEdge}
              />
            </section>

            <aside
              className={`inspector-panel${
                inspectorOpen ? ' inspector-panel--open' : ''
              }`}
              aria-label="Source evidence inspector"
            >
              <Inspector
                flow={flow}
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                relationshipLens={relationshipLens}
                activeTab={inspectorTab}
                sourceSplitMode={sourceSplitMode}
                onTabChange={setInspectorTab}
                onSelectNode={selectNode}
                onToggleSourceSplit={() =>
                  setSourceSplitMode((current) => !current)
                }
                onClose={() => setInspectorOpen(false)}
              />
            </aside>
            <button
              className={`inspector-backdrop${
                inspectorOpen ? ' inspector-backdrop--open' : ''
              }`}
              type="button"
              aria-label="Close inspector"
              onClick={() => setInspectorOpen(false)}
            />
          </div>
        </>
      )}
    </main>
  );
}

function WorkspaceContext({
  flow,
  selectionSummary,
  entryPoint,
  onChangeRepository,
}: {
  flow: FlowProjection;
  selectionSummary: RepositorySelectionSummary | null;
  entryPoint: FlowNode | null;
  onChangeRepository: () => void;
}) {
  return (
    <div className="workspace-context-bar">
      <div className="workspace-context-path">
        <strong>{selectionSummary?.rootLabel ?? flow.source.filePath}</strong>
        <span aria-hidden="true">/</span>
        <span>{entryPoint?.label ?? 'entry unavailable'}</span>
      </div>
      <div className="workspace-context-meta">
        <span>
          {flow.analysis.analyzedFileCount} source file
          {flow.analysis.analyzedFileCount === 1 ? '' : 's'}
          {selectionSummary !== null && selectionSummary.ignoredFileCount > 0
            ? ` · ${selectionSummary.ignoredFileCount} ignored`
            : ''}
        </span>
        <Button variant="ghost" onClick={onChangeRepository}>
          Change repository
        </Button>
      </div>
    </div>
  );
}

function AnalysisNotice({ status }: { status: ProjectionStatus }) {
  if (status.kind !== 'partial') {
    return null;
  }

  return (
    <div className="analysis-notice" role="status">
      <strong>Partial projection</strong>
      <span>{status.reasons.join(' ')}</span>
    </div>
  );
}

function FlowCanvas({
  flow,
  selectedNodeId,
  selectedEdgeId,
  focusMode,
  onSelectNode,
  onKeyboardNavigate,
  onSelectEdge,
}: {
  flow: FlowProjection;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  focusMode: boolean;
  onSelectNode: (id: string) => void;
  onKeyboardNavigate: (id: string) => void;
  onSelectEdge: (id: string) => void;
}) {
  const entryPoint = flow.nodes.find((node) => node.id === flow.entryPointId);
  const selectedNode = flow.nodes.find((node) => node.id === selectedNodeId);
  const focalNode = focusMode ? selectedNode : entryPoint;

  if (focalNode === undefined) {
    return (
      <p className="canvas-state" role="status">
        No focal function is available. Search for a projected function to
        continue.
      </p>
    );
  }

  const relatedEdges = flow.edges.filter((edge) =>
    focusMode
      ? edge.sourceId === focalNode.id || edge.targetId === focalNode.id
      : edge.sourceId === flow.entryPointId,
  );

  function handleNodeKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    nodeId: string,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }

    const candidateIds = new Set(
      flow.edges.flatMap((edge) => {
        if (event.key === 'ArrowRight' && edge.sourceId === nodeId) {
          return [edge.targetId];
        }
        if (event.key === 'ArrowLeft' && edge.targetId === nodeId) {
          return [edge.sourceId];
        }
        return [];
      }),
    );
    const nextNode = flow.nodes
      .filter((node) => candidateIds.has(node.id))
      .sort(compareFlowNodes)[0];

    if (nextNode === undefined) {
      return;
    }

    event.preventDefault();
    onKeyboardNavigate(nextNode.id);

    requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLButtonElement>('[data-flow-node-id]'),
      ).find((button) => button.dataset.flowNodeId === nextNode.id);
      target?.focus();
    });
  }

  return (
    <div className="semantic-canvas">
      {focusMode ? (
        <p className="focus-status" role="status">
          Neighborhood focus · {focalNode.label}
        </p>
      ) : null}
      <NodeButton
        node={focalNode}
        selected={selectedNodeId === focalNode.id && selectedEdgeId === null}
        onSelect={onSelectNode}
        onKeyDown={handleNodeKeyDown}
      />
      <div className="edge-lanes">
        {relatedEdges.map((edge) => {
          const outgoing = edge.sourceId === focalNode.id;
          const neighborId = outgoing ? edge.targetId : edge.sourceId;
          const neighbor = flow.nodes.find((node) => node.id === neighborId);
          const sourceNode = flow.nodes.find(
            (node) => node.id === edge.sourceId,
          );
          const targetNode = flow.nodes.find(
            (node) => node.id === edge.targetId,
          );
          if (neighbor === undefined) {
            return null;
          }

          const evidenceKind = edge.evidence[0]?.kind ?? 'evidence-unavailable';
          const relationshipLabel = `Inspect ${edge.kind} relationship from ${
            sourceNode?.label ?? edge.sourceId
          } to ${targetNode?.label ?? edge.targetId}`;

          return (
            <div className="edge-lane" key={edge.id}>
              <div
                className={`edge-path edge-path--${evidenceKind}`}
                aria-hidden="true"
              />
              <button
                className={`flow-edge flow-edge--${evidenceKind}${
                  selectedEdgeId === edge.id ? ' flow-edge--selected' : ''
                }`}
                type="button"
                aria-label={relationshipLabel}
                aria-pressed={selectedEdgeId === edge.id}
                onClick={() => onSelectEdge(edge.id)}
              >
                <span>{edge.kind}</span>
                <span className="edge-arrow" aria-hidden="true">
                  {outgoing ? '↓' : '↑'}
                </span>
                <span>{evidenceKind}</span>
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
        })}
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
      className={`flow-node${selected ? ' flow-node--selected' : ''}`}
      type="button"
      data-flow-node-id={node.id}
      aria-keyshortcuts="ArrowLeft ArrowRight"
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onKeyDown={(event) => onKeyDown(event, node.id)}
    >
      <span className="node-kind">
        {node.entryPoint ? 'Entry function' : node.kind}
      </span>
      <strong>{node.label}</strong>
      <span>
        {node.location.filePath}:L{node.location.startLine}–
        {node.location.endLine}
      </span>
    </button>
  );
}

function Inspector({
  flow,
  selectedNode,
  selectedEdge,
  relationshipLens,
  activeTab,
  sourceSplitMode,
  onTabChange,
  onSelectNode,
  onToggleSourceSplit,
  onClose,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  relationshipLens: RelationshipLens;
  activeTab: InspectorTab;
  sourceSplitMode: boolean;
  onTabChange: (tab: InspectorTab) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleSourceSplit: () => void;
  onClose: () => void;
}) {
  const relationshipTitle =
    selectedEdge === null
      ? null
      : `${labelForNode(flow, selectedEdge.sourceId)} → ${labelForNode(
          flow,
          selectedEdge.targetId,
        )}`;
  const location =
    selectedEdge?.evidence[0]?.location ?? selectedNode?.location;

  return (
    <Tabs
      className="inspector-tabs"
      value={activeTab}
      onValueChange={(value) => onTabChange(value as InspectorTab)}
    >
      <div className="inspector-heading">
        <div>
          <p className="panel-kicker">
            {selectedEdge === null ? 'Inspector' : 'Relationship'}
          </p>
          <h2>{relationshipTitle ?? selectedNode?.label ?? 'No selection'}</h2>
          {location === undefined ? null : (
            <p className="source-location">
              {location.filePath}:L{location.startLine}–{location.endLine}
            </p>
          )}
        </div>
        <div className="inspector-heading-actions">
          <Button
            className="source-expand-button"
            variant="ghost"
            aria-pressed={sourceSplitMode}
            disabled={selectedNode === null && selectedEdge === null}
            onClick={onToggleSourceSplit}
          >
            {sourceSplitMode ? 'Restore inspector' : 'Expand source'}
          </Button>
          <IconButton
            className="inspector-close-button"
            aria-label="Close inspector panel"
            onClick={onClose}
          >
            <X size={14} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      <TabsList aria-label="Inspector view">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="data" disabled={selectedEdge !== null}>
          Data
        </TabsTrigger>
        <TabsTrigger value="evidence">Evidence</TabsTrigger>
        <TabsTrigger value="steps" disabled={selectedEdge !== null}>
          Steps
        </TabsTrigger>
      </TabsList>

      <div className="inspector-content">
        <TabsContent value="overview">
          <InspectorOverview
            flow={flow}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
          />
        </TabsContent>
        <TabsContent value="data">
          <FunctionDataPanel flow={flow} selectedNode={selectedNode} />
        </TabsContent>
        <TabsContent value="evidence">
          <RelationshipEvidencePanel
            flow={flow}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            lens={relationshipLens}
          />
        </TabsContent>
        <TabsContent value="steps">
          <StaticStepPanel flow={flow} onSelectNode={onSelectNode} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function InspectorOverview({
  flow,
  selectedNode,
  selectedEdge,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
}) {
  if (selectedEdge !== null) {
    const evidence = selectedEdge.evidence[0];
    if (evidence === undefined) {
      return (
        <div className="inspector-stack">
          <p className="panel-copy">
            No source provenance was projected for this relationship.
          </p>
        </div>
      );
    }
    const snippet = getSourceSnippet(
      sourceTextFor(flow, evidence.location.filePath),
      evidence.location.startLine,
      evidence.location.endLine,
    );
    return (
      <div className="inspector-stack">
        <pre className="source-snippet">
          <code>{snippet ?? 'Source text is unavailable.'}</code>
        </pre>
        <div className="summary-row">
          <strong>{selectedEdge.kind}</strong>
          <span>{evidence.reason}</span>
          <small>{evidence.source}</small>
        </div>
      </div>
    );
  }

  if (selectedNode === null) {
    return <p className="panel-copy">Select a function to inspect evidence.</p>;
  }

  const sourceSnippet = getSourceSnippet(
    sourceTextFor(flow, selectedNode.location.filePath),
    selectedNode.location.startLine,
    selectedNode.location.endLine,
  );
  const relatedEdges = flow.edges.filter(
    (edge) =>
      edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id,
  );

  return (
    <div className="inspector-stack">
      <pre className="source-snippet">
        <code>
          {sourceSnippet ??
            'Source text is unavailable for this projected location.'}
        </code>
      </pre>
      <section className="inspector-section">
        <p className="panel-kicker">Relationship summary</p>
        <div className="summary-row">
          <strong>{relatedEdges.length}</strong>
          <span>
            projected call relationship{relatedEdges.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>
    </div>
  );
}

function EvidenceLegend() {
  return (
    <details className="evidence-legend">
      <summary>Evidence</summary>
      <div>
        <span>
          <i className="legend-line" /> verified-static
        </span>
        <span>
          <i className="legend-line legend-line--inferred" /> inferred-static
        </span>
        <span>
          <i className="legend-line legend-line--unavailable" /> unavailable
        </span>
      </div>
    </details>
  );
}

function getProjectionStatus(flow: FlowProjection): ProjectionStatus {
  if (flow.nodes.length === 0) {
    return {
      kind: 'empty',
      message:
        'The analysis completed, but this projection contains no functions to inspect.',
    };
  }

  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  const reasons: string[] = [];

  if (!nodeIds.has(flow.entryPointId)) {
    reasons.push('The entry point was not projected.');
  }

  const danglingRelationships = flow.edges.filter(
    (edge) => !nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId),
  ).length;
  if (danglingRelationships > 0) {
    reasons.push(
      `${danglingRelationships} relationship${
        danglingRelationships === 1 ? '' : 's'
      } reference${danglingRelationships === 1 ? 's' : ''} unavailable functions.`,
    );
  }

  const relationshipsWithoutEvidence = flow.edges.filter(
    (edge) => edge.evidence.length === 0,
  ).length;
  if (relationshipsWithoutEvidence > 0) {
    reasons.push(
      `${relationshipsWithoutEvidence} relationship${
        relationshipsWithoutEvidence === 1 ? '' : 's'
      } ${relationshipsWithoutEvidence === 1 ? 'has' : 'have'} no supporting evidence.`,
    );
  }

  if (flow.analysis.status === 'partial') {
    const visibleIssues = flow.analysis.issues.slice(0, 3);
    reasons.push(
      ...visibleIssues.map((issue) =>
        issue.filePath === undefined
          ? issue.message
          : `${issue.filePath}: ${issue.message}`,
      ),
    );
    if (flow.analysis.issues.length > visibleIssues.length) {
      reasons.push(
        `${flow.analysis.issues.length - visibleIssues.length} additional analysis issue${
          flow.analysis.issues.length - visibleIssues.length === 1 ? '' : 's'
        } not shown.`,
      );
    }
  }

  return reasons.length > 0 ? { kind: 'partial', reasons } : { kind: 'ready' };
}

function compareFlowNodes(left: FlowNode, right: FlowNode): number {
  return (
    left.location.filePath.localeCompare(right.location.filePath) ||
    left.location.startLine - right.location.startLine ||
    left.location.startColumn - right.location.startColumn ||
    left.id.localeCompare(right.id)
  );
}

function sourceTextFor(flow: FlowProjection, filePath: string): string | null {
  return (
    flow.sources.find((source) => source.filePath === filePath)?.text ??
    (flow.source.filePath === filePath ? flow.source.text : null)
  );
}

function getSourceSnippet(
  source: string | null,
  startLine: number,
  endLine: number,
): string | null {
  if (source === null) {
    return null;
  }

  return source
    .split('\n')
    .slice(startLine - 1, endLine)
    .join('\n');
}

function labelForNode(flow: FlowProjection, nodeId: string): string {
  return flow.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
}

function relationshipLabel(lens: RelationshipLens): string {
  return lens === 'ALL'
    ? 'All'
    : lens
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {
    // Fall through to system preference when storage is unavailable.
  }

  return typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}
