import { useMemo, useState } from 'react';

import {
  analyzeImpact,
  type FlowProjection,
  type ImpactEntityKind,
  type ImpactProjection,
  type ImpactResult,
  type RepositoryEntity,
} from './flow-client';
import { Button, Input } from './ui/primitives';
import './impact.css';

interface ImpactCandidate {
  id: string;
  kind: ImpactEntityKind;
  name: string;
  path: string | null;
}

type LayerFilter = 'all' | 'direct' | 'transitive';

export function ImpactPanel({
  flow,
  onOpenFunction,
}: {
  flow: FlowProjection;
  onOpenFunction: (entity: RepositoryEntity) => void;
}) {
  const candidates = useMemo(() => collectCandidates(flow), [flow]);
  const candidateById = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.id, candidate])),
    [candidates],
  );
  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [resultQuery, setResultQuery] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [impact, setImpact] = useState<ImpactProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [kindFilter, setKindFilter] = useState<ImpactEntityKind | 'all'>('all');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [focusedResultId, setFocusedResultId] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults =
    normalizedQuery === ''
      ? []
      : candidates
          .filter(
            (candidate) =>
              !scopeIds.includes(candidate.id) &&
              `${candidate.name} ${candidate.path ?? ''} ${candidate.kind}`
                .toLowerCase()
                .includes(normalizedQuery),
          )
          .slice(0, 20);
  const scope = scopeIds.flatMap((id) => {
    const candidate = candidateById.get(id);
    return candidate === undefined ? [] : [candidate];
  });
  const availableKinds = [
    ...new Set((impact?.results ?? []).map((result) => result.entityKind)),
  ].sort();
  const visibleResults = filterResults(
    impact,
    layerFilter,
    kindFilter,
    resultQuery,
    focusedResultId,
  );
  const selectedResult =
    impact?.results.find((result) => result.entityId === selectedResultId) ??
    visibleResults[0] ??
    null;

  async function traceImpact() {
    if (scopeIds.length === 0) {
      return;
    }
    setLoading(true);
    setError(null);
    setFocusedResultId(null);
    try {
      const next = await analyzeImpact(flow, scopeIds, maxDepth);
      setImpact(next);
      setSelectedResultId(next.results[0]?.entityId ?? null);
    } catch (cause: unknown) {
      setImpact(null);
      setSelectedResultId(null);
      setError(
        cause instanceof Error ? cause.message : 'Impact analysis failed.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="impact-panel" aria-label="Change impact explorer">
      <header className="impact-heading">
        <div>
          <p className="panel-kicker">Change impact</p>
          <h2>Change scope → downstream evidence</h2>
          <p>
            Trace known static dependents before editing. Impact means connected
            by supported evidence; it does not predict that code will break.
          </p>
        </div>
        {impact === null ? null : (
          <div className="impact-summary" aria-label="Impact summary">
            <span>{impact.summary.directCount} direct</span>
            <span>{impact.summary.transitiveCount} transitive</span>
            <span>{impact.summary.affectedFileIds.length} files</span>
            <span>{impact.summary.affectedPackageIds.length} packages</span>
          </div>
        )}
      </header>

      <div className="impact-scope">
        <div className="impact-scope-heading">
          <div>
            <p className="panel-kicker">Impact scope</p>
            <span>{scope.length}/8 change targets</span>
          </div>
          <div className="impact-depth" aria-label="Impact traversal depth">
            <span>Depth</span>
            {[1, 2, 3, 4].map((depth) => (
              <Button
                key={depth}
                size="sm"
                variant="ghost"
                aria-pressed={maxDepth === depth}
                onClick={() => setMaxDepth(depth)}
              >
                {depth}
              </Button>
            ))}
          </div>
        </div>

        <div className="impact-search">
          <Input
            aria-label="Search change targets"
            type="search"
            value={query}
            placeholder="Find package, module, file, or symbol…"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button
            disabled={scope.length === 0 || loading}
            onClick={traceImpact}
          >
            {loading ? 'Tracing…' : 'Trace impact'}
          </Button>
        </div>

        {searchResults.length > 0 ? (
          <div className="impact-search-results" role="listbox">
            {searchResults.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  if (scopeIds.length >= 8) {
                    return;
                  }
                  setScopeIds((current) => [...current, candidate.id]);
                  setQuery('');
                  setImpact(null);
                  setSelectedResultId(null);
                }}
              >
                <strong>{candidate.name}</strong>
                <span>
                  {candidate.kind} · {candidate.path ?? 'configured boundary'}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {scope.length === 0 ? (
          <p className="impact-empty">
            Select code or a configured package boundary to define the proposed
            change scope.
          </p>
        ) : (
          <div
            className="impact-scope-items"
            aria-label="Selected change targets"
          >
            {scope.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                aria-label={`Remove ${candidate.name} from impact scope`}
                onClick={() => {
                  setScopeIds((current) =>
                    current.filter((id) => id !== candidate.id),
                  );
                  setImpact(null);
                  setSelectedResultId(null);
                }}
              >
                <strong>{candidate.name}</strong>
                <span>{candidate.kind}</span>
                <small>×</small>
              </button>
            ))}
          </div>
        )}
      </div>

      {error === null ? null : <p className="impact-error">{error}</p>}

      {impact === null ? null : (
        <>
          <div className="impact-toolbar">
            <div
              className="impact-layer-filter"
              aria-label="Impact layer filter"
            >
              {(['all', 'direct', 'transitive'] as const).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant="ghost"
                  aria-pressed={layerFilter === filter}
                  onClick={() => setLayerFilter(filter)}
                >
                  {filter === 'all'
                    ? 'All'
                    : filter === 'direct'
                      ? 'Direct'
                      : 'Transitive'}
                </Button>
              ))}
            </div>
            <Input
              aria-label="Filter impact results"
              type="search"
              value={resultQuery}
              placeholder="Filter affected code…"
              autoComplete="off"
              onChange={(event) => setResultQuery(event.target.value)}
            />
            {focusedResultId === null ? null : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFocusedResultId(null)}
              >
                Back to impact results
              </Button>
            )}
          </div>

          {availableKinds.length > 1 ? (
            <div className="impact-kind-filter" aria-label="Impact kind filter">
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={kindFilter === 'all'}
                onClick={() => setKindFilter('all')}
              >
                All kinds
              </Button>
              {availableKinds.map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant="ghost"
                  aria-pressed={kindFilter === kind}
                  onClick={() => setKindFilter(kind)}
                >
                  {kind}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="impact-grid">
            <div
              className="impact-results"
              aria-label="Potential downstream impact"
            >
              {visibleResults.length === 0 ? (
                <div className="impact-empty-state">
                  <strong>No known downstream dependency found.</strong>
                  <span>
                    Supported static analysis did not find a matching downstream
                    relationship for this scope and filter.
                  </span>
                  {impact.status === 'partial' ? (
                    <span>
                      Impact coverage is partial; absence from the result set is
                      not a safety guarantee.
                    </span>
                  ) : null}
                </div>
              ) : (
                visibleResults.map((result) => (
                  <button
                    key={result.entityId}
                    type="button"
                    aria-pressed={selectedResult?.entityId === result.entityId}
                    onClick={() => setSelectedResultId(result.entityId)}
                  >
                    <div>
                      <strong>{result.name}</strong>
                      <span>
                        {result.entityKind} ·{' '}
                        {result.path ?? 'configured boundary'}
                      </span>
                    </div>
                    <small>
                      {result.distance === 1
                        ? 'direct'
                        : `${result.distance} hops`}
                    </small>
                  </button>
                ))
              )}
            </div>

            <ImpactDetail
              flow={flow}
              impact={impact}
              result={selectedResult}
              candidateById={candidateById}
              focused={
                selectedResult !== null &&
                focusedResultId === selectedResult.entityId
              }
              onFocus={() =>
                setFocusedResultId(selectedResult?.entityId ?? null)
              }
              onOpenFunction={onOpenFunction}
            />
          </div>

          {impact.status === 'partial' ? (
            <details className="impact-issues">
              <summary>
                Partial impact analysis · {impact.issues.length} unresolved or
                bounded item(s)
              </summary>
              <ul>
                {impact.issues.map((issue, index) => (
                  <li key={`${issue.filePath ?? 'impact'}:${index}`}>
                    {issue.filePath === undefined ? '' : `${issue.filePath}: `}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}

function ImpactDetail({
  flow,
  impact,
  result,
  candidateById,
  focused,
  onFocus,
  onOpenFunction,
}: {
  flow: FlowProjection;
  impact: ImpactProjection;
  result: ImpactResult | null;
  candidateById: Map<string, ImpactCandidate>;
  focused: boolean;
  onFocus: () => void;
  onOpenFunction: (entity: RepositoryEntity) => void;
}) {
  if (result === null) {
    return (
      <aside className="impact-detail">
        <p className="impact-empty">
          Select an affected entity to inspect why.
        </p>
      </aside>
    );
  }

  const path = result.paths[0] ?? null;
  const functionEntity = functionEntityFor(flow, result.entityId);

  return (
    <aside className="impact-detail" aria-label="Impact selection">
      <div className="impact-detail-heading">
        <div>
          <p className="panel-kicker">Potential downstream impact</p>
          <h3>{result.name}</h3>
          <p>
            {result.entityKind} · {result.path ?? 'configured boundary'}
          </p>
        </div>
        <div className="impact-detail-actions">
          <Button variant="ghost" aria-pressed={focused} onClick={onFocus}>
            Focus path
          </Button>
          {functionEntity === null ? null : (
            <Button onClick={() => onOpenFunction(functionEntity)}>
              Open function flow
            </Button>
          )}
        </div>
      </div>

      <div className="impact-distance">
        <span>Distance</span>
        <strong>
          {result.distance === 1 ? 'Direct · 1 hop' : `${result.distance} hops`}
        </strong>
        <small>
          {result.seedIds.length === 1
            ? 'Connected to 1 change target'
            : `Connected to ${result.seedIds.length} change targets`}
        </small>
      </div>

      {path === null ? null : (
        <section className="impact-path">
          <p className="panel-kicker">Evidence path</p>
          <ol>
            {path.steps.map((step, index) => {
              const source = candidateById.get(step.sourceId);
              const target = candidateById.get(step.targetId);
              const evidence = step.evidence[0];
              return (
                <li
                  key={`${step.kind}:${step.sourceId}:${step.targetId}:${index}`}
                >
                  <div className="impact-path-edge">
                    <strong>{source?.name ?? step.sourceId}</strong>
                    <span>
                      {step.kind} → {target?.name ?? step.targetId}
                    </span>
                  </div>
                  {evidence === undefined ? null : (
                    <div className="impact-evidence">
                      <span>{evidence.kind}</span>
                      <code>
                        {evidence.location.filePath}:L
                        {evidence.location.startLine}
                      </code>
                      <p>{evidence.reason}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {impact.status === 'partial' ? (
        <p className="impact-partial-note">
          This path is evidence-backed, but repository impact coverage is
          partial. Absence from the result set is not a safety guarantee.
        </p>
      ) : null}
    </aside>
  );
}

function collectCandidates(flow: FlowProjection): ImpactCandidate[] {
  const candidates = new Map<string, ImpactCandidate>();

  for (const entity of flow.topology?.entities ?? []) {
    if (entity.kind !== 'Package') {
      continue;
    }
    candidates.set(entity.id, {
      id: entity.id,
      kind: 'Package',
      name: entity.name,
      path: entity.path,
    });
  }

  for (const entity of flow.architecture?.entities ?? []) {
    if (entity.kind === 'Repository') {
      continue;
    }
    candidates.set(entity.id, {
      id: entity.id,
      kind: entity.kind,
      name: entity.name,
      path: entity.path,
    });
  }

  for (const node of flow.nodes) {
    if (candidates.has(node.id)) {
      continue;
    }
    candidates.set(node.id, {
      id: node.id,
      kind: 'Function',
      name: node.label,
      path: node.location.filePath,
    });
  }

  return [...candidates.values()].sort(
    (left, right) =>
      impactKindRank(left.kind) - impactKindRank(right.kind) ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id),
  );
}

function filterResults(
  impact: ImpactProjection | null,
  layerFilter: LayerFilter,
  kindFilter: ImpactEntityKind | 'all',
  query: string,
  focusedResultId: string | null,
): ImpactResult[] {
  if (impact === null) {
    return [];
  }
  const normalizedQuery = query.trim().toLowerCase();
  let focusIds: Set<string> | null = null;
  if (focusedResultId !== null) {
    const focused = impact.results.find(
      (result) => result.entityId === focusedResultId,
    );
    const path = focused?.paths[0];
    if (path !== undefined) {
      focusIds = new Set([
        focusedResultId,
        ...path.steps.map((step) => step.sourceId),
      ]);
    }
  }

  return impact.results.filter((result) => {
    if (focusIds !== null && !focusIds.has(result.entityId)) {
      return false;
    }
    if (layerFilter === 'direct' && result.distance !== 1) {
      return false;
    }
    if (layerFilter === 'transitive' && result.distance <= 1) {
      return false;
    }
    if (kindFilter !== 'all' && result.entityKind !== kindFilter) {
      return false;
    }
    if (
      normalizedQuery !== '' &&
      !`${result.name} ${result.path ?? ''} ${result.entityKind}`
        .toLowerCase()
        .includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });
}

function functionEntityFor(
  flow: FlowProjection,
  entityId: string,
): RepositoryEntity | null {
  const architectureEntity = flow.architecture?.entities.find(
    (entity) => entity.id === entityId && entity.kind === 'Function',
  );
  if (architectureEntity !== undefined) {
    return architectureEntity;
  }
  const node = flow.nodes.find((candidate) => candidate.id === entityId);
  if (node === undefined) {
    return null;
  }
  return {
    id: node.id,
    kind: 'Function',
    name: node.label,
    path: node.location.filePath,
    location: node.location,
    exported: false,
    evidence: [],
  };
}

function impactKindRank(kind: ImpactEntityKind): number {
  const rank: Record<ImpactEntityKind, number> = {
    Package: 0,
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
  return rank[kind];
}
