import { useMemo, useState, type KeyboardEvent } from 'react';

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

type ProjectionStatus =
  | { kind: 'ready' }
  | { kind: 'empty'; message: string }
  | { kind: 'partial'; reasons: string[] };

export function App() {
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [sourceSplitMode, setSourceSplitMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectionSummary, setSelectionSummary] =
    useState<RepositorySelectionSummary | null>(null);
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

  async function analyzeRepository(
    request: RepositoryAnalysisRequest,
    summary: RepositorySelectionSummary,
  ) {
    setAnalyzing(true);
    setError(null);
    setFlow(null);
    setSelectionSummary(summary);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setFocusMode(false);
    setSourceSplitMode(false);
    setQuery('');

    try {
      const loadedFlow = await analyzeRepositoryFlow(request);
      setFlow(loadedFlow);
      setSelectedNodeId(loadedFlow.entryPointId);
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to analyze the selected repository.',
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  }

  function navigateToNode(nodeId: string) {
    selectNode(nodeId);
    setFocusMode(true);
    setQuery('');
  }

  function toggleFocusMode() {
    setFocusMode((current) => !current);
    setSelectedEdgeId(null);
  }

  const entryPoint = flow?.nodes.find((node) => node.id === flow.entryPointId);

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Repository intelligence</p>
          <h1>CodeFlow</h1>
        </div>
        <p className="trust-note">Evidence first · static analysis only</p>
      </header>

      <RepositoryPicker busy={analyzing} onAnalyze={analyzeRepository} />

      {analyzing ? (
        <p className="state-panel" role="status">
          Analyzing selected TypeScript repository…
        </p>
      ) : error !== null ? (
        <section className="state-panel" role="alert">
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
        <section className="state-panel" role="status">
          <strong>No functions projected</strong>
          <span>{projectionStatus.message}</span>
        </section>
      ) : (
        <div
          className={`workspace-grid${
            sourceSplitMode ? ' workspace-grid--source-split' : ''
          }`}
        >
          <aside className="repository-panel" aria-label="Repository flow">
            <p className="panel-kicker">Repository</p>
            <strong>
              {selectionSummary?.rootLabel ?? flow.source.filePath}
            </strong>
            <p className="panel-copy">
              {flow.analysis.analyzedFileCount} TypeScript source file
              {flow.analysis.analyzedFileCount === 1 ? '' : 's'} analyzed from
              the selected repository.
            </p>
            {selectionSummary !== null &&
            selectionSummary.ignoredFileCount > 0 ? (
              <p className="panel-copy">
                {selectionSummary.ignoredFileCount} unsupported/dependency file
                {selectionSummary.ignoredFileCount === 1 ? '' : 's'} ignored
                before upload.
              </p>
            ) : null}
            <EvidenceLegend />
          </aside>

          <section className="canvas-panel" aria-label="Semantic flow canvas">
            <AnalysisNotice status={projectionStatus} />
            <div className="canvas-toolbar">
              <div>
                <p className="panel-kicker">Flow projection</p>
                <h2>{entryPoint?.label ?? 'Selected entry'} request flow</h2>
              </div>
              <span>{flow.nodes.length} functions</span>
            </div>
            <div className="comprehension-controls">
              <div className="search-control">
                <label htmlFor="function-search">Search functions</label>
                <input
                  id="function-search"
                  type="search"
                  value={query}
                  placeholder="Find a function…"
                  autoComplete="off"
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query.trim() !== '' ? (
                  <div
                    className="search-results"
                    aria-label="Function search results"
                  >
                    {searchResults.length === 0 ? (
                      <p>No matching functions.</p>
                    ) : (
                      searchResults.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => navigateToNode(node.id)}
                        >
                          <strong>{node.label}</strong>
                          <span>
                            {node.location.filePath}:L{node.location.startLine}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <button
                className="focus-toggle"
                type="button"
                aria-pressed={focusMode}
                disabled={selectedNode === null}
                onClick={toggleFocusMode}
              >
                {focusMode ? 'Show full flow' : 'Focus selected'}
              </button>
            </div>
            <FlowCanvas
              flow={flow}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
              focusMode={focusMode}
              onSelectNode={selectNode}
              onKeyboardNavigate={selectNode}
              onSelectEdge={setSelectedEdgeId}
            />
          </section>

          <aside
            className="inspector-panel"
            aria-label="Source evidence inspector"
          >
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
      )}
    </main>
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
                  {outgoing ? '→' : '←'}
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
    return (
      <RelationshipInspector
        flow={flow}
        edge={selectedEdge}
        sourceSplitMode={sourceSplitMode}
        onToggleSourceSplit={onToggleSourceSplit}
      />
    );
  }

  if (selectedNode === null) {
    return <p className="panel-copy">Select a function to inspect evidence.</p>;
  }

  const relatedEdges = flow.edges.filter(
    (edge) =>
      edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id,
  );
  const sourceSnippet = getSourceSnippet(
    sourceTextFor(flow, selectedNode.location.filePath),
    selectedNode.location.startLine,
    selectedNode.location.endLine,
  );

  return (
    <>
      <InspectorHeading
        label="Inspector / source"
        sourceSplitMode={sourceSplitMode}
        onToggleSourceSplit={onToggleSourceSplit}
      />
      <h2>{selectedNode.label}</h2>
      <p className="source-location">
        {selectedNode.location.filePath}:L{selectedNode.location.startLine}–
        {selectedNode.location.endLine}
      </p>
      <pre className="source-snippet">
        <code>{sourceSnippet ?? 'Source text is unavailable for this projected location.'}</code>
      </pre>
      <div className="evidence-list">
        <p className="panel-kicker">Relationship evidence</p>
        {relatedEdges.length === 0 ? (
          <p className="panel-copy">No projected call relationships.</p>
        ) : (
          relatedEdges.map((edge) => <EvidenceItem edge={edge} key={edge.id} />)
        )}
      </div>
    </>
  );
}

function RelationshipInspector({
  flow,
  edge,
  sourceSplitMode,
  onToggleSourceSplit,
}: {
  flow: FlowProjection;
  edge: FlowEdge;
  sourceSplitMode: boolean;
  onToggleSourceSplit: () => void;
}) {
  const evidence = edge.evidence[0];
  const sourceNode = flow.nodes.find((node) => node.id === edge.sourceId);
  const targetNode = flow.nodes.find((node) => node.id === edge.targetId);
  const relationshipTitle = `${sourceNode?.label ?? edge.sourceId} → ${
    targetNode?.label ?? edge.targetId
  }`;

  if (evidence === undefined) {
    return (
      <>
        <InspectorHeading
          label="Inspector / relationship"
          sourceSplitMode={sourceSplitMode}
          onToggleSourceSplit={onToggleSourceSplit}
        />
        <h2>{relationshipTitle}</h2>
        <div className="evidence-list">
          <p className="panel-kicker">Selected evidence</p>
          <EvidenceItem edge={edge} />
        </div>
      </>
    );
  }

  const sourceSnippet = getSourceSnippet(
    sourceTextFor(flow, evidence.location.filePath),
    evidence.location.startLine,
    evidence.location.endLine,
  );

  return (
    <>
      <InspectorHeading
        label="Inspector / relationship"
        sourceSplitMode={sourceSplitMode}
        onToggleSourceSplit={onToggleSourceSplit}
      />
      <h2>{relationshipTitle}</h2>
      <p className="source-location">
        {evidence.location.filePath}:L{evidence.location.startLine}–
        {evidence.location.endLine}
      </p>
      <pre className="source-snippet">
        <code>{sourceSnippet ?? 'Source text is unavailable for this evidence location.'}</code>
      </pre>
      <div className="evidence-list">
        <p className="panel-kicker">Selected evidence</p>
        <EvidenceItem edge={edge} />
      </div>
    </>
  );
}

function InspectorHeading({
  label,
  sourceSplitMode,
  onToggleSourceSplit,
}: {
  label: string;
  sourceSplitMode: boolean;
  onToggleSourceSplit: () => void;
}) {
  return (
    <div className="inspector-heading">
      <p className="panel-kicker">{label}</p>
      <button
        className="focus-toggle"
        type="button"
        aria-pressed={sourceSplitMode}
        onClick={onToggleSourceSplit}
      >
        {sourceSplitMode ? 'Restore inspector' : 'Expand source'}
      </button>
    </div>
  );
}

function EvidenceItem({ edge }: { edge: FlowEdge }) {
  const evidence = edge.evidence[0];

  if (evidence === undefined) {
    return (
      <article className="evidence-item evidence-item--unavailable">
        <div>
          <span className="evidence-chip evidence-chip--unavailable">
            evidence-unavailable
          </span>
          <span className="relationship-label">{edge.kind}</span>
        </div>
        <p>No supporting provenance was projected for this relationship.</p>
      </article>
    );
  }

  return (
    <article className="evidence-item">
      <div>
        <span className={`evidence-chip evidence-chip--${evidence.kind}`}>
          {evidence.kind}
        </span>
        <span className="relationship-label">{edge.kind}</span>
      </div>
      <p>{evidence.reason}</p>
      <small>
        {evidence.source} · {evidence.location.filePath}:L
        {evidence.location.startLine}
      </small>
    </article>
  );
}

function EvidenceLegend() {
  return (
    <div className="legend" aria-label="Evidence legend">
      <span>
        <i className="legend-line legend-line--verified" /> verified-static
      </span>
      <span>
        <i className="legend-line legend-line--inferred" /> inferred-static
      </span>
    </div>
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
