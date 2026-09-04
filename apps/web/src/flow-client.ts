export type EvidenceKind =
  | 'verified-static'
  | 'inferred-static'
  | 'configured'
  | 'observed-runtime'
  | 'user-asserted';

export interface SourceLocation {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface FlowEvidence {
  kind: EvidenceKind;
  source: string;
  location: SourceLocation;
  reason: string;
}

export interface FlowNode {
  id: string;
  kind: 'Function';
  label: string;
  location: SourceLocation;
  entryPoint: boolean;
}

export interface FlowEdge {
  id: string;
  kind: 'CALLS';
  sourceId: string;
  targetId: string;
  evidence: FlowEvidence[];
}

export interface ProjectionSource {
  filePath: string;
  text: string;
}

export interface AnalysisIssue {
  kind: 'ignored' | 'unsupported' | 'invalid' | 'limit';
  message: string;
  filePath?: string;
}

export interface FunctionParameterProjection {
  id: string;
  name: string;
  typeText: string | null;
  location: SourceLocation;
  evidence: FlowEvidence[];
}

export interface FunctionReturnProjection {
  id: string;
  expressionText: string | null;
  location: SourceLocation;
  evidence: FlowEvidence[];
}

export interface CallArgumentMapping {
  id: string;
  callerFunctionId: string;
  calleeFunctionId: string;
  argumentIndex: number;
  argumentText: string;
  parameterName: string | null;
  location: SourceLocation;
  evidence: FlowEvidence[];
}

export interface FunctionDataProjection {
  functionId: string;
  parameters: FunctionParameterProjection[];
  returns: FunctionReturnProjection[];
  callArguments: CallArgumentMapping[];
}

export type StaticFlowStepKind =
  | 'parameter'
  | 'argument'
  | 'declaration'
  | 'assignment'
  | 'transform'
  | 'read'
  | 'write'
  | 'mutation'
  | 'return'
  | 'branch'
  | 'failure';

export type StaticFlowRelationshipKind =
  | 'PASSES_ARGUMENT'
  | 'FLOWS_TO'
  | 'READS'
  | 'WRITES'
  | 'MUTATES'
  | 'RETURNS_TO';

export interface StaticFlowStep {
  id: string;
  functionId: string;
  kind: StaticFlowStepKind;
  label: string;
  valueText: string | null;
  location: SourceLocation;
  evidence: FlowEvidence[];
}

export interface StaticFlowRelationship {
  id: string;
  kind: StaticFlowRelationshipKind;
  functionId: string;
  sourceStepId: string | null;
  targetStepId: string | null;
  label: string;
  evidence: FlowEvidence[];
}

export type RepositoryEntityKind =
  | 'Repository'
  | 'Module'
  | 'File'
  | 'Function'
  | 'Method'
  | 'Class'
  | 'Interface'
  | 'Type'
  | 'Enum'
  | 'Variable';

export interface RepositoryEntity {
  id: string;
  kind: RepositoryEntityKind;
  name: string;
  path: string;
  location: SourceLocation | null;
  exported: boolean;
  evidence: FlowEvidence[];
}

export type RepositoryRelationshipKind =
  | 'CONTAINS'
  | 'DEFINES'
  | 'IMPORTS'
  | 'DEPENDS_ON'
  | 'EXPORTS'
  | 'REFERENCES'
  | 'EXTENDS'
  | 'IMPLEMENTS';

export interface RepositoryRelationship {
  id: string;
  kind: RepositoryRelationshipKind;
  sourceId: string;
  targetId: string;
  evidence: FlowEvidence[];
}

export interface RepositoryArchitectureProjection {
  rootId: string;
  entities: RepositoryEntity[];
  relationships: RepositoryRelationship[];
}

export interface PackageTopologyEntity {
  id: string;
  kind: 'Workspace' | 'Package';
  name: string;
  path: string;
  location: SourceLocation | null;
  evidence: FlowEvidence[];
}

export interface PackageTopologyRelationship {
  id: string;
  kind: 'CONTAINS' | 'DEPENDS_ON';
  sourceId: string;
  targetId: string;
  evidence: FlowEvidence[];
}

export interface PackageTopologyProjection {
  rootId: string | null;
  entities: PackageTopologyEntity[];
  relationships: PackageTopologyRelationship[];
  externalDependencies: Array<{ packageId: string; name: string }>;
  fileOwners: Record<string, string>;
  status: 'complete' | 'partial';
  issues: AnalysisIssue[];
}

export interface FlowProjection {
  id: string;
  entryPointId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  source: ProjectionSource;
  sources: ProjectionSource[];
  analysis: {
    status: 'complete' | 'partial';
    analyzedFileCount: number;
    ignoredFileCount: number;
    issues: AnalysisIssue[];
  };
  repository?: {
    name: string;
    url?: string;
    branch?: string;
    revision?: string;
  };
  entryPoints?: Array<{
    id: string;
    name: string;
    filePath: string;
    confidence: 'detected' | 'likely' | 'manual';
    reason: string;
  }>;
  /** Added in M4. Optional so older deterministic fixtures remain readable. */
  functionData?: FunctionDataProjection[];
  /** Added in M4. Optional so older deterministic fixtures remain readable. */
  staticFlow?: {
    steps: StaticFlowStep[];
    relationships: StaticFlowRelationship[];
  };
  /** Added in M6. Optional so older deterministic fixtures remain readable. */
  architecture?: RepositoryArchitectureProjection;
  /** Added in M7. Configured workspace/package topology above source architecture. */
  topology?: PackageTopologyProjection;
}

export interface RepositoryAnalysisRequest {
  files: Array<{
    filePath: string;
    sourceText: string;
  }>;
  metadata?: Array<{
    filePath: string;
    text: string;
  }>;
  entryPoint: {
    filePath: string;
    name: string;
  };
}

export async function analyzeRepositoryFlow(
  request: RepositoryAnalysisRequest,
): Promise<FlowProjection> {
  const response = await fetch('/api/flows/analyze', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as unknown;
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
    ) {
      throw new Error(payload.error);
    }

    throw new Error(
      `Repository analysis failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as FlowProjection;
}

export class GitHubAnalysisError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubAnalysisError';
  }
}

export async function analyzeGitHubRepository(
  repositoryUrl: string,
  entryPoint?: { filePath: string; name: string },
): Promise<FlowProjection> {
  const response = await fetch('/api/analyses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      repositoryUrl,
      ...(entryPoint === undefined ? {} : { entryPoint }),
    }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as unknown;
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      'message' in payload &&
      typeof payload.code === 'string' &&
      typeof payload.message === 'string'
    ) {
      throw new GitHubAnalysisError(payload.code, payload.message);
    }
    throw new GitHubAnalysisError(
      'ANALYSIS_FAILED',
      `Repository analysis failed with status ${response.status}.`,
    );
  }
  return (await response.json()) as FlowProjection;
}
