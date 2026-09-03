import ts from 'typescript';

import type {
  AnalysisSummary,
  EntryPointConfidence,
  EntryPointSuggestion,
  Evidence,
  EvidenceKind,
  FlowProjection,
  RepositorySource,
  RepositorySummary,
  SemanticEntity,
  SemanticRelationship,
  SourceLocation,
} from './model.js';

export interface AnalyzeTypeScriptRepositoryInput {
  files: RepositorySource[];
  ignoredFiles?: string[];
  repository?: RepositorySummary;
  entryPoint?: { filePath: string; name: string };
}

export interface RepositoryAnalysisResult {
  projection: FlowProjection;
  entryPoints: EntryPointSuggestion[];
}

interface FunctionRecord {
  declaration: ts.FunctionDeclaration;
  entity: SemanticEntity;
  sourceFile: ts.SourceFile;
}

const ENTRY_NAMES = new Set([
  'main',
  'start',
  'bootstrap',
  'handleRequest',
  'createRouter',
  'processJob',
  'worker',
]);

const ENTRY_PATHS = new Set([
  'src/index.ts',
  'src/main.ts',
  'src/server.ts',
  'src/app.ts',
  'src/worker.ts',
  'index.ts',
  'server.ts',
  'app.ts',
]);

export function analyzeTypeScriptRepository(
  input: AnalyzeTypeScriptRepositoryInput,
): RepositoryAnalysisResult {
  const files = [...input.files].sort((left, right) =>
    left.filePath.localeCompare(right.filePath),
  );
  const virtualFiles = new Map(
    files.map((file) => [toCompilerPath(file.filePath), file]),
  );
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2023,
    jsx: ts.JsxEmit.ReactJSX,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (requestedPath) =>
      virtualFiles.has(normalizeCompilerPath(requestedPath)) ||
      defaultHost.fileExists(requestedPath),
    getSourceFile: (requestedPath, languageVersion, onError, shouldCreate) => {
      const file = virtualFiles.get(normalizeCompilerPath(requestedPath));
      if (file !== undefined) {
        return ts.createSourceFile(
          requestedPath,
          file.text,
          languageVersion,
          true,
          scriptKindFor(file.filePath),
        );
      }

      return defaultHost.getSourceFile(
        requestedPath,
        languageVersion,
        onError,
        shouldCreate,
      );
    },
    readFile: (requestedPath) =>
      virtualFiles.get(normalizeCompilerPath(requestedPath))?.text ??
      defaultHost.readFile(requestedPath),
  };
  const rootNames = files.map((file) => toCompilerPath(file.filePath));
  const program = ts.createProgram({ rootNames, options, host });
  const checker = program.getTypeChecker();
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) =>
      virtualFiles.has(normalizeCompilerPath(sourceFile.fileName)),
    );
  const functions = collectFunctions(sourceFiles, virtualFiles);
  const declarationToFunction = new Map<ts.Declaration, FunctionRecord>();
  for (const record of functions.values()) {
    declarationToFunction.set(record.declaration, record);
  }

  const relationships = collectCallRelationships(
    checker,
    functions,
    declarationToFunction,
  );
  const entryPoints = discoverEntryPoints(
    [...functions.values()].map(({ entity }) => entity),
  );
  const selectedEntry = selectEntryPoint(input.entryPoint, entryPoints);
  if (selectedEntry === undefined) {
    throw new Error('No exported TypeScript entry point was found.');
  }

  const reachable = getReachableEntityIds(selectedEntry.id, relationships);
  const sourceByPath = new Map(files.map((file) => [file.filePath, file]));
  const source = sourceByPath.get(selectedEntry.filePath);
  if (source === undefined) {
    throw new Error('The selected entry point source is unavailable.');
  }

  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  const ignoredFiles = input.ignoredFiles ?? [];
  const unsupportedDynamicImports = countUnsupportedDynamicImports(sourceFiles);
  const limitations = buildLimitations(
    ignoredFiles,
    diagnostics.length,
    unsupportedDynamicImports,
  );
  const analysis: AnalysisSummary = {
    state: limitations.length > 0 ? 'PARTIAL' : 'READY',
    filesAnalyzed: files.length,
    filesIgnored: ignoredFiles.length,
    functions: functions.size,
    relationships: relationships.length,
    unresolvedReferences: 0,
    unsupportedDynamicImports,
    limitations,
  };

  return {
    entryPoints,
    projection: {
      id: `flow:${selectedEntry.id}`,
      entryPointId: selectedEntry.id,
      nodes: [...functions.values()]
        .filter(({ entity }) => reachable.has(entity.id))
        .map(({ entity }) => ({
          id: entity.id,
          kind: entity.kind,
          label: entity.name,
          location: entity.location,
          entryPoint: entity.id === selectedEntry.id,
        })),
      edges: relationships.filter(
        (relationship) =>
          reachable.has(relationship.sourceId) &&
          reachable.has(relationship.targetId),
      ),
      source,
      sources: files,
      entryPoints,
      analysis,
      ...(input.repository === undefined
        ? {}
        : { repository: input.repository }),
    },
  };
}

export function discoverEntryPoints(
  entities: SemanticEntity[],
): EntryPointSuggestion[] {
  return entities
    .filter((entity) => entity.attributes.exported)
    .map((entity) => {
      const path = entity.location.filePath.toLowerCase();
      const baseName = path.split('/').at(-1) ?? path;
      const nameMatch = ENTRY_NAMES.has(entity.name);
      const pathMatch = ENTRY_PATHS.has(path) || baseName === 'index.ts';
      const confidence: EntryPointConfidence =
        nameMatch || pathMatch ? 'detected' : 'likely';
      const reason = nameMatch
        ? `Exported ${entity.name} follows a deterministic application entry naming convention.`
        : pathMatch
          ? `Exported function is located in a conventional bootstrap file.`
          : `Exported function is available as a repository symbol.`;

      return {
        id: entity.id,
        name: entity.name,
        filePath: entity.location.filePath,
        confidence,
        reason,
      };
    })
    .sort((left, right) => {
      const confidenceOrder = { detected: 0, likely: 1, manual: 2 };
      return (
        confidenceOrder[left.confidence] - confidenceOrder[right.confidence] ||
        left.filePath.localeCompare(right.filePath) ||
        left.name.localeCompare(right.name)
      );
    });
}

function collectFunctions(
  sourceFiles: ts.SourceFile[],
  virtualFiles: Map<string, RepositorySource>,
): Map<string, FunctionRecord> {
  const functions = new Map<string, FunctionRecord>();

  for (const sourceFile of sourceFiles) {
    const file = virtualFiles.get(normalizeCompilerPath(sourceFile.fileName));
    if (file === undefined) {
      continue;
    }

    for (const statement of sourceFile.statements) {
      if (
        !ts.isFunctionDeclaration(statement) ||
        statement.name === undefined ||
        statement.body === undefined
      ) {
        continue;
      }

      const entity: SemanticEntity = {
        id: `function:${file.filePath}:${statement.name.text}`,
        kind: 'Function',
        name: statement.name.text,
        location: locationOf(sourceFile, statement, file.filePath),
        attributes: {
          exported:
            statement.modifiers?.some(
              (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
            ) ?? false,
        },
      };
      functions.set(entity.id, { declaration: statement, entity, sourceFile });
    }
  }

  return functions;
}

function collectCallRelationships(
  checker: ts.TypeChecker,
  functions: Map<string, FunctionRecord>,
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): SemanticRelationship[] {
  const relationships: SemanticRelationship[] = [];

  for (const sourceFunction of functions.values()) {
    const body = sourceFunction.declaration.body;
    if (body === undefined) {
      continue;
    }
    const aliases = collectFunctionAliases(
      body,
      checker,
      declarationToFunction,
    );
    const importedNames = collectImportedNames(sourceFunction.sourceFile);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const directTarget = resolveDirectFunction(
          node.expression,
          checker,
          declarationToFunction,
        );
        const aliasTarget = aliases.get(node.expression.text);
        const importedTarget = importedNames.has(node.expression.text)
          ? findUniqueFunctionByName(functions, node.expression.text)
          : undefined;
        const target = directTarget ?? aliasTarget ?? importedTarget;
        if (target !== undefined) {
          const evidenceKind: EvidenceKind =
            directTarget === undefined ? 'inferred-static' : 'verified-static';
          const evidence: Evidence = {
            kind: evidenceKind,
            source: 'typescript-compiler-api',
            location: locationOf(
              sourceFunction.sourceFile,
              node,
              sourceFunction.entity.location.filePath,
            ),
            reason:
              evidenceKind === 'verified-static'
                ? 'TypeScript symbol resolution binds this call to a function declaration in the repository.'
                : aliasTarget !== undefined
                  ? `Local function alias ${node.expression.text} points to ${target.entity.name}; the call target is inferred from that assignment.`
                  : `Imported function ${node.expression.text} matches a unique repository declaration; the cross-file target is inferred from the bounded source set.`,
          };
          relationships.push({
            id: `calls:${sourceFunction.entity.id}:${target.entity.id}:${node.getStart(sourceFunction.sourceFile)}`,
            kind: 'CALLS',
            sourceId: sourceFunction.entity.id,
            targetId: target.entity.id,
            evidence: [evidence],
          });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
  }

  return relationships;
}

function collectImportedNames(sourceFile: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      continue;
    }
    const clause = statement.importClause;
    if (clause?.name !== undefined) names.add(clause.name.text);
    for (const element of clause?.namedBindings &&
    ts.isNamedImports(clause.namedBindings)
      ? clause.namedBindings.elements
      : []) {
      names.add(element.name.text);
    }
  }
  return names;
}

function findUniqueFunctionByName(
  functions: Map<string, FunctionRecord>,
  name: string,
): FunctionRecord | undefined {
  const matches = [...functions.values()].filter(
    ({ entity }) => entity.name === name,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

function collectFunctionAliases(
  body: ts.Block,
  checker: ts.TypeChecker,
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): Map<string, FunctionRecord> {
  const aliases = new Map<string, FunctionRecord>();
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isIdentifier(node.initializer)
    ) {
      const target = resolveDirectFunction(
        node.initializer,
        checker,
        declarationToFunction,
      );
      if (target !== undefined) {
        aliases.set(node.name.text, target);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return aliases;
}

function resolveDirectFunction(
  identifier: ts.Identifier,
  checker: ts.TypeChecker,
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): FunctionRecord | undefined {
  const symbol = checker.getSymbolAtLocation(identifier);
  if (symbol === undefined) {
    return undefined;
  }
  const resolved =
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  for (const declaration of resolved.declarations ?? []) {
    const target = declarationToFunction.get(declaration);
    if (target !== undefined) {
      return target;
    }
  }
  return undefined;
}

function selectEntryPoint(
  requested: AnalyzeTypeScriptRepositoryInput['entryPoint'],
  suggestions: EntryPointSuggestion[],
): EntryPointSuggestion | undefined {
  if (requested !== undefined) {
    return suggestions.find(
      (entryPoint) =>
        entryPoint.filePath === requested.filePath &&
        entryPoint.name === requested.name,
    );
  }
  return suggestions[0];
}

function getReachableEntityIds(
  entryPointId: string,
  relationships: SemanticRelationship[],
): Set<string> {
  const reachable = new Set([entryPointId]);
  const queue = [entryPointId];
  while (queue.length > 0) {
    const sourceId = queue.shift();
    if (sourceId === undefined) {
      break;
    }
    for (const relationship of relationships) {
      if (
        relationship.sourceId === sourceId &&
        !reachable.has(relationship.targetId)
      ) {
        reachable.add(relationship.targetId);
        queue.push(relationship.targetId);
      }
    }
  }
  return reachable;
}

function buildLimitations(
  ignoredFiles: string[],
  diagnosticCount: number,
  unsupportedDynamicImports: number,
): string[] {
  const limitations: string[] = [];
  if (ignoredFiles.length > 0) {
    limitations.push(
      `${ignoredFiles.length} file${ignoredFiles.length === 1 ? '' : 's'} ignored by repository scope filters.`,
    );
  }
  if (diagnosticCount > 0) {
    limitations.push(
      `${diagnosticCount} TypeScript diagnostic${diagnosticCount === 1 ? '' : 's'} could not be resolved from the bounded source set.`,
    );
  }
  if (unsupportedDynamicImports > 0) {
    limitations.push(
      `${unsupportedDynamicImports} dynamic import${unsupportedDynamicImports === 1 ? '' : 's'} could not be resolved statically.`,
    );
  }
  return limitations;
}

function countUnsupportedDynamicImports(sourceFiles: ts.SourceFile[]): number {
  let count = 0;
  for (const sourceFile of sourceFiles) {
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        (node.arguments[0] === undefined ||
          !ts.isStringLiteralLike(node.arguments[0]))
      ) {
        count += 1;
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return count;
}

function toCompilerPath(filePath: string): string {
  return `/${filePath.replaceAll('\\', '/').replace(/^\/+/, '')}`;
}

function normalizeCompilerPath(filePath: string): string {
  return `/${filePath.replaceAll('\\', '/').replace(/^\/+/, '')}`;
}

function scriptKindFor(filePath: string): ts.ScriptKind {
  return filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function locationOf(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  displayFilePath: string,
): SourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    filePath: displayFilePath,
    startLine: start.line + 1,
    startColumn: start.character + 1,
    endLine: end.line + 1,
    endColumn: end.character + 1,
  };
}
