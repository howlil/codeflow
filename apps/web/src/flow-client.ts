import type { Evidence, FlowProjection } from '@codeflow/analysis-core';

export type {
  FlowEdge,
  FlowNode,
  FlowProjection,
} from '@codeflow/analysis-core';
export type FlowEvidence = Evidence;

export class AnalysisRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AnalysisRequestError';
  }
}

export async function loadAnalysis(
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
    const payload = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new AnalysisRequestError(
      payload?.code ?? 'ANALYSIS_FAILED',
      payload?.message ??
        `Analysis request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as FlowProjection;
}

export async function loadSampleFlow(): Promise<FlowProjection> {
  const response = await fetch('/api/flows/sample');

  if (!response.ok) {
    throw new Error(`Flow request failed with status ${response.status}.`);
  }

  return (await response.json()) as FlowProjection;
}
