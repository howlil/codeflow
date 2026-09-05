import type { PullRequestAnalysis, SemanticChangeKind } from './change-client';
import type {
  FlowEvidence,
  FlowProjection,
  RepositoryEntityKind,
  SourceLocation,
} from './flow-client';

export type GraphLevel = 'code' | 'structure' | 'packages';
export type GraphLens =
  'ALL' | 'CALLS' | 'REFERENCES' | 'DEPENDENCIES' | 'TYPES';

export type GraphNodeKind = RepositoryEntityKind | 'Package' | 'Workspace';

export interface SemanticGraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  path: string | null;
  location: SourceLocation | null;
  evidence: FlowEvidence[];
  entryPoint: boolean;
  changeKind?: SemanticChangeKind;
}

export interface SemanticGraphEdge {
  id: string;
  kind: string;
  sourceId: string;
  targetId: string;
  evidence: FlowEvidence[];
  changeKind?: 'added' | 'removed';
}

export interface SemanticGraph {
  nodes: SemanticGraphNode[];
  edges: SemanticGraphEdge[];
}

const CODE_KINDS = new Set<GraphNodeKind>([
  'Function',
  'Method',
  'Class',
  'Interface',
  'Type',
  'Enum',
  'Variable',
]);
const STRUCTURE_KINDS = new Set<GraphNodeKind>([
  'Repository',
  'Module',
  'File',
]);
const PACKAGE_KINDS = new Set<GraphNodeKind>(['Workspace', 'Package']);

const DEPENDENCY_EDGE_KINDS = new Set([
  'IMPORTS',
  'DEPENDS_ON',
  'CONTAINS',
  'DEFINES',
  'EXPORTS',
]);
const TYPE_EDGE_KINDS = new Set(['EXTENDS', 'IMPLEMENTS']);

export function graphLevelForKind(kind: GraphNodeKind): GraphLevel {
  if (PACKAGE_KINDS.has(kind)) {
    return 'packages';
  }
  if (STRUCTURE_KINDS.has(kind)) {
    return 'structure';
  }
  return 'code';
}

export function graphNodeBelongsToLevel(
  node: SemanticGraphNode,
  level: GraphLevel,
): boolean {
  if (level === 'code') {
    return CODE_KINDS.has(node.kind);
  }
  if (level === 'structure') {
    return STRUCTURE_KINDS.has(node.kind);
  }
  return PACKAGE_KINDS.has(node.kind);
}

export function graphEdgeMatchesLens(
  edge: SemanticGraphEdge,
  lens: GraphLens,
): boolean {
  if (lens === 'ALL') {
    return true;
  }
  if (lens === 'CALLS') {
    return edge.kind === 'CALLS';
  }
  if (lens === 'REFERENCES') {
    return edge.kind === 'REFERENCES';
  }
  if (lens === 'DEPENDENCIES') {
    return DEPENDENCY_EDGE_KINDS.has(edge.kind);
  }
  return TYPE_EDGE_KINDS.has(edge.kind);
}

export function availableGraphLenses(graph: SemanticGraph): GraphLens[] {
  const lenses: GraphLens[] = ['ALL'];
  if (graph.edges.some((edge) => edge.kind === 'CALLS')) {
    lenses.push('CALLS');
  }
  if (graph.edges.some((edge) => edge.kind === 'REFERENCES')) {
    lenses.push('REFERENCES');
  }
  if (graph.edges.some((edge) => DEPENDENCY_EDGE_KINDS.has(edge.kind))) {
    lenses.push('DEPENDENCIES');
  }
  if (graph.edges.some((edge) => TYPE_EDGE_KINDS.has(edge.kind))) {
    lenses.push('TYPES');
  }
  return lenses;
}

export function buildSemanticGraph(
  flow: FlowProjection,
  changeAnalysis: PullRequestAnalysis | null = null,
): SemanticGraph {
  const nodes = new Map<string, SemanticGraphNode>();
  const edges = new Map<string, SemanticGraphEdge>();
  const entryPointIds = new Set([
    flow.entryPointId,
    ...(flow.entryPoints ?? []).map((entry) => entry.id),
  ]);

  for (const entity of flow.architecture?.entities ?? []) {
    nodes.set(entity.id, {
      id: entity.id,
      kind: entity.kind,
      label: entity.name,
      path: entity.path,
      location: entity.location,
      evidence: entity.evidence,
      entryPoint: entryPointIds.has(entity.id),
    });
  }

  for (const node of flow.nodes) {
    const existing = nodes.get(node.id);
    nodes.set(node.id, {
      id: node.id,
      kind: 'Function',
      label: node.label,
      path: node.location.filePath,
      location: node.location,
      evidence: existing?.evidence ?? [],
      entryPoint: node.entryPoint || entryPointIds.has(node.id),
      ...(existing?.changeKind === undefined
        ? {}
        : { changeKind: existing.changeKind }),
    });
  }

  for (const entity of flow.topology?.entities ?? []) {
    nodes.set(entity.id, {
      id: entity.id,
      kind: entity.kind,
      label: entity.name,
      path: entity.path,
      location: entity.location,
      evidence: entity.evidence,
      entryPoint: false,
    });
  }

  for (const edge of flow.edges) {
    edges.set(edge.id, {
      id: edge.id,
      kind: edge.kind,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      evidence: edge.evidence,
    });
  }

  for (const edge of flow.architecture?.relationships ?? []) {
    edges.set(edge.id, {
      id: edge.id,
      kind: edge.kind,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      evidence: edge.evidence,
    });
  }

  for (const edge of flow.topology?.relationships ?? []) {
    edges.set(edge.id, {
      id: edge.id,
      kind: edge.kind,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      evidence: edge.evidence,
    });
  }

  if (changeAnalysis !== null) {
    applyChangeOverlay(nodes, edges, changeAnalysis);
  }

  return {
    nodes: Array.from(nodes.values()).sort(compareGraphNodes),
    edges: Array.from(edges.values()).sort(compareGraphEdges),
  };
}

function applyChangeOverlay(
  nodes: Map<string, SemanticGraphNode>,
  edges: Map<string, SemanticGraphEdge>,
  analysis: PullRequestAnalysis,
) {
  const baseEntities = new Map(
    (analysis.base.architecture?.entities ?? []).map((entity) => [
      entity.id,
      entity,
    ]),
  );
  const baseFunctions = new Map(
    analysis.base.nodes.map((node) => [node.id, node]),
  );

  for (const change of analysis.change.entities) {
    if (change.headEntityId !== null) {
      const node = nodes.get(change.headEntityId);
      if (node !== undefined) {
        node.changeKind = change.changeKind;
      }
    }

    if (change.changeKind !== 'removed' || change.baseEntityId === null) {
      continue;
    }

    const architectureEntity = baseEntities.get(change.baseEntityId);
    const functionNode = baseFunctions.get(change.baseEntityId);
    if (architectureEntity !== undefined) {
      nodes.set(change.baseEntityId, {
        id: architectureEntity.id,
        kind: architectureEntity.kind,
        label: architectureEntity.name,
        path: architectureEntity.path,
        location: architectureEntity.location,
        evidence: architectureEntity.evidence,
        entryPoint: architectureEntity.id === analysis.base.entryPointId,
        changeKind: 'removed',
      });
    } else if (functionNode !== undefined) {
      nodes.set(change.baseEntityId, {
        id: functionNode.id,
        kind: 'Function',
        label: functionNode.label,
        path: functionNode.location.filePath,
        location: functionNode.location,
        evidence: [],
        entryPoint: functionNode.entryPoint,
        changeKind: 'removed',
      });
    } else {
      nodes.set(change.baseEntityId, {
        id: change.baseEntityId,
        kind: change.entityKind,
        label: change.name,
        path: change.path,
        location: change.baseLocation,
        evidence: [],
        entryPoint: false,
        changeKind: 'removed',
      });
    }
  }

  for (const delta of analysis.change.relationshipDeltas) {
    const sourceId = resolveChangeEndpoint(
      nodes,
      delta.source.name,
      delta.source.path,
    );
    const targetId = resolveChangeEndpoint(
      nodes,
      delta.target.name,
      delta.target.path,
    );
    if (sourceId === null || targetId === null) {
      continue;
    }
    edges.set(`change:${delta.id}`, {
      id: `change:${delta.id}`,
      kind: delta.relationshipKind,
      sourceId,
      targetId,
      evidence: [],
      changeKind: delta.changeKind,
    });
  }
}

function resolveChangeEndpoint(
  nodes: Map<string, SemanticGraphNode>,
  name: string,
  path: string | null,
): string | null {
  const exact = Array.from(nodes.values()).find(
    (node) => node.label === name && (path === null || node.path === path),
  );
  if (exact !== undefined) {
    return exact.id;
  }
  const byName = Array.from(nodes.values()).find((node) => node.label === name);
  return byName?.id ?? null;
}

function compareGraphNodes(
  left: SemanticGraphNode,
  right: SemanticGraphNode,
): number {
  return (
    graphLevelForKind(left.kind).localeCompare(graphLevelForKind(right.kind)) ||
    left.path?.localeCompare(right.path ?? '') ||
    left.label.localeCompare(right.label) ||
    left.id.localeCompare(right.id)
  );
}

function compareGraphEdges(
  left: SemanticGraphEdge,
  right: SemanticGraphEdge,
): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.targetId.localeCompare(right.targetId) ||
    left.id.localeCompare(right.id)
  );
}
