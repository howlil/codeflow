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

export interface Evidence {
  kind: EvidenceKind;
  source: string;
  location: SourceLocation;
  reason: string;
}

export interface SemanticEntity {
  id: string;
  kind: 'Function';
  name: string;
  location: SourceLocation;
  attributes: {
    exported: boolean;
  };
}

export interface SemanticRelationship {
  id: string;
  kind: 'CALLS';
  sourceId: string;
  targetId: string;
  evidence: Evidence[];
}

export interface SemanticGraph {
  entities: SemanticEntity[];
  relationships: SemanticRelationship[];
}

export interface FlowNode {
  id: string;
  kind: SemanticEntity['kind'];
  label: string;
  location: SourceLocation;
  entryPoint: boolean;
}

export interface FlowEdge {
  id: string;
  kind: SemanticRelationship['kind'];
  sourceId: string;
  targetId: string;
  evidence: Evidence[];
}

export interface ProjectionSource {
  filePath: string;
  text: string;
}

export type AnalysisIssueKind =
  | 'ignored'
  | 'unsupported'
  | 'invalid'
  | 'limit';

export interface AnalysisIssue {
  kind: AnalysisIssueKind;
  message: string;
  filePath?: string;
}

export interface AnalysisSummary {
  status: 'complete' | 'partial';
  analyzedFileCount: number;
  ignoredFileCount: number;
  issues: AnalysisIssue[];
}

export interface FlowProjection {
  id: string;
  entryPointId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  /** Entry-point source retained for the existing single-source consumer contract. */
  source: ProjectionSource;
  /** All analyzed repository sources required for cross-file inspection. */
  sources: ProjectionSource[];
  analysis: AnalysisSummary;
}
