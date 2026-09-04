import type {
  RepositoryChangeFileInput,
  RepositoryChangeSource,
  RepositoryFileChangeKind,
} from '@codeflow/analysis-core';

import {
  isSupportedMetadataPath,
  isSupportedSourcePath,
  REPOSITORY_LIMITS,
  RepositoryAcquisitionError,
  UnsupportedRepositoryError,
  type AcquiredRepository,
  type AcquiredSource,
} from './github.js';

export const PULL_REQUEST_LIMITS = {
  maxChangedFiles: 80,
  maxPatchBytes: 512 * 1024,
} as const;

export interface AcquiredPullRequest {
  source: RepositoryChangeSource;
  base: AcquiredRepository;
  head: AcquiredRepository;
  files: RepositoryChangeFileInput[];
  issues: string[];
}

interface ParsedPullRequestUrl {
  owner: string;
  repository: string;
  pullRequestNumber: number;
  canonicalUrl: string;
}

interface PullRequestMetadata {
  number?: number;
  title?: string;
  html_url?: string;
  changed_files?: number;
  base?: {
    sha?: string;
    repo?: { full_name?: string; html_url?: string; name?: string } | null;
  };
  head?: {
    sha?: string;
    repo?: { full_name?: string; html_url?: string; name?: string } | null;
  };
}

interface GitHubChangedFile {
  filename?: string;
  previous_filename?: string;
  status?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

export function parseGitHubPullRequestUrl(value: string): ParsedPullRequestUrl {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Enter a public GitHub pull request URL such as https://github.com/owner/repository/pull/123.',
    );
  }

  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com') {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Only public https://github.com/owner/repository/pull/number URLs are supported.',
    );
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (
    segments.length !== 4 ||
    segments[2] !== 'pull' ||
    segments.some((segment, index) =>
      index === 3 ? !/^\d+$/.test(segment) : index === 2 ? false : !/^[\w.-]+$/.test(segment),
    )
  ) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Use exactly one GitHub pull request URL: https://github.com/owner/repository/pull/123.',
    );
  }

  const owner = segments[0]!;
  const repository = segments[1]!.replace(/\.git$/i, '');
  const pullRequestNumber = Number(segments[3]);
  if (repository === '' || !Number.isSafeInteger(pullRequestNumber) || pullRequestNumber < 1) {
    throw new RepositoryAcquisitionError('invalid-url', 'The GitHub pull request URL is invalid.');
  }

  return {
    owner,
    repository,
    pullRequestNumber,
    canonicalUrl: `https://github.com/${owner}/${repository}/pull/${pullRequestNumber}`,
  };
}

export async function acquirePublicGitHubPullRequest(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<AcquiredPullRequest> {
  const parsed = parseGitHubPullRequestUrl(value);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repository)}`;
  const metadata = await fetchJson<PullRequestMetadata>(
    `${apiBase}/pulls/${parsed.pullRequestNumber}`,
    fetcher,
    'The public GitHub pull request was not found or could not be read.',
  );

  const baseSha = metadata.base?.sha;
  const headSha = metadata.head?.sha;
  const baseRepository = metadata.base?.repo?.full_name;
  const headRepository = metadata.head?.repo?.full_name;
  if (
    baseSha === undefined ||
    headSha === undefined ||
    baseRepository === undefined ||
    headRepository === undefined
  ) {
    throw new RepositoryAcquisitionError(
      'remote-failure',
      'GitHub did not provide immutable base/head repository revisions for this pull request.',
    );
  }

  const rawFiles = await fetchJson<GitHubChangedFile[]>(
    `${apiBase}/pulls/${parsed.pullRequestNumber}/files?per_page=100&page=1`,
    fetcher,
    'GitHub could not provide the pull request changed-file list.',
  );
  const issues: string[] = [];
  const declaredChangedFiles = metadata.changed_files ?? rawFiles.length;
  if (declaredChangedFiles > PULL_REQUEST_LIMITS.maxChangedFiles) {
    issues.push(
      `Pull request contains ${declaredChangedFiles} changed files; change projection is bounded to ${PULL_REQUEST_LIMITS.maxChangedFiles}.`,
    );
  }

  let patchBytes = 0;
  const files: RepositoryChangeFileInput[] = [];
  for (const item of rawFiles.slice(0, PULL_REQUEST_LIMITS.maxChangedFiles)) {
    if (typeof item.filename !== 'string' || item.filename === '') {
      continue;
    }
    let patch: string | null = item.patch ?? null;
    if (patch !== null) {
      const bytes = Buffer.byteLength(patch, 'utf8');
      if (patchBytes + bytes > PULL_REQUEST_LIMITS.maxPatchBytes) {
        issues.push(
          `Patch content exceeded the ${PULL_REQUEST_LIMITS.maxPatchBytes}-byte pull request diff budget; some changed files retain file-level status only.`,
        );
        patch = null;
      } else {
        patchBytes += bytes;
      }
    }
    files.push({
      path: item.filename,
      ...(typeof item.previous_filename === 'string'
        ? { previousPath: item.previous_filename }
        : {}),
      status: normalizeStatus(item.status),
      additions: item.additions ?? 0,
      deletions: item.deletions ?? 0,
      patch,
    });
  }

  const basePriorityPaths = files.flatMap((file) =>
    file.status === 'added' ? [] : [file.previousPath ?? file.path],
  );
  const headPriorityPaths = files.flatMap((file) =>
    file.status === 'removed' ? [] : [file.path],
  );
  const [base, head] = await Promise.all([
    acquireRevision(baseRepository, baseSha, basePriorityPaths, fetcher),
    acquireRevision(headRepository, headSha, headPriorityPaths, fetcher),
  ]);

  return {
    source: {
      provider: 'github',
      repository: `${parsed.owner}/${parsed.repository}`,
      pullRequestNumber: parsed.pullRequestNumber,
      title: metadata.title ?? `Pull request #${parsed.pullRequestNumber}`,
      url: metadata.html_url ?? parsed.canonicalUrl,
      baseRevision: baseSha,
      headRevision: headSha,
    },
    base,
    head,
    files,
    issues,
  };
}

async function acquireRevision(
  repositoryFullName: string,
  revision: string,
  priorityPaths: string[],
  fetcher: typeof fetch,
): Promise<AcquiredRepository> {
  const [owner, repository] = repositoryFullName.split('/');
  if (owner === undefined || repository === undefined || owner === '' || repository === '') {
    throw new RepositoryAcquisitionError(
      'remote-failure',
      'GitHub returned an invalid repository identity for one pull request revision.',
    );
  }
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
  const tree = await fetchJson<{
    truncated?: boolean;
    tree?: Array<{ path?: string; type?: string; size?: number }>;
  }>(
    `${apiBase}/git/trees/${encodeURIComponent(revision)}?recursive=1`,
    fetcher,
    'GitHub could not provide a repository tree for one pull request revision.',
  );

  const ignoredFiles: string[] = [];
  if (tree.truncated === true) {
    ignoredFiles.push(`GitHub tree for revision ${revision.slice(0, 12)} was truncated.`);
  }
  const candidates = (tree.tree ?? [])
    .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
    .map((entry) => ({ path: entry.path as string, size: entry.size ?? 0 }));
  const sourceCandidates = candidates.filter((entry) => isSupportedSourcePath(entry.path));
  const metadataCandidates = candidates
    .filter((entry) => isSupportedMetadataPath(entry.path))
    .sort((left, right) => left.path.localeCompare(right.path));

  if (sourceCandidates.length === 0) {
    throw new UnsupportedRepositoryError(
      `No supported TypeScript source found at revision ${revision.slice(0, 12)}.`,
    );
  }

  const priority = new Set(priorityPaths);
  sourceCandidates.sort((left, right) => {
    const leftPriority = priority.has(left.path) ? 0 : 1;
    const rightPriority = priority.has(right.path) ? 0 : 1;
    return leftPriority - rightPriority || left.path.localeCompare(right.path);
  });

  const files = await acquireFiles(
    owner,
    repository,
    revision,
    sourceCandidates,
    REPOSITORY_LIMITS.maxFiles,
    REPOSITORY_LIMITS.maxFileBytes,
    REPOSITORY_LIMITS.maxTotalBytes,
    ignoredFiles,
    fetcher,
  );
  if (files.length === 0) {
    throw new UnsupportedRepositoryError(
      `No supported TypeScript source remained inside analysis bounds at revision ${revision.slice(0, 12)}.`,
    );
  }

  const metadata = await acquireFiles(
    owner,
    repository,
    revision,
    metadataCandidates,
    REPOSITORY_LIMITS.maxMetadataFiles,
    REPOSITORY_LIMITS.maxMetadataFileBytes,
    REPOSITORY_LIMITS.maxTotalMetadataBytes,
    ignoredFiles,
    fetcher,
  );

  return {
    files,
    metadata,
    ignoredFiles: [...new Set(ignoredFiles)],
    repository: {
      name: repository,
      url: `https://github.com/${owner}/${repository}`,
      revision,
    },
  };
}

async function acquireFiles(
  owner: string,
  repository: string,
  revision: string,
  candidates: Array<{ path: string; size: number }>,
  maxFiles: number,
  maxFileBytes: number,
  maxTotalBytes: number,
  ignoredFiles: string[],
  fetcher: typeof fetch,
): Promise<AcquiredSource[]> {
  const selected = candidates.slice(0, maxFiles);
  ignoredFiles.push(...candidates.slice(maxFiles).map((entry) => entry.path));
  const result: AcquiredSource[] = [];
  let totalBytes = 0;

  for (const entry of selected) {
    if (entry.size > maxFileBytes || totalBytes + entry.size > maxTotalBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }
    const rawPath = entry.path.split('/').map(encodeURIComponent).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${encodeURIComponent(revision)}/${rawPath}`;
    const response = await fetchWithTimeout(rawUrl, fetcher);
    if (!response.ok) {
      ignoredFiles.push(entry.path);
      continue;
    }
    const bytes = await readResponseBytes(response, maxFileBytes);
    if (totalBytes + bytes.byteLength > maxTotalBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }
    totalBytes += bytes.byteLength;
    result.push({ filePath: entry.path, text: new TextDecoder().decode(bytes) });
  }
  return result;
}

function normalizeStatus(status: string | undefined): RepositoryFileChangeKind {
  switch (status) {
    case 'added':
    case 'modified':
    case 'removed':
    case 'renamed':
    case 'copied':
    case 'changed':
      return status;
    default:
      return 'unknown';
  }
}

async function fetchJson<T>(
  url: string,
  fetcher: typeof fetch,
  failureMessage: string,
): Promise<T> {
  const response = await fetchWithTimeout(url, fetcher);
  if (!response.ok) {
    throw new RepositoryAcquisitionError('remote-failure', failureMessage);
  }
  return (await response.json()) as T;
}

async function fetchWithTimeout(url: string, fetcher: typeof fetch): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REPOSITORY_LIMITS.timeoutMs);
  try {
    return await fetcher(url, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'CodeFlow-static-analysis',
      },
      signal: controller.signal,
    });
  } catch (error) {
    throw new RepositoryAcquisitionError(
      'remote-failure',
      error instanceof DOMException && error.name === 'AbortError'
        ? 'GitHub pull request acquisition timed out.'
        : 'GitHub could not be reached or rejected the pull request request.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBytes(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RepositoryAcquisitionError(
      'limit-exceeded',
      'A selected pull request source file exceeds the supported size limit.',
    );
  }
  if (response.body !== null && typeof response.body.getReader === 'function') {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new RepositoryAcquisitionError(
          'limit-exceeded',
          'A selected pull request source file exceeds the supported size limit.',
        );
      }
      chunks.push(next.value);
    }
    const result = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }
  const bytes = new TextEncoder().encode(await response.text());
  if (bytes.byteLength > maxBytes) {
    throw new RepositoryAcquisitionError(
      'limit-exceeded',
      'A selected pull request source file exceeds the supported size limit.',
    );
  }
  return bytes;
}
