import type { FlowProjection } from '../../integrations/api/flow-client';
import type {
  SemanticGraph,
  SemanticGraphEdge,
  SemanticGraphNode,
} from './graph-model';

export type SystemConcern =
  | 'ui'
  | 'component'
  | 'application'
  | 'core'
  | 'infrastructure'
  | 'test';

export type SystemMapMode =
  | 'system'
  | 'runtime'
  | 'data'
  | 'tests'
  | 'dependencies';

export type SystemEdgeKind =
  | 'CALL'
  | 'REFERENCE'
  | 'DEPENDENCY'
  | 'TYPE'
  | 'STRUCTURE';

export interface ConcernClassification {
  concern: SystemConcern;
  reason: string;
}

export interface SystemMapNode extends SemanticGraphNode {
  concern: SystemConcern;
  concernReason: string;
}

export interface SystemMapEdge extends SemanticGraphEdge {
  semanticKind: SystemEdgeKind;
}

export interface ExternalDependencyGroup {
  packageId: string;
  packageName: string;
  packagePath: string | null;
  dependencies: string[];
}

export interface SystemMapProjection {
  nodes: SystemMapNode[];
  symbolNodes: SystemMapNode[];
  edges: SystemMapEdge[];
  primaryEntryId: string | null;
  concernCounts: Record<SystemConcern, number>;
  externalDependencies: ExternalDependencyGroup[];
}

const SYMBOL_KINDS = new Set<SemanticGraphNode['kind']>([
  'Function',
  'Method',
  'Class',
  'Interface',
  'Type',
  'Enum',
  'Variable',
]);

const TEST_PATH =
  /(^|\/)(?:__tests__|tests?|specs?|e2e|fixtures)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/i;
const UI_SURFACE_NAME =
  /(?:app|page|screen|view|workspace|experience|layout|route)$/i;
const COMPONENT_PATH = /(^|\/)(?:components?|ui)(?:\/|$)/i;
const CORE_PATH = /(^|\/)(?:domain|core)(?:\/|$)/i;
const APPLICATION_PATH =
  /(^|\/)(?:application|features?|services?|use-cases?|usecases|workflows?)(?:\/|$)/i;
const INFRASTRUCTURE_PATH =
  /(^|\/)(?:integrations?|infrastructure|infra|adapters?|repositories?|database|db|clients?|gateways?)(?:\/|$)/i;
const INFRASTRUCTURE_NAME =
  /(repository|adapter|gateway|client|database|store|transport|persistence)$/i;
const APPLICATION_NAME =
  /(controller|handler|service|usecase|use-case|orchestrator|manager|workflow)$/i;

export function classifySystemConcern(
  node: SemanticGraphNode,
): ConcernClassification {
  const path = normalizePath(node.path ?? node.location?.filePath ?? '');
  const fileName = path.split('/').at(-1) ?? '';
  const stem = fileName.replace(/\.[^.]+$/, '');

  if (TEST_PATH.test(path)) {
    return {
      concern: 'test',
      reason: 'test/spec/e2e source path',
    };
  }

  if (UI_SURFACE_NAME.test(stem) && /\.[jt]sx$/i.test(fileName)) {
    return {
      concern: 'ui',
      reason: 'interactive surface name in JSX/TSX source',
    };
  }

  if (COMPONENT_PATH.test(path) || /\.[jt]sx$/i.test(fileName)) {
    return {
      concern: 'component',
      reason: COMPONENT_PATH.test(path)
        ? 'component/UI source boundary'
        : 'renderable JSX/TSX source',
    };
  }

  if (CORE_PATH.test(path)) {
    return {
      concern: 'core',
      reason: 'domain/core source boundary',
    };
  }

  if (
    INFRASTRUCTURE_PATH.test(path) ||
    INFRASTRUCTURE_NAME.test(node.label)
  ) {
    return {
      concern: 'infrastructure',
      reason: 'integration/adapter/persistence boundary',
    };
  }

  if (APPLICATION_PATH.test(path) || APPLICATION_NAME.test(node.label)) {
    return {
      concern: 'application',
      reason: 'application orchestration/service boundary',
    };
  }

  return {
    concern: 'application',
    reason: 'source-backed code without a stronger concern signal',
  };
}

export function systemEdgeKind(kind: string): SystemEdgeKind {
  if (kind === 'CALLS') {
    return 'CALL';
  }
  if (kind === 'REFERENCES') {
    return 'REFERENCE';
  }
  if (kind === 'IMPORTS' || kind === 'DEPENDS_ON') {
    return 'DEPENDENCY';
  }
  if (kind === 'EXTENDS' || kind === 'IMPLEMENTS') {
    return 'TYPE';
  }
  return 'STRUCTURE';
}

export function buildSystemMapProjection(
  flow: FlowProjection,
  graph: SemanticGraph,
): SystemMapProjection {
  const nodes = graph.nodes.map<SystemMapNode>((node) => {
    const classification = classifySystemConcern(node);
    return {
      ...node,
      concern: classification.concern,
      concernReason: classification.reason,
    };
  });
  const symbolNodes = nodes.filter((node) => SYMBOL_KINDS.has(node.kind));
  const concernCounts = createConcernCounts();
  for (const node of symbolNodes) {
    concernCounts[node.concern] += 1;
  }

  return {
    nodes,
    symbolNodes,
    edges: graph.edges.map((edge) => ({
      ...edge,
      semanticKind: systemEdgeKind(edge.kind),
    })),
    primaryEntryId:
      nodes.some((node) => node.id === flow.entryPointId)
        ? flow.entryPointId
        : (symbolNodes.find((node) => node.entryPoint)?.id ?? null),
    concernCounts,
    externalDependencies: groupExternalDependencies(flow),
  };
}

export function selectSystemMapNodes(
  projection: SystemMapProjection,
  mode: Exclude<SystemMapMode, 'data' | 'dependencies'>,
  perConcernLimit = 8,
): SystemMapNode[] {
  if (mode === 'tests') {
    const testIds = new Set(
      projection.symbolNodes
        .filter((node) => node.concern === 'test')
        .map((node) => node.id),
    );
    const relatedIds = new Set(testIds);
    for (const edge of projection.edges) {
      if (testIds.has(edge.sourceId)) {
        relatedIds.add(edge.targetId);
      }
      if (testIds.has(edge.targetId)) {
        relatedIds.add(edge.sourceId);
      }
    }
    return projection.symbolNodes
      .filter((node) => relatedIds.has(node.id))
      .sort((left, right) => rankNodes(left, right, projection.primaryEntryId))
      .slice(0, 40);
  }

  const concerns: SystemConcern[] = [
    'ui',
    'component',
    'application',
    'core',
    'infrastructure',
    ...(mode === 'system' ? (['test'] satisfies SystemConcern[]) : []),
  ];
  const selected: SystemMapNode[] = [];
  for (const concern of concerns) {
    selected.push(
      ...projection.symbolNodes
        .filter((node) => node.concern === concern)
        .sort((left, right) => rankNodes(left, right, projection.primaryEntryId))
        .slice(0, perConcernLimit),
    );
  }
  return selected;
}

export function selectSystemMapEdges(
  projection: SystemMapProjection,
  nodes: SystemMapNode[],
  mode: Exclude<SystemMapMode, 'data' | 'dependencies'>,
): SystemMapEdge[] {
  const ids = new Set(nodes.map((node) => node.id));
  return projection.edges.filter((edge) => {
    if (!ids.has(edge.sourceId) || !ids.has(edge.targetId)) {
      return false;
    }
    if (edge.semanticKind === 'STRUCTURE') {
      return false;
    }
    if (mode === 'runtime') {
      return edge.semanticKind !== 'DEPENDENCY';
    }
    if (mode === 'tests') {
      const source = nodes.find((node) => node.id === edge.sourceId);
      const target = nodes.find((node) => node.id === edge.targetId);
      return source?.concern === 'test' || target?.concern === 'test';
    }
    return true;
  });
}

function groupExternalDependencies(
  flow: FlowProjection,
): ExternalDependencyGroup[] {
  const topology = flow.topology;
  if (topology === undefined) {
    return [];
  }
  const packageById = new Map(
    topology.entities
      .filter((entity) => entity.kind === 'Package')
      .map((entity) => [entity.id, entity]),
  );
  const groups = new Map<string, Set<string>>();
  for (const dependency of topology.externalDependencies) {
    const current = groups.get(dependency.packageId) ?? new Set<string>();
    current.add(dependency.name);
    groups.set(dependency.packageId, current);
  }
  return Array.from(groups.entries())
    .map(([packageId, dependencies]) => {
      const packageEntity = packageById.get(packageId);
      return {
        packageId,
        packageName: packageEntity?.name ?? packageId,
        packagePath: packageEntity?.path ?? null,
        dependencies: Array.from(dependencies).sort((a, b) => a.localeCompare(b)),
      };
    })
    .sort((left, right) => left.packageName.localeCompare(right.packageName));
}

function createConcernCounts(): Record<SystemConcern, number> {
  return {
    ui: 0,
    component: 0,
    application: 0,
    core: 0,
    infrastructure: 0,
    test: 0,
  };
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/').toLowerCase();
}

function rankNodes(
  left: SystemMapNode,
  right: SystemMapNode,
  primaryEntryId: string | null,
): number {
  const leftPrimary = left.id === primaryEntryId ? 0 : left.entryPoint ? 1 : 2;
  const rightPrimary = right.id === primaryEntryId ? 0 : right.entryPoint ? 1 : 2;
  return (
    leftPrimary - rightPrimary ||
    (left.path ?? '').localeCompare(right.path ?? '') ||
    left.label.localeCompare(right.label)
  );
}
