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
}
