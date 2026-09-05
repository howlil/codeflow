import type {
  Evidence,
  FlowProjection,
  SourceLocation,
  StaticFlowRelationship,
  StaticFlowStep,
} from './model.js';

export type BehaviorDeltaChangeKind = 'added' | 'removed';
export type BehaviorDeltaCategory =
  | 'parameter'
  | 'return'
  | 'step'
  | 'relationship';
export type BehaviorDeltaSnapshot = 'base' | 'head';

export interface FunctionBehaviorDeltaItem {
  id: string;
  changeKind: BehaviorDeltaChangeKind;
  category: BehaviorDeltaCategory;
  kind: string;
  label: string;
  detail: string | null;
  snapshot: BehaviorDeltaSnapshot;
  location: SourceLocation | null;
  evidence: Evidence[];
}

export interface FunctionBehaviorDeltaSummary {
  addedCount: number;
  removedCount: number;
  parameterCount: number;
  returnCount: number;
  stepCount: number;
  relationshipCount: number;
}

export interface FunctionBehaviorDelta {
  changeEntityId: string;
  functionName: string;
  path: string;
  baseFunctionId: string | null;
  headFunctionId: string | null;
  items: FunctionBehaviorDeltaItem[];
  summary: FunctionBehaviorDeltaSummary;
}

interface ChangedFunctionRef {
  id: string;
  entityKind: string;
  name: string;
  path: string;
  baseEntityId: string | null;
  headEntityId: string | null;
}

interface BehaviorFact {
  key: string;
  category: BehaviorDeltaCategory;
  kind: string;
  label: string;
  detail: string | null;
  location: SourceLocation | null;
  evidence: Evidence[];
}

export function buildFunctionBehaviorDeltas(
  base: FlowProjection,
  head: FlowProjection,
  changes: ChangedFunctionRef[],
): FunctionBehaviorDelta[] {
  return changes
    .filter((change) => change.entityKind === 'Function')
    .map((change) => buildFunctionBehaviorDelta(base, head, change))
    .sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.functionName.localeCompare(right.functionName),
    );
}

function buildFunctionBehaviorDelta(
  base: FlowProjection,
  head: FlowProjection,
  change: ChangedFunctionRef,
): FunctionBehaviorDelta {
  const baseFacts =
    change.baseEntityId === null ? [] : functionFacts(base, change.baseEntityId);
  const headFacts =
    change.headEntityId === null ? [] : functionFacts(head, change.headEntityId);
  const items = diffFacts(change.id, baseFacts, headFacts);

  return {
    changeEntityId: change.id,
    functionName: change.name,
    path: change.path,
    baseFunctionId: change.baseEntityId,
    headFunctionId: change.headEntityId,
    items,
    summary: summarize(items),
  };
}

function functionFacts(flow: FlowProjection, functionId: string): BehaviorFact[] {
  const facts: BehaviorFact[] = [];
  const data = flow.functionData.find(
    (projection) => projection.functionId === functionId,
  );

  data?.parameters.forEach((parameter, index) => {
    facts.push({
      key: factKey([
        'parameter',
        String(index),
        parameter.name,
        parameter.typeText ?? '',
      ]),
      category: 'parameter',
      kind: 'parameter',
      label: parameter.name,
      detail: parameter.typeText,
      location: parameter.location,
      evidence: parameter.evidence,
    });
  });

  data?.returns.forEach((returnPath, index) => {
    facts.push({
      key: factKey([
        'return',
        String(index),
        normalize(returnPath.expressionText ?? ''),
      ]),
      category: 'return',
      kind: 'return',
      label: returnPath.expressionText === null ? 'Return' : 'Return expression',
      detail: returnPath.expressionText,
      location: returnPath.location,
      evidence: returnPath.evidence,
    });
  });

  const stepById = new Map(
    flow.staticFlow.steps
      .filter((step) => step.functionId === functionId)
      .map((step) => [step.id, step] as const),
  );

  for (const step of stepById.values()) {
    if (step.kind === 'parameter' || step.kind === 'return') continue;
    facts.push(stepFact(step));
  }

  for (const relationship of flow.staticFlow.relationships) {
    if (relationship.functionId !== functionId) continue;
    facts.push(relationshipFact(relationship, stepById));
  }

  return facts.sort(compareFacts);
}

function stepFact(step: StaticFlowStep): BehaviorFact {
  return {
    key: stepSemanticKey(step),
    category: 'step',
    kind: step.kind,
    label: step.label,
    detail: step.valueText,
    location: step.location,
    evidence: step.evidence,
  };
}

function relationshipFact(
  relationship: StaticFlowRelationship,
  stepById: Map<string, StaticFlowStep>,
): BehaviorFact {
  const source =
    relationship.sourceStepId === null
      ? null
      : stepById.get(relationship.sourceStepId) ?? null;
  const target =
    relationship.targetStepId === null
      ? null
      : stepById.get(relationship.targetStepId) ?? null;
  const sourceKey = source === null ? 'boundary' : stepSemanticKey(source);
  const targetKey = target === null ? 'boundary' : stepSemanticKey(target);
  const sourceLabel = source?.label ?? 'function boundary';
  const targetLabel = target?.label ?? 'function boundary';
  const location = relationship.evidence[0]?.location ?? target?.location ?? null;

  return {
    key: factKey([
      'relationship',
      relationship.kind,
      normalize(relationship.label),
      sourceKey,
      targetKey,
    ]),
    category: 'relationship',
    kind: relationship.kind,
    label: relationship.label,
    detail: `${sourceLabel} → ${targetLabel}`,
    location,
    evidence: relationship.evidence,
  };
}

function stepSemanticKey(step: StaticFlowStep): string {
  return factKey([
    'step',
    step.kind,
    normalize(step.label),
    normalize(step.valueText ?? ''),
  ]);
}

function diffFacts(
  changeEntityId: string,
  baseFacts: BehaviorFact[],
  headFacts: BehaviorFact[],
): FunctionBehaviorDeltaItem[] {
  const baseByKey = groupFacts(baseFacts);
  const headByKey = groupFacts(headFacts);
  const keys = [...new Set([...baseByKey.keys(), ...headByKey.keys()])].sort();
  const raw: Array<{
    changeKind: BehaviorDeltaChangeKind;
    snapshot: BehaviorDeltaSnapshot;
    fact: BehaviorFact;
  }> = [];

  for (const key of keys) {
    const baseGroup = baseByKey.get(key) ?? [];
    const headGroup = headByKey.get(key) ?? [];
    if (baseGroup.length > headGroup.length) {
      for (const fact of baseGroup.slice(headGroup.length)) {
        raw.push({ changeKind: 'removed', snapshot: 'base', fact });
      }
    }
    if (headGroup.length > baseGroup.length) {
      for (const fact of headGroup.slice(baseGroup.length)) {
        raw.push({ changeKind: 'added', snapshot: 'head', fact });
      }
    }
  }

  return raw
    .sort(
      (left, right) =>
        changeKindRank(left.changeKind) - changeKindRank(right.changeKind) ||
        categoryRank(left.fact.category) - categoryRank(right.fact.category) ||
        left.fact.kind.localeCompare(right.fact.kind) ||
        left.fact.label.localeCompare(right.fact.label) ||
        (left.fact.detail ?? '').localeCompare(right.fact.detail ?? '') ||
        compareLocations(left.fact.location, right.fact.location),
    )
    .map(({ changeKind, snapshot, fact }, index) => ({
      id: `behavior-delta:${changeEntityId}:${changeKind}:${index}`,
      changeKind,
      category: fact.category,
      kind: fact.kind,
      label: fact.label,
      detail: fact.detail,
      snapshot,
      location: fact.location,
      evidence: fact.evidence,
    }));
}

function groupFacts(facts: BehaviorFact[]): Map<string, BehaviorFact[]> {
  const grouped = new Map<string, BehaviorFact[]>();
  for (const fact of facts) {
    const current = grouped.get(fact.key) ?? [];
    current.push(fact);
    grouped.set(fact.key, current);
  }
  for (const group of grouped.values()) {
    group.sort((left, right) => compareLocations(left.location, right.location));
  }
  return grouped;
}

function summarize(items: FunctionBehaviorDeltaItem[]): FunctionBehaviorDeltaSummary {
  return {
    addedCount: items.filter((item) => item.changeKind === 'added').length,
    removedCount: items.filter((item) => item.changeKind === 'removed').length,
    parameterCount: items.filter((item) => item.category === 'parameter').length,
    returnCount: items.filter((item) => item.category === 'return').length,
    stepCount: items.filter((item) => item.category === 'step').length,
    relationshipCount: items.filter((item) => item.category === 'relationship')
      .length,
  };
}

function factKey(parts: string[]): string {
  return parts.join('|');
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function compareFacts(left: BehaviorFact, right: BehaviorFact): number {
  return left.key.localeCompare(right.key) || compareLocations(left.location, right.location);
}

function compareLocations(
  left: SourceLocation | null,
  right: SourceLocation | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (
    left.filePath.localeCompare(right.filePath) ||
    left.startLine - right.startLine ||
    left.startColumn - right.startColumn
  );
}

function changeKindRank(kind: BehaviorDeltaChangeKind): number {
  return kind === 'removed' ? 0 : 1;
}

function categoryRank(category: BehaviorDeltaCategory): number {
  const ranks: Record<BehaviorDeltaCategory, number> = {
    parameter: 0,
    return: 1,
    step: 2,
    relationship: 3,
  };
  return ranks[category];
}
