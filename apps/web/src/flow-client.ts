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
}

export interface RepositoryAnalysisRequest {
  files: Array<{
    filePath: string;
    sourceText: string;
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
