export type EvidenceKind = 'verified-static' | 'inferred-static';

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

export async function loadSampleFlow(): Promise<FlowProjection> {
  const response = await fetch('/api/flows/sample');

  if (!response.ok) {
    throw new Error(`Flow request failed with status ${response.status}.`);
  }

  return (await response.json()) as FlowProjection;
}
