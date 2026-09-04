import ts from 'typescript';

import type {
  AnalysisIssue,
  Evidence,
  PackageTopologyEntity,
  PackageTopologyProjection,
  PackageTopologyRelationship,
  SourceLocation,
} from './model.js';
import type {
  RepositoryMetadataInput,
  TypeScriptSourceInput,
} from './typescript-flow.js';

interface PackageManifest {
  filePath: string;
  rootPath: string;
  name: string;
  dependencies: string[];
  workspacePatterns: string[];
}

interface AliasRule {
  key: string;
  targets: string[];
  configDirectory: string;
}

export function buildPackageTopology(
  files: TypeScriptSourceInput[],
  metadata: RepositoryMetadataInput[] = [],
): PackageTopologyProjection | undefined {
  if (metadata.length === 0) {
    return undefined;
  }

  const issues: AnalysisIssue[] = [];
  const manifests = metadata
    .filter((item) => basename(item.filePath) === 'package.json')
    .map((item) => parsePackageManifest(item, issues))
    .filter((item): item is PackageManifest => item !== null)
    .sort((left, right) => left.rootPath.localeCompare(right.rootPath));

  if (manifests.length === 0) {
    return {
      rootId: null,
      entities: [],
      relationships: [],
      externalDependencies: [],
      fileOwners: {},
      status: issues.length > 0 ? 'partial' : 'complete',
      issues,
    };
  }

  const workspacePatterns = collectWorkspacePatterns(metadata, manifests, issues);
  const workspaceConfigured = workspacePatterns.length > 0;
  const entities: PackageTopologyEntity[] = [];
  const relationships = new Map<string, PackageTopologyRelationship>();
  const packageByName = new Map<string, PackageManifest>();
  const packageEntityByRoot = new Map<string, PackageTopologyEntity>();

  let rootId: string | null = null;
  if (workspaceConfigured) {
    rootId = 'workspace:.';
    const workspaceMetadata =
      metadata.find((item) => basename(item.filePath) === 'pnpm-workspace.yaml') ??
      metadata.find(
        (item) => basename(item.filePath) === 'package.json' && dirname(item.filePath) === '.',
      );
    entities.push({
      id: rootId,
      kind: 'Workspace',
      name: 'Workspace',
      path: '.',
      location:
        workspaceMetadata === undefined
          ? null
          : textLocation(workspaceMetadata, 'packages'),
      evidence:
        workspaceMetadata === undefined
          ? []
          : [
              configuredEvidence(
                workspaceMetadata,
                'Workspace membership is declared by repository metadata.',
                'packages',
              ),
            ],
    });
  }

  for (const manifest of manifests) {
    if (
      workspaceConfigured &&
      manifest.rootPath !== '.' &&
      !workspacePatterns.some((pattern) => matchesWorkspacePattern(manifest.rootPath, pattern))
    ) {
      continue;
    }
    const entity: PackageTopologyEntity = {
      id: packageId(manifest.rootPath),
      kind: 'Package',
      name: manifest.name,
      path: manifest.rootPath,
      location: metadataLocation(metadata, manifest.filePath, manifest.name),
      evidence: [
        configuredEvidence(
          metadata.find((item) => item.filePath === manifest.filePath)!,
          'Package identity is declared by package.json metadata.',
          manifest.name,
        ),
      ],
    };
    entities.push(entity);
    packageByName.set(manifest.name, manifest);
    packageEntityByRoot.set(manifest.rootPath, entity);
    if (rootId !== null) {
      addRelationship(
        relationships,
        topologyRelationship(
          'CONTAINS',
          rootId,
          entity.id,
          entity.evidence[0]!,
        ),
      );
    }
  }

  const activePackages = new Set(packageEntityByRoot.values());
  for (const manifest of manifests) {
    const sourceEntity = packageEntityByRoot.get(manifest.rootPath);
    if (sourceEntity === undefined || !activePackages.has(sourceEntity)) {
      continue;
    }
    const manifestMetadata = metadata.find((item) => item.filePath === manifest.filePath)!;
    for (const dependency of manifest.dependencies) {
      const targetManifest = packageByName.get(dependency);
      const targetEntity =
        targetManifest === undefined
          ? undefined
          : packageEntityByRoot.get(targetManifest.rootPath);
      if (targetEntity === undefined) {
        continue;
      }
      addRelationship(
        relationships,
        topologyRelationship(
          'DEPENDS_ON',
          sourceEntity.id,
          targetEntity.id,
          configuredEvidence(
            manifestMetadata,
            `package.json declares an internal dependency on ${dependency}.`,
            dependency,
          ),
        ),
      );
    }
  }

  const fileOwners: Record<string, string> = {};
  for (const file of files) {
    const owner = findPackageOwner(file.filePath, packageEntityByRoot);
    if (owner !== null) {
      fileOwners[file.filePath] = owner.id;
    }
  }

  const aliasRules = collectAliasRules(metadata, issues);
  collectStaticPackageDependencies(
    files,
    packageEntityByRoot,
    packageByName,
    fileOwners,
    aliasRules,
    relationships,
  );

  const internalNames = new Set(packageByName.keys());
  const externalDependencies = manifests.flatMap((manifest) => {
    const entity = packageEntityByRoot.get(manifest.rootPath);
    if (entity === undefined) {
      return [];
    }
    return manifest.dependencies
      .filter((dependency) => !internalNames.has(dependency))
      .map((name) => ({ packageId: entity.id, name }));
  });

  return {
    rootId,
    entities: entities.sort((left, right) => left.path.localeCompare(right.path)),
    relationships: [...relationships.values()].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
    externalDependencies: dedupeExternalDependencies(externalDependencies),
    fileOwners,
    status: issues.length > 0 ? 'partial' : 'complete',
    issues,
  };
}

function parsePackageManifest(
  metadata: RepositoryMetadataInput,
  issues: AnalysisIssue[],
): PackageManifest | null {
  try {
    const parsed = JSON.parse(metadata.text) as unknown;
    if (!isRecord(parsed)) {
      throw new Error('package.json must contain an object.');
    }
    const rootPath = dirname(metadata.filePath);
    const name =
      typeof parsed.name === 'string' && parsed.name.trim() !== ''
        ? parsed.name
        : rootPath === '.'
          ? 'root'
          : basename(rootPath);
    const dependencies = [
      ...keysOfRecord(parsed.dependencies),
      ...keysOfRecord(parsed.devDependencies),
      ...keysOfRecord(parsed.peerDependencies),
      ...keysOfRecord(parsed.optionalDependencies),
    ];
    const workspacePatterns = Array.isArray(parsed.workspaces)
      ? parsed.workspaces.filter((value): value is string => typeof value === 'string')
      : isRecord(parsed.workspaces) && Array.isArray(parsed.workspaces.packages)
        ? parsed.workspaces.packages.filter(
            (value): value is string => typeof value === 'string',
          )
        : [];
    return {
      filePath: metadata.filePath,
      rootPath,
      name,
      dependencies: [...new Set(dependencies)].sort(),
      workspacePatterns,
    };
  } catch {
    issues.push({
      kind: 'invalid',
      filePath: metadata.filePath,
      message: 'Package metadata could not be parsed; other repository evidence remains usable.',
    });
    return null;
  }
}

function collectWorkspacePatterns(
  metadata: RepositoryMetadataInput[],
  manifests: PackageManifest[],
  issues: AnalysisIssue[],
): string[] {
  const patterns = new Set<string>();
  for (const manifest of manifests) {
    if (manifest.rootPath === '.') {
      manifest.workspacePatterns.forEach((pattern) => patterns.add(normalizePattern(pattern)));
    }
  }
  for (const item of metadata.filter(
    (candidate) => basename(candidate.filePath) === 'pnpm-workspace.yaml',
  )) {
    try {
      for (const pattern of parsePnpmWorkspacePatterns(item.text)) {
        patterns.add(normalizePattern(pattern));
      }
    } catch {
      issues.push({
        kind: 'invalid',
        filePath: item.filePath,
        message: 'pnpm workspace metadata could not be parsed; package manifests remain usable.',
      });
    }
  }
  return [...patterns].filter(Boolean).sort();
}

function parsePnpmWorkspacePatterns(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const patterns: string[] = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^packages\s*:/.test(line.trim())) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    const match = line.match(/^\s*-\s*["']?([^"'#]+)["']?\s*(?:#.*)?$/);
    if (match?.[1] !== undefined) {
      patterns.push(match[1].trim());
      continue;
    }
    if (line.trim() !== '' && !/^\s/.test(line)) {
      break;
    }
  }
  return patterns;
}

function collectAliasRules(
  metadata: RepositoryMetadataInput[],
  issues: AnalysisIssue[],
): AliasRule[] {
  const rules: AliasRule[] = [];
  for (const item of metadata.filter((candidate) =>
    /^tsconfig(?:\.[^/]+)?\.json$/i.test(basename(candidate.filePath)),
  )) {
    const parsed = ts.parseConfigFileTextToJson(item.filePath, item.text);
    if (parsed.error !== undefined || !isRecord(parsed.config)) {
      issues.push({
        kind: 'invalid',
        filePath: item.filePath,
        message: 'TypeScript configuration could not be parsed; static source analysis remains available.',
      });
      continue;
    }
    const compilerOptions = isRecord(parsed.config.compilerOptions)
      ? parsed.config.compilerOptions
      : {};
    const paths = isRecord(compilerOptions.paths) ? compilerOptions.paths : {};
    const baseUrl =
      typeof compilerOptions.baseUrl === 'string' ? compilerOptions.baseUrl : '.';
    const configDirectory = normalizePath(`${dirname(item.filePath)}/${baseUrl}`);
    for (const [key, rawTargets] of Object.entries(paths)) {
      if (!Array.isArray(rawTargets)) continue;
      const targets = rawTargets.filter(
        (target): target is string => typeof target === 'string',
      );
      if (targets.length > 0) {
        rules.push({ key, targets, configDirectory });
      }
    }
  }
  return rules.sort(
    (left, right) => right.configDirectory.length - left.configDirectory.length,
  );
}

function collectStaticPackageDependencies(
  files: TypeScriptSourceInput[],
  packageEntityByRoot: Map<string, PackageTopologyEntity>,
  packageByName: Map<string, PackageManifest>,
  fileOwners: Record<string, string>,
  aliasRules: AliasRule[],
  relationships: Map<string, PackageTopologyRelationship>,
): void {
  const availableFiles = new Set(files.map((file) => file.filePath));
  const entityById = new Map(
    [...packageEntityByRoot.values()].map((entity) => [entity.id, entity]),
  );
  for (const file of files) {
    const sourcePackageId = fileOwners[file.filePath];
    if (sourcePackageId === undefined) continue;
    const sourceFile = ts.createSourceFile(
      file.filePath,
      file.sourceText,
      ts.ScriptTarget.Latest,
      true,
      file.filePath.toLowerCase().endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    for (const statement of sourceFile.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteralLike(statement.moduleSpecifier)
      ) {
        continue;
      }
      const specifier = statement.moduleSpecifier.text;
      let targetPackage: PackageTopologyEntity | undefined;
      for (const [name, manifest] of packageByName) {
        if (specifier === name || specifier.startsWith(`${name}/`)) {
          targetPackage = packageEntityByRoot.get(manifest.rootPath);
          break;
        }
      }
      if (targetPackage === undefined) {
        const targetFile = resolveAliasTarget(
          specifier,
          file.filePath,
          aliasRules,
          availableFiles,
        );
        if (targetFile !== null) {
          const targetPackageId = fileOwners[targetFile];
          if (targetPackageId !== undefined) {
            targetPackage = entityById.get(targetPackageId);
          }
        }
      }
      if (targetPackage === undefined || targetPackage.id === sourcePackageId) {
        continue;
      }
      addRelationship(
        relationships,
        topologyRelationship(
          'DEPENDS_ON',
          sourcePackageId,
          targetPackage.id,
          staticEvidence(
            sourceFile,
            statement.moduleSpecifier,
            file.filePath,
            `This import statically references code owned by ${targetPackage.name}.`,
          ),
        ),
      );
    }
  }
}

function resolveAliasTarget(
  specifier: string,
  sourceFilePath: string,
  rules: AliasRule[],
  availableFiles: Set<string>,
): string | null {
  for (const rule of rules) {
    if (!isAncestor(rule.configDirectory, dirname(sourceFilePath))) continue;
    const wildcard = matchAlias(rule.key, specifier);
    if (wildcard === null) continue;
    for (const target of rule.targets) {
      const mapped = target.includes('*') ? target.replace('*', wildcard) : target;
      const base = normalizePath(`${rule.configDirectory}/${mapped}`);
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}/index.ts`,
        `${base}/index.tsx`,
      ];
      const resolved = candidates.find((candidate) => availableFiles.has(candidate));
      if (resolved !== undefined) return resolved;
    }
  }
  return null;
}

function matchAlias(pattern: string, specifier: string): string | null {
  const star = pattern.indexOf('*');
  if (star < 0) return pattern === specifier ? '' : null;
  const prefix = pattern.slice(0, star);
  const suffix = pattern.slice(star + 1);
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return null;
  return specifier.slice(prefix.length, specifier.length - suffix.length);
}

function findPackageOwner(
  filePath: string,
  packages: Map<string, PackageTopologyEntity>,
): PackageTopologyEntity | null {
  const candidates = [...packages.entries()]
    .filter(([root]) => root === '.' || filePath.startsWith(`${root}/`))
    .sort((left, right) => right[0].length - left[0].length);
  return candidates[0]?.[1] ?? null;
}

function matchesWorkspacePattern(path: string, pattern: string): boolean {
  if (pattern.startsWith('!')) return false;
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**', '§§')
    .replaceAll('*', '[^/]*')
    .replaceAll('§§', '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

function topologyRelationship(
  kind: PackageTopologyRelationship['kind'],
  sourceId: string,
  targetId: string,
  evidence: Evidence,
): PackageTopologyRelationship {
  return {
    id: `${kind.toLowerCase()}:${sourceId}:${targetId}`,
    kind,
    sourceId,
    targetId,
    evidence: [evidence],
  };
}

function addRelationship(
  relationships: Map<string, PackageTopologyRelationship>,
  candidate: PackageTopologyRelationship,
): void {
  const existing = relationships.get(candidate.id);
  if (existing === undefined) {
    relationships.set(candidate.id, candidate);
    return;
  }
  for (const evidence of candidate.evidence) {
    if (
      !existing.evidence.some(
        (item) =>
          item.location.filePath === evidence.location.filePath &&
          item.location.startLine === evidence.location.startLine &&
          item.location.startColumn === evidence.location.startColumn,
      )
    ) {
      existing.evidence.push(evidence);
    }
  }
}

function configuredEvidence(
  metadata: RepositoryMetadataInput,
  reason: string,
  token: string,
): Evidence {
  return {
    kind: 'configured',
    source: basename(metadata.filePath),
    location: textLocation(metadata, token),
    reason,
  };
}

function staticEvidence(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  filePath: string,
  reason: string,
): Evidence {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    kind: 'verified-static',
    source: 'typescript-parser',
    location: {
      filePath,
      startLine: start.line + 1,
      startColumn: start.character + 1,
      endLine: end.line + 1,
      endColumn: end.character + 1,
    },
    reason,
  };
}

function textLocation(
  metadata: RepositoryMetadataInput,
  token: string,
): SourceLocation {
  const index = Math.max(0, metadata.text.indexOf(token));
  const before = metadata.text.slice(0, index);
  const lines = before.split(/\r?\n/);
  const line = lines.length;
  const column = (lines.at(-1)?.length ?? 0) + 1;
  return {
    filePath: metadata.filePath,
    startLine: line,
    startColumn: column,
    endLine: line,
    endColumn: column + Math.max(1, token.length),
  };
}

function metadataLocation(
  metadata: RepositoryMetadataInput[],
  filePath: string,
  token: string,
): SourceLocation | null {
  const item = metadata.find((candidate) => candidate.filePath === filePath);
  return item === undefined ? null : textLocation(item, token);
}

function keysOfRecord(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function packageId(rootPath: string): string {
  return `package:${rootPath}`;
}

function normalizePattern(pattern: string): string {
  return pattern.trim().replace(/^\.\//, '').replace(/\/$/, '');
}

function dirname(filePath: string): string {
  const normalized = normalizePath(filePath);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? '.' : normalized.slice(0, index) || '.';
}

function basename(filePath: string): string {
  const normalized = normalizePath(filePath);
  const index = normalized.lastIndexOf('/');
  return index < 0 ? normalized : normalized.slice(index + 1);
}

function normalizePath(path: string): string {
  const result: string[] = [];
  for (const segment of path.replaceAll('\\', '/').split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      result.pop();
      continue;
    }
    result.push(segment);
  }
  return result.join('/') || '.';
}

function isAncestor(ancestor: string, path: string): boolean {
  return ancestor === '.' || path === ancestor || path.startsWith(`${ancestor}/`);
}

function dedupeExternalDependencies(
  dependencies: Array<{ packageId: string; name: string }>,
): Array<{ packageId: string; name: string }> {
  const seen = new Set<string>();
  return dependencies.filter((dependency) => {
    const key = `${dependency.packageId}:${dependency.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
