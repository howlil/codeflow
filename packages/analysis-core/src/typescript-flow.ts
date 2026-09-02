import ts from 'typescript';

import type {
  AnalysisIssue,
  CallArgumentMapping,
  Evidence,
  EvidenceKind,
  FlowProjection,
  FunctionDataProjection,
  FunctionParameterProjection,
  FunctionReturnProjection,
  SemanticEntity,
  SemanticGraph,
  SemanticRelationship,
  SourceLocation,
  StaticFlowProjection,
  StaticFlowRelationship,
  StaticFlowStep,
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

interface CallRecord {
  sourceFunction: FunctionRecord;
  targetFunction: FunctionRecord;
  call: ts.CallExpression;
  evidenceKind: EvidenceKind;
}

interface CallAnalysis {
  relationships: SemanticRelationship[];
  calls: CallRecord[];
}

interface StaticDataAnalysis {
  functionData: FunctionDataProjection[];
  staticFlow: StaticFlowProjection;
}

const ASSIGNMENT_OPERATORS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

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

  const callAnalysis = collectCallAnalysis(
    checker,
    functions,
    declarationToFunction,
  );
  const graph: SemanticGraph = {
    entities: functions.map(({ entity }) => entity),
    relationships: callAnalysis.relationships,
  };
  const staticData = buildStaticDataAnalysis(
    checker,
    functions,
    callAnalysis.calls,
  );
  const issues = collectAnalysisIssues(
    program,
    checker,
    displayPathByCompilerPath,
  );

  return projectRepositoryFlow(
    graph,
    files,
    input.entryPoint,
    issues,
    staticData,
  );
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

function collectCallAnalysis(
  checker: ts.TypeChecker,
  functions: FunctionRecord[],
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): CallAnalysis {
  const relationships: SemanticRelationship[] = [];
  const calls: CallRecord[] = [];

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
      if (node !== body && ts.isFunctionLike(node)) {
        return;
      }

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
          const evidence: Evidence = evidenceAt(
            sourceFile,
            node,
            displayFilePath,
            evidenceKind,
            evidenceKind === 'verified-static'
              ? 'TypeScript symbol resolution binds this call directly to the target function declaration.'
              : `Local function alias ${node.expression.text} points to ${target.entity.name}; the call target is inferred from that assignment.`,
          );

          relationships.push({
            id: `calls:${sourceFunction.entity.id}:${target.entity.id}:${node.getStart(sourceFile)}`,
            kind: 'CALLS',
            sourceId: sourceFunction.entity.id,
            targetId: target.entity.id,
            evidence: [evidence],
          });
          calls.push({
            sourceFunction,
            targetFunction: target,
            call: node,
            evidenceKind,
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(body);
  }

  return { relationships, calls };
}

function collectFunctionAliases(
  body: ts.Block,
  checker: ts.TypeChecker,
  declarationToFunction: Map<ts.Declaration, FunctionRecord>,
): Map<string, FunctionRecord> {
  const aliases = new Map<string, FunctionRecord>();

  const visit = (node: ts.Node): void => {
    if (node !== body && ts.isFunctionLike(node)) {
      return;
    }

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

function buildStaticDataAnalysis(
  checker: ts.TypeChecker,
  functions: FunctionRecord[],
  calls: CallRecord[],
): StaticDataAnalysis {
  const functionData = functions.map((record) =>
    buildFunctionDataProjection(record, calls),
  );
  const steps: StaticFlowStep[] = [];
  const relationships: StaticFlowRelationship[] = [];
  const returnStepIdsByFunction = new Map<string, string[]>();
  const parameterStepIdsByFunction = new Map<string, string[]>();
  const bindingHistoryByFunction = new Map<
    string,
    Map<ts.Symbol, Array<{ position: number; stepId: string }>>
  >();

  for (const record of functions) {
    const sourceFile = record.declaration.getSourceFile();
    const filePath = record.entity.location.filePath;
    const body = record.declaration.body;
    if (body === undefined) {
      continue;
    }

    const localSymbols = collectLocalSymbols(checker, record);
    const bindingHistory = new Map<
      ts.Symbol,
      Array<{ position: number; stepId: string }>
    >();
    bindingHistoryByFunction.set(record.entity.id, bindingHistory);
    const parameterStepIds: string[] = [];

    record.declaration.parameters.forEach((parameter, index) => {
      const stepId = parameterStepId(record.entity.id, index);
      const parameterName = parameter.name.getText(sourceFile);
      const step: StaticFlowStep = {
        id: stepId,
        functionId: record.entity.id,
        kind: 'parameter',
        label: `Parameter ${parameterName}`,
        valueText: parameter.type?.getText(sourceFile) ?? null,
        location: locationOf(sourceFile, parameter, filePath),
        evidence: [
          evidenceAt(
            sourceFile,
            parameter,
            filePath,
            'verified-static',
            'The parameter is declared directly on this TypeScript function.',
          ),
        ],
      };
      steps.push(step);
      parameterStepIds.push(stepId);

      if (ts.isIdentifier(parameter.name)) {
        const symbol = checker.getSymbolAtLocation(parameter.name);
        if (symbol !== undefined) {
          recordBindingWrite(
            bindingHistory,
            symbol,
            parameter.getStart(sourceFile),
            stepId,
          );
        }
      }
    });
    parameterStepIdsByFunction.set(record.entity.id, parameterStepIds);

    const returnStepIds: string[] = [];

    const addReads = (expression: ts.Expression): string[] => {
      const readStepIds: string[] = [];
      for (const identifier of collectLocalReads(
        expression,
        checker,
        localSymbols,
      )) {
        const symbol = checker.getSymbolAtLocation(identifier);
        if (symbol === undefined) {
          continue;
        }

        const position = identifier.getStart(sourceFile);
        const stepId = `step:read:${record.entity.id}:${position}`;
        const step: StaticFlowStep = {
          id: stepId,
          functionId: record.entity.id,
          kind: 'read',
          label: `Read ${identifier.text}`,
          valueText: identifier.text,
          location: locationOf(sourceFile, identifier, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              identifier,
              filePath,
              'verified-static',
              'This local or parameter binding is referenced by the expression.',
            ),
          ],
        };
        steps.push(step);
        readStepIds.push(stepId);

        const previousWrite = findLatestBindingWrite(
          bindingHistory,
          symbol,
          position,
        );
        relationships.push({
          id: `reads:${record.entity.id}:${position}`,
          kind: 'READS',
          functionId: record.entity.id,
          sourceStepId: previousWrite,
          targetStepId: stepId,
          label: `Read ${identifier.text}`,
          evidence: [
            evidenceAt(
              sourceFile,
              identifier,
              filePath,
              previousWrite === null ? 'verified-static' : 'inferred-static',
              previousWrite === null
                ? 'The binding read is source-backed; no earlier supported write is projected.'
                : 'The read is connected to the latest earlier supported lexical write. Branch execution is not selected statically.',
            ),
          ],
        });
      }
      return readStepIds;
    };

    const addTransform = (
      expression: ts.Expression,
      inputStepIds: string[],
    ): string[] => {
      if (!isTransformExpression(expression)) {
        return inputStepIds;
      }

      const position = expression.getStart(sourceFile);
      const stepId = `step:transform:${record.entity.id}:${position}`;
      steps.push({
        id: stepId,
        functionId: record.entity.id,
        kind: 'transform',
        label: `Transform ${truncateSource(expression.getText(sourceFile))}`,
        valueText: expression.getText(sourceFile),
        location: locationOf(sourceFile, expression, filePath),
        evidence: [
          evidenceAt(
            sourceFile,
            expression,
            filePath,
            'verified-static',
            'The expression deterministically transforms or derives a value in source; no runtime result is fabricated.',
          ),
        ],
      });
      for (const inputStepId of inputStepIds) {
        relationships.push(
          flowRelationship(
            record.entity.id,
            'FLOWS_TO',
            inputStepId,
            stepId,
            `Value contributes to ${truncateSource(expression.getText(sourceFile))}`,
            evidenceAt(
              sourceFile,
              expression,
              filePath,
              'inferred-static',
              'The static expression consumes this local value. Branch/path execution remains unresolved.',
            ),
          ),
        );
      }
      return [stepId];
    };

    const connectInputs = (
      inputStepIds: string[],
      targetStepId: string,
      node: ts.Node,
    ): void => {
      for (const inputStepId of inputStepIds) {
        relationships.push(
          flowRelationship(
            record.entity.id,
            'FLOWS_TO',
            inputStepId,
            targetStepId,
            'Static value flow',
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'inferred-static',
              'Source structure establishes a static value dependency; it does not select a runtime path or value.',
            ),
          ),
        );
      }
    };

    const visit = (node: ts.Node): void => {
      if (node !== body && ts.isFunctionLike(node)) {
        return;
      }

      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer !== undefined
      ) {
        const readIds = addReads(node.initializer);
        const inputIds = addTransform(node.initializer, readIds);
        const position = node.getStart(sourceFile);
        const stepId = `step:declaration:${record.entity.id}:${position}`;
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'declaration',
          label: `Declare ${node.name.text}`,
          valueText: node.initializer.getText(sourceFile),
          location: locationOf(sourceFile, node, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'This local binding is initialized directly by the source expression.',
            ),
          ],
        });
        connectInputs(inputIds, stepId, node);
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol !== undefined) {
          recordBindingWrite(bindingHistory, symbol, position, stepId);
        }
        relationships.push({
          id: `writes:${record.entity.id}:${position}`,
          kind: 'WRITES',
          functionId: record.entity.id,
          sourceStepId: inputIds[0] ?? null,
          targetStepId: stepId,
          label: `Initialize ${node.name.text}`,
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'The variable declaration writes its initializer into the local binding.',
            ),
          ],
        });
        return;
      }

      if (
        ts.isBinaryExpression(node) &&
        ASSIGNMENT_OPERATORS.has(node.operatorToken.kind)
      ) {
        const readIds = addReads(node.right);
        const inputIds = addTransform(node.right, readIds);
        const position = node.getStart(sourceFile);
        const isLocalWrite = ts.isIdentifier(node.left);
        const stepId = `step:${isLocalWrite ? 'write' : 'mutation'}:${record.entity.id}:${position}`;
        const targetText = node.left.getText(sourceFile);
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: isLocalWrite ? 'write' : 'mutation',
          label: `${isLocalWrite ? 'Write' : 'Mutate'} ${truncateSource(targetText)}`,
          valueText: node.right.getText(sourceFile),
          location: locationOf(sourceFile, node, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              isLocalWrite
                ? 'The assignment writes a local binding directly in source.'
                : 'The assignment changes a property or indexed target directly in source.',
            ),
          ],
        });
        connectInputs(inputIds, stepId, node);

        const relationshipKind = isLocalWrite ? 'WRITES' : 'MUTATES';
        relationships.push({
          id: `${relationshipKind.toLowerCase()}:${record.entity.id}:${position}`,
          kind: relationshipKind,
          functionId: record.entity.id,
          sourceStepId: inputIds[0] ?? null,
          targetStepId: stepId,
          label: `${isLocalWrite ? 'Write' : 'Mutate'} ${truncateSource(targetText)}`,
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              isLocalWrite
                ? 'The source contains an explicit assignment to this local binding.'
                : 'The source contains an explicit assignment to this property or indexed target.',
            ),
          ],
        });

        if (isLocalWrite) {
          const symbol = checker.getSymbolAtLocation(node.left);
          if (symbol !== undefined) {
            recordBindingWrite(bindingHistory, symbol, position, stepId);
          }
        }
        return;
      }

      if (
        (ts.isPrefixUnaryExpression(node) ||
          ts.isPostfixUnaryExpression(node)) &&
        (node.operator === ts.SyntaxKind.PlusPlusToken ||
          node.operator === ts.SyntaxKind.MinusMinusToken)
      ) {
        const position = node.getStart(sourceFile);
        const target = node.operand;
        const targetText = target.getText(sourceFile);
        const stepId = `step:mutation:${record.entity.id}:${position}`;
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'mutation',
          label: `Mutate ${truncateSource(targetText)}`,
          valueText: node.getText(sourceFile),
          location: locationOf(sourceFile, node, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'The update expression mutates its target directly in source.',
            ),
          ],
        });
        relationships.push({
          id: `mutates:${record.entity.id}:${position}`,
          kind: 'MUTATES',
          functionId: record.entity.id,
          sourceStepId: null,
          targetStepId: stepId,
          label: `Mutate ${truncateSource(targetText)}`,
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'The update operator is an explicit mutation in the source.',
            ),
          ],
        });

        if (ts.isIdentifier(target)) {
          const symbol = checker.getSymbolAtLocation(target);
          if (symbol !== undefined) {
            recordBindingWrite(bindingHistory, symbol, position, stepId);
          }
        }
        return;
      }

      if (ts.isReturnStatement(node)) {
        const readIds =
          node.expression === undefined ? [] : addReads(node.expression);
        const inputIds =
          node.expression === undefined
            ? []
            : addTransform(node.expression, readIds);
        const position = node.getStart(sourceFile);
        const stepId = returnStepId(record.entity.id, position);
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'return',
          label:
            node.expression === undefined
              ? 'Return'
              : `Return ${truncateSource(node.expression.getText(sourceFile))}`,
          valueText: node.expression?.getText(sourceFile) ?? null,
          location: locationOf(sourceFile, node, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'This return path is declared directly in source. Static analysis does not claim that the path executes at runtime.',
            ),
          ],
        });
        connectInputs(inputIds, stepId, node);
        returnStepIds.push(stepId);
        return;
      }

      if (ts.isIfStatement(node)) {
        const readIds = addReads(node.expression);
        const position = node.getStart(sourceFile);
        const stepId = `step:branch:${record.entity.id}:${position}`;
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'branch',
          label: `Possible branch: ${truncateSource(node.expression.getText(sourceFile))}`,
          valueText: node.expression.getText(sourceFile),
          location: locationOf(sourceFile, node.expression, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node.expression,
              filePath,
              'verified-static',
              'The source declares a conditional branch. No branch outcome or probability is inferred.',
            ),
          ],
        });
        connectInputs(readIds, stepId, node.expression);
        visit(node.thenStatement);
        if (node.elseStatement !== undefined) {
          visit(node.elseStatement);
        }
        return;
      }

      if (ts.isSwitchStatement(node)) {
        const readIds = addReads(node.expression);
        const position = node.getStart(sourceFile);
        const stepId = `step:branch:${record.entity.id}:${position}`;
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'branch',
          label: `Possible switch: ${truncateSource(node.expression.getText(sourceFile))}`,
          valueText: node.expression.getText(sourceFile),
          location: locationOf(sourceFile, node.expression, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node.expression,
              filePath,
              'verified-static',
              'The source declares switch alternatives. No runtime case is selected.',
            ),
          ],
        });
        connectInputs(readIds, stepId, node.expression);
        for (const clause of node.caseBlock.clauses) {
          for (const statement of clause.statements) {
            visit(statement);
          }
        }
        return;
      }

      if (ts.isThrowStatement(node)) {
        const readIds =
          node.expression === undefined ? [] : addReads(node.expression);
        const position = node.getStart(sourceFile);
        const stepId = `step:failure:${record.entity.id}:${position}`;
        steps.push({
          id: stepId,
          functionId: record.entity.id,
          kind: 'failure',
          label:
            node.expression === undefined
              ? 'Possible failure: throw'
              : `Possible failure: throw ${truncateSource(node.expression.getText(sourceFile))}`,
          valueText: node.expression?.getText(sourceFile) ?? null,
          location: locationOf(sourceFile, node, filePath),
          evidence: [
            evidenceAt(
              sourceFile,
              node,
              filePath,
              'verified-static',
              'The source contains a throw path. Static analysis does not claim that it occurs at runtime.',
            ),
          ],
        });
        connectInputs(readIds, stepId, node);
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(body);
    returnStepIdsByFunction.set(record.entity.id, returnStepIds);
  }

  for (const callRecord of calls) {
    const sourceFile = callRecord.call.getSourceFile();
    const filePath = callRecord.sourceFunction.entity.location.filePath;
    const callerId = callRecord.sourceFunction.entity.id;
    const calleeId = callRecord.targetFunction.entity.id;
    const callPosition = callRecord.call.getStart(sourceFile);
    const callStepId = `step:call:${callerId}:${callPosition}`;
    const bindingHistory =
      bindingHistoryByFunction.get(callerId) ??
      new Map<ts.Symbol, Array<{ position: number; stepId: string }>>();
    const localSymbols = collectLocalSymbols(
      checker,
      callRecord.sourceFunction,
    );

    steps.push({
      id: callStepId,
      functionId: callerId,
      kind: 'transform',
      label: `Call ${callRecord.targetFunction.entity.name}`,
      valueText: callRecord.call.getText(sourceFile),
      location: locationOf(sourceFile, callRecord.call, filePath),
      evidence: [
        evidenceAt(
          sourceFile,
          callRecord.call,
          filePath,
          callRecord.evidenceKind,
          'The supported call is a source-backed transformation boundary. No runtime return value is fabricated.',
        ),
      ],
    });

    callRecord.call.arguments.forEach((argument, index) => {
      const argumentStepId = `step:argument:${callerId}:${callPosition}:${index}`;
      const parameterStepId =
        parameterStepIdsByFunction.get(calleeId)?.[index] ?? null;
      steps.push({
        id: argumentStepId,
        functionId: callerId,
        kind: 'argument',
        label: `Argument ${index + 1} → ${parameterNameFor(callRecord.targetFunction, index) ?? `parameter ${index + 1}`}`,
        valueText: argument.getText(sourceFile),
        location: locationOf(sourceFile, argument, filePath),
        evidence: [
          evidenceAt(
            sourceFile,
            argument,
            filePath,
            callRecord.evidenceKind,
            'Argument position maps deterministically to the supported callee parameter position.',
          ),
        ],
      });

      for (const identifier of collectLocalReads(
        argument,
        checker,
        localSymbols,
      )) {
        const symbol = checker.getSymbolAtLocation(identifier);
        if (symbol === undefined) {
          continue;
        }
        const sourceStepId = findLatestBindingWrite(
          bindingHistory,
          symbol,
          argument.getStart(sourceFile),
        );
        if (sourceStepId !== null) {
          relationships.push(
            flowRelationship(
              callerId,
              'FLOWS_TO',
              sourceStepId,
              argumentStepId,
              `Value flows into argument ${index + 1}`,
              evidenceAt(
                sourceFile,
                argument,
                filePath,
                'inferred-static',
                'The argument references the latest earlier supported lexical binding write. Runtime branch selection is not assumed.',
              ),
            ),
          );
        }
      }

      relationships.push(
        flowRelationship(
          callerId,
          'FLOWS_TO',
          argumentStepId,
          callStepId,
          `Argument ${index + 1} contributes to call`,
          evidenceAt(
            sourceFile,
            argument,
            filePath,
            callRecord.evidenceKind,
            'The argument is syntactically supplied to this supported call.',
          ),
        ),
      );

      relationships.push({
        id: `passes-argument:${callerId}:${callPosition}:${index}`,
        kind: 'PASSES_ARGUMENT',
        functionId: callerId,
        sourceStepId: argumentStepId,
        targetStepId: parameterStepId,
        label: `${truncateSource(argument.getText(sourceFile))} → ${parameterNameFor(callRecord.targetFunction, index) ?? `parameter ${index + 1}`}`,
        evidence: [
          evidenceAt(
            sourceFile,
            argument,
            filePath,
            callRecord.evidenceKind,
            'The supported call maps this argument position to the corresponding callee parameter.',
          ),
        ],
      });
    });

    for (const returnStepId of returnStepIdsByFunction.get(calleeId) ?? []) {
      relationships.push({
        id: `returns-to:${returnStepId}:${callStepId}`,
        kind: 'RETURNS_TO',
        functionId: callerId,
        sourceStepId: returnStepId,
        targetStepId: callStepId,
        label: `${callRecord.targetFunction.entity.name} return → call result`,
        evidence: [
          evidenceAt(
            sourceFile,
            callRecord.call,
            filePath,
            'inferred-static',
            'A declared callee return path may provide the call result. Static analysis does not select which return path executes.',
          ),
        ],
      });
    }
  }

  return { functionData, staticFlow: { steps, relationships } };
}

function buildFunctionDataProjection(
  record: FunctionRecord,
  calls: CallRecord[],
): FunctionDataProjection {
  const sourceFile = record.declaration.getSourceFile();
  const filePath = record.entity.location.filePath;
  const parameters: FunctionParameterProjection[] =
    record.declaration.parameters.map((parameter, index) => ({
      id: `parameter:${record.entity.id}:${index}`,
      name: parameter.name.getText(sourceFile),
      typeText: parameter.type?.getText(sourceFile) ?? null,
      location: locationOf(sourceFile, parameter, filePath),
      evidence: [
        evidenceAt(
          sourceFile,
          parameter,
          filePath,
          'verified-static',
          'The parameter is declared directly on this TypeScript function.',
        ),
      ],
    }));
  const returns: FunctionReturnProjection[] = collectReturnStatements(
    record,
  ).map((statement) => ({
    id: `return:${record.entity.id}:${statement.getStart(sourceFile)}`,
    expressionText: statement.expression?.getText(sourceFile) ?? null,
    location: locationOf(sourceFile, statement, filePath),
    evidence: [
      evidenceAt(
        sourceFile,
        statement,
        filePath,
        'verified-static',
        'This return path is declared directly in source.',
      ),
    ],
  }));
  const callArguments: CallArgumentMapping[] = calls
    .filter((call) => call.sourceFunction.entity.id === record.entity.id)
    .flatMap((call) => {
      const callPosition = call.call.getStart(sourceFile);
      return call.call.arguments.map((argument, index) => ({
        id: `argument-map:${record.entity.id}:${callPosition}:${index}`,
        callerFunctionId: record.entity.id,
        calleeFunctionId: call.targetFunction.entity.id,
        argumentIndex: index,
        argumentText: argument.getText(sourceFile),
        parameterName: parameterNameFor(call.targetFunction, index),
        location: locationOf(sourceFile, argument, filePath),
        evidence: [
          evidenceAt(
            sourceFile,
            argument,
            filePath,
            call.evidenceKind,
            'Argument position maps to the corresponding parameter on the resolved supported call target.',
          ),
        ],
      }));
    });

  return {
    functionId: record.entity.id,
    parameters,
    returns,
    callArguments,
  };
}

function collectReturnStatements(record: FunctionRecord): ts.ReturnStatement[] {
  const returns: ts.ReturnStatement[] = [];
  const body = record.declaration.body;
  if (body === undefined) {
    return returns;
  }

  const visit = (node: ts.Node): void => {
    if (node !== body && ts.isFunctionLike(node)) {
      return;
    }
    if (ts.isReturnStatement(node)) {
      returns.push(node);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return returns;
}

function collectLocalSymbols(
  checker: ts.TypeChecker,
  record: FunctionRecord,
): Set<ts.Symbol> {
  const symbols = new Set<ts.Symbol>();
  const body = record.declaration.body;
  if (body === undefined) {
    return symbols;
  }

  for (const parameter of record.declaration.parameters) {
    if (!ts.isIdentifier(parameter.name)) {
      continue;
    }
    const symbol = checker.getSymbolAtLocation(parameter.name);
    if (symbol !== undefined) {
      symbols.add(symbol);
    }
  }

  const visit = (node: ts.Node): void => {
    if (node !== body && ts.isFunctionLike(node)) {
      return;
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const symbol = checker.getSymbolAtLocation(node.name);
      if (symbol !== undefined) {
        symbols.add(symbol);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return symbols;
}

function collectLocalReads(
  expression: ts.Expression,
  checker: ts.TypeChecker,
  localSymbols: Set<ts.Symbol>,
): ts.Identifier[] {
  const reads: ts.Identifier[] = [];
  const seen = new Set<number>();

  const visit = (node: ts.Node): void => {
    if (node !== expression && ts.isFunctionLike(node)) {
      return;
    }
    if (ts.isIdentifier(node) && isIdentifierReadPosition(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const position = node.getStart(node.getSourceFile());
      if (
        symbol !== undefined &&
        localSymbols.has(symbol) &&
        !seen.has(position)
      ) {
        seen.add(position);
        reads.push(node);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(expression);
  return reads;
}

function isIdentifierReadPosition(identifier: ts.Identifier): boolean {
  const parent = identifier.parent;
  if (
    (ts.isVariableDeclaration(parent) && parent.name === identifier) ||
    (ts.isParameter(parent) && parent.name === identifier) ||
    (ts.isFunctionDeclaration(parent) && parent.name === identifier)
  ) {
    return false;
  }
  if (ts.isPropertyAccessExpression(parent) && parent.name === identifier) {
    return false;
  }
  if (
    ts.isBinaryExpression(parent) &&
    parent.left === identifier &&
    ASSIGNMENT_OPERATORS.has(parent.operatorToken.kind)
  ) {
    return false;
  }
  return true;
}

function isTransformExpression(expression: ts.Expression): boolean {
  return !(
    ts.isIdentifier(expression) ||
    ts.isStringLiteralLike(expression) ||
    ts.isNumericLiteral(expression) ||
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword ||
    expression.kind === ts.SyntaxKind.NullKeyword
  );
}

function recordBindingWrite(
  history: Map<ts.Symbol, Array<{ position: number; stepId: string }>>,
  symbol: ts.Symbol,
  position: number,
  stepId: string,
): void {
  const entries = history.get(symbol) ?? [];
  entries.push({ position, stepId });
  entries.sort((left, right) => left.position - right.position);
  history.set(symbol, entries);
}

function findLatestBindingWrite(
  history: Map<ts.Symbol, Array<{ position: number; stepId: string }>>,
  symbol: ts.Symbol,
  beforePosition: number,
): string | null {
  const entries = history.get(symbol) ?? [];
  let result: string | null = null;
  for (const entry of entries) {
    if (entry.position >= beforePosition) {
      break;
    }
    result = entry.stepId;
  }
  return result;
}

function parameterNameFor(
  targetFunction: FunctionRecord,
  index: number,
): string | null {
  const parameter = targetFunction.declaration.parameters[index];
  return (
    parameter?.name.getText(targetFunction.declaration.getSourceFile()) ?? null
  );
}

function parameterStepId(functionIdValue: string, index: number): string {
  return `step:parameter:${functionIdValue}:${index}`;
}

function returnStepId(functionIdValue: string, position: number): string {
  return `step:return:${functionIdValue}:${position}`;
}

function flowRelationship(
  functionIdValue: string,
  kind: StaticFlowRelationship['kind'],
  sourceStepId: string | null,
  targetStepId: string | null,
  label: string,
  evidence: Evidence,
): StaticFlowRelationship {
  return {
    id: `${kind.toLowerCase()}:${functionIdValue}:${sourceStepId ?? 'source'}:${targetStepId ?? 'target'}`,
    kind,
    functionId: functionIdValue,
    sourceStepId,
    targetStepId,
    label,
    evidence: [evidence],
  };
}

function truncateSource(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 72 ? `${normalized.slice(0, 69)}…` : normalized;
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

    for (const diagnostic of program
      .getSyntacticDiagnostics(sourceFile)
      .slice(0, 3)) {
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

      if (
        checker.getSymbolAtLocation(statement.moduleSpecifier) === undefined
      ) {
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
  staticData: StaticDataAnalysis,
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
  const functionOrder = new Map<string, number>([[entryPoint.id, 0]]);

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
        functionOrder.set(relationship.targetId, functionOrder.size);
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
    throw new Error(
      `Entry source ${entryPointInput.filePath} was not analyzed.`,
    );
  }

  const projectedSteps = staticData.staticFlow.steps
    .filter((step) => reachable.has(step.functionId))
    .sort((left, right) => compareStaticSteps(left, right, functionOrder));
  const projectedStepIds = new Set(projectedSteps.map((step) => step.id));

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
    functionData: staticData.functionData.filter((data) =>
      reachable.has(data.functionId),
    ),
    staticFlow: {
      steps: projectedSteps,
      relationships: staticData.staticFlow.relationships.filter(
        (relationship) =>
          reachable.has(relationship.functionId) &&
          (relationship.sourceStepId === null ||
            projectedStepIds.has(relationship.sourceStepId)) &&
          (relationship.targetStepId === null ||
            projectedStepIds.has(relationship.targetStepId)),
      ),
    },
  };
}

function compareStaticSteps(
  left: StaticFlowStep,
  right: StaticFlowStep,
  functionOrder: Map<string, number>,
): number {
  return (
    (functionOrder.get(left.functionId) ?? Number.MAX_SAFE_INTEGER) -
      (functionOrder.get(right.functionId) ?? Number.MAX_SAFE_INTEGER) ||
    left.location.filePath.localeCompare(right.location.filePath) ||
    left.location.startLine - right.location.startLine ||
    left.location.startColumn - right.location.startColumn ||
    left.id.localeCompare(right.id)
  );
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

function evidenceAt(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  displayFilePath: string,
  kind: EvidenceKind,
  reason: string,
): Evidence {
  return {
    kind,
    source: 'typescript-compiler-api',
    location: locationOf(sourceFile, node, displayFilePath),
    reason,
  };
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
