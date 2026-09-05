import type {
  AnalysisIssue,
  FlowProjection,
  RepositoryEntity,
  RepositoryEntityKind,
  SourceLocation,
} from './model.js';
import {
  buildFunctionBehaviorDeltas,
  type FunctionBehaviorDelta,
} from './behavior-delta.js';
import {
  buildImpactProjection,
  type ImpactProjection,
  type ImpactRelationshipKind,
} from './impact-analysis.js';

export type RepositoryFileChangeKind =
  | 'added'
  | 'modified'
  | 'removed'
  | 'renamed'
  | 'copied'
  | 'changed'
  | 'unknown';

export type SemanticChangeKind = 'added' | 'modified' | 'removed';

export interface RepositoryChangeFileInput {
  path: string;
  previousPath?: string;
  status: RepositoryFileChangeKind;
  additions: number;
  deletions: number;
  patch?: string | null;
}

export interface RepositoryChangeSource {
  provider: 'github';
  repository: string;
  pullRequestNumber: number;
  title: string;
  url: string;
  baseRevision: string;
  headRevision: string;
}

export interface ChangeHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
}

export interface RepositoryChangedFile {
  path: string;
  previousPath: string | null;
  status: RepositoryFileChangeKind;
  additions: number;
  deletions: number;
  patch: string | null;
  hunks: ChangeHunk[];
  supported: boolean;
  semanticChangeIds: string[];
}

export interface SemanticChangeEntity {
  id: string;
  changeKind: SemanticChangeKind;
  entityKind: Exclude<RepositoryEntityKind, 'Repository'>;
  name: string;
  path: string;
  baseEntityId: string | null;
  headEntityId: string | null;
  baseLocation: SourceLocation | null;
  headLocation: SourceLocation | null;
}

export interface RelationshipDeltaEndpoint {
  kind: string;
  name: string;
  path: string | null;
}

export interface RelationshipDelta {
  id: string;
  changeKind: 'added' | 'removed';
  relationshipKind: ImpactRelationshipKind;
  source: RelationshipDeltaEndpoint;
  target: RelationshipDeltaEndpoint;
}

export interface RepositoryChangeProjection {
  source: RepositoryChangeSource;
  files: RepositoryChangedFile[];
  entities: SemanticChangeEntity[];
  behaviorDeltas: FunctionBehaviorDelta[];
  relationshipDeltas: RelationshipDelta[];
  impact: {
    base: ImpactProjection | null;
    head: ImpactProjection | null;
  };
  coverage: {
    status: 'complete' | 'partial';
    issues: AnalysisIssue[];
  };
}

const MAX_AUTOMATIC_IMPACT_SEEDS = 8;
const DEFAULT_IMPACT_DEPTH = 3;
const SUPPORTED_RELATIONSHIPS = new Set<ImpactRelationshipKind>([
  'CALLS',
  'REFERENCES',
  'IMPORTS',
  'DEPENDS_ON',
  'EXTENDS',
  'IMPLEMENTS',
]);

interface EntityRecord {
  id: string;
  kind: string;
  name: string;
  path: string | null;
}

interface RelationshipRecord {
  key: string;
  kind: ImpactRelationshipKind;
  source: RelationshipDeltaEndpoint;
  target: RelationshipDeltaEndpoint;
}

export function buildRepositoryChangeProjection(input: {
  source: RepositoryChangeSource;
  base: FlowProjection;
  head: FlowProjection;
  files: RepositoryChangeFileInput[];
  maxImpactDepth?: number;
}): RepositoryChangeProjection {
  const issues: AnalysisIssue[] = [];
  const files = input.files
    .map((file) => projectChangedFile(file, issues))
    .sort((left, right) => left.path.localeCompare(right.path));
  const entities = mapSemanticChanges(input.base, input.head, files, issues);

  const impactCandidates = entities.slice(0, MAX_AUTOMATIC_IMPACT_SEEDS);
  if (entities.length > MAX_AUTOMATIC_IMPACT_SEEDS) {
    issues.push({
      kind: 'limit',
      message: `Automatic impact scope is bounded to ${MAX_AUTOMATIC_IMPACT_SEEDS} changed semantic entities; ${entities.length - MAX_AUTOMATIC_IMPACT_SEEDS} additional change target(s) remain visible but were not traversed.`,
    });
  }

  const baseSeedIds = impactCandidates.flatMap((entity) =>
    entity.changeKind !== 'added' && entity.baseEntityId !== null
      ? [entity.baseEntityId]
      : [],
  );
  const headSeedIds = impactCandidates.flatMap((entity) =>
    entity.changeKind !== 'removed' && entity.headEntityId !== null
      ? [entity.headEntityId]
      : [],
  );
  const maxImpactDepth = input.maxImpactDepth ?? DEFAULT_IMPACT_DEPTH;
  const baseImpact =
    baseSeedIds.length === 0
      ? null
      : buildImpactProjection(input.base, baseSeedIds, maxImpactDepth);
  const headImpact =
    headSeedIds.length === 0
      ? null
      : buildImpactProjection(input.head, headSeedIds, maxImpactDepth);

  if (input.base.analysis.status === 'partial') {
    issues.push(
      ...input.base.analysis.issues.map((issue) => ({
        ...issue,
        message: `Base revision: ${issue.message}`,
      })),
    );
  }
  if (input.head.analysis.status === 'partial') {
    issues.push(
      ...input.head.analysis.issues.map((issue) => ({
        ...issue,
        message: `Head revision: ${issue.message}`,
      })),
    );
  }
  for (const issue of baseImpact?.issues ?? []) {
    issues.push({ ...issue, message: `Base impact: ${issue.message}` });
  }
  for (const issue of headImpact?.issues ?? []) {
    issues.push({ ...issue, message: `Head impact: ${issue.message}` });
  }

  const result: RepositoryChangeProjection = {
    source: input.source,
    files,
    entities,
    behaviorDeltas: buildFunctionBehaviorDeltas(
      input.base,
      input.head,
      entities,
    ),
    relationshipDeltas: buildRelationshipDeltas(input.base, input.head),
    impact: {
      base: baseImpact,
      head: headImpact,
    },
    coverage: {
      status: issues.length === 0 ? 'complete' : 'partial',
      issues: dedupeIssues(issues),
    },
  };

  for (const file of result.files) {
    file.semanticChangeIds = entities
      .filter(
        (entity) =>
          entity.path === file.path ||
          (file.previousPath !== null && entity.path === file.previousPath),
      )
      .map((entity) => entity.id);
  }

  return result;
}

export function parseUnifiedPatchHunks(patch: string): ChangeHunk[] {
  const hunks: ChangeHunk[] = [];
  const matcher = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/gm;
  for (const match of patch.matchAll(matcher)) {
    hunks.push({
      header: match[0],
      oldStart: Number(match[1]),
      oldLines: match[2] === undefined ? 1 : Number(match[2]),
      newStart: Number(match[3]),
      newLines: match[4] === undefined ? 1 : Number(match[4]),
    });
  }
  return hunks;
}

function projectChangedFile(
  input: RepositoryChangeFileInput,
  issues: AnalysisIssue[],
): RepositoryChangedFile {
  const supported =
    isSupportedTypeScriptPath(input.path) ||
    (input.previousPath !== undefined &&
      isSupportedTypeScriptPath(input.previousPath));
  const patch = input.patch ?? null;
  const hunks = patch === null ? [] : parseUnifiedPatchHunks(patch);

  if (!supported) {
    issues.push({
      kind: 'unsupported',
      filePath: input.path,
      message:
        'This changed file is visible in the pull request, but semantic change mapping currently supports TypeScript/TSX source only.',
    });
  } else if (patch === null) {
    issues.push({
      kind: 'unsupported',
      filePath: input.path,
      message:
        'GitHub did not provide a patch for this changed file; file-level change is known but changed-line semantic mapping is unavailable.',
    });
  } else if (hunks.length === 0) {
    issues.push({
      kind: 'invalid',
      filePath: input.path,
      message:
        'The GitHub patch did not contain a supported unified-diff hunk header.',
    });
  }

  return {
    path: input.path,
    previousPath: input.previousPath ?? null,
    status: input.status,
    additions: input.additions,
    deletions: input.deletions,
    patch,
    hunks,
    supported,
    semanticChangeIds: [],
  };
}

function mapSemanticChanges(
  base: FlowProjection,
  head: FlowProjection,
  files: RepositoryChangedFile[],
  issues: AnalysisIssue[],
): SemanticChangeEntity[] {
  const changes = new Map<string, SemanticChangeEntity>();
  const baseEntities = repositoryEntities(base);
  const headEntities = repositoryEntities(head);
  const baseByKey = new Map(
    baseEntities.map((entity) => [entityStableKey(entity), entity]),
  );
  const headByKey = new Map(
    headEntities.map((entity) => [entityStableKey(entity), entity]),
  );

  for (const file of files) {
    if (!file.supported) {
      continue;
    }

    const basePath = file.previousPath ?? file.path;
    const baseCandidates = matchingEntities(
      baseEntities,
      basePath,
      file.hunks,
      'base',
    );
    const headCandidates = matchingEntities(
      headEntities,
      file.path,
      file.hunks,
      'head',
    );
    const candidateKeys = new Set([
      ...baseCandidates.map(entityStableKey),
      ...headCandidates.map(entityStableKey),
    ]);

    if (candidateKeys.size === 0) {
      const baseFile = baseEntities.find(
        (entity) => entity.kind === 'File' && entity.path === basePath,
      );
      const headFile = headEntities.find(
        (entity) => entity.kind === 'File' && entity.path === file.path,
      );
      if (baseFile !== undefined) candidateKeys.add(entityStableKey(baseFile));
      if (headFile !== undefined) candidateKeys.add(entityStableKey(headFile));
    }

    if (candidateKeys.size === 0) {
      issues.push({
        kind: 'unsupported',
        filePath: file.path,
        message:
          'The changed TypeScript file is known, but no analyzed semantic entity could be mapped inside the current bounded source projection.',
      });
      continue;
    }

    for (const key of candidateKeys) {
      const baseEntity =
        baseByKey.get(key) ?? findEquivalentEntity(baseEntities, key, basePath);
      const headEntity =
        headByKey.get(key) ??
        findEquivalentEntity(headEntities, key, file.path);

      let changeKind: SemanticChangeKind;
      if (
        file.status === 'added' ||
        (baseEntity === undefined && headEntity !== undefined)
      ) {
        changeKind = 'added';
      } else if (
        file.status === 'removed' ||
        (baseEntity !== undefined && headEntity === undefined)
      ) {
        changeKind = 'removed';
      } else if (file.status === 'renamed' && file.previousPath !== null) {
        if (headEntity === undefined) {
          changeKind = 'removed';
        } else if (baseEntity === undefined) {
          changeKind = 'added';
        } else {
          changeKind = 'modified';
        }
      } else {
        changeKind = 'modified';
      }

      const entity = headEntity ?? baseEntity;
      if (entity === undefined || entity.kind === 'Repository') {
        continue;
      }
      const id = changeEntityId(changeKind, entity, baseEntity, headEntity);
      changes.set(id, {
        id,
        changeKind,
        entityKind: entity.kind,
        name: entity.name,
        path: headEntity?.path ?? baseEntity?.path ?? file.path,
        baseEntityId: baseEntity?.id ?? null,
        headEntityId: headEntity?.id ?? null,
        baseLocation: baseEntity?.location ?? null,
        headLocation: headEntity?.location ?? null,
      });
    }
  }

  return [...changes.values()].sort(
    (left, right) =>
      changeKindRank(left.changeKind) - changeKindRank(right.changeKind) ||
      left.path.localeCompare(right.path) ||
      entityKindRank(left.entityKind) - entityKindRank(right.entityKind) ||
      left.name.localeCompare(right.name),
  );
}

function repositoryEntities(flow: FlowProjection): RepositoryEntity[] {
  return (flow.architecture?.entities ?? []).filter(
    (entity) => entity.kind !== 'Repository' && entity.kind !== 'Module',
  );
}

function matchingEntities(
  entities: RepositoryEntity[],
  path: string,
  hunks: ChangeHunk[],
  snapshot: 'base' | 'head',
): RepositoryEntity[] {
  const inFile = entities.filter(
    (entity) => entity.path === path && entity.kind !== 'File',
  );
  if (hunks.length === 0) {
    return [];
  }
  return inFile.filter((entity) => {
    const location = entity.location;
    if (location === null) return false;
    return hunks.some((hunk) => {
      const start = snapshot === 'base' ? hunk.oldStart : hunk.newStart;
      const lines = snapshot === 'base' ? hunk.oldLines : hunk.newLines;
      return overlaps(location, start, lines);
    });
  });
}

function overlaps(
  location: SourceLocation,
  start: number,
  lines: number,
): boolean {
  if (lines <= 0) return false;
  const end = start + lines - 1;
  return location.startLine <= end && location.endLine >= start;
}

function entityStableKey(entity: RepositoryEntity): string {
  return `${entity.kind}|${entity.path}|${entity.name}`;
}

function findEquivalentEntity(
  entities: RepositoryEntity[],
  key: string,
  path: string,
): RepositoryEntity | undefined {
  const [kind, , name] = key.split('|');
  return entities.find(
    (entity) =>
      entity.kind === kind && entity.path === path && entity.name === name,
  );
}

function changeEntityId(
  changeKind: SemanticChangeKind,
  entity: RepositoryEntity,
  baseEntity: RepositoryEntity | undefined,
  headEntity: RepositoryEntity | undefined,
): string {
  const stable = `${entity.kind}:${headEntity?.path ?? baseEntity?.path ?? entity.path}:${entity.name}`;
  return `change:${changeKind}:${stable}`;
}

function buildRelationshipDeltas(
  base: FlowProjection,
  head: FlowProjection,
): RelationshipDelta[] {
  const baseRelationships = relationshipRecords(base);
  const headRelationships = relationshipRecords(head);
  const deltas: RelationshipDelta[] = [];

  for (const [key, relationship] of baseRelationships) {
    if (!headRelationships.has(key)) {
      deltas.push({
        id: `relationship-delta:removed:${key}`,
        changeKind: 'removed',
        relationshipKind: relationship.kind,
        source: relationship.source,
        target: relationship.target,
      });
    }
  }
  for (const [key, relationship] of headRelationships) {
    if (!baseRelationships.has(key)) {
      deltas.push({
        id: `relationship-delta:added:${key}`,
        changeKind: 'added',
        relationshipKind: relationship.kind,
        source: relationship.source,
        target: relationship.target,
      });
    }
  }

  return deltas.sort(
    (left, right) =>
      relationshipDeltaRank(left.changeKind) -
        relationshipDeltaRank(right.changeKind) ||
      left.relationshipKind.localeCompare(right.relationshipKind) ||
      left.source.name.localeCompare(right.source.name) ||
      left.target.name.localeCompare(right.target.name),
  );
}

function relationshipRecords(
  flow: FlowProjection,
): Map<string, RelationshipRecord> {
  const entityById = collectRelationshipEntities(flow);
  const records = new Map<string, RelationshipRecord>();

  const add = (kind: string, sourceId: string, targetId: string): void => {
    if (!SUPPORTED_RELATIONSHIPS.has(kind as ImpactRelationshipKind)) return;
    const source = entityById.get(sourceId);
    const target = entityById.get(targetId);
    if (source === undefined || target === undefined) return;
    const relationshipKind = kind as ImpactRelationshipKind;
    const key = `${relationshipKind}|${entityRecordKey(source)}|${entityRecordKey(target)}`;
    records.set(key, {
      key,
      kind: relationshipKind,
      source: endpoint(source),
      target: endpoint(target),
    });
  };

  for (const edge of flow.edges) {
    add(edge.kind, edge.sourceId, edge.targetId);
  }
  for (const relationship of flow.architecture?.relationships ?? []) {
    add(relationship.kind, relationship.sourceId, relationship.targetId);
  }
  for (const relationship of flow.topology?.relationships ?? []) {
    add(relationship.kind, relationship.sourceId, relationship.targetId);
  }
  return records;
}

function collectRelationshipEntities(
  flow: FlowProjection,
): Map<string, EntityRecord> {
  const entities = new Map<string, EntityRecord>();
  for (const entity of flow.architecture?.entities ?? []) {
    entities.set(entity.id, {
      id: entity.id,
      kind: entity.kind,
      name: entity.name,
      path: entity.path,
    });
  }
  for (const entity of flow.topology?.entities ?? []) {
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

function endpoint(entity: EntityRecord): RelationshipDeltaEndpoint {
  return { kind: entity.kind, name: entity.name, path: entity.path };
}

function entityRecordKey(entity: EntityRecord): string {
  return `${entity.kind}|${entity.path ?? ''}|${entity.name}`;
}

function isSupportedTypeScriptPath(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    (lower.endsWith('.ts') || lower.endsWith('.tsx')) &&
    !lower.endsWith('.d.ts')
  );
}

function changeKindRank(kind: SemanticChangeKind): number {
  return kind === 'modified' ? 0 : kind === 'removed' ? 1 : 2;
}

function entityKindRank(
  kind: Exclude<RepositoryEntityKind, 'Repository'>,
): number {
  const rank: Record<Exclude<RepositoryEntityKind, 'Repository'>, number> = {
    Module: 0,
    File: 1,
    Class: 2,
    Interface: 3,
    Type: 4,
    Enum: 5,
    Function: 6,
    Method: 7,
    Variable: 8,
  };
  return rank[kind];
}

function relationshipDeltaRank(kind: RelationshipDelta['changeKind']): number {
  return kind === 'removed' ? 0 : 1;
}

function dedupeIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.kind}|${issue.filePath ?? ''}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
