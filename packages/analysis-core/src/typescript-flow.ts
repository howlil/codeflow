import ts from 'typescript';

import type {
  AnalysisIssue,
  Evidence,
  EvidenceKind,
  FlowProjection,
  SemanticEntity,
  SemanticGraph,
  SemanticRelationship,
  SourceLocation,
} from './model.js';

export interface AnalyzeTypeScriptFlowInput {
  filePath: string;
  sourceText: string;
  entryPointName: string;
}

export interface TypeScriptSourceInput {
  filePath: string;
  sourceText: string;
}

export interface AnalyzeTypeScriptRepositoryInput {
  files: TypeScriptSourceInput[];
  entryPoint: {
    filePath: string;
    name: string;
  };
}

interface FunctionRecord {
  declaration: ts.FunctionDeclaration;
  entity: SemanticEntity;
}

export function analyzeTypeScriptFlow(
  input: AnalyzeTypeScriptFlowInput,
): FlowProjection {
  return analyzeTypeScriptRepository({
    files: [{ filePath: input.filePath, sourceText: input.sourceText }],
    entryPoint: {
      filePath: input.filePath,
      name: input.entryPointName,
    },
  });
}

export function analyzeTypeScriptRepository(
  input: AnalyzeTypeScriptRepositoryInput,
): FlowProjection {
  if (input.files.length === 0) {
    throw new Error('At least one TypeScript source file is required.');
  }

  const files = [...input.files].sort((left, right) =>
    left.filePath.localeCompare(right.filePath),
  );
  const { program, displayPathByCompilerPath } = createProgram(files);
  const checker = program.getTypeChecker();
  const functions: FunctionRecord[] = [];
  const declarationToFunction = new Map<ts.Declaration, FunctionRecord>();

  for (const sourceFile of program.getSourceFiles()) {
    const displayFilePath = displayPathByCompilerPath.get(sourceFile.fileName);
    if (displayFilePath === undefined) {
      continue;
    }

    for (const record of collectFunctions(sourceFile, displayFilePath)) {
      functions.push(record);
      declarationToFunction.set(record.declaration, record);
    }
  }

  const graph: SemanticGraph = {
    entities: functions.map(({ entity }) => entity),
    relationships: collectCallRelationships(
      checker,
      functions,
      declarationToFunction,
    ),
  };
  const issues = collectAnalysisIssues(
    program,
    checker,
    displayPathByCompilerPath,
  );

  return projectRepositoryFlow(graph, files, input.entryPoint, issues);
}

function createProgram(files: TypeScriptSourceInput[]): {
  program: ts.Program;
  displayPathByCompilerPath: Map<string, string>;
} {
  const options: ts.CompilerOptions = {
    allowJs: false,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2023,
  };
  const sourceFiles = new Map<string, ts.SourceFile>();
  const displayPathByCompilerPath = new Map<string, string>();

  for (const file of files) {
    const compilerPath = compilerPathFor(file.filePath);
    sourceFiles.set(
      compilerPath,
      ts.createSourceFile(
        compilerPath,
        file.sourceText,
        ts.ScriptTarget.Latest,
        true,
        file.filePath.toLowerCase().endsWith('.tsx')
          ? ts.ScriptKind.TSX
          : ts.ScriptKind.TS,
      ),
    );
    displayPathByCompilerPath.set(compilerPath, file.filePath);
  }

  const host: ts.CompilerHost = {
    directoryExists: (directoryName) =>
      directoryExists(directoryName, sourceFiles.keys()),
    fileExists: (fileName) => sourceFiles.has(fileName),
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => '/lib.d.ts',
    getDirectories: () => [],
    getNewLine: () => '\n',
    getSourceFile: (fileName) => sourceFiles.get(fileName),
    readFile: (fileName) => sourceFiles.get(fileName)?.text,
    realpath: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    writeFile: () => undefined,
  };
  const program = ts.createProgram({
    rootNames: [...sourceFiles.keys()],
    options,
    host,
  });

  return { program, displayPathByCompilerPath };
}

function directoryExists(
  directoryName: string,
  fileNames: IterableIterator<string>,
): boolean {
  const prefix = directoryName.endsWith('/')
    ? directoryName
    : `${directoryName}/`;

  for (const fileName of fileNames) {
    if (fileName.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function collectFunctions(
  sourceFile: ts.SourceFile,
  displayFilePath: string,
): FunctionRecord[] {
  const functions: FunctionRecord[] = [];

  for (const statement of sourceFile.statements) {
    if (
      !ts.isFunctionDeclaration(statement) ||
      statement.name === undefined ||
      statement.body === undefined
    ) {
      continue;
    }

    const name = statement.name.text;
    const exported =
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ) ?? false;
    const entity: SemanticEntity = {
      id: functionId(displayFilePath, name),
      kind: 'Function',
      name,
      location: locationOf(sourceFile, statement, displayFilePath),
      attributes: { exported },
    };

    functions.push({ declaration: statement, entity });
  }

  return functions;
}

function collectCallRelationships(
  checker: ts.TypeChecker,
  functions: FunctionRecord[],
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): SemanticRelationship[] {
  const relationships: SemanticRelationship[] = [];

  for (const sourceFunction of functions) {
    const body = sourceFunction.declaration.body;
    if (body === undefined) {
      continue;
    }

    const aliases = collectFunctionAliases(
      body,
      checker,
      declarationToFunction,
    );
    const sourceFile = sourceFunction.declaration.getSourceFile();
    const displayFilePath = sourceFunction.entity.location.filePath;

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const directTarget = resolveDirectFunction(
          node.expression,
          checker,
          declarationToFunction,
        );
        const aliasTarget = aliases.get(node.expression.text);
        const target = directTarget ?? aliasTarget;

        if (target !== undefined) {
          const evidenceKind: EvidenceKind =
            directTarget !== undefined ? 'verified-static' : 'inferred-static';
          const evidence: Evidence = {
            kind: evidenceKind,
            source: 'typescript-compiler-api',
            location: locationOf(sourceFile, node, displayFilePath),
            reason:
              evidenceKind === 'verified-static'
                ? 'TypeScript symbol resolution binds this call directly to the target function declaration.'
                : `Local function alias ${node.expression.text} points to ${target.entity.name}; the call target is inferred from that assignment.`,
          };

          relationships.push({
            id: `calls:${sourceFunction.entity.id}:${target.entity.id}:${node.getStart(sourceFile)}`,
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

  const resolvedSymbol =
    (symbol.flags & ts.SymbolFlags.Alias) !== 0
      ? checker.getAliasedSymbol(symbol)
      : symbol;

  for (const declaration of resolvedSymbol.declarations ?? []) {
    const target = declarationToFunction.get(declaration);
    if (target !== undefined) {
      return target;
    }
  }

  return undefined;
}

function collectAnalysisIssues(
  program: ts.Program,
  checker: ts.TypeChecker,
  displayPathByCompilerPath: Map<string, string>,
): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    const displayFilePath = displayPathByCompilerPath.get(sourceFile.fileName);
    if (displayFilePath === undefined) {
      continue;
    }

    for (const diagnostic of program.getSyntacticDiagnostics(sourceFile).slice(0, 3)) {
      issues.push({
        kind: 'invalid',
        filePath: displayFilePath,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      });
    }

    for (const statement of sourceFile.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteralLike(statement.moduleSpecifier) ||
        !statement.moduleSpecifier.text.startsWith('.')
      ) {
        continue;
      }

      if (checker.getSymbolAtLocation(statement.moduleSpecifier) === undefined) {
        issues.push({
          kind: 'unsupported',
          filePath: displayFilePath,
          message: `Relative import ${statement.moduleSpecifier.text} could not be resolved from the selected repository files.`,
        });
      }
    }
  }

  return issues;
}

function projectRepositoryFlow(
  graph: SemanticGraph,
  files: TypeScriptSourceInput[],
  entryPointInput: AnalyzeTypeScriptRepositoryInput['entryPoint'],
  issues: AnalysisIssue[],
): FlowProjection {
  const entryPoint = graph.entities.find(
    (entity) =>
      entity.name === entryPointInput.name &&
      entity.location.filePath === entryPointInput.filePath &&
      entity.attributes.exported,
  );

  if (entryPoint === undefined) {
    throw new Error(
      `Exported entry point ${entryPointInput.name} was not found in ${entryPointInput.filePath}.`,
    );
  }

  const reachable = new Set<string>([entryPoint.id]);
  const queue = [entryPoint.id];

  while (queue.length > 0) {
    const sourceId = queue.shift();
    if (sourceId === undefined) {
      break;
    }

    for (const relationship of graph.relationships) {
      if (
        relationship.sourceId === sourceId &&
        !reachable.has(relationship.targetId)
      ) {
        reachable.add(relationship.targetId);
        queue.push(relationship.targetId);
      }
    }
  }

  const sources = files.map(({ filePath, sourceText }) => ({
    filePath,
    text: sourceText,
  }));
  const source = sources.find(
    (candidate) => candidate.filePath === entryPointInput.filePath,
  );

  if (source === undefined) {
    throw new Error(`Entry source ${entryPointInput.filePath} was not analyzed.`);
  }

  return {
    id: `flow:${entryPoint.id}`,
    entryPointId: entryPoint.id,
    nodes: graph.entities
      .filter((entity) => reachable.has(entity.id))
      .map((entity) => ({
        id: entity.id,
        kind: entity.kind,
        label: entity.name,
        location: entity.location,
        entryPoint: entity.id === entryPoint.id,
      })),
    edges: graph.relationships.filter(
      (relationship) =>
        reachable.has(relationship.sourceId) &&
        reachable.has(relationship.targetId),
    ),
    source,
    sources,
    analysis: {
      status: issues.length > 0 ? 'partial' : 'complete',
      analyzedFileCount: files.length,
      ignoredFileCount: 0,
      issues,
    },
  };
}

function compilerPathFor(filePath: string): string {
  const normalized = filePath
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
  return `/${normalized}`;
}

function functionId(filePath: string, name: string): string {
  return `function:${filePath}:${name}`;
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
