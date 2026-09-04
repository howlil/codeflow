import {
  buildImpactProjection,
  type FlowProjection,
  type ImpactProjection,
} from '@codeflow/analysis-core';
import type { FastifyInstance } from 'fastify';

const MAX_IMPACT_REQUEST_BYTES = 2_500_000;
const MAX_IMPACT_SEEDS = 8;
const MAX_IMPACT_DEPTH = 4;

interface ImpactAnalysisPayload {
  flow: FlowProjection;
  seedIds: string[];
  maxDepth: number;
}

export function registerImpactRoute(app: FastifyInstance): void {
  app.post<{ Body: unknown }>(
    '/api/flows/impact',
    { bodyLimit: MAX_IMPACT_REQUEST_BYTES },
    async (request, reply) => {
      try {
        const payload = parseImpactAnalysisPayload(request.body);
        return buildImpactProjection(
          payload.flow,
          payload.seedIds,
          payload.maxDepth,
        ) satisfies ImpactProjection;
      } catch (error: unknown) {
        if (error instanceof ImpactInputError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        throw error;
      }
    },
  );
}

class ImpactInputError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

function parseImpactAnalysisPayload(body: unknown): ImpactAnalysisPayload {
  if (!isRecord(body) || !isRecord(body.flow)) {
    throw new ImpactInputError(
      400,
      'Impact analysis requires a flow projection.',
    );
  }
  if (!Array.isArray(body.seedIds) || body.seedIds.length === 0) {
    throw new ImpactInputError(
      400,
      'Impact analysis requires at least one selected change target.',
    );
  }
  if (body.seedIds.length > MAX_IMPACT_SEEDS) {
    throw new ImpactInputError(
      413,
      `Impact scope is bounded to ${MAX_IMPACT_SEEDS} change targets.`,
    );
  }
  const seedIds = body.seedIds.map((value, index) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ImpactInputError(
        400,
        `Impact seed at index ${index} must be a non-empty entity ID.`,
      );
    }
    return value;
  });

  const maxDepthValue = body.maxDepth ?? 3;
  if (
    typeof maxDepthValue !== 'number' ||
    !Number.isInteger(maxDepthValue) ||
    maxDepthValue < 1 ||
    maxDepthValue > MAX_IMPACT_DEPTH
  ) {
    throw new ImpactInputError(
      400,
      `Impact maxDepth must be an integer from 1 to ${MAX_IMPACT_DEPTH}.`,
    );
  }

  const flow = body.flow;
  if (
    typeof flow.id !== 'string' ||
    typeof flow.entryPointId !== 'string' ||
    !Array.isArray(flow.nodes) ||
    !Array.isArray(flow.edges) ||
    !isRecord(flow.analysis) ||
    (flow.analysis.status !== 'complete' && flow.analysis.status !== 'partial')
  ) {
    throw new ImpactInputError(
      400,
      'Impact analysis received an invalid semantic flow projection.',
    );
  }
  if (
    flow.architecture !== undefined &&
    (!isRecord(flow.architecture) ||
      !Array.isArray(flow.architecture.entities) ||
      !Array.isArray(flow.architecture.relationships))
  ) {
    throw new ImpactInputError(
      400,
      'Impact analysis received an invalid repository architecture projection.',
    );
  }
  if (
    flow.topology !== undefined &&
    (!isRecord(flow.topology) ||
      !Array.isArray(flow.topology.entities) ||
      !Array.isArray(flow.topology.relationships) ||
      !isRecord(flow.topology.fileOwners))
  ) {
    throw new ImpactInputError(
      400,
      'Impact analysis received an invalid package topology projection.',
    );
  }

  return {
    flow: flow as unknown as FlowProjection,
    seedIds,
    maxDepth: maxDepthValue,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
