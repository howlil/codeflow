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

export interface FlowProjection {
  id: string;
  entryPointId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  source: {
    filePath: string;
    text: string;
  };
  repository?: RepositorySummary;
  sources?: RepositorySource[];
  entryPoints?: EntryPointSuggestion[];
  analysis?: AnalysisSummary;
}

export interface RepositorySource {
  filePath: string;
  text: string;
}

export interface RepositorySummary {
  name: string;
  url?: string;
  branch?: string;
  revision?: string;
}

export type EntryPointConfidence = 'detected' | 'likely' | 'manual';

export interface EntryPointSuggestion {
  id: string;
  name: string;
  filePath: string;
  confidence: EntryPointConfidence;
  reason: string;
}

export type AnalysisLifecycleState =
  | 'VALIDATING'
  | 'FETCHING'
  | 'INDEXING'
  | 'ANALYZING'
  | 'READY'
  | 'PARTIAL'
  | 'FAILED';

export interface AnalysisSummary {
  state: AnalysisLifecycleState;
  filesAnalyzed: number;
  filesIgnored: number;
  functions: number;
  relationships: number;
  unresolvedReferences: number;
  unsupportedDynamicImports: number;
  limitations: string[];
}
