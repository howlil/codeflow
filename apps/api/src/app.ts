import {
  analyzeTypeScriptRepository,
  buildSampleRequestFlow,
  discoverEntryPoints,
  type AnalysisIssue,
  type FlowProjection,
  type TypeScriptSourceInput,
} from '@codeflow/analysis-core';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  acquirePublicGitHubRepository,
  RepositoryAcquisitionError,
  UnsupportedRepositoryError,
} from './github.js';

const MAX_REQUEST_BYTES = 1_500_000;
const MAX_FILE_RECORDS = 256;
const MAX_ANALYZED_FILES = 96;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 1_000_000;
const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

interface RepositoryFilePayload {
  filePath: string;
  sourceText: string;
}

interface AnalyzeRepositoryPayload {
  files: RepositoryFilePayload[];
  entryPoint: {
    filePath: string;
    name: string;
  };
}

interface GitHubAnalysisPayload {
  repositoryUrl: string;
  entryPoint?: {
    filePath: string;
    name: string;
  };
}

class InputError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'codeflow-api',
  }));

  app.get('/api/flows/sample', async () => buildSampleRequestFlow());

  app.post<{ Body: unknown }>(
    '/api/analyses',
    { bodyLimit: 32 * 1024 },
    async (request, reply) => {
      try {
        const payload = parseGitHubAnalysisPayload(request.body);
        const acquired = await acquirePublicGitHubRepository(
          payload.repositoryUrl,
        );
        const files = acquired.files.map((file) => ({
          filePath: file.filePath,
          sourceText: file.text,
        }));
        const entryPoints = discoverEntryPoints(files);
        const entryPoint = payload.entryPoint ?? entryPoints[0];
        if (entryPoint === undefined) {
          return reply.code(422).send({
            code: 'NO_ENTRY_POINT',
            message: 'No exported TypeScript entry point was found.',
          });
        }

        const projection = analyzeTypeScriptRepository({
          files,
          entryPoint: {
            filePath: entryPoint.filePath,
            name: entryPoint.name,
          },
        });
        const acquisitionIssues = acquired.ignoredFiles.map((filePath) => ({
          kind: 'ignored' as const,
          filePath,
          message:
            'Dependency, generated, unsupported, or oversized content was excluded from this bounded analysis.',
        }));
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
        } satisfies FlowProjection;
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
        if (
          error instanceof Error &&
          error.message.startsWith('Exported entry point')
        ) {
          return reply.code(422).send({
            code: 'NO_ENTRY_POINT',
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  app.post<{ Body: unknown }>(
    '/api/flows/analyze',
    { bodyLimit: MAX_REQUEST_BYTES },
    async (request, reply) => {
      try {
        const payload = parseAnalyzeRepositoryPayload(request.body);
        const prepared = prepareRepositoryInput(payload);
        const projection = analyzeTypeScriptRepository({
          files: prepared.files,
          entryPoint: prepared.entryPoint,
        });

        return mergeInputIssues(projection, prepared.issues);
      } catch (error: unknown) {
        if (error instanceof InputError) {
          return reply.code(error.statusCode).send({ error: error.message });
        }

        if (
          error instanceof Error &&
          (error.message.startsWith('Exported entry point') ||
            error.message.startsWith('Entry source'))
        ) {
          return reply.code(422).send({ error: error.message });
        }

        throw error;
      }
    },
  );

  return app;
}

function parseGitHubAnalysisPayload(body: unknown): GitHubAnalysisPayload {
  if (!isRecord(body) || typeof body.repositoryUrl !== 'string') {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'repositoryUrl must be a public GitHub repository URL.',
    );
  }
  if (body.entryPoint === undefined) {
    return { repositoryUrl: body.repositoryUrl };
  }
  if (
    !isRecord(body.entryPoint) ||
    typeof body.entryPoint.filePath !== 'string' ||
    typeof body.entryPoint.name !== 'string' ||
    body.entryPoint.filePath.trim() === '' ||
    body.entryPoint.name.trim() === ''
  ) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'entryPoint must include a filePath and name.',
    );
  }
  return {
    repositoryUrl: body.repositoryUrl,
    entryPoint: {
      filePath: body.entryPoint.filePath,
      name: body.entryPoint.name.trim(),
    },
  };
}

function parseAnalyzeRepositoryPayload(
  body: unknown,
): AnalyzeRepositoryPayload {
  if (!isRecord(body) || !Array.isArray(body.files)) {
    throw new InputError(400, 'Repository analysis requires a files array.');
  }
  if (body.files.length === 0) {
    throw new InputError(
      400,
      'Repository analysis requires at least one file.',
    );
  }
  if (body.files.length > MAX_FILE_RECORDS) {
    throw new InputError(
      413,
      `Repository selection exceeds the ${MAX_FILE_RECORDS}-file request limit.`,
    );
  }

  const files = body.files.map((file, index) => {
    if (
      !isRecord(file) ||
      typeof file.filePath !== 'string' ||
      typeof file.sourceText !== 'string'
    ) {
      throw new InputError(
        400,
        `Repository file at index ${index} must contain filePath and sourceText strings.`,
      );
    }

    return {
      filePath: file.filePath,
      sourceText: file.sourceText,
    };
  });

  if (
    !isRecord(body.entryPoint) ||
    typeof body.entryPoint.filePath !== 'string' ||
    typeof body.entryPoint.name !== 'string' ||
    body.entryPoint.name.trim() === ''
  ) {
    throw new InputError(
      400,
      'Repository analysis requires an entryPoint with filePath and exported function name.',
    );
  }

  return {
    files,
    entryPoint: {
      filePath: body.entryPoint.filePath,
      name: body.entryPoint.name.trim(),
    },
  };
}

function prepareRepositoryInput(payload: AnalyzeRepositoryPayload): {
  files: TypeScriptSourceInput[];
  entryPoint: AnalyzeRepositoryPayload['entryPoint'];
  issues: AnalysisIssue[];
} {
  const entryPoint = {
    filePath: normalizeRepositoryPath(payload.entryPoint.filePath),
    name: payload.entryPoint.name,
  };
  const seenPaths = new Set<string>();
  const normalizedFiles = payload.files.map((file) => {
    const filePath = normalizeRepositoryPath(file.filePath);
    if (seenPaths.has(filePath)) {
      throw new InputError(400, `Duplicate repository path: ${filePath}.`);
    }
    seenPaths.add(filePath);
    return { filePath, sourceText: file.sourceText };
  });
  const orderedFiles = [...normalizedFiles].sort((left, right) => {
    if (left.filePath === entryPoint.filePath) {
      return -1;
    }
    if (right.filePath === entryPoint.filePath) {
      return 1;
    }
    return left.filePath.localeCompare(right.filePath);
  });
  const files: TypeScriptSourceInput[] = [];
  const issues: AnalysisIssue[] = [];
  let totalSourceBytes = 0;

  for (const file of orderedFiles) {
    if (isIgnoredPath(file.filePath)) {
      issues.push({
        kind: 'ignored',
        filePath: file.filePath,
        message:
          'Dependency, build, generated, or VCS directory is outside the M3 analysis scope.',
      });
      continue;
    }

    if (!isSupportedTypeScriptPath(file.filePath)) {
      issues.push({
        kind: 'unsupported',
        filePath: file.filePath,
        message:
          'M3 analyzes .ts and .tsx source files only; declaration files are excluded.',
      });
      continue;
    }

    const sourceBytes = Buffer.byteLength(file.sourceText, 'utf8');
    if (sourceBytes > MAX_FILE_BYTES) {
      issues.push({
        kind: 'limit',
        filePath: file.filePath,
        message: `File exceeds the ${MAX_FILE_BYTES}-byte analysis limit.`,
      });
      continue;
    }

    if (files.length >= MAX_ANALYZED_FILES) {
      issues.push({
        kind: 'limit',
        filePath: file.filePath,
        message: `Repository projection is bounded to ${MAX_ANALYZED_FILES} analyzed files.`,
      });
      continue;
    }

    if (totalSourceBytes + sourceBytes > MAX_TOTAL_SOURCE_BYTES) {
      issues.push({
        kind: 'limit',
        filePath: file.filePath,
        message: `Repository source exceeds the ${MAX_TOTAL_SOURCE_BYTES}-byte analysis budget.`,
      });
      continue;
    }

    files.push(file);
    totalSourceBytes += sourceBytes;
  }

  if (files.length === 0) {
    throw new InputError(
      422,
      'No supported TypeScript source files remain inside the analysis bounds.',
    );
  }
  if (!files.some((file) => file.filePath === entryPoint.filePath)) {
    throw new InputError(
      422,
      `Entry source ${entryPoint.filePath} is unsupported, ignored, or outside the analysis bounds.`,
    );
  }

  return { files, entryPoint, issues };
}

function mergeInputIssues(
  projection: FlowProjection,
  inputIssues: AnalysisIssue[],
): FlowProjection {
  if (inputIssues.length === 0) {
    return projection;
  }

  const issues = [...inputIssues, ...projection.analysis.issues];
  return {
    ...projection,
    analysis: {
      ...projection.analysis,
      status: 'partial',
      ignoredFileCount:
        projection.analysis.ignoredFileCount + inputIssues.length,
      issues,
    },
  };
}

function normalizeRepositoryPath(filePath: string): string {
  const normalized = filePath.replaceAll('\\', '/');
  if (
    normalized === '' ||
    normalized.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.includes('\0')
  ) {
    throw new InputError(400, `Unsafe repository path: ${filePath}.`);
  }

  const segments = normalized.split('/');
  if (
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new InputError(400, `Unsafe repository path: ${filePath}.`);
  }

  return segments.join('/');
}

function isIgnoredPath(filePath: string): boolean {
  return filePath
    .split('/')
    .some((segment) => IGNORED_DIRECTORY_NAMES.has(segment.toLowerCase()));
}

function isSupportedTypeScriptPath(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase();
  return (
    (lowerPath.endsWith('.ts') || lowerPath.endsWith('.tsx')) &&
    !lowerPath.endsWith('.d.ts')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
