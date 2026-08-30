import { useEffect, useMemo, useState } from 'react';

import {
  loadSampleFlow,
  type FlowEdge,
  type FlowNode,
  type FlowProjection,
} from './flow-client';

export function App() {
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void loadSampleFlow()
      .then((loadedFlow) => {
        if (!active) {
          return;
        }

        setFlow(loadedFlow);
        setSelectedNodeId(loadedFlow.entryPointId);
      })
      .catch((caughtError: unknown) => {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to load the flow.',
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedNode = useMemo(
    () => flow?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [flow, selectedNodeId],
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

  function navigateToNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setFocusMode(true);
    setQuery('');
  }

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Repository intelligence</p>
          <h1>CodeFlow</h1>
        </div>
        <p className="trust-note">Evidence first · static analysis only</p>
      </header>

      {error !== null ? (
        <section className="state-panel" role="alert">
          <strong>Flow unavailable</strong>
          <span>{error}</span>
        </section>
      ) : flow === null ? (
        <p className="state-panel" role="status">
          Analyzing TypeScript fixture…
        </p>
      ) : (
        <div className="workspace-grid">
          <aside className="repository-panel" aria-label="Repository flow">
            <p className="panel-kicker">Fixture</p>
            <strong>{flow.source.filePath}</strong>
            <p className="panel-copy">
              One exported entry point projected from deterministic TypeScript
              analysis.
            </p>
            <EvidenceLegend />
          </aside>

          <section className="canvas-panel" aria-label="Semantic flow canvas">
            <div className="canvas-toolbar">
              <div>
                <p className="panel-kicker">Flow projection</p>
                <h2>handleGreeting request flow</h2>
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
                            L{node.location.startLine}–{node.location.endLine}
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
                onClick={() => setFocusMode((current) => !current)}
              >
                {focusMode ? 'Show full flow' : 'Focus selected'}
              </button>
            </div>
            <FlowCanvas
              flow={flow}
              selectedNodeId={selectedNodeId}
              focusMode={focusMode}
              onSelect={setSelectedNodeId}
            />
          </section>

          <aside
            className="inspector-panel"
            aria-label="Source evidence inspector"
          >
            <Inspector flow={flow} selectedNode={selectedNode} />
          </aside>
        </div>
      )}
    </main>
  );
}

function FlowCanvas({
  flow,
  selectedNodeId,
  focusMode,
  onSelect,
}: {
  flow: FlowProjection;
  selectedNodeId: string | null;
  focusMode: boolean;
  onSelect: (id: string) => void;
}) {
  const entryPoint = flow.nodes.find((node) => node.entryPoint);
  const selectedNode = flow.nodes.find((node) => node.id === selectedNodeId);
  const focalNode = focusMode ? selectedNode : entryPoint;

  if (focalNode === undefined) {
    return <p role="status">No focal function found.</p>;
  }

  const relatedEdges = flow.edges.filter((edge) =>
    focusMode
      ? edge.sourceId === focalNode.id || edge.targetId === focalNode.id
      : edge.sourceId === flow.entryPointId,
  );

  return (
    <div className="semantic-canvas">
      {focusMode ? (
        <p className="focus-status" role="status">
          Neighborhood focus · {focalNode.label}
        </p>
      ) : null}
      <NodeButton
        node={focalNode}
        selected={selectedNodeId === focalNode.id}
        onSelect={onSelect}
      />
      <div className="edge-lanes">
        {relatedEdges.map((edge) => {
          const outgoing = edge.sourceId === focalNode.id;
          const neighborId = outgoing ? edge.targetId : edge.sourceId;
          const neighbor = flow.nodes.find((node) => node.id === neighborId);
          if (neighbor === undefined) {
            return null;
          }

          const evidenceKind = edge.evidence[0]?.kind ?? 'inferred-static';
          return (
            <div className="edge-lane" key={edge.id}>
              <div className={`flow-edge flow-edge--${evidenceKind}`}>
                <span>{edge.kind}</span>
                <span className="edge-arrow" aria-hidden="true">
                  {outgoing ? '→' : '←'}
                </span>
                <span>{evidenceKind}</span>
              </div>
              <NodeButton
                node={neighbor}
                selected={selectedNodeId === neighbor.id}
                onSelect={onSelect}
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
}: {
  node: FlowNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      className={`flow-node${selected ? ' flow-node--selected' : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
    >
      <span className="node-kind">
        {node.entryPoint ? 'Entry function' : node.kind}
      </span>
      <strong>{node.label}</strong>
      <span>
        L{node.location.startLine}–{node.location.endLine}
      </span>
    </button>
  );
}

function Inspector({
  flow,
  selectedNode,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
}) {
  if (selectedNode === null) {
    return <p className="panel-copy">Select a function to inspect evidence.</p>;
  }

  const relatedEdges = flow.edges.filter(
    (edge) =>
      edge.sourceId === selectedNode.id || edge.targetId === selectedNode.id,
  );
  const sourceSnippet = getSourceSnippet(flow.source.text, selectedNode);

  return (
    <>
      <p className="panel-kicker">Inspector / source</p>
      <h2>{selectedNode.label}</h2>
      <p className="source-location">
        {selectedNode.location.filePath}:L{selectedNode.location.startLine}–
        {selectedNode.location.endLine}
      </p>
      <pre className="source-snippet">
        <code>{sourceSnippet}</code>
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

function EvidenceItem({ edge }: { edge: FlowEdge }) {
  const evidence = edge.evidence[0];

  if (evidence === undefined) {
    return null;
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
        {evidence.source} · L{evidence.location.startLine}
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

function getSourceSnippet(source: string, node: FlowNode): string {
  return source
    .split('\n')
    .slice(node.location.startLine - 1, node.location.endLine)
    .join('\n');
}
