import ts from 'typescript';

import type {
  Evidence,
  FlowProjection,
  RepositoryArchitectureProjection,
  RepositoryEntity,
  RepositoryEntityKind,
  RepositoryRelationship,
  RepositoryRelationshipKind,
  SourceLocation,
} from './model.js';
import {
  analyzeTypeScriptRepository as analyzeBaseTypeScriptRepository,
  type AnalyzeTypeScriptRepositoryInput,
  type TypeScriptSourceInput,
} from './typescript-flow.js';

interface SymbolRecord {
  entity: RepositoryEntity;
  declaration: ts.Node;
  nameNode: ts.Node;
  symbol: ts.Symbol | null;
}

interface ProgramContext {
  program: ts.Program;
  checker: ts.TypeChecker;
  displayPathByCompilerPath: Map<string, string>;
}

export function analyzeTypeScriptRepository(
  input: AnalyzeTypeScriptRepositoryInput,
): FlowProjection {
  const flow = analyzeBaseTypeScriptRepository(input);
  return {
    ...flow,
    architecture: buildRepositoryArchitecture(input.files),
  };
}

export function buildRepositoryArchitecture(
  files: TypeScriptSourceInput[],
): RepositoryArchitectureProjection {
  const orderedFiles = [...files].sort((left, right) =>
    left.filePath.localeCompare(right.filePath),
  );
  const context = createProgram(orderedFiles);
  const entities = new Map<string, RepositoryEntity>();
  const relationships = new Map<string, RepositoryRelationship>();
  const symbolRecords: SymbolRecord[] = [];
  const recordBySymbol = new Map<ts.Symbol, SymbolRecord>();
  const fileEntityByPath = new Map<string, RepositoryEntity>();

  const rootId = 'repository:.';
  entities.set(rootId, {
    id: rootId,
    kind: 'Repository',
    name: 'Repository',
    path: '.',
    location: null,
    exported: false,
    evidence: [],
  });

  for (const sourceFile of context.program.getSourceFiles()) {
    const filePath = context.displayPathByCompilerPath.get(sourceFile.fileName);
    if (filePath === undefined) {
      continue;
    }

    const fileEntity = repositoryEntity(
      `file:${filePath}`,
      'File',
      basename(filePath),
      filePath,
      locationOf(sourceFile, sourceFile, filePath),
      false,
      evidenceAt(
        sourceFile,
        sourceFile,
        filePath,
        'verified-static',
        'This file is part of the bounded TypeScript source set analyzed by CodeFlow.',
      ),
    );
    entities.set(fileEntity.id, fileEntity);
    fileEntityByPath.set(filePath, fileEntity);

    ensureModuleHierarchy(
      filePath,
      sourceFile,
      entities,
      relationships,
      rootId,
    );

    const directory = dirname(filePath);
    const parentId = directory === '.' ? rootId : moduleId(directory);
    addRelationship(
      relationships,
      relationship(
        'CONTAINS',
        parentId,
        fileEntity.id,
        evidenceAt(
          sourceFile,
          sourceFile,
          filePath,
          'verified-static',
          'Repository-relative source path places this file inside the containing module.',
        ),
      ),
    );

    collectSymbols(
      sourceFile,
      filePath,
      context.checker,
      fileEntity,
      entities,
      relationships,
      symbolRecords,
      recordBySymbol,
    );
  }

  collectImportsAndModuleDependencies(context, fileEntityByPath, relationships);
  collectHeritageRelationships(
    context.checker,
    symbolRecords,
    recordBySymbol,
    relationships,
  );
  collectReferenceRelationships(
    context.checker,
    symbolRecords,
    recordBySymbol,
    relationships,
  );

  return {
    rootId,
    entities: [...entities.values()].sort(compareEntities),
    relationships: [...relationships.values()].sort(compareRelationships),
  };
}

function createProgram(files: TypeScriptSourceInput[]): ProgramContext {
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

  return {
    program,
    checker: program.getTypeChecker(),
    displayPathByCompilerPath,
  };
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

function ensureModuleHierarchy(
  filePath: string,
  sourceFile: ts.SourceFile,
  entities: Map<string, RepositoryEntity>,
  relationships: Map<string, RepositoryRelationship>,
  rootId: string,
): void {
  const directory = dirname(filePath);
  if (directory === '.') {
    return;
  }

  const segments = directory.split('/').filter(Boolean);
  let currentPath = '';
  let parentId = rootId;

  for (const segment of segments) {
    currentPath = currentPath === '' ? segment : `${currentPath}/${segment}`;
    const id = moduleId(currentPath);
    if (!entities.has(id)) {
      entities.set(
        id,
        repositoryEntity(
          id,
          'Module',
          segment,
          currentPath,
          locationOf(sourceFile, sourceFile, filePath),
          false,
          evidenceAt(
            sourceFile,
            sourceFile,
            filePath,
            'inferred-static',
            'This module is inferred from the repository-relative directory structure of analyzed source files.',
          ),
        ),
      );
      addRelationship(
        relationships,
        relationship(
          'CONTAINS',
          parentId,
          id,
          evidenceAt(
            sourceFile,
            sourceFile,
            filePath,
            'inferred-static',
            'Repository-relative paths establish this directory containment relationship.',
          ),
        ),
      );
    }
    parentId = id;
  }
}

function collectSymbols(
  sourceFile: ts.SourceFile,
  filePath: string,
  checker: ts.TypeChecker,
  fileEntity: RepositoryEntity,
  entities: Map<string, RepositoryEntity>,
  relationships: Map<string, RepositoryRelationship>,
  symbolRecords: SymbolRecord[],
  recordBySymbol: Map<ts.Symbol, SymbolRecord>,
): void {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      registerSymbol(
        'Function',
        statement.name.text,
        statement,
        statement.name,
        hasExportModifier(statement),
        sourceFile,
        filePath,
        checker,
        fileEntity,
        entities,
        relationships,
        symbolRecords,
        recordBySymbol,
      );
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name !== undefined) {
      const classRecord = registerSymbol(
        'Class',
        statement.name.text,
        statement,
        statement.name,
        hasExportModifier(statement),
        sourceFile,
        filePath,
        checker,
        fileEntity,
        entities,
        relationships,
        symbolRecords,
        recordBySymbol,
      );
      for (const member of statement.members) {
        if (!ts.isMethodDeclaration(member) || member.name === undefined) {
          continue;
        }
        const memberName = member.name.getText(sourceFile);
        const methodRecord = registerSymbol(
          'Method',
          `${statement.name.text}.${memberName}`,
          member,
          member.name,
          false,
          sourceFile,
          filePath,
          checker,
          fileEntity,
          entities,
          relationships,
          symbolRecords,
          recordBySymbol,
        );
        addRelationship(
          relationships,
          relationship(
            'CONTAINS',
            classRecord.entity.id,
            methodRecord.entity.id,
            evidenceAt(
              sourceFile,
              member,
              filePath,
              'verified-static',
              'The method is declared directly inside this class.',
            ),
          ),
        );
      }
      continue;
    }

    if (ts.isInterfaceDeclaration(statement)) {
      registerSymbol(
        'Interface',
        statement.name.text,
        statement,
        statement.name,
        hasExportModifier(statement),
        sourceFile,
        filePath,
        checker,
        fileEntity,
        entities,
        relationships,
        symbolRecords,
        recordBySymbol,
      );
      continue;
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      registerSymbol(
        'Type',
        statement.name.text,
        statement,
        statement.name,
        hasExportModifier(statement),
        sourceFile,
        filePath,
        checker,
        fileEntity,
        entities,
        relationships,
        symbolRecords,
        recordBySymbol,
      );
      continue;
    }

    if (ts.isEnumDeclaration(statement)) {
      registerSymbol(
        'Enum',
        statement.name.text,
        statement,
        statement.name,
        hasExportModifier(statement),
        sourceFile,
        filePath,
        checker,
        fileEntity,
        entities,
        relationships,
        symbolRecords,
        recordBySymbol,
      );
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }
        const kind: RepositoryEntityKind =
          declaration.initializer !== undefined &&
          (ts.isArrowFunction(declaration.initializer) ||
            ts.isFunctionExpression(declaration.initializer))
            ? 'Function'
            : 'Variable';
        registerSymbol(
          kind,
          declaration.name.text,
          declaration,
          declaration.name,
          hasExportModifier(statement),
          sourceFile,
          filePath,
          checker,
          fileEntity,
          entities,
          relationships,
          symbolRecords,
          recordBySymbol,
        );
      }
    }
  }
}

function registerSymbol(
  kind: RepositoryEntityKind,
  name: string,
  declaration: ts.Node,
  nameNode: ts.Node,
  exported: boolean,
  sourceFile: ts.SourceFile,
  filePath: string,
  checker: ts.TypeChecker,
  fileEntity: RepositoryEntity,
  entities: Map<string, RepositoryEntity>,
  relationships: Map<string, RepositoryRelationship>,
  symbolRecords: SymbolRecord[],
  recordBySymbol: Map<ts.Symbol, SymbolRecord>,
): SymbolRecord {
  const id = entityId(kind, filePath, name, declaration.getStart(sourceFile));
  const evidence = evidenceAt(
    sourceFile,
    declaration,
    filePath,
    'verified-static',
    `This ${kind.toLowerCase()} is declared directly in the analyzed TypeScript source.`,
  );
  const entity = repositoryEntity(
    id,
    kind,
    name,
    filePath,
    locationOf(sourceFile, declaration, filePath),
    exported,
    evidence,
  );
  entities.set(id, entity);
  const symbol = checker.getSymbolAtLocation(nameNode) ?? null;
  const record: SymbolRecord = { entity, declaration, nameNode, symbol };
  symbolRecords.push(record);
  if (symbol !== null) {
    recordBySymbol.set(resolveAlias(checker, symbol), record);
  }

  addRelationship(
    relationships,
    relationship('DEFINES', fileEntity.id, entity.id, evidence),
  );
  if (exported) {
    addRelationship(
      relationships,
      relationship(
        'EXPORTS',
        fileEntity.id,
        entity.id,
        evidenceAt(
          sourceFile,
          declaration,
          filePath,
          'verified-static',
          'The declaration has an explicit TypeScript export modifier.',
        ),
      ),
    );
  }
  return record;
}

function collectImportsAndModuleDependencies(
  context: ProgramContext,
  fileEntityByPath: Map<string, RepositoryEntity>,
  relationships: Map<string, RepositoryRelationship>,
): void {
  for (const sourceFile of context.program.getSourceFiles()) {
    const filePath = context.displayPathByCompilerPath.get(sourceFile.fileName);
    if (filePath === undefined) {
      continue;
    }
    const sourceEntity = fileEntityByPath.get(filePath);
    if (sourceEntity === undefined) {
      continue;
    }

    for (const statement of sourceFile.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteralLike(statement.moduleSpecifier)
      ) {
        continue;
      }
      const targetPath = importedFilePath(
        context,
        filePath,
        statement.moduleSpecifier,
      );
      if (targetPath === null) {
        continue;
      }
      const targetEntity = fileEntityByPath.get(targetPath);
      if (targetEntity === undefined) {
        continue;
      }
      const importEvidence = evidenceAt(
        sourceFile,
        statement.moduleSpecifier,
        filePath,
        'verified-static',
        'The TypeScript import resolves to another analyzed repository source file.',
      );
      addRelationship(
        relationships,
        relationship(
          'IMPORTS',
          sourceEntity.id,
          targetEntity.id,
          importEvidence,
        ),
      );

      const sourceModule = dirname(filePath);
      const targetModule = dirname(targetPath);
      if (sourceModule !== targetModule) {
        addRelationship(
          relationships,
          relationship(
            'DEPENDS_ON',
            sourceModule === '.' ? 'repository:.' : moduleId(sourceModule),
            targetModule === '.' ? 'repository:.' : moduleId(targetModule),
            importEvidence,
          ),
        );
      }
    }
  }
}

function importedFilePath(
  context: ProgramContext,
  sourceDisplayPath: string,
  moduleSpecifier: ts.StringLiteralLike,
): string | null {
  const symbol = context.checker.getSymbolAtLocation(moduleSpecifier);
  if (symbol !== undefined) {
    for (const declaration of symbol.declarations ?? []) {
      const target = context.displayPathByCompilerPath.get(
        declaration.getSourceFile().fileName,
      );
      if (target !== undefined && target !== sourceDisplayPath) {
        return target;
      }
    }
  }

  if (!moduleSpecifier.text.startsWith('.')) {
    return null;
  }
  const normalizedBase = normalizePath(
    `${dirname(sourceDisplayPath)}/${moduleSpecifier.text}`,
  );
  const candidates = [
    normalizedBase,
    `${normalizedBase}.ts`,
    `${normalizedBase}.tsx`,
    `${normalizedBase}/index.ts`,
    `${normalizedBase}/index.tsx`,
  ];
  const available = new Set(context.displayPathByCompilerPath.values());
  return candidates.find((candidate) => available.has(candidate)) ?? null;
}

function collectHeritageRelationships(
  checker: ts.TypeChecker,
  records: SymbolRecord[],
  recordBySymbol: Map<ts.Symbol, SymbolRecord>,
  relationships: Map<string, RepositoryRelationship>,
): void {
  for (const record of records) {
    if (
      !ts.isClassDeclaration(record.declaration) &&
      !ts.isInterfaceDeclaration(record.declaration)
    ) {
      continue;
    }
    for (const clause of record.declaration.heritageClauses ?? []) {
      const kind: RepositoryRelationshipKind =
        clause.token === ts.SyntaxKind.ImplementsKeyword
          ? 'IMPLEMENTS'
          : 'EXTENDS';
      for (const heritageType of clause.types) {
        const symbol = checker.getSymbolAtLocation(heritageType.expression);
        if (symbol === undefined) {
          continue;
        }
        const target = recordBySymbol.get(resolveAlias(checker, symbol));
        if (target === undefined || target.entity.id === record.entity.id) {
          continue;
        }
        const sourceFile = heritageType.getSourceFile();
        addRelationship(
          relationships,
          relationship(
            kind,
            record.entity.id,
            target.entity.id,
            evidenceAt(
              sourceFile,
              heritageType,
              record.entity.path,
              'verified-static',
              `The TypeScript heritage clause statically declares this ${kind.toLowerCase()} relationship.`,
            ),
          ),
        );
      }
    }
  }
}

function collectReferenceRelationships(
  checker: ts.TypeChecker,
  records: SymbolRecord[],
  recordBySymbol: Map<ts.Symbol, SymbolRecord>,
  relationships: Map<string, RepositoryRelationship>,
): void {
  for (const record of records) {
    const sourceFile = record.declaration.getSourceFile();
    const visit = (node: ts.Node): void => {
      if (node === record.nameNode) {
        return;
      }
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        if (symbol !== undefined) {
          const target = recordBySymbol.get(resolveAlias(checker, symbol));
          if (target !== undefined && target.entity.id !== record.entity.id) {
            addRelationship(
              relationships,
              relationship(
                'REFERENCES',
                record.entity.id,
                target.entity.id,
                evidenceAt(
                  sourceFile,
                  node,
                  record.entity.path,
                  'verified-static',
                  'The TypeScript checker resolves this identifier to the referenced repository symbol.',
                ),
              ),
            );
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(record.declaration, visit);
  }
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return (symbol.flags & ts.SymbolFlags.Alias) !== 0
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function hasExportModifier(node: ts.Node): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
      false)
  );
}

function repositoryEntity(
  id: string,
  kind: RepositoryEntityKind,
  name: string,
  path: string,
  location: SourceLocation | null,
  exported: boolean,
  evidence: Evidence,
): RepositoryEntity {
  return {
    id,
    kind,
    name,
    path,
    location,
    exported,
    evidence: [evidence],
  };
}

function relationship(
  kind: RepositoryRelationshipKind,
  sourceId: string,
  targetId: string,
  evidence: Evidence,
): RepositoryRelationship {
  return {
    id: `${kind.toLowerCase()}:${sourceId}:${targetId}`,
    kind,
    sourceId,
    targetId,
    evidence: [evidence],
  };
}

function addRelationship(
  relationships: Map<string, RepositoryRelationship>,
  candidate: RepositoryRelationship,
): void {
  const existing = relationships.get(candidate.id);
  if (existing === undefined) {
    relationships.set(candidate.id, candidate);
    return;
  }
  const evidence = candidate.evidence[0];
  if (
    evidence !== undefined &&
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

function entityId(
  kind: RepositoryEntityKind,
  filePath: string,
  name: string,
  position: number,
): string {
  if (kind === 'Function') {
    return `function:${filePath}:${name}`;
  }
  return `${kind.toLowerCase()}:${filePath}:${name}:${position}`;
}

function moduleId(path: string): string {
  return `module:${path}`;
}

function compilerPathFor(filePath: string): string {
  const normalized = filePath
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');
  return `/${normalized}`;
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
  const segments: string[] = [];
  for (const segment of path.replaceAll('\\', '/').split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

function evidenceAt(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  displayFilePath: string,
  kind: Evidence['kind'],
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

function compareEntities(
  left: RepositoryEntity,
  right: RepositoryEntity,
): number {
  const rank: Record<RepositoryEntityKind, number> = {
    Repository: 0,
    Module: 1,
    File: 2,
    Class: 3,
    Interface: 4,
    Type: 5,
    Enum: 6,
    Function: 7,
    Method: 8,
    Variable: 9,
  };
  return (
    rank[left.kind] - rank[right.kind] ||
    left.path.localeCompare(right.path) ||
    left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
  );
}

function compareRelationships(
  left: RepositoryRelationship,
  right: RepositoryRelationship,
): number {
  return (
    left.kind.localeCompare(right.kind) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.targetId.localeCompare(right.targetId)
  );
}
