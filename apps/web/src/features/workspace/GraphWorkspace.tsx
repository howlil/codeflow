import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { PullRequestAnalysis } from '../../integrations/api/change-client';
import {
  analyzeImpact,
  type FlowEvidence,
  type FlowProjection,
  type ImpactProjection,
  type SourceLocation,
} from '../../integrations/api/flow-client';
import {
  availableGraphLenses,
  buildSemanticGraph,
  graphEdgeMatchesLens,
  graphLevelForKind,
  graphNodeBelongsToLevel,
  type GraphLens,
  type GraphLevel,
  type SemanticGraph,
  type SemanticGraphEdge,
  type SemanticGraphNode,
} from '../../domain/graph/graph-model';
import type { RepositorySelectionSummary } from '../acquisition/RepositoryPicker';
import {
  Button,
  IconButton,
  Input,
  Select,
} from '../../components/ui/primitives';

interface GraphWorkspaceProps {
  flow: FlowProjection;
  changeAnalysis: PullRequestAnalysis | null;
  selectionSummary: RepositorySelectionSummary | null;
  onSelectEntry: (entryPoint: { filePath: string; name: string }) => void;
  onTraceFunction: (node: SemanticGraphNode) => void;
  onChangeRepository: () => void;
}

type ExpansionDirection = 'incoming' | 'outgoing';

type GraphPosition = { x: number; y: number };

type GraphLayout = {
  positions: Map<string, GraphPosition>;
  width: number;
  height: number;
};

const NODE_WIDTH = 196;
const NODE_HEIGHT = 72;
const COLUMN_GAP = 72;
const ROW_GAP = 34;
const MIN_GRAPH_ZOOM = 0.6;
const MAX_GRAPH_ZOOM = 1.4;
const GRAPH_ZOOM_STEP = 0.1;

type SourceSnippetLine = {
  lineNumber: number;
  text: string;
  active: boolean;
};

export function GraphWorkspace({
  flow,
  changeAnalysis,
  selectionSummary,
  onSelectEntry,
  onTraceFunction,
  onChangeRepository,
}: GraphWorkspaceProps) {
  const graph = useMemo(
    () => buildSemanticGraph(flow, changeAnalysis),
    [flow, changeAnalysis],
  );
  const [level, setLevel] = useState<GraphLevel>('code');
  const [requestedLens, setRequestedLens] = useState<GraphLens>('ALL');
  const [focusId, setFocusId] = useState(flow.entryPointId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    flow.entryPointId,
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [expandedIncoming, setExpandedIncoming] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedOutgoing, setExpandedOutgoing] = useState<Set<string>>(
    () => new Set([flow.entryPointId]),
  );
  const [query, setQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [impact, setImpact] = useState<ImpactProjection | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleSearchShortcut(event: globalThis.KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const graphWithImpact = useMemo(
    () => appendImpactProjection(graph, impact),
    [graph, impact],
  );

  const levelNodes = useMemo(
    () =>
      graphWithImpact.nodes.filter((node) =>
        graphNodeBelongsToLevel(node, level),
      ),
    [graphWithImpact.nodes, level],
  );
  const levelNodeIds = useMemo(
    () => new Set(levelNodes.map((node) => node.id)),
    [levelNodes],
  );
  const levelEdges = useMemo(
    () =>
      graphWithImpact.edges.filter(
        (edge) =>
          levelNodeIds.has(edge.sourceId) && levelNodeIds.has(edge.targetId),
      ),
    [graphWithImpact.edges, levelNodeIds],
  );
  const levelGraph = useMemo<SemanticGraph>(
    () => ({ nodes: levelNodes, edges: levelEdges }),
    [levelNodes, levelEdges],
  );
  const availableLenses = useMemo(
    () => availableGraphLenses(levelGraph),
    [levelGraph],
  );

  const lens: GraphLens = availableLenses.includes(requestedLens)
    ? requestedLens
    : 'ALL';

  const filteredEdges = useMemo(
    () => levelEdges.filter((edge) => graphEdgeMatchesLens(edge, lens)),
    [levelEdges, lens],
  );

  const resolvedFocusId = useMemo(
    () => resolveFocusForLevel(flow, graphWithImpact, level, focusId),
    [flow, graphWithImpact, level, focusId],
  );
  const focusNode = useMemo(
    () =>
      graphWithImpact.nodes.find((node) => node.id === resolvedFocusId) ?? null,
    [graphWithImpact.nodes, resolvedFocusId],
  );

  const impactIds = useMemo(() => {
    const ids = new Set<string>();
    for (const seed of impact?.seeds ?? []) {
      ids.add(seed.entityId);
    }
    for (const result of impact?.results ?? []) {
      ids.add(result.entityId);
      for (const path of result.paths) {
        for (const step of path.steps) {
          ids.add(step.sourceId);
          ids.add(step.targetId);
        }
      }
    }
    return ids;
  }, [impact]);

  const visibleNodeIds = useMemo(() => {
    const visible = new Set<string>();
    if (resolvedFocusId !== null) {
      visible.add(resolvedFocusId);
    }
    for (const edge of filteredEdges) {
      if (expandedOutgoing.has(edge.sourceId)) {
        visible.add(edge.sourceId);
        visible.add(edge.targetId);
      }
      if (expandedIncoming.has(edge.targetId)) {
        visible.add(edge.sourceId);
        visible.add(edge.targetId);
      }
    }
    for (const id of impactIds) {
      if (levelNodeIds.has(id)) {
        visible.add(id);
      }
    }
    if (visible.size === 0 && levelNodes[0] !== undefined) {
      visible.add(levelNodes[0].id);
    }
    return visible;
  }, [
    resolvedFocusId,
    filteredEdges,
    expandedOutgoing,
    expandedIncoming,
    impactIds,
    levelNodeIds,
    levelNodes,
  ]);

  const visibleNodes = useMemo(
    () => levelNodes.filter((node) => visibleNodeIds.has(node.id)),
    [levelNodes, visibleNodeIds],
  );
  const visibleEdges = useMemo(
    () =>
      filteredEdges.filter(
        (edge) =>
          visibleNodeIds.has(edge.sourceId) &&
          visibleNodeIds.has(edge.targetId),
      ),
    [filteredEdges, visibleNodeIds],
  );

  const layout = useMemo(
    () => layoutGraph(visibleNodes, visibleEdges, resolvedFocusId),
    [visibleNodes, visibleEdges, resolvedFocusId],
  );

  const selectedNode = useMemo(
    () =>
      graphWithImpact.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graphWithImpact.nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () =>
      graphWithImpact.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [graphWithImpact.edges, selectedEdgeId],
  );

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized === '') {
      return [];
    }
    return graph.nodes
      .filter(
        (node) =>
          node.label.toLowerCase().includes(normalized) ||
          (node.path?.toLowerCase().includes(normalized) ?? false),
      )
      .slice(0, 12);
  }, [graph.nodes, query]);

  function setExpansion(nodeId: string, direction: ExpansionDirection) {
    if (direction === 'incoming') {
      setExpandedIncoming((current) => new Set(current).add(nodeId));
    } else {
      setExpandedOutgoing((current) => new Set(current).add(nodeId));
    }
  }

  function showBoth(nodeId: string) {
    setExpandedIncoming((current) => new Set(current).add(nodeId));
    setExpandedOutgoing((current) => new Set(current).add(nodeId));
  }

  function collapseNode(nodeId: string) {
    setExpandedIncoming((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
    setExpandedOutgoing((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
  }

  function focusGraph(nodeId: string, targetLevel = level) {
    setLevel(targetLevel);
    setFocusId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setExpandedIncoming(new Set());
    setExpandedOutgoing(new Set([nodeId]));
    setImpact(null);
    setImpactError(null);
    setQuery('');
  }

  function changeLevel(nextLevel: GraphLevel) {
    const nextFocus = resolveFocusForLevel(
      flow,
      graphWithImpact,
      nextLevel,
      selectedNodeId ?? focusId,
    );
    setLevel(nextLevel);
    setRequestedLens('ALL');
    setSelectedEdgeId(null);
    setImpact(null);
    if (nextFocus !== null) {
      setFocusId(nextFocus);
      setSelectedNodeId(nextFocus);
      setExpandedIncoming(new Set([nextFocus]));
      setExpandedOutgoing(new Set([nextFocus]));
    }
  }

  function chooseSearchResult(node: SemanticGraphNode) {
    focusGraph(node.id, graphLevelForKind(node.kind));
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
        chooseSearchResult(result);
      }
    }
  }

  async function showDependents(node: SemanticGraphNode) {
    if (node.kind === 'Repository' || node.kind === 'Workspace') {
      return;
    }
    setImpactLoading(true);
    setImpactError(null);
    try {
      const projection = await analyzeImpact(flow, [node.id]);
      setImpact(projection);
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    } catch (caughtError: unknown) {
      setImpactError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to trace downstream dependents.',
      );
    } finally {
      setImpactLoading(false);
    }
  }

  const currentEntryPoint = (flow.entryPoints ?? []).find(
    (entry) => entry.id === flow.entryPointId,
  );

  return (
    <motion.section
      className="graph-workspace"
      aria-label="Code graph explorer"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <GraphContextBar
        flow={flow}
        selectionSummary={selectionSummary}
        changeAnalysis={changeAnalysis}
        query={query}
        searchResults={searchResults}
        activeSearchIndex={activeSearchIndex}
        searchInputRef={searchInputRef}
        currentEntryPoint={currentEntryPoint}
        onQueryChange={(value) => {
          setQuery(value);
          setActiveSearchIndex(0);
        }}
        onSearchKeyDown={handleSearchKeyDown}
        onActiveSearchIndexChange={setActiveSearchIndex}
        onChooseSearchResult={chooseSearchResult}
        onSelectEntry={onSelectEntry}
        onChangeRepository={onChangeRepository}
      />

      <AnimatePresence initial={false}>
        {changeAnalysis !== null ? (
          <motion.div
            key="change-overlay"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <ChangeOverlayBar analysis={changeAnalysis} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="graph-workspace-body">
        <div className="graph-primary-pane">
          <div className="graph-primary-toolbar">
            <div className="graph-primary-heading">
              <strong>{focusNode?.label ?? 'Semantic graph'}</strong>
              <span>
                {levelLabel(level)} · {lensLabel(lens)} · {visibleNodes.length}/
                {levelNodes.length} visible · static projection
              </span>
            </div>

            <GraphProjectionControls
              graph={graphWithImpact}
              level={level}
              lens={lens}
              availableLenses={availableLenses}
              onLevelChange={changeLevel}
              onLensChange={setRequestedLens}
            />

            <AnimatePresence initial={false}>
              {impact !== null ? (
                <motion.div
                  key="impact-status"
                  className="graph-impact-status"
                  role="status"
                  initial={{ opacity: 0, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.12 }}
                >
                  <span>
                    Dependents: {impact.summary.directCount} direct ·{' '}
                    {impact.summary.transitiveCount} transitive
                  </span>
                  <Button variant="ghost" onClick={() => setImpact(null)}>
                    Clear dependents
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {impactError !== null ? (
              <motion.div
                key="impact-error"
                className="graph-inline-error"
                role="alert"
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.12 }}
              >
                {impactError}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <GraphCanvas
            nodes={visibleNodes}
            edges={visibleEdges}
            layout={layout}
            focusId={resolvedFocusId}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            impactIds={impactIds}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setSelectedEdgeId(null);
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id);
              setSelectedNodeId(null);
            }}
          />
        </div>

        <GraphInspector
          flow={flow}
          graph={graphWithImpact}
          changeAnalysis={changeAnalysis}
          node={selectedNode}
          edge={selectedEdge}
          focusId={resolvedFocusId}
          expandedIncoming={expandedIncoming}
          expandedOutgoing={expandedOutgoing}
          impactLoading={impactLoading}
          onExpandIncoming={(id) => setExpansion(id, 'incoming')}
          onExpandOutgoing={(id) => setExpansion(id, 'outgoing')}
          onShowBoth={showBoth}
          onCollapse={collapseNode}
          onFocus={(node) => focusGraph(node.id, graphLevelForKind(node.kind))}
          onShowDependents={showDependents}
          onTraceFunction={onTraceFunction}
          onSelectEdge={(id) => {
            setSelectedEdgeId(id);
            setSelectedNodeId(null);
          }}
        />
      </div>
    </motion.section>
  );
}

function GraphContextBar({
  flow,
  selectionSummary,
  changeAnalysis,
  query,
  searchResults,
  activeSearchIndex,
  searchInputRef,
  currentEntryPoint,
  onQueryChange,
  onSearchKeyDown,
  onActiveSearchIndexChange,
  onChooseSearchResult,
  onSelectEntry,
  onChangeRepository,
}: {
  flow: FlowProjection;
  selectionSummary: RepositorySelectionSummary | null;
  changeAnalysis: PullRequestAnalysis | null;
  query: string;
  searchResults: SemanticGraphNode[];
  activeSearchIndex: number;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  currentEntryPoint:
    NonNullable<FlowProjection['entryPoints']>[number] | undefined;
  onQueryChange: (value: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onActiveSearchIndexChange: (index: number) => void;
  onChooseSearchResult: (node: SemanticGraphNode) => void;
  onSelectEntry: (entryPoint: { filePath: string; name: string }) => void;
  onChangeRepository: () => void;
}) {
  const entryPoints = flow.entryPoints ?? [];
  const repositoryLabel =
    selectionSummary?.rootLabel ??
    changeAnalysis?.change.source.repository ??
    flow.repository?.name ??
    flow.source.filePath;

  return (
    <div className="graph-context-bar">
      <div className="graph-repository-context">
        <strong>{repositoryLabel}</strong>
        <span>
          {flow.analysis.analyzedFileCount} analyzed file
          {flow.analysis.analyzedFileCount === 1 ? '' : 's'}
          {flow.analysis.status === 'partial' ? ' · partial' : ''}
        </span>
      </div>

      <div className="graph-entry-control">
        <span>Entry</span>
        {entryPoints.length > 1 ? (
          <Select
            aria-label="Entry point"
            value={currentEntryPoint?.id ?? flow.entryPointId}
            options={entryPoints.map((entry) => ({
              value: entry.id,
              label: `${entry.name} — ${entry.filePath}`,
            }))}
            onValueChange={(id) => {
              const entry = entryPoints.find(
                (candidate) => candidate.id === id,
              );
              if (entry !== undefined && entry.id !== flow.entryPointId) {
                onSelectEntry({ filePath: entry.filePath, name: entry.name });
              }
            }}
          />
        ) : (
          <strong>{currentEntryPoint?.name ?? flow.entryPointId}</strong>
        )}
      </div>

      <div className="graph-search-control">
        <Input
          ref={searchInputRef}
          aria-label="Search code graph"
          type="search"
          value={query}
          placeholder="Search symbol, file, package…  ⌘K"
          autoComplete="off"
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onSearchKeyDown}
        />
        <AnimatePresence initial={false}>
          {query.trim() !== '' ? (
            <motion.div
              key="graph-search-results"
              className="graph-search-results"
              role="listbox"
              aria-label="Graph search results"
              initial={{ opacity: 0, y: -4, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.12 }}
            >
              {searchResults.length === 0 ? (
                <p>No matching semantic entity.</p>
              ) : (
                searchResults.map((node, index) => (
                  <button
                    key={node.id}
                    type="button"
                    role="option"
                    aria-selected={activeSearchIndex === index}
                    onMouseEnter={() => onActiveSearchIndexChange(index)}
                    onClick={() => onChooseSearchResult(node)}
                  >
                    <span>{node.kind}</span>
                    <strong>{node.label}</strong>
                    <small>{node.path ?? 'path unavailable'}</small>
                  </button>
                ))
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Button variant="ghost" onClick={onChangeRepository}>
        Change repository
      </Button>
    </div>
  );
}

function GraphProjectionControls({
  graph,
  level,
  lens,
  availableLenses,
  onLevelChange,
  onLensChange,
}: {
  graph: SemanticGraph;
  level: GraphLevel;
  lens: GraphLens;
  availableLenses: GraphLens[];
  onLevelChange: (level: GraphLevel) => void;
  onLensChange: (lens: GraphLens) => void;
}) {
  const levels: GraphLevel[] = ['code', 'structure', 'packages'];
  const lenses: GraphLens[] = [
    'ALL',
    'CALLS',
    'REFERENCES',
    'DEPENDENCIES',
    'TYPES',
  ];

  return (
    <div className="graph-projection-controls">
      <div
        className="graph-level-switcher"
        role="group"
        aria-label="Graph level"
      >
        {levels.map((candidate) => {
          const count = graph.nodes.filter((node) =>
            graphNodeBelongsToLevel(node, candidate),
          ).length;
          return (
            <Button
              key={candidate}
              variant="ghost"
              aria-pressed={level === candidate}
              disabled={count === 0}
              onClick={() => onLevelChange(candidate)}
            >
              <span>{levelLabel(candidate)}</span>
              <small>{count}</small>
            </Button>
          );
        })}
      </div>

      <div className="graph-lens-control">
        <span>Relationship</span>
        <Select
          aria-label="Relationship lens"
          value={lens}
          options={lenses.map((candidate) => ({
            value: candidate,
            label: lensLabel(candidate),
            disabled: !availableLenses.includes(candidate),
          }))}
          onValueChange={(value) => onLensChange(value as GraphLens)}
        />
      </div>
    </div>
  );
}

function GraphCanvas({
  nodes,
  edges,
  layout,
  focusId,
  selectedNodeId,
  selectedEdgeId,
  impactIds,
  onSelectNode,
  onSelectEdge,
}: {
  nodes: SemanticGraphNode[];
  edges: SemanticGraphEdge[];
  layout: GraphLayout;
  focusId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  impactIds: Set<string>;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);

  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );

  const emphasis = useMemo(() => {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const activeNodeId = selectedNodeId ?? focusId;

    if (selectedEdgeId !== null) {
      const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);
      if (selectedEdge !== undefined) {
        edgeIds.add(selectedEdge.id);
        nodeIds.add(selectedEdge.sourceId);
        nodeIds.add(selectedEdge.targetId);
      }
    } else if (activeNodeId !== null) {
      nodeIds.add(activeNodeId);
      for (const edge of edges) {
        if (edge.sourceId === activeNodeId || edge.targetId === activeNodeId) {
          edgeIds.add(edge.id);
          nodeIds.add(edge.sourceId);
          nodeIds.add(edge.targetId);
        }
      }
    }

    for (const id of impactIds) {
      nodeIds.add(id);
    }
    for (const edge of edges) {
      if (impactIds.has(edge.sourceId) && impactIds.has(edge.targetId)) {
        edgeIds.add(edge.id);
      }
    }

    return {
      nodeIds,
      edgeIds,
      active: selectedEdgeId !== null || activeNodeId !== null,
    };
  }, [edges, focusId, impactIds, selectedEdgeId, selectedNodeId]);

  function clampZoom(value: number) {
    return Math.min(MAX_GRAPH_ZOOM, Math.max(MIN_GRAPH_ZOOM, value));
  }

  function setGraphZoom(value: number) {
    const next = clampZoom(Number(value.toFixed(2)));
    zoomRef.current = next;
    setZoom(next);
  }

  function zoomBy(delta: number) {
    setGraphZoom(zoomRef.current + delta);
  }

  function scrollFocusIntoCenter(behavior: ScrollBehavior) {
    const canvas = canvasRef.current;
    if (canvas === null || focusId === null) {
      return;
    }
    const position = layout.positions.get(focusId);
    if (
      position === undefined ||
      canvas.clientWidth <= 0 ||
      canvas.clientHeight <= 0 ||
      typeof canvas.scrollTo !== 'function'
    ) {
      return;
    }
    const scale = zoomRef.current;
    const focusX = (position.x + NODE_WIDTH / 2) * scale;
    const focusY = (position.y + NODE_HEIGHT / 2) * scale;
    canvas.scrollTo({
      left: Math.max(0, focusX - canvas.clientWidth / 2),
      top: Math.max(0, focusY - canvas.clientHeight / 2),
      behavior,
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || focusId === null) {
      return;
    }
    const position = layout.positions.get(focusId);
    if (
      position === undefined ||
      canvas.clientWidth <= 0 ||
      canvas.clientHeight <= 0 ||
      typeof canvas.scrollTo !== 'function'
    ) {
      return;
    }
    const scale = zoomRef.current;
    canvas.scrollTo({
      left: Math.max(
        0,
        (position.x + NODE_WIDTH / 2) * scale - canvas.clientWidth / 2,
      ),
      top: Math.max(
        0,
        (position.y + NODE_HEIGHT / 2) * scale - canvas.clientHeight / 2,
      ),
      behavior: 'auto',
    });
  }, [focusId, layout]);

  function fitGraph() {
    const canvas = canvasRef.current;
    if (
      canvas === null ||
      canvas.clientWidth <= 0 ||
      canvas.clientHeight <= 0
    ) {
      return;
    }
    const horizontal = (canvas.clientWidth - 56) / layout.width;
    const vertical = (canvas.clientHeight - 56) / layout.height;
    const nextZoom = clampZoom(Math.min(1, horizontal, vertical));
    setGraphZoom(nextZoom);
    if (typeof canvas.scrollTo === 'function') {
      requestAnimationFrame(() => {
        canvas.scrollTo({
          left: Math.max(0, (layout.width * nextZoom - canvas.clientWidth) / 2),
          top: Math.max(
            0,
            (layout.height * nextZoom - canvas.clientHeight) / 2,
          ),
          behavior: 'smooth',
        });
      });
    }
  }

  if (nodes.length === 0) {
    return (
      <div className="graph-empty-state" role="status">
        <strong>No semantic entities in this projection</strong>
        <span>Change level or relationship lens to continue.</span>
      </div>
    );
  }

  const dense = edges.length >= 8;

  return (
    <div className="graph-canvas-shell">
      <div
        ref={canvasRef}
        className={`graph-canvas${dense ? ' graph-canvas--dense' : ''}`}
        role="region"
        aria-label="Semantic code graph"
      >
        <div
          className="graph-viewport"
          style={{
            width: layout.width * zoom,
            height: layout.height * zoom,
          }}
        >
          <div
            className="graph-stage"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${zoom})`,
            }}
          >
            <svg
              className="graph-edge-layer"
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              aria-label="Semantic relationships"
            >
              <defs>
                <marker
                  id="codeflow-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>
              {edges.map((edge) => {
                const source = layout.positions.get(edge.sourceId);
                const target = layout.positions.get(edge.targetId);
                const sourceNode = nodesById.get(edge.sourceId);
                const targetNode = nodesById.get(edge.targetId);
                if (source === undefined || target === undefined) {
                  return null;
                }
                const path = edgePath(source, target);
                const trust = evidenceTrust(edge.evidence);
                const muted = emphasis.active && !emphasis.edgeIds.has(edge.id);
                const label = `${sourceNode?.label ?? edge.sourceId} ${edge.kind} ${targetNode?.label ?? edge.targetId}`;
                return (
                  <g
                    key={edge.id}
                    className={`graph-edge graph-edge--${trust}${
                      edge.changeKind === undefined
                        ? ''
                        : ` graph-edge--change-${edge.changeKind}`
                    }${
                      selectedEdgeId === edge.id ? ' graph-edge--selected' : ''
                    }${muted ? ' graph-edge--muted' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={label}
                    aria-pressed={selectedEdgeId === edge.id}
                    onClick={() => onSelectEdge(edge.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectEdge(edge.id);
                      }
                    }}
                  >
                    <path className="graph-edge-hit" d={path} />
                    <path
                      className="graph-edge-line"
                      d={path}
                      markerEnd="url(#codeflow-arrow)"
                    />
                    <text
                      className="graph-edge-label"
                      x={(source.x + target.x + NODE_WIDTH) / 2}
                      y={(source.y + target.y + NODE_HEIGHT) / 2 - 6}
                      textAnchor="middle"
                    >
                      {edge.kind}
                    </text>
                  </g>
                );
              })}
            </svg>

            <AnimatePresence initial={false}>
              {nodes.map((node) => {
                const position = layout.positions.get(node.id);
                if (position === undefined) {
                  return null;
                }
                const muted = emphasis.active && !emphasis.nodeIds.has(node.id);
                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    className={`semantic-graph-node${
                      focusId === node.id ? ' semantic-graph-node--focus' : ''
                    }${
                      selectedNodeId === node.id
                        ? ' semantic-graph-node--selected'
                        : ''
                    }${node.entryPoint ? ' semantic-graph-node--entry' : ''}${
                      impactIds.has(node.id)
                        ? ' semantic-graph-node--impact'
                        : ''
                    }${
                      node.changeKind === undefined
                        ? ''
                        : ` semantic-graph-node--change-${node.changeKind}`
                    }${muted ? ' semantic-graph-node--muted' : ''}`}
                    initial={{ left: position.x, top: position.y, scale: 0.96 }}
                    animate={{ left: position.x, top: position.y, scale: 1 }}
                    exit={{ scale: 0.96 }}
                    transition={{
                      left: {
                        duration: shouldReduceMotion ? 0 : 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      top: {
                        duration: shouldReduceMotion ? 0 : 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      },
                      scale: { duration: shouldReduceMotion ? 0 : 0.12 },
                    }}
                    aria-pressed={selectedNodeId === node.id}
                    aria-label={`${node.kind} ${node.label}${
                      node.changeKind === undefined ? '' : ` ${node.changeKind}`
                    }`}
                    onClick={() => onSelectNode(node.id)}
                  >
                    <span className="semantic-graph-node-meta">
                      <span>{node.kind}</span>
                      {node.entryPoint ? <span>ENTRY</span> : null}
                      {node.changeKind !== undefined ? (
                        <span>{node.changeKind.toUpperCase()}</span>
                      ) : null}
                    </span>
                    <strong>{node.label}</strong>
                    <span className="semantic-graph-node-path">
                      {compactPath(node.path)}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div
        className="graph-viewport-controls"
        role="group"
        aria-label="Graph viewport controls"
      >
        <IconButton
          aria-label="Zoom out"
          title="Zoom out"
          disabled={zoom <= MIN_GRAPH_ZOOM}
          onClick={() => zoomBy(-GRAPH_ZOOM_STEP)}
        >
          −
        </IconButton>
        <span aria-live="polite">{Math.round(zoom * 100)}%</span>
        <IconButton
          aria-label="Zoom in"
          title="Zoom in"
          disabled={zoom >= MAX_GRAPH_ZOOM}
          onClick={() => zoomBy(GRAPH_ZOOM_STEP)}
        >
          +
        </IconButton>
        <Button variant="ghost" onClick={fitGraph}>
          Fit graph
        </Button>
        <Button variant="ghost" onClick={() => scrollFocusIntoCenter('smooth')}>
          Center focus
        </Button>
      </div>
    </div>
  );
}

function GraphInspector({
  flow,
  graph,
  changeAnalysis,
  node,
  edge,
  focusId,
  expandedIncoming,
  expandedOutgoing,
  impactLoading,
  onExpandIncoming,
  onExpandOutgoing,
  onShowBoth,
  onCollapse,
  onFocus,
  onShowDependents,
  onTraceFunction,
  onSelectEdge,
}: {
  flow: FlowProjection;
  graph: SemanticGraph;
  changeAnalysis: PullRequestAnalysis | null;
  node: SemanticGraphNode | null;
  edge: SemanticGraphEdge | null;
  focusId: string | null;
  expandedIncoming: Set<string>;
  expandedOutgoing: Set<string>;
  impactLoading: boolean;
  onExpandIncoming: (id: string) => void;
  onExpandOutgoing: (id: string) => void;
  onShowBoth: (id: string) => void;
  onCollapse: (id: string) => void;
  onFocus: (node: SemanticGraphNode) => void;
  onShowDependents: (node: SemanticGraphNode) => void;
  onTraceFunction: (node: SemanticGraphNode) => void;
  onSelectEdge: (id: string) => void;
}) {
  if (edge !== null) {
    const source = graph.nodes.find(
      (candidate) => candidate.id === edge.sourceId,
    );
    const target = graph.nodes.find(
      (candidate) => candidate.id === edge.targetId,
    );
    return (
      <motion.aside
        key={`edge:${edge.id}`}
        className="graph-inspector"
        aria-label="Graph inspector"
        initial={{ opacity: 0, x: 5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.12 }}
      >
        <div className="graph-inspector-header">
          <span className="panel-kicker">Relationship</span>
          <strong>{edge.kind}</strong>
          <span>
            {source?.label ?? edge.sourceId} → {target?.label ?? edge.targetId}
          </span>
        </div>
        {edge.changeKind !== undefined ? (
          <div className="graph-change-state">
            {edge.changeKind} relationship
          </div>
        ) : null}
        <EvidenceList evidence={edge.evidence} />
      </motion.aside>
    );
  }

  if (node === null) {
    return (
      <motion.aside
        key="empty"
        className="graph-inspector"
        aria-label="Graph inspector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        <div className="graph-inspector-empty">
          <strong>Select a node or relationship</strong>
          <span>Inspect source, evidence, and graph-native actions here.</span>
        </div>
      </motion.aside>
    );
  }

  const relatedEdges = graph.edges.filter(
    (candidate) =>
      candidate.sourceId === node.id || candidate.targetId === node.id,
  );
  const incoming = relatedEdges.filter(
    (candidate) => candidate.targetId === node.id,
  );
  const outgoing = relatedEdges.filter(
    (candidate) => candidate.sourceId === node.id,
  );
  const sourceFlow =
    node.changeKind === 'removed' && changeAnalysis !== null
      ? changeAnalysis.base
      : flow;
  const snippet = sourceSnippet(sourceFlow, node.location);
  const projectedFunction = flow.nodes.some(
    (candidate) => candidate.id === node.id,
  );
  const behaviorDelta = changeAnalysis?.change.behaviorDeltas.find(
    (candidate) =>
      candidate.baseFunctionId === node.id ||
      candidate.headFunctionId === node.id,
  );

  return (
    <motion.aside
      key={`node:${node.id}`}
      className="graph-inspector"
      aria-label="Graph inspector"
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.12 }}
    >
      <div className="graph-inspector-header">
        <span className="panel-kicker">{node.kind}</span>
        <strong>{node.label}</strong>
        <span>{formatLocation(node.path, node.location)}</span>
      </div>

      {node.changeKind !== undefined ? (
        <div
          className={`graph-change-state graph-change-state--${node.changeKind}`}
        >
          {node.changeKind} in pull request
        </div>
      ) : null}

      <div
        className="graph-relationship-summary"
        aria-label="Relationship summary"
      >
        <span>
          <strong>{incoming.length}</strong> incoming
        </span>
        <span>
          <strong>{outgoing.length}</strong> outgoing
        </span>
        <span>
          <strong>{relatedEdges.length}</strong> total
        </span>
      </div>

      <section className="graph-inspector-section">
        <div className="graph-inspector-section-heading">
          <strong>Trace</strong>
          <span>from selected entity</span>
        </div>
        <div className="graph-node-primary-actions">
          <Button
            aria-pressed={expandedOutgoing.has(node.id)}
            onClick={() => onExpandOutgoing(node.id)}
          >
            Expand outgoing
          </Button>
          <Button
            aria-pressed={expandedIncoming.has(node.id)}
            onClick={() => onExpandIncoming(node.id)}
          >
            Expand incoming
          </Button>
        </div>
        <div className="graph-node-secondary-actions">
          <Button variant="ghost" onClick={() => onShowBoth(node.id)}>
            Show both
          </Button>
          <Button
            variant="ghost"
            aria-pressed={focusId === node.id}
            onClick={() => onFocus(node)}
          >
            {focusId === node.id ? 'Focused' : 'Focus here'}
          </Button>
          <Button variant="ghost" onClick={() => onCollapse(node.id)}>
            Collapse branch
          </Button>
          {node.kind !== 'Repository' && node.kind !== 'Workspace' ? (
            <Button
              variant="ghost"
              disabled={impactLoading}
              onClick={() => void onShowDependents(node)}
            >
              {impactLoading ? 'Tracing…' : 'Show dependents'}
            </Button>
          ) : null}
          {node.kind === 'Function' && !projectedFunction ? (
            <Button onClick={() => onTraceFunction(node)}>
              Trace calls from here
            </Button>
          ) : null}
        </div>
      </section>

      {snippet !== null ? (
        <section className="graph-inspector-section">
          <div className="graph-inspector-section-heading">
            <strong>Source</strong>
            <span>{formatLocation(node.path, node.location)}</span>
          </div>
          <pre className="graph-source-snippet">
            <code>
              {snippet.map((line) => (
                <span
                  key={line.lineNumber}
                  className={`graph-source-line${
                    line.active ? ' graph-source-line--active' : ''
                  }`}
                  aria-current={line.active ? 'location' : undefined}
                >
                  <span className="graph-source-line-number">
                    {line.lineNumber}
                  </span>
                  <span className="graph-source-line-code">
                    {line.text === '' ? ' ' : line.text}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </section>
      ) : null}

      {behaviorDelta !== undefined ? (
        <section className="graph-inspector-section">
          <div className="graph-inspector-section-heading">
            <strong>Behavior delta</strong>
            <span>BASE → HEAD static facts</span>
          </div>
          {behaviorDelta.items.length === 0 ? (
            <p className="graph-inspector-note">
              No supported static behavior delta found.
            </p>
          ) : (
            <div className="graph-behavior-delta-list">
              {behaviorDelta.items.slice(0, 8).map((item) => (
                <div key={item.id}>
                  <span>
                    {item.changeKind} · {item.category}
                  </span>
                  <strong>{item.label}</strong>
                  {item.detail === null ? null : <small>{item.detail}</small>}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="graph-inspector-section">
        <div className="graph-inspector-section-heading">
          <strong>Relationships</strong>
          <span>select one to inspect evidence</span>
        </div>
        {relatedEdges.length === 0 ? (
          <p className="graph-inspector-note">
            No supported semantic relationships for this entity.
          </p>
        ) : (
          <div className="graph-related-edge-list">
            {relatedEdges.slice(0, 12).map((candidate) => {
              const outgoingEdge = candidate.sourceId === node.id;
              const other = graph.nodes.find(
                (graphNode) =>
                  graphNode.id ===
                  (outgoingEdge ? candidate.targetId : candidate.sourceId),
              );
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onSelectEdge(candidate.id)}
                >
                  <span>
                    {outgoingEdge ? '→' : '←'} {candidate.kind}
                  </span>
                  <strong>{other?.label ?? 'Unknown entity'}</strong>
                  <small>{evidenceTrust(candidate.evidence)}</small>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {node.evidence.length > 0 ? (
        <EvidenceList evidence={node.evidence} />
      ) : null}
    </motion.aside>
  );
}

function ChangeOverlayBar({ analysis }: { analysis: PullRequestAnalysis }) {
  const counts = analysis.change.entities.reduce(
    (result, entity) => {
      result[entity.changeKind] += 1;
      return result;
    },
    { added: 0, modified: 0, removed: 0 },
  );
  return (
    <div className="graph-change-overlay-bar" role="status">
      <div>
        <span className="panel-kicker">Change overlay</span>
        <strong>
          PR #{analysis.change.source.pullRequestNumber} ·{' '}
          {analysis.change.source.title}
        </strong>
      </div>
      <div className="graph-change-counts">
        <span>+ {counts.added} added</span>
        <span>~ {counts.modified} modified</span>
        <span>− {counts.removed} removed</span>
        <span>
          {analysis.change.source.baseRevision.slice(0, 7)} →{' '}
          {analysis.change.source.headRevision.slice(0, 7)}
        </span>
      </div>
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: FlowEvidence[] }) {
  return (
    <section className="graph-inspector-section">
      <div className="graph-inspector-section-heading">
        <strong>Evidence</strong>
        <span>{evidence.length}</span>
      </div>
      {evidence.length === 0 ? (
        <p className="graph-inspector-note">
          No supporting evidence is available for this projected relationship.
        </p>
      ) : (
        <div className="graph-evidence-list">
          {evidence.map((item, index) => (
            <div
              key={`${item.source}:${item.location.filePath}:${item.location.startLine}:${index}`}
            >
              <span>
                {item.kind} · {item.source}
              </span>
              <strong>{item.reason}</strong>
              <small>
                {formatLocation(item.location.filePath, item.location)}
              </small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function appendImpactProjection(
  graph: SemanticGraph,
  impact: ImpactProjection | null,
): SemanticGraph {
  if (impact === null) {
    return graph;
  }
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));

  for (const result of impact.results) {
    if (!nodes.has(result.entityId)) {
      nodes.set(result.entityId, {
        id: result.entityId,
        kind: result.entityKind,
        label: result.name,
        path: result.path,
        location: null,
        evidence: result.evidence,
        entryPoint: false,
      });
    }
    for (const path of result.paths) {
      path.steps.forEach((step, index) => {
        const id = `impact:${path.seedId}:${result.entityId}:${index}:${step.sourceId}:${step.targetId}`;
        if (!edges.has(id)) {
          edges.set(id, {
            id,
            kind: step.kind,
            sourceId: step.sourceId,
            targetId: step.targetId,
            evidence: step.evidence,
          });
        }
      });
    }
  }
  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}

function resolveFocusForLevel(
  flow: FlowProjection,
  graph: SemanticGraph,
  level: GraphLevel,
  preferredId: string | null,
): string | null {
  const preferred = graph.nodes.find((node) => node.id === preferredId);
  if (preferred !== undefined && graphNodeBelongsToLevel(preferred, level)) {
    return preferred.id;
  }

  const entry = graph.nodes.find((node) => node.id === flow.entryPointId);
  if (level === 'code' && entry !== undefined) {
    return entry.id;
  }

  const entryPath = entry?.path ?? flow.source.filePath;
  if (level === 'structure') {
    const file = graph.nodes.find(
      (node) => node.kind === 'File' && node.path === entryPath,
    );
    if (file !== undefined) {
      return file.id;
    }
    if (
      flow.architecture?.rootId !== undefined &&
      graph.nodes.some((node) => node.id === flow.architecture?.rootId)
    ) {
      return flow.architecture.rootId;
    }
  }

  if (level === 'packages') {
    const ownerId = flow.topology?.fileOwners[entryPath];
    if (
      ownerId !== undefined &&
      graph.nodes.some((node) => node.id === ownerId)
    ) {
      return ownerId;
    }
    if (
      flow.topology?.rootId !== null &&
      flow.topology?.rootId !== undefined &&
      graph.nodes.some((node) => node.id === flow.topology?.rootId)
    ) {
      return flow.topology.rootId;
    }
  }

  return (
    graph.nodes.find((node) => graphNodeBelongsToLevel(node, level))?.id ?? null
  );
}

function layoutGraph(
  nodes: SemanticGraphNode[],
  edges: SemanticGraphEdge[],
  focusId: string | null,
): GraphLayout {
  if (nodes.length === 0) {
    return { positions: new Map(), width: 640, height: 360 };
  }
  const ids = new Set(nodes.map((node) => node.id));
  const rootId = focusId !== null && ids.has(focusId) ? focusId : nodes[0]?.id;
  const depth = new Map<string, number>();
  if (rootId !== undefined) {
    depth.set(rootId, 0);
  }

  for (let pass = 0; pass < nodes.length * 2; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      const sourceDepth = depth.get(edge.sourceId);
      const targetDepth = depth.get(edge.targetId);
      if (sourceDepth !== undefined && targetDepth === undefined) {
        depth.set(edge.targetId, sourceDepth + 1);
        changed = true;
      } else if (targetDepth !== undefined && sourceDepth === undefined) {
        depth.set(edge.sourceId, targetDepth - 1);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }

  const unresolved = nodes.filter((node) => !depth.has(node.id));
  const maxDepth = Math.max(0, ...Array.from(depth.values()));
  for (const node of unresolved) {
    depth.set(node.id, maxDepth + 1);
  }

  const groups = new Map<number, SemanticGraphNode[]>();
  for (const node of nodes) {
    const nodeDepth = depth.get(node.id) ?? 0;
    const group = groups.get(nodeDepth) ?? [];
    group.push(node);
    groups.set(nodeDepth, group);
  }
  for (const group of groups.values()) {
    group.sort((left, right) => left.label.localeCompare(right.label));
  }

  const depths = Array.from(groups.keys()).sort((left, right) => left - right);
  const rootDepth = rootId === undefined ? 0 : (depth.get(rootId) ?? 0);

  for (let pass = 0; pass < 3; pass += 1) {
    const order = new Map<string, number>();
    for (const nodeDepth of depths) {
      const group = groups.get(nodeDepth) ?? [];
      group.forEach((node, index) => order.set(node.id, index));
    }

    const orderedDepths = [...depths].sort((left, right) => {
      const distance = Math.abs(left - rootDepth) - Math.abs(right - rootDepth);
      return distance === 0 ? left - right : distance;
    });

    for (const nodeDepth of orderedDepths) {
      if (nodeDepth === rootDepth) {
        continue;
      }
      const anchorDepth = nodeDepth < rootDepth ? nodeDepth + 1 : nodeDepth - 1;
      const anchorIds = new Set(
        (groups.get(anchorDepth) ?? []).map((node) => node.id),
      );
      const group = groups.get(nodeDepth) ?? [];
      group.sort((left, right) => {
        const leftScore = relationshipOrderScore(
          left.id,
          anchorIds,
          edges,
          order,
        );
        const rightScore = relationshipOrderScore(
          right.id,
          anchorIds,
          edges,
          order,
        );
        if (
          Number.isFinite(leftScore) &&
          Number.isFinite(rightScore) &&
          leftScore !== rightScore
        ) {
          return leftScore - rightScore;
        }
        if (Number.isFinite(leftScore) !== Number.isFinite(rightScore)) {
          return Number.isFinite(leftScore) ? -1 : 1;
        }
        return left.label.localeCompare(right.label);
      });
    }
  }

  const minDepth = depths[0] ?? 0;
  const tallest = Math.max(
    1,
    ...Array.from(groups.values(), (group) => group.length),
  );
  const graphContentHeight =
    tallest * NODE_HEIGHT + Math.max(0, tallest - 1) * ROW_GAP;
  const positions = new Map<string, GraphPosition>();

  for (const nodeDepth of depths) {
    const group = groups.get(nodeDepth) ?? [];
    const groupHeight =
      group.length * NODE_HEIGHT + Math.max(0, group.length - 1) * ROW_GAP;
    const yOffset = 42 + Math.max(0, (graphContentHeight - groupHeight) / 2);
    group.forEach((node, index) => {
      positions.set(node.id, {
        x: 42 + (nodeDepth - minDepth) * (NODE_WIDTH + COLUMN_GAP),
        y: yOffset + index * (NODE_HEIGHT + ROW_GAP),
      });
    });
  }

  return {
    positions,
    width: Math.max(
      680,
      84 +
        depths.length * NODE_WIDTH +
        Math.max(0, depths.length - 1) * COLUMN_GAP,
    ),
    height: Math.max(420, 84 + graphContentHeight),
  };
}

function relationshipOrderScore(
  nodeId: string,
  anchorIds: Set<string>,
  edges: SemanticGraphEdge[],
  order: Map<string, number>,
): number {
  const scores: number[] = [];
  for (const edge of edges) {
    if (edge.sourceId === nodeId && anchorIds.has(edge.targetId)) {
      const value = order.get(edge.targetId);
      if (value !== undefined) scores.push(value);
    } else if (edge.targetId === nodeId && anchorIds.has(edge.sourceId)) {
      const value = order.get(edge.sourceId);
      if (value !== undefined) scores.push(value);
    }
  }
  if (scores.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function edgePath(source: GraphPosition, target: GraphPosition): string {
  const sourceX = source.x + NODE_WIDTH;
  const sourceY = source.y + NODE_HEIGHT / 2;
  const targetX = target.x;
  const targetY = target.y + NODE_HEIGHT / 2;
  if (target.x >= source.x) {
    const middleX = sourceX + (targetX - sourceX) / 2;
    return `M ${sourceX} ${sourceY} C ${middleX} ${sourceY}, ${middleX} ${targetY}, ${targetX} ${targetY}`;
  }
  const leftSourceX = source.x;
  const rightTargetX = target.x + NODE_WIDTH;
  const middleX = rightTargetX + (leftSourceX - rightTargetX) / 2;
  return `M ${leftSourceX} ${sourceY} C ${middleX} ${sourceY}, ${middleX} ${targetY}, ${rightTargetX} ${targetY}`;
}

function sourceSnippet(
  flow: FlowProjection,
  location: SourceLocation | null,
): SourceSnippetLine[] | null {
  if (location === null) {
    return null;
  }
  const source = flow.sources.find(
    (candidate) => candidate.filePath === location.filePath,
  );
  if (source === undefined) {
    return null;
  }
  const lines = source.text.split('\n');
  const start = Math.max(0, location.startLine - 3);
  const end = Math.min(
    lines.length,
    Math.max(location.endLine + 2, location.startLine + 4),
    start + 14,
  );
  return lines.slice(start, end).map((line, index) => {
    const lineNumber = start + index + 1;
    return {
      lineNumber,
      text: line,
      active:
        lineNumber >= location.startLine && lineNumber <= location.endLine,
    };
  });
}

function evidenceTrust(evidence: FlowEvidence[]): string {
  const kind = evidence[0]?.kind;
  if (
    kind === 'verified-static' ||
    kind === 'configured' ||
    kind === 'observed-runtime'
  ) {
    return 'verified';
  }
  if (kind === 'inferred-static') {
    return 'inferred';
  }
  return 'unavailable';
}

function levelLabel(level: GraphLevel): string {
  if (level === 'packages') return 'Packages';
  if (level === 'structure') return 'Structure';
  return 'Code';
}

function lensLabel(lens: GraphLens): string {
  if (lens === 'ALL') return 'All';
  if (lens === 'DEPENDENCIES') return 'Dependencies';
  if (lens === 'REFERENCES') return 'References';
  if (lens === 'TYPES') return 'Types';
  return 'Calls';
}

function compactPath(path: string | null): string {
  if (path === null || path === '' || path === '.') {
    return path ?? 'path unavailable';
  }
  const parts = path.split('/');
  if (parts.length <= 3) {
    return path;
  }
  return `…/${parts.slice(-3).join('/')}`;
}

function formatLocation(
  path: string | null,
  location: SourceLocation | null,
): string {
  if (location === null) {
    return path ?? 'source location unavailable';
  }
  return `${path ?? location.filePath}:L${location.startLine}–${location.endLine}`;
}
