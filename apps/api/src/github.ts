import type {
  RepositorySource,
  RepositorySummary,
} from '@codeflow/analysis-core';

export const REPOSITORY_LIMITS = {
  maxFiles: 40,
  maxFileBytes: 800_000,
  maxTotalBytes: 4_000_000,
  timeoutMs: 8_000,
} as const;

export interface AcquiredRepository {
  files: RepositorySource[];
  ignoredFiles: string[];
  repository: RepositorySummary;
}

export class RepositoryAcquisitionError extends Error {
  readonly code: 'invalid-url' | 'remote-failure' | 'limit-exceeded';

  constructor(code: RepositoryAcquisitionError['code'], message: string) {
    super(message);
    this.name = 'RepositoryAcquisitionError';
    this.code = code;
  }
}

export class UnsupportedRepositoryError extends Error {
  constructor(message = 'No supported TypeScript source found.') {
    super(message);
    this.name = 'UnsupportedRepositoryError';
  }
}

export interface ParsedGitHubUrl {
  owner: string;
  repository: string;
  canonicalUrl: string;
}

export function parseGitHubRepositoryUrl(value: string): ParsedGitHubUrl {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Enter a public GitHub repository URL such as https://github.com/owner/repository.',
    );
  }

  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'github.com'
  ) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Only public https://github.com/owner/repository URLs are supported.',
    );
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (
    segments.length !== 2 ||
    segments.some((segment) => !/^[\w.-]+$/.test(segment))
  ) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'Use exactly one GitHub owner and repository, without a branch or file path.',
    );
  }

  const owner = segments.at(0);
  const rawRepository = segments.at(1);
  if (owner === undefined || rawRepository === undefined) {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'The GitHub owner or repository is missing.',
    );
  }
  const repository = rawRepository.replace(/\.git$/i, '');
  if (repository === '') {
    throw new RepositoryAcquisitionError(
      'invalid-url',
      'The repository name is missing.',
    );
  }

  return {
    owner,
    repository,
    canonicalUrl: `https://github.com/${owner}/${repository}`,
  };
}

export async function acquirePublicGitHubRepository(
  value: string,
  fetcher: typeof fetch = fetch,
): Promise<AcquiredRepository> {
  const parsed = parseGitHubRepositoryUrl(value);
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repository)}`;
  const metadata = await fetchJson<{ default_branch?: string; name?: string }>(
    `${apiBase}`,
    fetcher,
  );
  const branch = metadata.default_branch;
  if (branch === undefined || branch === '') {
    throw new RepositoryAcquisitionError(
      'remote-failure',
      'GitHub did not provide a default branch for this repository.',
    );
  }

  const tree = await fetchJson<{
    truncated?: boolean;
    tree?: Array<{ path?: string; type?: string; size?: number }>;
  }>(`${apiBase}/git/trees/${encodeURIComponent(branch)}?recursive=1`, fetcher);
  const ignoredFiles: string[] = [];
  if (tree.truncated === true) {
    ignoredFiles.push('GitHub tree truncated the repository listing.');
  }

  const candidates = (tree.tree ?? [])
    .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
    .map((entry) => ({ path: entry.path as string, size: entry.size ?? 0 }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const supported = candidates.filter((entry) =>
    isSupportedSourcePath(entry.path),
  );
  ignoredFiles.push(
    ...candidates
      .filter((entry) => !isSupportedSourcePath(entry.path))
      .map((entry) => entry.path),
  );

  if (supported.length === 0) {
    throw new UnsupportedRepositoryError();
  }

  const selected = supported.slice(0, REPOSITORY_LIMITS.maxFiles);
  ignoredFiles.push(
    ...supported.slice(REPOSITORY_LIMITS.maxFiles).map((entry) => entry.path),
  );
  const files: RepositorySource[] = [];
  let totalBytes = 0;
  for (const entry of selected) {
    if (entry.size > REPOSITORY_LIMITS.maxFileBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }
    if (totalBytes + entry.size > REPOSITORY_LIMITS.maxTotalBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }

    const rawPath = entry.path.split('/').map(encodeURIComponent).join('/');
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repository)}/${encodeURIComponent(branch)}/${rawPath}`;
    const response = await fetchWithTimeout(rawUrl, fetcher);
    if (!response.ok) {
      throw new RepositoryAcquisitionError(
        'remote-failure',
        'GitHub could not provide one of the selected source files.',
      );
    }
    const bytes = await readResponseBytes(response);
    if (bytes.byteLength > REPOSITORY_LIMITS.maxFileBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }
    if (totalBytes + bytes.byteLength > REPOSITORY_LIMITS.maxTotalBytes) {
      ignoredFiles.push(entry.path);
      continue;
    }
    totalBytes += bytes.byteLength;
    files.push({ filePath: entry.path, text: new TextDecoder().decode(bytes) });
  }

  if (files.length === 0) {
    throw new UnsupportedRepositoryError();
  }

  return {
    files,
    ignoredFiles: [...new Set(ignoredFiles)],
    repository: {
      name: metadata.name ?? parsed.repository,
      url: parsed.canonicalUrl,
      branch,
    },
  };
}

export function isSupportedSourcePath(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/');
  if (
    normalized.startsWith('/') ||
    normalized.split('/').some((segment) => segment === '..' || segment === '')
  ) {
    return false;
  }
  const segments = normalized.toLowerCase().split('/');
  const ignoredDirectories = new Set([
    '.git',
    'node_modules',
    'vendor',
    'dist',
    'build',
    'coverage',
    'generated',
    '__generated__',
  ]);
  if (
    segments.slice(0, -1).some((segment) => ignoredDirectories.has(segment))
  ) {
    return false;
  }
  return /\.(ts|tsx)$/.test(normalized);
}

async function fetchJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetchWithTimeout(url, fetcher);
  if (!response.ok) {
    const message =
      response.status === 404
        ? 'The public GitHub repository was not found.'
        : 'GitHub could not be reached or rejected the repository request.';
    throw new RepositoryAcquisitionError('remote-failure', message);
  }
  return (await response.json()) as T;
}

async function fetchWithTimeout(
  url: string,
  fetcher: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REPOSITORY_LIMITS.timeoutMs,
  );
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
        ? 'GitHub repository acquisition timed out.'
        : 'GitHub could not be reached or rejected the repository request.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > REPOSITORY_LIMITS.maxFileBytes
  ) {
    throw new RepositoryAcquisitionError(
      'limit-exceeded',
      'A selected source file exceeds the supported size limit.',
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
      if (total > REPOSITORY_LIMITS.maxFileBytes) {
        await reader.cancel();
        throw new RepositoryAcquisitionError(
          'limit-exceeded',
          'A selected source file exceeds the supported size limit.',
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
  return new TextEncoder().encode(await response.text());
}
