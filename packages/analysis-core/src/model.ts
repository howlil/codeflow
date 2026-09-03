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

export type AnalysisIssueKind = 'ignored' | 'unsupported' | 'invalid' | 'limit';

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

export interface FunctionParameterProjection {
  id: string;
  name: string;
  typeText: string | null;
  location: SourceLocation;
  evidence: Evidence[];
}

export interface FunctionReturnProjection {
  id: string;
  expressionText: string | null;
  location: SourceLocation;
  evidence: Evidence[];
}

export interface CallArgumentMapping {
  id: string;
  callerFunctionId: string;
  calleeFunctionId: string;
  argumentIndex: number;
  argumentText: string;
  parameterName: string | null;
  location: SourceLocation;
  evidence: Evidence[];
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
  evidence: Evidence[];
}

export interface StaticFlowRelationship {
  id: string;
  kind: StaticFlowRelationshipKind;
  functionId: string;
  sourceStepId: string | null;
  targetStepId: string | null;
  label: string;
  evidence: Evidence[];
}

export interface StaticFlowProjection {
  steps: StaticFlowStep[];
  relationships: StaticFlowRelationship[];
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
  /** Source-backed function inputs, outputs, and caller/callee argument mappings. */
  functionData: FunctionDataProjection[];
  /** Ordered static exploration steps and relationships. Never observed runtime execution. */
  staticFlow: StaticFlowProjection;
  repository?: RepositorySummary;
  entryPoints?: EntryPointSuggestion[];
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
