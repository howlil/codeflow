import ts from 'typescript';

import type { EntryPointSuggestion } from './model.js';
import type { TypeScriptSourceInput } from './typescript-flow.js';

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

export function discoverEntryPoints(
  files: TypeScriptSourceInput[],
): EntryPointSuggestion[] {
  return files
    .flatMap((file) => {
      const sourceFile = ts.createSourceFile(
        file.filePath,
        file.sourceText,
        ts.ScriptTarget.Latest,
        true,
        file.filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      return sourceFile.statements.flatMap((statement) => {
        if (
          !ts.isFunctionDeclaration(statement) ||
          statement.name === undefined ||
          statement.body === undefined ||
          !statement.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
          )
        ) {
          return [];
        }

        const name = statement.name.text;
        const normalizedPath = file.filePath.toLowerCase();
        const baseName = normalizedPath.split('/').at(-1) ?? normalizedPath;
        const detected =
          ENTRY_NAMES.has(name) ||
          ENTRY_PATHS.has(normalizedPath) ||
          baseName === 'index.ts';
        return [
          {
            id: `function:${file.filePath}:${name}`,
            name,
            filePath: file.filePath,
            confidence: detected ? 'detected' : 'likely',
            reason: detected
              ? 'Exported function matches a deterministic application entry convention.'
              : 'Exported function is available as a repository symbol.',
          } satisfies EntryPointSuggestion,
        ];
      });
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
