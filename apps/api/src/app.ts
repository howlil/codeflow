import {
  analyzeTypeScriptRepository,
  buildSampleRequestFlow,
} from '@codeflow/analysis-core';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  acquirePublicGitHubRepository,
  RepositoryAcquisitionError,
  UnsupportedRepositoryError,
} from './github.js';

interface AnalysisRequest {
  repositoryUrl?: unknown;
  entryPoint?: unknown;
}

interface EntryPointRequest {
  filePath: string;
  name: string;
}

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'codeflow-api',
  }));

  app.get('/api/flows/sample', async () => buildSampleRequestFlow());

  app.post<{ Body: AnalysisRequest }>(
    '/api/analyses',
    async (request, reply) => {
      const repositoryUrl = request.body?.repositoryUrl;
      if (typeof repositoryUrl !== 'string' || repositoryUrl.trim() === '') {
        return reply.code(400).send({
          code: 'INVALID_REQUEST',
          message: 'repositoryUrl must be a public GitHub repository URL.',
        });
      }

      const entryPoint = parseEntryPoint(request.body?.entryPoint);
      if (request.body?.entryPoint !== undefined && entryPoint === undefined) {
        return reply.code(400).send({
          code: 'INVALID_REQUEST',
          message: 'entryPoint must include a filePath and name.',
        });
      }

      try {
        const acquired = await acquirePublicGitHubRepository(repositoryUrl);
        const result = analyzeTypeScriptRepository({
          files: acquired.files,
          ignoredFiles: acquired.ignoredFiles,
          repository: acquired.repository,
          ...(entryPoint === undefined ? {} : { entryPoint }),
        });
        return reply.send(result.projection);
      } catch (error) {
        if (error instanceof RepositoryAcquisitionError) {
          return reply
            .code(
              error.code === 'invalid-url'
                ? 400
                : error.code === 'limit-exceeded'
                  ? 413
                  : 502,
            )
            .send({
              code:
                error.code === 'invalid-url'
                  ? 'INVALID_REPOSITORY_URL'
                  : error.code === 'limit-exceeded'
                    ? 'REPOSITORY_LIMIT_EXCEEDED'
                    : 'REPOSITORY_UNAVAILABLE',
              message: error.message,
            });
        }
        if (error instanceof UnsupportedRepositoryError) {
          return reply.code(422).send({
            code: 'UNSUPPORTED_REPOSITORY',
            message: error.message,
          });
        }
        if (error instanceof Error && error.message.includes('entry point')) {
          return reply.code(422).send({
            code: 'NO_ENTRY_POINT',
            message: error.message,
          });
        }
        return reply.code(500).send({
          code: 'ANALYSIS_FAILED',
          message:
            'The repository could not be analyzed within the supported scope.',
        });
      }
    },
  );

  return app;
}

function parseEntryPoint(value: unknown): EntryPointRequest | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.filePath !== 'string' ||
    typeof candidate.name !== 'string' ||
    candidate.filePath.trim() === '' ||
    candidate.name.trim() === ''
  ) {
    return undefined;
  }
  return { filePath: candidate.filePath, name: candidate.name };
}
