import {
  Boxes,
  Braces,
  Cable,
  CircleDot,
  FileCode2,
  FlaskConical,
  GitBranch,
  Layers3,
  Network,
  Package,
  Search,
  ServerCog,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useMemo, useState, type KeyboardEvent } from 'react';

import { Button, Input, ProductIcon } from '../../components/ui/primitives';
import { buildSemanticGraph } from '../../domain/graph/graph-model';
import {
  buildSystemMapProjection,
  selectSystemMapEdges,
  selectSystemMapNodes,
  type SystemConcern,
  type SystemMapEdge,
  type SystemMapMode,
  type SystemMapNode,
  type SystemMapProjection,
} from '../../domain/graph/system-map-model';
import type {
  FlowProjection,
  StaticFlowStep,
} from '../../integrations/api/flow-client';
import type { RepositorySelectionSummary } from '../acquisition/RepositoryPicker';

interface Props {
  flow: FlowProjection;
  selectionSummary: RepositorySelectionSummary | null;
  onChangeRepository: () => void;
}

type Position = { x: number; y: number };

const NODE_WIDTH = 184;
const NODE_HEIGHT = 62;
const COLUMN_GAP = 48;
const ROW_GAP = 24;
const PADDING = 32;
const RUNTIME_CONCERNS: SystemConcern[] = [
  'ui',
  'component',
  'application',
  'core',
  'infrastructure',
];

const CONCERN: Record<
  SystemConcern,
  { label: string; short: string; description: string; icon: LucideIcon }
> = {
  ui: {
    label: 'UI / Interface',
    short: 'UI',
    description: 'Pages, screens, routes, and primary interactive surfaces.',
    icon: Layers3,
  },
  component: {
    label: 'Components',
    short: 'Component',
    description: 'Reusable renderable interface building blocks.',
    icon: Boxes,
  },
  application: {
    label: 'Application logic',
    short: 'Logic',
    description: 'Handlers, services, workflows, and orchestration.',
    icon: Workflow,
  },
  core: {
    label: 'Core / Domain',
    short: 'Core',
    description: 'Domain rules and code explicitly inside a core boundary.',
    icon: Braces,
  },
  infrastructure: {
    label: 'Infrastructure',
    short: 'Infra',
    description:
      'Adapters, clients, repositories, persistence, and external boundaries.',
    icon: ServerCog,
  },
  test: {
    label: 'Testing',
    short: 'Test',
    description:
      'Test, spec, and e2e code kept outside the primary runtime lane.',
    icon: FlaskConical,
  },
};

const MODES: Array<{ id: SystemMapMode; label: string; icon: LucideIcon }> = [
  { id: 'system', label: 'System map', icon: Network },
  { id: 'runtime', label: 'Runtime path', icon: GitBranch },
  { id: 'data', label: 'Data flow', icon: Cable },
  { id: 'tests', label: 'Tests', icon: FlaskConical },
  { id: 'dependencies', label: 'Dependencies', icon: Package },
];

export function SystemMapWorkspace({
  flow,
  selectionSummary,
  onChangeRepository,
}: Props) {
  const projection = useMemo(
    () => buildSystemMapProjection(flow, buildSemanticGraph(flow)),
    [flow],
  );
  const [mode, setMode] = useState<SystemMapMode>('system');
  const [selectedId, setSelectedId] = useState<string | null>(
    projection.primaryEntryId ?? projection.symbolNodes[0]?.id ?? null,
  );
  const [query, setQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);

  const graphMode: 'system' | 'runtime' | 'tests' | null =
    mode === 'system' || mode === 'runtime' || mode === 'tests' ? mode : null;
  const nodes = useMemo(
    () =>
      graphMode === null ? [] : selectSystemMapNodes(projection, graphMode),
    [graphMode, projection],
  );
  const edges = useMemo(
    () =>
      graphMode === null
        ? []
        : selectSystemMapEdges(projection, nodes, graphMode),
    [graphMode, nodes, projection],
  );
  const selected =
    projection.nodes.find((node) => node.id === selectedId) ?? null;
  const dataNode = resolveDataNode(flow, projection, selectedId);
  const primary =
    projection.nodes.find((node) => node.id === projection.primaryEntryId) ??
    null;
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value === '') return [];
    return projection.symbolNodes
      .filter(
        (node) =>
          node.label.toLowerCase().includes(value) ||
          (node.path?.toLowerCase().includes(value) ?? false),
      )
      .slice(0, 10);
  }, [projection.symbolNodes, query]);

  function changeMode(next: SystemMapMode) {
    setMode(next);
    setQuery('');
    setSearchIndex(0);
    if (next === 'tests') {
      setSelectedId(
        projection.symbolNodes.find((node) => node.concern === 'test')?.id ??
          projection.primaryEntryId,
      );
    } else if (next === 'data') {
      setSelectedId(dataNode?.id ?? projection.primaryEntryId);
    } else if (next === 'system' || next === 'runtime') {
      setSelectedId(projection.primaryEntryId ?? selectedId);
    }
  }

  function choose(node: SystemMapNode) {
    setSelectedId(node.id);
    setMode(node.concern === 'test' ? 'tests' : 'system');
    setQuery('');
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setQuery('');
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSearchIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSearchIndex((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter' && results[searchIndex] !== undefined) {
      event.preventDefault();
      choose(results[searchIndex]);
    }
  }

  const repository =
    selectionSummary?.rootLabel ??
    flow.repository?.name ??
    flow.source.filePath;
  const secondaryEntries = Math.max(0, (flow.entryPoints?.length ?? 0) - 1);

  return (
    <motion.section
      className="system-map-workspace"
      aria-label="CodeFlow system map"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <header className="system-map-context-bar">
        <div className="system-map-repository">
          <ProductIcon icon={FileCode2} size={13} />
          <div>
            <strong>{repository}</strong>
            <span>
              {flow.analysis.analyzedFileCount} analyzed files
              {flow.analysis.status === 'partial' ? ' · partial evidence' : ''}
            </span>
          </div>
        </div>
        <div
          className="system-map-entry-summary"
          aria-label="Primary entry point"
        >
          <ProductIcon icon={CircleDot} size={11} />
          <div>
            <span>Primary entry</span>
            <strong>{primary?.label ?? 'No detected entry'}</strong>
          </div>
          {secondaryEntries > 0 ? (
            <small>{secondaryEntries} more mapped</small>
          ) : null}
        </div>
        <div className="system-map-search">
          <ProductIcon icon={Search} size={12} />
          <Input
            aria-label="Search system map"
            type="search"
            value={query}
            placeholder="Search symbol or path…"
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchIndex(0);
            }}
            onKeyDown={onSearchKeyDown}
          />
          {query.trim() !== '' ? (
            <div className="system-map-search-results" role="listbox">
              {results.length === 0 ? (
                <p>No matching semantic entity.</p>
              ) : (
                results.map((node, index) => (
                  <button
                    key={node.id}
                    type="button"
                    role="option"
                    aria-selected={index === searchIndex}
                    onMouseEnter={() => setSearchIndex(index)}
                    onClick={() => choose(node)}
                  >
                    <span>{CONCERN[node.concern].short}</span>
                    <strong>{node.label}</strong>
                    <small>{compactPath(node.path)}</small>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <Button variant="ghost" onClick={onChangeRepository}>
          Change repository
        </Button>
      </header>

      <div className="system-map-toolbar">
        <div
          className="system-map-mode-switcher"
          role="group"
          aria-label="Map view"
        >
          {MODES.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={mode === item.id}
              onClick={() => changeMode(item.id)}
            >
              <ProductIcon icon={item.icon} size={11} />
              {item.label}
            </Button>
          ))}
        </div>
        <span>
          Concern labels are inferred from source structure; relationships
          remain source-backed.
        </span>
      </div>

      <ConcernSummary projection={projection} />

      <div className="system-map-body">
        <main className="system-map-primary-pane">
          {mode === 'data' ? (
            <DataPanel flow={flow} node={dataNode} />
          ) : mode === 'dependencies' ? (
            <DependencyPanel flow={flow} projection={projection} />
          ) : (
            <MapCanvas
              projection={projection}
              nodes={nodes}
              edges={edges}
              selectedId={selectedId}
              onSelect={setSelectedId}
              testMode={mode === 'tests'}
            />
          )}
        </main>
        <Inspector
          flow={flow}
          projection={projection}
          node={mode === 'data' ? dataNode : selected}
          onSelect={setSelectedId}
        />
      </div>
    </motion.section>
  );
}

function ConcernSummary({ projection }: { projection: SystemMapProjection }) {
  return (
    <div
      className="system-map-concern-summary"
      aria-label="Separation of concerns"
    >
      {[...RUNTIME_CONCERNS, 'test' as const].map((concern) => (
        <div key={concern} data-concern={concern}>
          <span>
            <ProductIcon icon={CONCERN[concern].icon} size={11} />
            {CONCERN[concern].short}
          </span>
          <strong>{projection.concernCounts[concern]}</strong>
        </div>
      ))}
      <div data-concern="dependency">
        <span>
          <ProductIcon icon={Package} size={11} /> Dependency
        </span>
        <strong>
          {projection.externalDependencies.reduce(
            (count, group) => count + group.dependencies.length,
            0,
          )}
        </strong>
      </div>
    </div>
  );
}

function MapCanvas({
  projection,
  nodes,
  edges,
  selectedId,
  onSelect,
  testMode,
}: {
  projection: SystemMapProjection;
  nodes: SystemMapNode[];
  edges: SystemMapEdge[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  testMode: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const layout = useMemo(() => layoutNodes(nodes), [nodes]);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  if (nodes.length === 0)
    return <Empty text="No source-backed entities in this view." />;

  return (
    <div className="system-map-canvas-shell">
      <div className="system-map-canvas-intro">
        <div>
          <span className="panel-kicker">
            {testMode ? 'TEST SURFACE' : 'SYSTEM EXECUTION MAP'}
          </span>
          <strong>
            {testMode
              ? 'Tests stay separate and connect back to production code.'
              : 'Follow responsibility first, then inspect exact relationships.'}
          </strong>
        </div>
        <span>{nodes.length} visible entities</span>
      </div>
      <div
        className="system-map-canvas"
        role="region"
        aria-label="System architecture map"
      >
        <div
          className="system-map-stage"
          style={{ width: layout.width, height: layout.height }}
        >
          {RUNTIME_CONCERNS.map((concern, column) => (
            <div
              key={concern}
              className="system-map-lane-heading"
              data-concern={concern}
              style={{
                left: PADDING + column * (NODE_WIDTH + COLUMN_GAP),
                width: NODE_WIDTH,
              }}
            >
              <span>{CONCERN[concern].label}</span>
              <small>{projection.concernCounts[concern]}</small>
            </div>
          ))}
          {layout.testY !== null ? (
            <div
              className="system-map-test-divider"
              style={{ top: layout.testY - 54 }}
            >
              <span>
                <ProductIcon icon={FlaskConical} size={11} />
                TESTING — supporting verification, not runtime execution
              </span>
              <small>{projection.concernCounts.test} detected</small>
            </div>
          ) : null}
          <svg
            className="system-map-edge-layer"
            width={layout.width}
            height={layout.height}
            aria-label="Source-backed system relationships"
          >
            <defs>
              <marker
                id="system-map-arrow"
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
              const sourceNode = nodeById.get(edge.sourceId);
              const targetNode = nodeById.get(edge.targetId);
              if (!source || !target || !sourceNode || !targetNode) return null;
              const testEdge =
                sourceNode.concern === 'test' || targetNode.concern === 'test';
              return (
                <g
                  key={edge.id}
                  className={`system-map-edge system-map-edge--${edge.semanticKind.toLowerCase()}${
                    testEdge ? ' system-map-edge--test' : ''
                  }`}
                >
                  <path
                    d={edgePath(source, target)}
                    markerEnd="url(#system-map-arrow)"
                  />
                  <text
                    x={(source.x + target.x + NODE_WIDTH) / 2}
                    y={(source.y + target.y + NODE_HEIGHT) / 2 - 5}
                    textAnchor="middle"
                  >
                    {edge.semanticKind}
                  </text>
                </g>
              );
            })}
          </svg>
          {nodes.map((node) => {
            const position = layout.positions.get(node.id);
            if (!position) return null;
            const meta = CONCERN[node.concern];
            const primary = node.id === projection.primaryEntryId;
            return (
              <motion.button
                key={node.id}
                type="button"
                className="system-map-node"
                data-concern={node.concern}
                data-primary-entry={primary ? 'true' : undefined}
                aria-pressed={selectedId === node.id}
                aria-label={`${primary ? 'Primary entry ' : ''}${meta.label} ${node.label}`}
                initial={{ left: position.x, top: position.y, scale: 0.97 }}
                animate={{ left: position.x, top: position.y, scale: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.16 }}
                onClick={() => onSelect(node.id)}
              >
                <span className="system-map-node-meta">
                  <span>
                    <ProductIcon icon={meta.icon} size={10} /> {meta.short}
                  </span>
                  {primary ? (
                    <strong>PRIMARY ENTRY</strong>
                  ) : node.entryPoint ? (
                    <strong>ENTRY</strong>
                  ) : null}
                </span>
                <strong className="system-map-node-title">{node.label}</strong>
                <span className="system-map-node-path">
                  {compactPath(node.path)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DataPanel({
  flow,
  node,
}: {
  flow: FlowProjection;
  node: SystemMapNode | null;
}) {
  if (node === null)
    return <Empty text="No supported static data flow found." />;
  const steps =
    flow.staticFlow?.steps.filter((step) => step.functionId === node.id) ?? [];
  const relationships =
    flow.staticFlow?.relationships.filter(
      (item) => item.functionId === node.id,
    ) ?? [];
  const functionData = flow.functionData?.find(
    (item) => item.functionId === node.id,
  );
  const stepById = new Map(steps.map((step) => [step.id, step]));

  return (
    <div className="system-data-flow" aria-label="Static data flow">
      <div className="system-data-flow-header">
        <div>
          <span className="panel-kicker">SOURCE-BACKED STATIC FLOW</span>
          <strong>{node.label}</strong>
          <span>{compactPath(node.path)}</span>
        </div>
        <div>
          <span>{functionData?.parameters.length ?? 0} inputs</span>
          <span>{steps.length} steps</span>
          <span>{functionData?.returns.length ?? 0} returns</span>
        </div>
      </div>
      <p className="system-data-flow-warning">
        Static source relationships only. This does not claim observed runtime
        branch choice, values, timing, or frequency.
      </p>
      {steps.length === 0 ? (
        <Empty text="No supported static steps for this function." />
      ) : (
        <div className="system-data-flow-track">
          {steps.map((step, index) => {
            const outgoing = relationships.filter(
              (item) => item.sourceStepId === step.id,
            );
            return (
              <div key={step.id} className="system-data-step-row">
                <DataStep step={step} index={index} />
                <div className="system-data-relations">
                  {outgoing.length === 0 ? (
                    <span>end / no projected next step</span>
                  ) : (
                    outgoing.map((item) => (
                      <div key={item.id}>
                        <ProductIcon icon={Cable} size={10} />
                        <span>{item.kind}</span>
                        <strong>
                          {item.targetStepId === null
                            ? item.label
                            : (stepById.get(item.targetStepId)?.label ??
                              item.label)}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataStep({ step, index }: { step: StaticFlowStep; index: number }) {
  return (
    <div className="system-data-step" data-step-kind={step.kind}>
      <span>{String(index + 1).padStart(2, '0')}</span>
      <div>
        <small>{step.kind.toUpperCase()}</small>
        <strong>{step.label}</strong>
        {step.valueText === null ? null : <code>{step.valueText}</code>}
      </div>
    </div>
  );
}

function DependencyPanel({
  flow,
  projection,
}: {
  flow: FlowProjection;
  projection: SystemMapProjection;
}) {
  const packages =
    flow.topology?.entities.filter((entity) => entity.kind === 'Package') ?? [];
  const packageById = new Map(packages.map((item) => [item.id, item]));
  const internal =
    flow.topology?.relationships.filter((item) => item.kind === 'DEPENDS_ON') ??
    [];
  if (projection.externalDependencies.length === 0 && internal.length === 0) {
    return <Empty text="No configured package dependency topology." />;
  }
  return (
    <div
      className="system-dependency-topology"
      aria-label="Dependency topology"
    >
      <div className="system-dependency-header">
        <span className="panel-kicker">DEPENDENCY BOUNDARIES</span>
        <strong>
          Dependencies stay separate from application and domain logic.
        </strong>
        <span>
          Configured package metadata and source-backed relationships.
        </span>
      </div>
      {internal.length > 0 ? (
        <section>
          <h3>Internal packages</h3>
          {internal.map((item) => (
            <div key={item.id} className="system-package-relation">
              <span>
                {packageById.get(item.sourceId)?.name ?? item.sourceId}
              </span>
              <ProductIcon icon={Cable} size={11} />
              <strong>
                {packageById.get(item.targetId)?.name ?? item.targetId}
              </strong>
            </div>
          ))}
        </section>
      ) : null}
      <section>
        <h3>External dependencies</h3>
        <div className="system-external-dependency-grid">
          {projection.externalDependencies.map((group) => (
            <div key={group.packageId} className="system-dependency-group">
              <strong>{group.packageName}</strong>
              <small>{group.packagePath ?? 'package path unavailable'}</small>
              <div>
                {group.dependencies.map((dependency) => (
                  <span key={dependency}>{dependency}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Inspector({
  flow,
  projection,
  node,
  onSelect,
}: {
  flow: FlowProjection;
  projection: SystemMapProjection;
  node: SystemMapNode | null;
  onSelect: (id: string) => void;
}) {
  if (node === null) {
    return (
      <aside className="system-map-inspector">
        <Empty text="Select a mapped entity." />
      </aside>
    );
  }
  const related = projection.edges.filter(
    (edge) => edge.sourceId === node.id || edge.targetId === node.id,
  );
  const incoming = related.filter((edge) => edge.targetId === node.id);
  const outgoing = related.filter((edge) => edge.sourceId === node.id);
  const relatedTests = related
    .map((edge) =>
      projection.nodes.find(
        (candidate) =>
          candidate.id ===
          (edge.sourceId === node.id ? edge.targetId : edge.sourceId),
      ),
    )
    .filter(
      (candidate): candidate is SystemMapNode =>
        candidate !== undefined && candidate.concern === 'test',
    );
  const steps =
    flow.staticFlow?.steps.filter((step) => step.functionId === node.id) ?? [];
  const functionData = flow.functionData?.find(
    (item) => item.functionId === node.id,
  );
  const packageId =
    node.path === null ? undefined : flow.topology?.fileOwners[node.path];
  const dependencyGroup = projection.externalDependencies.find(
    (group) => group.packageId === packageId,
  );
  const snippet = sourceSnippet(
    flow,
    node.path,
    node.location?.startLine ?? null,
  );
  const meta = CONCERN[node.concern];

  return (
    <aside className="system-map-inspector" aria-label="System map inspector">
      <header>
        <span className="panel-kicker">{meta.label.toUpperCase()}</span>
        <strong>{node.label}</strong>
        <span>
          {formatLocation(node.path, node.location?.startLine ?? null)}
        </span>
      </header>
      {node.id === projection.primaryEntryId ? (
        <p className="system-map-primary-entry-note">
          Primary runtime anchor selected automatically.
        </p>
      ) : null}
      <section>
        <h3>
          Responsibility <small>inferred</small>
        </h3>
        <p>{meta.description}</p>
        <small>{node.concernReason}</small>
      </section>
      <div className="system-map-stats">
        <span>
          <strong>{incoming.length}</strong> incoming
        </span>
        <span>
          <strong>{outgoing.length}</strong> outgoing
        </span>
        <span>
          <strong>{relatedTests.length}</strong> tests
        </span>
        <span>
          <strong>{steps.length}</strong> data steps
        </span>
      </div>
      <section>
        <h3>
          Relationships <small>exact graph edges</small>
        </h3>
        <div className="system-map-related-list">
          {related.slice(0, 12).map((edge) => {
            const otherId =
              edge.sourceId === node.id ? edge.targetId : edge.sourceId;
            const other = projection.nodes.find(
              (candidate) => candidate.id === otherId,
            );
            return (
              <button
                key={edge.id}
                type="button"
                disabled={other === undefined}
                onClick={() => other && onSelect(other.id)}
              >
                <strong>{edge.semanticKind}</strong>
                <span>{other?.label ?? otherId}</span>
              </button>
            );
          })}
        </div>
      </section>
      {functionData !== undefined || steps.length > 0 ? (
        <section>
          <h3>
            Data <small>static facts</small>
          </h3>
          <p>
            {functionData?.parameters.length ?? 0} parameters ·{' '}
            {functionData?.returns.length ?? 0} returns · {steps.length} flow
            steps
          </p>
        </section>
      ) : null}
      {relatedTests.length > 0 ? (
        <section>
          <h3>
            Tests <small>outside runtime flow</small>
          </h3>
          <div className="system-map-test-links">
            {relatedTests.slice(0, 8).map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => onSelect(test.id)}
              >
                {test.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {dependencyGroup !== undefined ? (
        <section>
          <h3>
            Package dependencies <small>{dependencyGroup.packageName}</small>
          </h3>
          <p>{dependencyGroup.dependencies.slice(0, 10).join(' · ')}</p>
        </section>
      ) : null}
      {snippet.length > 0 ? (
        <section>
          <h3>Source</h3>
          <pre className="system-map-source-snippet">
            <code>
              {snippet.map((line) => (
                <span
                  key={line.lineNumber}
                  data-active={line.active ? 'true' : undefined}
                >
                  <small>{line.lineNumber}</small>
                  <span>{line.text || ' '}</span>
                </span>
              ))}
            </code>
          </pre>
        </section>
      ) : null}
    </aside>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="system-map-empty" role="status">
      <strong>{text}</strong>
    </div>
  );
}

function layoutNodes(nodes: SystemMapNode[]) {
  const positions = new Map<string, Position>();
  let runtimeRows = 1;
  RUNTIME_CONCERNS.forEach((concern, column) => {
    const group = nodes.filter((node) => node.concern === concern);
    runtimeRows = Math.max(runtimeRows, group.length);
    group.forEach((node, row) =>
      positions.set(node.id, {
        x: PADDING + column * (NODE_WIDTH + COLUMN_GAP),
        y: 58 + row * (NODE_HEIGHT + ROW_GAP),
      }),
    );
  });
  const tests = nodes.filter((node) => node.concern === 'test');
  const runtimeHeight = 58 + runtimeRows * (NODE_HEIGHT + ROW_GAP);
  const testY = tests.length > 0 ? runtimeHeight + 72 : null;
  tests.forEach((node, index) =>
    positions.set(node.id, {
      x: PADDING + (index % 5) * (NODE_WIDTH + COLUMN_GAP),
      y:
        (testY ?? runtimeHeight) +
        Math.floor(index / 5) * (NODE_HEIGHT + ROW_GAP),
    }),
  );
  return {
    positions,
    testY,
    width: PADDING * 2 + 5 * NODE_WIDTH + 4 * COLUMN_GAP,
    height:
      (testY ?? runtimeHeight) +
      Math.max(1, Math.ceil(tests.length / 5)) * (NODE_HEIGHT + ROW_GAP) +
      PADDING,
  };
}

function edgePath(source: Position, target: Position) {
  const sy = source.y + NODE_HEIGHT / 2;
  const ty = target.y + NODE_HEIGHT / 2;
  const right = target.x >= source.x;
  const sx = right ? source.x + NODE_WIDTH : source.x;
  const tx = right ? target.x : target.x + NODE_WIDTH;
  const bend = Math.max(30, Math.abs(tx - sx) * 0.42);
  return `M ${sx} ${sy} C ${right ? sx + bend : sx - bend} ${sy}, ${
    right ? tx - bend : tx + bend
  } ${ty}, ${tx} ${ty}`;
}

function resolveDataNode(
  flow: FlowProjection,
  projection: SystemMapProjection,
  preferredId: string | null,
) {
  const ids = new Set(
    (flow.staticFlow?.steps ?? []).map((step) => step.functionId),
  );
  if (preferredId !== null && ids.has(preferredId)) {
    return (
      projection.symbolNodes.find((node) => node.id === preferredId) ?? null
    );
  }
  if (
    projection.primaryEntryId !== null &&
    ids.has(projection.primaryEntryId)
  ) {
    return (
      projection.symbolNodes.find(
        (node) => node.id === projection.primaryEntryId,
      ) ?? null
    );
  }
  return projection.symbolNodes.find((node) => ids.has(node.id)) ?? null;
}

function compactPath(path: string | null) {
  if (!path) return 'path unavailable';
  const parts = path.replaceAll('\\', '/').split('/');
  return parts.length <= 3 ? path : `…/${parts.slice(-3).join('/')}`;
}

function formatLocation(path: string | null, line: number | null) {
  return line === null ? compactPath(path) : `${compactPath(path)}:${line}`;
}

function sourceSnippet(
  flow: FlowProjection,
  path: string | null,
  line: number | null,
) {
  if (path === null) return [];
  const source = flow.sources.find((item) => item.filePath === path);
  if (!source) return [];
  const lines = source.text.split(/\r?\n/);
  const center = line ?? 1;
  const start = Math.max(1, center - 3);
  const end = Math.min(lines.length, center + 5);
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const lineNumber = start + index;
    return {
      lineNumber,
      text: lines[lineNumber - 1] ?? '',
      active: lineNumber === center,
    };
  });
}
