import { useMemo, useState, type FormEvent } from 'react';

import type { RepositoryAnalysisRequest } from '../../integrations/api/flow-client';
import { Button, Input, Select } from '../../components/ui/primitives';

const MAX_ANALYZED_FILES = 96;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_TOTAL_SOURCE_BYTES = 1_000_000;
const MAX_METADATA_FILES = 48;
const MAX_METADATA_FILE_BYTES = 64 * 1024;
const MAX_TOTAL_METADATA_BYTES = 512 * 1024;
const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);
const directoryInputAttributes = { webkitdirectory: '' };

interface SelectedSource {
  file: File;
  filePath: string;
}

export interface RepositorySelectionSummary {
  rootLabel: string;
  selectedFileCount: number;
  ignoredFileCount: number;
}

export function RepositoryPicker({
  busy,
  onAnalyze,
}: {
  busy: boolean;
  onAnalyze: (
    request: RepositoryAnalysisRequest,
    summary: RepositorySelectionSummary,
  ) => Promise<void>;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [entryFilePath, setEntryFilePath] = useState('');
  const [entryPointName, setEntryPointName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const candidates = useMemo(
    () => selectTypeScriptSources(selectedFiles),
    [selectedFiles],
  );
  const metadataCandidates = useMemo(
    () => selectRepositoryMetadata(selectedFiles),
    [selectedFiles],
  );
  const ignoredFileCount =
    selectedFiles.length - candidates.length - metadataCandidates.length;
  const selectionError = getSelectionError(candidates, metadataCandidates);
  const entryOptions =
    candidates.length === 0
      ? [{ value: '', label: 'Select a repository first', disabled: true }]
      : candidates.map(({ filePath }) => ({
          value: filePath,
          label: filePath,
        }));

  function handleFiles(fileList: FileList | null) {
    const files = fileList === null ? [] : Array.from(fileList);
    const nextCandidates = selectTypeScriptSources(files);
    setSelectedFiles(files);
    setEntryFilePath(nextCandidates[0]?.filePath ?? '');
    setLocalError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      selectionError !== null ||
      candidates.length === 0 ||
      entryFilePath === '' ||
      entryPointName.trim() === ''
    ) {
      return;
    }

    setLocalError(null);

    try {
      const files = await Promise.all(
        candidates.map(async ({ file, filePath }) => ({
          filePath,
          sourceText: await file.text(),
        })),
      );
      const metadata = await Promise.all(
        metadataCandidates.map(async ({ file, filePath }) => ({
          filePath,
          text: await file.text(),
        })),
      );
      const firstPath = candidates[0]?.filePath ?? 'Local repository';
      const rootLabel = firstPath.includes('/')
        ? firstPath.slice(0, firstPath.indexOf('/'))
        : 'Local repository';

      await onAnalyze(
        {
          files,
          metadata,
          entryPoint: {
            filePath: entryFilePath,
            name: entryPointName.trim(),
          },
        },
        {
          rootLabel,
          selectedFileCount: candidates.length,
          ignoredFileCount,
        },
      );
    } catch (error: unknown) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Unable to read the selected repository files.',
      );
    }
  }

  return (
    <form
      className="repository-input"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="repository-input-heading">
        <div>
          <p className="panel-kicker">Repository input</p>
          <strong>Analyze local TypeScript</strong>
        </div>
        <span>Files stay in-memory for this analysis request.</span>
      </div>

      <div className="repository-input-grid">
        <label className="file-control">
          <span>Repository directory</span>
          <Input
            {...directoryInputAttributes}
            className="file-input"
            type="file"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>

        <label>
          <span>Entry source file</span>
          <Select
            aria-label="Entry source file"
            value={entryFilePath}
            options={entryOptions}
            disabled={candidates.length === 0 || busy}
            onValueChange={setEntryFilePath}
          />
        </label>

        <label>
          <span>Exported entry function</span>
          <Input
            type="text"
            value={entryPointName}
            placeholder="handleRequest"
            disabled={busy}
            onChange={(event) => setEntryPointName(event.target.value)}
          />
        </label>

        <Button
          className="primary-action"
          variant="primary"
          size="md"
          type="submit"
          disabled={
            busy ||
            candidates.length === 0 ||
            entryFilePath === '' ||
            entryPointName.trim() === '' ||
            selectionError !== null
          }
        >
          {busy ? 'Analyzing…' : 'Analyze repository'}
        </Button>
      </div>

      {selectedFiles.length > 0 ? (
        <p className="repository-selection-note" role="status">
          {candidates.length} TypeScript source file
          {candidates.length === 1 ? '' : 's'} selected
          {metadataCandidates.length > 0
            ? ` · ${metadataCandidates.length} workspace/config metadata file${metadataCandidates.length === 1 ? '' : 's'} included`
            : ''}
          {ignoredFileCount > 0
            ? ` · ${ignoredFileCount} dependency, build, declaration, or unsupported file${ignoredFileCount === 1 ? '' : 's'} ignored before upload`
            : ''}
        </p>
      ) : null}

      {selectionError !== null || localError !== null ? (
        <p className="repository-input-error" role="alert">
          {selectionError ?? localError}
        </p>
      ) : null}
    </form>
  );
}

function selectTypeScriptSources(files: File[]): SelectedSource[] {
  return files
    .map((file) => ({ file, filePath: repositoryPathOf(file) }))
    .filter(({ filePath }) => isSupportedTypeScriptPath(filePath))
    .filter(({ filePath }) => !isIgnoredPath(filePath))
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
}

function selectRepositoryMetadata(files: File[]): SelectedSource[] {
  return files
    .map((file) => ({ file, filePath: repositoryPathOf(file) }))
    .filter(({ filePath }) => isSupportedMetadataPath(filePath))
    .filter(({ filePath }) => !isIgnoredPath(filePath))
    .sort((left, right) => left.filePath.localeCompare(right.filePath));
}

function getSelectionError(
  candidates: SelectedSource[],
  metadataCandidates: SelectedSource[],
): string | null {
  if (candidates.length > MAX_ANALYZED_FILES) {
    return `CodeFlow analyzes at most ${MAX_ANALYZED_FILES} TypeScript files per request. Choose a narrower repository directory.`;
  }

  const oversized = candidates.find(({ file }) => file.size > MAX_FILE_BYTES);
  if (oversized !== undefined) {
    return `${oversized.filePath} exceeds the ${MAX_FILE_BYTES}-byte per-file analysis limit.`;
  }

  const totalBytes = candidates.reduce(
    (total, { file }) => total + file.size,
    0,
  );
  if (totalBytes > MAX_TOTAL_SOURCE_BYTES) {
    return `Selected TypeScript source exceeds the ${MAX_TOTAL_SOURCE_BYTES}-byte analysis budget. Choose a narrower directory.`;
  }

  if (metadataCandidates.length > MAX_METADATA_FILES) {
    return `CodeFlow reads at most ${MAX_METADATA_FILES} workspace/config metadata files per request.`;
  }
  const oversizedMetadata = metadataCandidates.find(
    ({ file }) => file.size > MAX_METADATA_FILE_BYTES,
  );
  if (oversizedMetadata !== undefined) {
    return `${oversizedMetadata.filePath} exceeds the ${MAX_METADATA_FILE_BYTES}-byte metadata limit.`;
  }
  const totalMetadataBytes = metadataCandidates.reduce(
    (total, { file }) => total + file.size,
    0,
  );
  if (totalMetadataBytes > MAX_TOTAL_METADATA_BYTES) {
    return `Workspace/config metadata exceeds the ${MAX_TOTAL_METADATA_BYTES}-byte metadata budget.`;
  }

  return null;
}

function repositoryPathOf(file: File): string {
  const relativePath = (file as File & { webkitRelativePath?: string })
    .webkitRelativePath;
  return (
    relativePath && relativePath !== '' ? relativePath : file.name
  ).replaceAll('\\', '/');
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

function isSupportedMetadataPath(filePath: string): boolean {
  const name = filePath.split('/').at(-1)?.toLowerCase() ?? '';
  return (
    name === 'package.json' ||
    name === 'pnpm-workspace.yaml' ||
    /^tsconfig(?:\.[^/]+)?\.json$/.test(name)
  );
}
