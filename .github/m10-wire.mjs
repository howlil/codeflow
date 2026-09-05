import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, replacements) {
  let text = readFileSync(path, 'utf8');
  for (const [before, after] of replacements) {
    if (!text.includes(before)) {
      throw new Error(`M10 wiring target not found in ${path}: ${before.slice(0, 100)}`);
    }
    text = text.replace(before, after);
  }
  writeFileSync(path, text);
}

patch('packages/analysis-core/src/change-analysis.ts', [
  [
    "} from './model.js';\nimport {\n  buildImpactProjection,",
    "} from './model.js';\nimport {\n  buildFunctionBehaviorDeltas,\n  type FunctionBehaviorDelta,\n} from './behavior-delta.js';\nimport {\n  buildImpactProjection,",
  ],
  [
    '  entities: SemanticChangeEntity[];\n  relationshipDeltas: RelationshipDelta[];',
    '  entities: SemanticChangeEntity[];\n  behaviorDeltas: FunctionBehaviorDelta[];\n  relationshipDeltas: RelationshipDelta[];',
  ],
  [
    '    entities,\n    relationshipDeltas: buildRelationshipDeltas(input.base, input.head),',
    '    entities,\n    behaviorDeltas: buildFunctionBehaviorDeltas(input.base, input.head, entities),\n    relationshipDeltas: buildRelationshipDeltas(input.base, input.head),',
  ],
]);

patch('packages/analysis-core/src/index.ts', [
  [
    "export type {\n  ChangeHunk,",
    "export type {\n  BehaviorDeltaCategory,\n  BehaviorDeltaChangeKind,\n  BehaviorDeltaSnapshot,\n  FunctionBehaviorDelta,\n  FunctionBehaviorDeltaItem,\n  FunctionBehaviorDeltaSummary,\n} from './behavior-delta.js';\nexport { buildFunctionBehaviorDeltas } from './behavior-delta.js';\nexport type {\n  ChangeHunk,",
  ],
]);

patch('apps/web/src/change-client.ts', [
  [
    '  FlowProjection,\n  ImpactProjection,',
    '  FlowEvidence,\n  FlowProjection,\n  ImpactProjection,',
  ],
  [
    'export interface RepositoryChangeProjection {',
    `export type BehaviorDeltaChangeKind = 'added' | 'removed';\nexport type BehaviorDeltaCategory =\n  | 'parameter'\n  | 'return'\n  | 'step'\n  | 'relationship';\nexport type BehaviorDeltaSnapshot = 'base' | 'head';\n\nexport interface FunctionBehaviorDeltaItem {\n  id: string;\n  changeKind: BehaviorDeltaChangeKind;\n  category: BehaviorDeltaCategory;\n  kind: string;\n  label: string;\n  detail: string | null;\n  snapshot: BehaviorDeltaSnapshot;\n  location: SourceLocation | null;\n  evidence: FlowEvidence[];\n}\n\nexport interface FunctionBehaviorDelta {\n  changeEntityId: string;\n  functionName: string;\n  path: string;\n  baseFunctionId: string | null;\n  headFunctionId: string | null;\n  items: FunctionBehaviorDeltaItem[];\n  summary: {\n    addedCount: number;\n    removedCount: number;\n    parameterCount: number;\n    returnCount: number;\n    stepCount: number;\n    relationshipCount: number;\n  };\n}\n\nexport interface RepositoryChangeProjection {`,
  ],
  [
    '  entities: SemanticChangeEntity[];\n  relationshipDeltas: RelationshipDelta[];',
    '  entities: SemanticChangeEntity[];\n  behaviorDeltas: FunctionBehaviorDelta[];\n  relationshipDeltas: RelationshipDelta[];',
  ],
]);

patch('apps/web/src/ChangeWorkspace.tsx', [
  [
    '  PullRequestAnalysis,\n  RelationshipDelta,',
    '  FunctionBehaviorDelta,\n  PullRequestAnalysis,\n  RelationshipDelta,',
  ],
  [
    '  const groups = groupChanges(change.entities, analysis);\n',
    `  const groups = groupChanges(change.entities, analysis);\n  const behaviorDelta =\n    selectedChange === null\n      ? null\n      : change.behaviorDeltas.find(\n          (delta) => delta.changeEntityId === selectedChange.id,\n        ) ?? null;\n`,
  ],
  [
    '        <span>{change.relationshipDeltas.length} relationship deltas</span>\n        <span>{countImpact(change)} downstream results</span>',
    '        <span>{countBehaviorDeltas(change)} static behavior deltas</span>\n        <span>{change.relationshipDeltas.length} relationship deltas</span>\n        <span>{countImpact(change)} downstream results</span>',
  ],
  [
    '        >\n          <ImpactInspector\n',
    '        >\n          <BehaviorDeltaInspector delta={behaviorDelta} />\n          <ImpactInspector\n',
  ],
  [
    'function ImpactInspector({\n',
    `function BehaviorDeltaInspector({\n  delta,\n}: {\n  delta: FunctionBehaviorDelta | null;\n}) {\n  if (delta === null) {\n    return null;\n  }\n\n  return (\n    <section className="behavior-deltas change-impact-section">\n      <header className="change-pane-heading">\n        <div>\n          <p className="panel-kicker">Static behavior delta</p>\n          <h3>{delta.functionName}</h3>\n          <p>\n            BASE → HEAD · +{delta.summary.addedCount} −\n            {delta.summary.removedCount} supported static facts\n          </p>\n        </div>\n      </header>\n\n      {delta.items.length === 0 ? (\n        <div className="change-empty-state">\n          <strong>No supported static behavior delta detected.</strong>\n          <span>\n            Contract and projected static-flow facts are unchanged. This does not\n            prove runtime equivalence.\n          </span>\n        </div>\n      ) : (\n        <div className="behavior-delta-list">\n          {delta.items.map((item) => {\n            const evidence = item.evidence[0];\n            const location = item.location ?? evidence?.location ?? null;\n            return (\n              <div key={item.id}>\n                <span\n                  className={\`change-kind change-kind--\${item.changeKind}\`}\n                >\n                  {item.changeKind === 'added' ? 'A' : 'R'}\n                </span>\n                <div>\n                  <strong>\n                    {behaviorCategoryLabel(item.category)} · {item.kind}\n                  </strong>\n                  <span>{item.label}</span>\n                  {item.detail === null ? null : <small>{item.detail}</small>}\n                  {location === null ? null : (\n                    <small>\n                      {item.snapshot.toUpperCase()} · {location.filePath}:L\n                      {location.startLine}\n                    </small>\n                  )}\n                  {evidence === undefined ? null : (\n                    <small>{evidence.reason}</small>\n                  )}\n                </div>\n              </div>\n            );\n          })}\n        </div>\n      )}\n    </section>\n  );\n}\n\nfunction ImpactInspector({\n`,
  ],
  [
    'function countImpact(change: PullRequestAnalysis[\'change\']): number {',
    `function countBehaviorDeltas(change: PullRequestAnalysis['change']): number {\n  return change.behaviorDeltas.reduce(\n    (count, delta) => count + delta.items.length,\n    0,\n  );\n}\n\nfunction behaviorCategoryLabel(\n  category: FunctionBehaviorDelta['items'][number]['category'],\n): string {\n  if (category === 'parameter') return 'Input';\n  if (category === 'return') return 'Return';\n  if (category === 'relationship') return 'Data flow';\n  return 'Step';\n}\n\nfunction countImpact(change: PullRequestAnalysis['change']): number {`,
  ],
]);

patch('apps/web/src/change-workspace.css', [
  [
    '.relationship-deltas {\n  padding-bottom: 10px;\n}',
    `.behavior-deltas {\n  padding-bottom: 0;\n}\n\n.behavior-delta-list {\n  border-top: 1px solid var(--color-cs-border);\n}\n\n.behavior-delta-list > div {\n  display: grid;\n  grid-template-columns: 22px minmax(0, 1fr);\n  gap: 7px;\n  border-bottom: 1px solid var(--color-cs-border);\n  padding: 7px 10px;\n}\n\n.behavior-delta-list > div > div {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.behavior-delta-list strong {\n  font-size: 10px;\n  font-weight: 600;\n}\n\n.behavior-delta-list span,\n.behavior-delta-list small {\n  overflow: hidden;\n  color: var(--color-cs-muted);\n  font-size: 9px;\n  line-height: 1.45;\n  text-overflow: ellipsis;\n}\n\n.relationship-deltas {\n  padding-bottom: 10px;\n}`,
  ],
]);

patch('apps/web/src/ChangeWorkspace.test.tsx', [
  [
    '      relationshipDeltas: [\n',
    `      behaviorDeltas: [\n        {\n          changeEntityId:\n            'change:modified:Function:core.ts:processPayment',\n          functionName: 'processPayment',\n          path: 'core.ts',\n          baseFunctionId: 'function:core:process',\n          headFunctionId: 'function:core:process',\n          items: [\n            {\n              id: 'behavior:removed:return',\n              changeKind: 'removed',\n              category: 'return',\n              kind: 'return',\n              label: 'Return expression',\n              detail: '1',\n              snapshot: 'base',\n              location,\n              evidence,\n            },\n            {\n              id: 'behavior:added:return',\n              changeKind: 'added',\n              category: 'return',\n              kind: 'return',\n              label: 'Return expression',\n              detail: '2',\n              snapshot: 'head',\n              location,\n              evidence,\n            },\n          ],\n          summary: {\n            addedCount: 1,\n            removedCount: 1,\n            parameterCount: 0,\n            returnCount: 2,\n            stepCount: 0,\n            relationshipCount: 0,\n          },\n        },\n      ],\n      relationshipDeltas: [\n`,
  ],
  [
    "    expect(screen.getByText(/return 2;/)).toBeTruthy();\n    expect(screen.getByText('handle')).toBeTruthy();",
    "    expect(screen.getByText(/return 2;/)).toBeTruthy();\n    expect(screen.getByText('Static behavior delta')).toBeTruthy();\n    expect(screen.getByText(/BASE → HEAD/)).toBeTruthy();\n    expect(screen.getByText('1')).toBeTruthy();\n    expect(screen.getByText('2')).toBeTruthy();\n    expect(screen.getByText('handle')).toBeTruthy();",
  ],
  [
    "describe('M9 change workspace', () => {\n  it('connects actual diff, changed entity, downstream evidence, and function flow', () => {",
    "describe('M10 change workspace', () => {\n  it('connects actual diff, static behavior delta, downstream evidence, and function flow', () => {",
  ],
]);
