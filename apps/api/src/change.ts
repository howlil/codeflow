import {
  analyzeTypeScriptRepository,
  buildRepositoryChangeProjection,
  discoverEntryPoints,
  type AnalysisIssue,
  type FlowProjection,
  type RepositoryChangeProjection,
} from '@codeflow/analysis-core';
import type { FastifyInstance } from 'fastify';

import {
  acquirePublicGitHubPullRequest,
  type AcquiredPullRequest,
} from './github-pr.js';
import {
  RepositoryAcquisitionError,
  UnsupportedRepositoryError,
  type AcquiredRepository,
} from './github.js';

interface PullRequestAnalysisResponse {
  change: RepositoryChangeProjection;
  base: FlowProjection;
  head: FlowProjection;
}

export function registerChangeRoute(app: FastifyInstance): void {
  app.post<{ Body: unknown }>(
    '/api/changes/github',
    { bodyLimit: 32 * 1024 },
    async (request, reply) => {
      try {
        const pullRequestUrl = parsePayload(request.body);
        const acquired = await acquirePublicGitHubPullRequest(pullRequestUrl);
        const base = analyzeSnapshot(acquired.base);
        const head = analyzeSnapshot(acquired.head);
        const projected = buildRepositoryChangeProjection({
          source: acquired.source,
          base,
          head,
          files: acquired.files,
        });
        const acquisitionIssues: AnalysisIssue[] = acquired.issues.map(
          (message) => ({ kind: 'limit', message }),
        );
        const change =
          acquisitionIssues.length === 0
            ? projected
            : {
                ...projected,
                coverage: {
                  status: 'partial' as const,
                  issues: [...acquisitionIssues, ...projected.coverage.issues],
                },
              };
        return { change, base, head } satisfies PullRequestAnalysisResponse;
      } catch (error: unknown) {
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
                  ? 'INVALID_PULL_REQUEST_URL'
                  : error.code === 'limit-exceeded'
                    ? 'PULL_REQUEST_LIMIT_EXCEEDED'
                    : 'PULL_REQUEST_UNAVAILABLE',
              message: error.message,
            });
        }
        if (error instanceof UnsupportedRepositoryError) {
          return reply.code(422).send({
            code: 'UNSUPPORTED_PULL_REQUEST',
            message: error.message,
          });
        }
        if (error instanceof PullRequestAnalysisError) {
          return reply.code(422).send({
            code: 'NO_ENTRY_POINT',
            message: error.message,
          });
        }
        throw error;
      }
    },
  );
}

class PullRequestAnalysisError extends Error {}

function parsePayload(body: unknown): string {
  if (
    typeof body !== 'object' ||
    body === null ||
    Array.isArray(body) ||
    !('pullRequestUrl' in body) ||
    typeof body.pullRequestUrl !== 'string'
  ) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'pullRequestUrl must be a public GitHub pull request URL.',
    );
  }
  return body.pullRequestUrl;
}

function analyzeSnapshot(acquired: AcquiredRepository): FlowProjection {
  const files = acquired.files.map((file) => ({
    filePath: file.filePath,
    sourceText: file.text,
  }));
  const entryPoints = discoverEntryPoints(files);
  const entryPoint = entryPoints[0];
  if (entryPoint === undefined) {
    throw new PullRequestAnalysisError(
      `Revision ${acquired.repository.revision?.slice(0, 12) ?? 'unknown'} has no exported TypeScript entry point inside the bounded source projection.`,
    );
  }
  const projection = analyzeTypeScriptRepository({
    files,
    metadata: acquired.metadata,
    entryPoint: {
      filePath: entryPoint.filePath,
      name: entryPoint.name,
    },
  });
  const acquisitionIssues: AnalysisIssue[] = acquired.ignoredFiles.map(
    (filePath) => ({
      kind: 'ignored',
      filePath,
      message:
        'Dependency, generated, unsupported, or out-of-budget content was excluded from this bounded revision analysis.',
    }),
  );
  return {
    ...projection,
    repository: acquired.repository,
    entryPoints,
    analysis: {
      ...projection.analysis,
      status:
        acquisitionIssues.length > 0
          ? ('partial' as const)
          : projection.analysis.status,
      ignoredFileCount:
        projection.analysis.ignoredFileCount + acquisitionIssues.length,
      issues: [...acquisitionIssues, ...projection.analysis.issues],
    },
  };
}
