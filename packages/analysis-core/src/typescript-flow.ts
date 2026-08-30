import ts from 'typescript';

import type {
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

interface FunctionRecord {
  declaration: ts.FunctionDeclaration;
  entity: SemanticEntity;
}

export function analyzeTypeScriptFlow(
  input: AnalyzeTypeScriptFlowInput,
): FlowProjection {
  const compilerPath = input.filePath.startsWith('/')
    ? input.filePath
    : `/${input.filePath}`;
  const sourceFile = ts.createSourceFile(
    compilerPath,
    input.sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const checker = createTypeChecker(compilerPath, input.sourceText, sourceFile);
  const functions = collectFunctions(sourceFile, input.filePath);
  const relationships = collectCallRelationships(
    sourceFile,
    checker,
    functions,
    input.filePath,
  );
  const graph: SemanticGraph = {
    entities: [...functions.values()].map(({ entity }) => entity),
    relationships,
  };

  return projectFlow(graph, input, input.entryPointName);
}

function createTypeChecker(
  filePath: string,
  sourceText: string,
  sourceFile: ts.SourceFile,
): ts.TypeChecker {
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2023,
  };
  const defaultHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...defaultHost,
    fileExists: (requestedPath) =>
      requestedPath === filePath || defaultHost.fileExists(requestedPath),
    getSourceFile: (requestedPath, languageVersion, onError, shouldCreate) => {
      if (requestedPath === filePath) {
        return sourceFile;
      }

      return defaultHost.getSourceFile(
        requestedPath,
        languageVersion,
        onError,
        shouldCreate,
      );
    },
    readFile: (requestedPath) =>
      requestedPath === filePath
        ? sourceText
        : defaultHost.readFile(requestedPath),
  };
  const program = ts.createProgram({
    rootNames: [filePath],
    options,
    host,
  });

  return program.getTypeChecker();
}

function collectFunctions(
  sourceFile: ts.SourceFile,
  displayFilePath: string,
): Map<string, FunctionRecord> {
  const functions = new Map<string, FunctionRecord>();

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

    functions.set(name, { declaration: statement, entity });
  }

  return functions;
}

function collectCallRelationships(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  functions: Map<string, FunctionRecord>,
  displayFilePath: string,
): SemanticRelationship[] {
  const relationships: SemanticRelationship[] = [];
  const declarationToFunction = new Map<ts.Declaration, FunctionRecord>(
    [...functions.values()].map((record) => [record.declaration, record]),
  );

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

  for (const declaration of symbol.declarations ?? []) {
    const target = declarationToFunction.get(declaration);
    if (target !== undefined) {
      return target;
    }
  }

  return undefined;
}

function projectFlow(
  graph: SemanticGraph,
  input: AnalyzeTypeScriptFlowInput,
  entryPointName: string,
): FlowProjection {
  const entryPoint = graph.entities.find(
    (entity) => entity.name === entryPointName && entity.attributes.exported,
  );

  if (entryPoint === undefined) {
    throw new Error(`Exported entry point ${entryPointName} was not found.`);
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
    source: {
      filePath: input.filePath,
      text: input.sourceText,
    },
  };
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
