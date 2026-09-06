import type {
  AnalysisIssue,
  FlowEvidence,
  FlowProjection,
  ImpactProjection,
  RepositoryEntityKind,
  SourceLocation,
} from './flow-client';

export type RepositoryFileChangeKind =
  | 'added'
  | 'modified'
  | 'removed'
  | 'renamed'
  | 'copied'
  | 'changed'
  | 'unknown';

export type SemanticChangeKind = 'added' | 'modified' | 'removed';

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
  relationshipKind:
    | 'CALLS'
    | 'REFERENCES'
    | 'IMPORTS'
    | 'DEPENDS_ON'
    | 'EXTENDS'
    | 'IMPLEMENTS';
  source: RelationshipDeltaEndpoint;
  target: RelationshipDeltaEndpoint;
}

export type BehaviorDeltaChangeKind = 'added' | 'removed';
export type BehaviorDeltaCategory =
  'parameter' | 'return' | 'step' | 'relationship';
export type BehaviorDeltaSnapshot = 'base' | 'head';

export interface FunctionBehaviorDeltaItem {
  id: string;
  changeKind: BehaviorDeltaChangeKind;
  category: BehaviorDeltaCategory;
  kind: string;
  label: string;
  detail: string | null;
  snapshot: BehaviorDeltaSnapshot;
  location: SourceLocation | null;
  evidence: FlowEvidence[];
}

export interface FunctionBehaviorDelta {
  changeEntityId: string;
  functionName: string;
  path: string;
  baseFunctionId: string | null;
  headFunctionId: string | null;
  items: FunctionBehaviorDeltaItem[];
  summary: {
    addedCount: number;
    removedCount: number;
    parameterCount: number;
    returnCount: number;
    stepCount: number;
    relationshipCount: number;
  };
}

export interface RepositoryChangeProjection {
  source: {
    provider: 'github';
    repository: string;
    pullRequestNumber: number;
    title: string;
    url: string;
    baseRevision: string;
    headRevision: string;
  };
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

export interface PullRequestAnalysis {
  change: RepositoryChangeProjection;
  base: FlowProjection;
  head: FlowProjection;
}

export async function analyzeGitHubPullRequest(
  pullRequestUrl: string,
): Promise<PullRequestAnalysis> {
  const response = await fetch('/api/changes/github', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pullRequestUrl }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as unknown;
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
    ) {
      throw new Error(payload.message);
    }
    throw new Error(
      `Pull request analysis failed with status ${response.status}.`,
    );
  }
  return (await response.json()) as PullRequestAnalysis;
}
