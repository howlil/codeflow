import type {
  AnalysisIssue,
  Evidence,
  FlowProjection,
  PackageTopologyEntity,
  RepositoryEntity,
  RepositoryEntityKind,
} from './model.js';

export type ImpactEntityKind =
  | Exclude<RepositoryEntityKind, 'Repository'>
  | 'Package';

export type ImpactRelationshipKind =
  | 'CALLS'
  | 'REFERENCES'
  | 'IMPORTS'
  | 'DEPENDS_ON'
  | 'EXTENDS'
  | 'IMPLEMENTS';

export interface ImpactSeed {
  entityId: string;
  entityKind: ImpactEntityKind;
  name: string;
  path: string | null;
}

export interface ImpactPathStep {
  sourceId: string;
  targetId: string;
  kind: ImpactRelationshipKind;
  evidence: Evidence[];
}

export interface ImpactPath {
  seedId: string;
  steps: ImpactPathStep[];
}

export interface ImpactResult {
  entityId: string;
  entityKind: ImpactEntityKind;
  name: string;
  path: string | null;
  distance: number;
  seedIds: string[];
  paths: ImpactPath[];
  evidence: Evidence[];
}

export interface ImpactSummary {
  directCount: number;
  transitiveCount: number;
  byKind: Partial<Record<ImpactEntityKind, number>>;
  affectedPackageIds: string[];
  affectedModuleIds: string[];
  affectedFileIds: string[];
}

export interface ImpactProjection {
  seeds: ImpactSeed[];
  results: ImpactResult[];
  summary: ImpactSummary;
  maxDepth: number;
  status: 'complete' | 'partial';
  issues: AnalysisIssue[];
}

const DEFAULT_MAX_DEPTH = 3;
const MAX_DEPTH = 4;
const MAX_SEEDS = 8;
const MAX_RESULTS = 256;
const MAX_PATHS_PER_RESULT = 3;
const IMPACT_RELATIONSHIPS = new Set<ImpactRelationshipKind>([
  'CALLS',
  'REFERENCES',
  'IMPORTS',
  'DEPENDS_ON',
  'EXTENDS',
  'IMPLEMENTS',
]);

interface ImpactEntityRecord {
  id: string;
  kind: ImpactEntityKind;
  name: string;
  path: string | null;
}

interface TraversableRelationship extends ImpactPathStep {
  id: string;
}

interface QueueItem {
  currentId: string;
  seedId: string;
  distance: number;
  steps: ImpactPathStep[];
}

export function buildImpactProjection(
  flow: FlowProjection,
  seedIds: string[],
  requestedMaxDepth = DEFAULT_MAX_DEPTH,
): ImpactProjection {
  const maxDepth = Math.max(1, Math.min(MAX_DEPTH, requestedMaxDepth));
  const entityById = collectEntities(flow);
  const issues: AnalysisIssue[] = [];
  const uniqueSeedIds = [...new Set(seedIds)].slice(0, MAX_SEEDS);

  if (seedIds.length > MAX_SEEDS) {
    issues.push({
      kind: 'limit',
      message: `Impact scope is bounded to ${MAX_SEEDS} entities.`,
    });
  }

  const seeds = uniqueSeedIds.flatMap((entityId) => {
    const entity = entityById.get(entityId);
    if (entity === undefined) {
      issues.push({
        kind: 'invalid',
        message: `Impact seed ${entityId} is not present in the analyzed semantic model.`,
      });
      return [];
    }

    return [
      {
        entityId: entity.id,
        entityKind: entity.kind,
        name: entity.name,
        path: entity.path,
      },
    ];
  });

  const seedSet = new Set(seeds.map((seed) => seed.entityId));
  const incoming = indexIncomingRelationships(flow);
  const resultById = new Map<string, ImpactResult>();
  const queue: QueueItem[] = seeds.map((seed) => ({
    currentId: seed.entityId,
    seedId: seed.entityId,
    distance: 0,
    steps: [],
  }));
  const bestDistance = new Map<string, number>(
    seeds.map((seed) => [`${seed.entityId}:${seed.entityId}`, 0]),
  );
  let truncated = false;

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor]!;
    if (current.distance >= maxDepth) {
      continue;
    }

    for (const relationship of incoming.get(current.currentId) ?? []) {
      const entity = entityById.get(relationship.sourceId);
      if (entity === undefined || seedSet.has(entity.id)) {
        continue;
      }

      const distance = current.distance + 1;
      const steps = [relationshipStep(relationship), ...current.steps];
      const path: ImpactPath = { seedId: current.seedId, steps };
      const existing = resultById.get(entity.id);

      if (existing === undefined) {
        if (resultById.size >= MAX_RESULTS) {
          truncated = true;
          continue;
        }

        resultById.set(entity.id, {
          entityId: entity.id,
          entityKind: entity.kind,
          name: entity.name,
          path: entity.path,
          distance,
          seedIds: [current.seedId],
          paths: [path],
          evidence: collectPathEvidence(path),
        });
      } else {
        existing.distance = Math.min(existing.distance, distance);
        if (!existing.seedIds.includes(current.seedId)) {
          existing.seedIds.push(current.seedId);
          existing.seedIds.sort();
        }

        const pathKey = impactPathKey(path);
        if (
          existing.paths.length < MAX_PATHS_PER_RESULT &&
          !existing.paths.some(
            (candidate) => impactPathKey(candidate) === pathKey,
          )
        ) {
          existing.paths.push(path);
          existing.paths.sort(comparePaths);
          existing.evidence = collectResultEvidence(existing.paths);
        }
      }

      const visitKey = `${current.seedId}:${entity.id}`;
      const previousDistance = bestDistance.get(visitKey);
      if (previousDistance === undefined || distance < previousDistance) {
        bestDistance.set(visitKey, distance);
        queue.push({
          currentId: entity.id,
          seedId: current.seedId,
          distance,
          steps,
        });
      }
    }
  }

  if (truncated) {
    issues.push({
      kind: 'limit',
      message: `Impact projection is bounded to ${MAX_RESULTS} affected entities.`,
    });
  }

  const results = [...resultById.values()].sort(compareResults);
  const summary = summarizeImpact(flow, results, entityById);
  const inheritedIssues = [
    ...(flow.analysis.status === 'partial' ? flow.analysis.issues : []),
    ...(flow.topology?.status === 'partial' ? flow.topology.issues : []),
  ];
  const allIssues = dedupeIssues([...issues, ...inheritedIssues]);

  return {
    seeds,
    results,
    summary,
    maxDepth,
    status:
      flow.analysis.status === 'partial' ||
      flow.topology?.status === 'partial' ||
      allIssues.length > 0
        ? 'partial'
        : 'complete',
    issues: allIssues,
  };
}

function collectEntities(
  flow: FlowProjection,
): Map<string, ImpactEntityRecord> {
  const entities = new Map<string, ImpactEntityRecord>();

  for (const entity of flow.topology?.entities ?? []) {
    if (entity.kind !== 'Package') {
      continue;
    }
    entities.set(entity.id, {
      id: entity.id,
      kind: 'Package',
      name: entity.name,
      path: entity.path,
    });
  }

  for (const entity of flow.architecture?.entities ?? []) {
    if (entity.kind === 'Repository') {
      continue;
    }
    entities.set(entity.id, {
      id: entity.id,
      kind: entity.kind,
      name: entity.name,
      path: entity.path,
    });
  }

  for (const node of flow.nodes) {
    if (!entities.has(node.id)) {
      entities.set(node.id, {
        id: node.id,
        kind: 'Function',
        name: node.label,
        path: node.location.filePath,
      });
    }
  }

  return entities;
}

function indexIncomingRelationships(
  flow: FlowProjection,
): Map<string, TraversableRelationship[]> {
  const relationships = new Map<string, TraversableRelationship>();

  for (const edge of flow.edges) {
    addRelationship(relationships, {
      id: edge.id,
      kind: 'CALLS',
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      evidence: edge.evidence,
    });
  }

  for (const relationship of flow.architecture?.relationships ?? []) {
    if (
      !IMPACT_RELATIONSHIPS.has(
        relationship.kind as ImpactRelationshipKind,
      )
    ) {
      continue;
    }
    addRelationship(relationships, {
      id: relationship.id,
      kind: relationship.kind as ImpactRelationshipKind,
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      evidence: relationship.evidence,
    });
  }

  for (const relationship of flow.topology?.relationships ?? []) {
    if (relationship.kind !== 'DEPENDS_ON') {
      continue;
    }
    addRelationship(relationships, {
      id: relationship.id,
      kind: 'DEPENDS_ON',
      sourceId: relationship.sourceId,
      targetId: relationship.targetId,
      evidence: relationship.evidence,
    });
  }

  const incoming = new Map<string, TraversableRelationship[]>();
  for (const relationship of relationships.values()) {
    const values = incoming.get(relationship.targetId) ?? [];
    values.push(relationship);
    incoming.set(relationship.targetId, values);
  }

  for (const values of incoming.values()) {
    values.sort(compareRelationships);
  }

  return incoming;
}

function addRelationship(
  relationships: Map<string, TraversableRelationship>,
  relationship: TraversableRelationship,
): void {
  const key = `${relationship.kind}:${relationship.sourceId}:${relationship.targetId}`;
  const existing = relationships.get(key);

  if (existing === undefined) {
    relationships.set(key, relationship);
    return;
  }

  existing.evidence = dedupeEvidence([
    ...existing.evidence,
    ...relationship.evidence,
  ]);
}

function relationshipStep(
  relationship: TraversableRelationship,
): ImpactPathStep {
  return {
    sourceId: relationship.sourceId,
    targetId: relationship.targetId,
    kind: relationship.kind,
    evidence: relationship.evidence,
  };
}

function summarizeImpact(
  flow: FlowProjection,
  results: ImpactResult[],
  entityById: Map<string, ImpactEntityRecord>,
): ImpactSummary {
  const byKind: ImpactSummary['byKind'] = {};
  const affectedPackageIds = new Set<string>();
  const affectedModuleIds = new Set<string>();
  const affectedFileIds = new Set<string>();
  const architectureEntities = flow.architecture?.entities ?? [];
  const fileByPath = new Map(
    architectureEntities
      .filter((entity) => entity.kind === 'File')
      .map((entity) => [entity.path, entity]),
  );
  const modules = architectureEntities.filter(
    (entity): entity is RepositoryEntity => entity.kind === 'Module',
  );
  const packages = (flow.topology?.entities ?? []).filter(
    (entity) => entity.kind === 'Package',
  );

  for (const result of results) {
    byKind[result.entityKind] = (byKind[result.entityKind] ?? 0) + 1;

    if (result.entityKind === 'Package') {
      affectedPackageIds.add(result.entityId);
    }
    if (result.entityKind === 'Module') {
      affectedModuleIds.add(result.entityId);
    }
    if (result.entityKind === 'File') {
      affectedFileIds.add(result.entityId);
    }
    if (result.path === null) {
      continue;
    }

    const file = fileByPath.get(result.path);
    if (file !== undefined) {
      affectedFileIds.add(file.id);
    }

    const module = deepestContainingModule(modules, result.path);
    if (module !== undefined) {
      affectedModuleIds.add(module.id);
    }

    const ownerId = flow.topology?.fileOwners[result.path];
    if (ownerId !== undefined) {
      affectedPackageIds.add(ownerId);
    } else {
      const owner = deepestContainingPackage(packages, result.path);
      if (owner !== undefined && entityById.has(owner.id)) {
        affectedPackageIds.add(owner.id);
      }
    }
  }

  return {
    directCount: results.filter((result) => result.distance === 1).length,
    transitiveCount: results.filter((result) => result.distance > 1).length,
    byKind,
    affectedPackageIds: [...affectedPackageIds].sort(),
    affectedModuleIds: [...affectedModuleIds].sort(),
    affectedFileIds: [...affectedFileIds].sort(),
  };
}

function deepestContainingModule(
  modules: RepositoryEntity[],
  path: string,
): RepositoryEntity | undefined {
  return modules
    .filter(
      (module) =>
        path === module.path || path.startsWith(`${module.path}/`),
    )
    .sort((left, right) => right.path.length - left.path.length)[0];
}

function deepestContainingPackage(
  packages: PackageTopologyEntity[],
  path: string,
): PackageTopologyEntity | undefined {
  return packages
    .filter(
      (entity) =>
        entity.kind === 'Package' &&
        (path === entity.path || path.startsWith(`${entity.path}/`)),
    )
    .sort((left, right) => right.path.length - left.path.length)[0];
}

function collectResultEvidence(paths: ImpactPath[]): Evidence[] {
  return dedupeEvidence(paths.flatMap(collectPathEvidence));
}

function collectPathEvidence(path: ImpactPath): Evidence[] {
  return dedupeEvidence(path.steps.flatMap((step) => step.evidence));
}

function dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    const key = `${item.kind}:${item.location.filePath}:${item.location.startLine}:${item.location.startColumn}:${item.reason}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function dedupeIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.kind}:${issue.filePath ?? ''}:${issue.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function impactPathKey(path: ImpactPath): string {
  return `${path.seedId}:${path.steps
    .map((step) => `${step.kind}:${step.sourceId}:${step.targetId}`)
    .join('|')}`;
}

function comparePaths(left: ImpactPath, right: ImpactPath): number {
  return (
    left.steps.length - right.steps.length ||
    impactPathKey(left).localeCompare(impactPathKey(right))
  );
}

function compareRelationships(
  left: TraversableRelationship,
  right: TraversableRelationship,
): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.targetId.localeCompare(right.targetId)
  );
}

function compareResults(left: ImpactResult, right: ImpactResult): number {
  return (
    left.distance - right.distance ||
    impactKindRank(left.entityKind) - impactKindRank(right.entityKind) ||
    left.name.localeCompare(right.name) ||
    left.entityId.localeCompare(right.entityId)
  );
}

function impactKindRank(kind: ImpactEntityKind): number {
  const ranks: Record<ImpactEntityKind, number> = {
    Package: 0,
    Module: 1,
    File: 2,
    Class: 3,
    Interface: 4,
    Type: 5,
    Enum: 6,
    Function: 7,
    Method: 8,
    Variable: 9,
  };
  return ranks[kind];
}
