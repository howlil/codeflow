import { useMemo, useState } from 'react';

import type {
  FunctionBehaviorDelta,
  PullRequestAnalysis,
  RelationshipDelta,
  RepositoryChangedFile,
  SemanticChangeEntity,
} from './change-client';
import type { FlowProjection, ImpactResult } from './flow-client';
import { Button } from './ui/primitives';
import './change-workspace.css';

type SnapshotKind = 'base' | 'head';

export function ChangeWorkspace({
  analysis,
  onOpenFunction,
  onChangeRepository,
}: {
  analysis: PullRequestAnalysis;
  onOpenFunction: (
    snapshot: SnapshotKind,
    flow: FlowProjection,
    entityId: string,
  ) => void;
  onChangeRepository: () => void;
}) {
  const { change } = analysis;
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(
    change.entities[0]?.id ?? null,
  );
  const selectedChange =
    change.entities.find((entity) => entity.id === selectedChangeId) ??
    change.entities[0] ??
    null;
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    selectedChange?.path ?? change.files[0]?.path ?? '',
  );
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);

  const snapshot = snapshotForChange(selectedChange);
  const snapshotFlow = snapshot === 'base' ? analysis.base : analysis.head;
  const snapshotImpact = change.impact[snapshot];
  const seedId =
    selectedChange === null
      ? null
      : snapshot === 'base'
        ? selectedChange.baseEntityId
        : selectedChange.headEntityId;
  const impactResults = useMemo(
    () =>
      (snapshotImpact?.results ?? []).filter(
        (result) => seedId === null || result.seedIds.includes(seedId),
      ),
    [seedId, snapshotImpact],
  );
  const selectedImpact =
    impactResults.find((result) => result.entityId === selectedImpactId) ??
    impactResults[0] ??
    null;
  const selectedFile =
    change.files.find(
      (file) =>
        file.path === selectedFilePath ||
        file.previousPath === selectedFilePath,
    ) ??
    change.files.find(
      (file) =>
        selectedChange !== null &&
        (file.path === selectedChange.path ||
          file.previousPath === selectedChange.path),
    ) ??
    change.files[0] ??
    null;
  const groups = groupChanges(change.entities, analysis);
  const behaviorDelta =
    selectedChange === null
      ? null
      : (change.behaviorDeltas.find(
          (delta) => delta.changeEntityId === selectedChange.id,
        ) ?? null);

  return (
    <section
      className="change-workspace"
      aria-label="Pull request change workspace"
    >
      <header className="change-header">
        <div>
          <p className="panel-kicker">
            {change.source.repository} · PR #{change.source.pullRequestNumber}
          </p>
          <h2>{change.source.title}</h2>
          <p>
            Frozen revisions <code>{shortSha(change.source.baseRevision)}</code>{' '}
            → <code>{shortSha(change.source.headRevision)}</code>. Impact means
            connected by supported static evidence; it does not predict failure.
          </p>
        </div>
        <Button variant="ghost" onClick={onChangeRepository}>
          Change repository
        </Button>
      </header>

      <div
        className="change-summary"
        aria-label="Pull request semantic summary"
      >
        <span>{change.files.length} changed files</span>
        <span>{change.entities.length} semantic changes</span>
        <span>{countBehaviorDeltas(change)} static behavior deltas</span>
        <span>{change.relationshipDeltas.length} relationship deltas</span>
        <span>{countImpact(change)} downstream results</span>
        <span>{change.coverage.status} coverage</span>
      </div>

      <div className="change-grid">
        <aside className="change-navigation" aria-label="Changed code">
          <div className="change-section-heading">
            <p className="panel-kicker">Changed semantic code</p>
            <span>diff → entity</span>
          </div>
          {groups.length === 0 ? (
            <p className="change-empty">
              No supported semantic entity could be mapped. Changed files remain
              visible below.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="change-group">
                <header>
                  <strong>{group.label}</strong>
                  <span>{group.entities.length}</span>
                </header>
                {group.entities.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    aria-pressed={selectedChange?.id === entity.id}
                    onClick={() => {
                      setSelectedChangeId(entity.id);
                      setSelectedFilePath(entity.path);
                      setSelectedImpactId(null);
                    }}
                  >
                    <span
                      className={`change-kind change-kind--${entity.changeKind}`}
                    >
                      {changeKindLabel(entity.changeKind)}
                    </span>
                    <span className="change-entity-copy">
                      <strong>{entity.name}</strong>
                      <small>
                        {entity.entityKind} · {entity.path}
                      </small>
                    </span>
                  </button>
                ))}
              </section>
            ))
          )}

          <div className="change-section-heading change-files-heading">
            <p className="panel-kicker">Changed files</p>
            <span>{change.files.length}</span>
          </div>
          <div className="change-file-list">
            {change.files.map((file) => (
              <button
                key={`${file.previousPath ?? ''}:${file.path}`}
                type="button"
                aria-pressed={selectedFile?.path === file.path}
                onClick={() => setSelectedFilePath(file.path)}
              >
                <span>{file.status.slice(0, 1).toUpperCase()}</span>
                <strong>{file.path}</strong>
                <small>
                  +{file.additions} −{file.deletions}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <section className="change-diff" aria-label="Selected change diff">
          <ChangeDiff file={selectedFile} />
        </section>

        <aside
          className="change-impact"
          aria-label="Potential downstream impact"
        >
          <BehaviorDeltaInspector delta={behaviorDelta} />
          <ImpactInspector
            selectedChange={selectedChange}
            snapshot={snapshot}
            flow={snapshotFlow}
            results={impactResults}
            selectedResult={selectedImpact}
            onSelectResult={(result) => setSelectedImpactId(result.entityId)}
            onOpenFunction={onOpenFunction}
          />
          <RelationshipDeltas deltas={change.relationshipDeltas} />
        </aside>
      </div>

      {change.coverage.status === 'partial' ? (
        <details className="change-coverage">
          <summary>
            Partial change analysis · {change.coverage.issues.length} bounded or
            unresolved item(s)
          </summary>
          <p>
            Absence from the downstream result set is not a safety guarantee.
          </p>
          <ul>
            {change.coverage.issues.map((issue, index) => (
              <li key={`${issue.filePath ?? 'change'}:${index}`}>
                {issue.filePath === undefined ? '' : `${issue.filePath}: `}
                {issue.message}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function ChangeDiff({ file }: { file: RepositoryChangedFile | null }) {
  if (file === null) {
    return <p className="change-empty">No changed file is available.</p>;
  }
  return (
    <>
      <header className="change-pane-heading">
        <div>
          <p className="panel-kicker">Actual Git diff</p>
          <h3>{file.path}</h3>
          {file.previousPath === null ? null : (
            <p>previously {file.previousPath}</p>
          )}
        </div>
        <span>
          +{file.additions} −{file.deletions}
        </span>
      </header>
      {file.patch === null ? (
        <div className="change-empty-state">
          <strong>Patch unavailable for this file.</strong>
          <span>
            File-level change is known, but changed-line semantic mapping is not
            available from GitHub for this patch.
          </span>
        </div>
      ) : (
        <pre className="change-patch" tabIndex={0}>
          <code>{file.patch}</code>
        </pre>
      )}
    </>
  );
}

function BehaviorDeltaInspector({
  delta,
}: {
  delta: FunctionBehaviorDelta | null;
}) {
  if (delta === null) {
    return null;
  }

  return (
    <section className="behavior-deltas change-impact-section">
      <header className="change-pane-heading">
        <div>
          <p className="panel-kicker">Static behavior delta</p>
          <h3>{delta.functionName}</h3>
          <p>
            BASE → HEAD · +{delta.summary.addedCount} −
            {delta.summary.removedCount} supported static facts
          </p>
        </div>
      </header>

      {delta.items.length === 0 ? (
        <div className="change-empty-state">
          <strong>No supported static behavior delta detected.</strong>
          <span>
            Contract and projected static-flow facts are unchanged. This does
            not prove runtime equivalence.
          </span>
        </div>
      ) : (
        <div className="behavior-delta-list">
          {delta.items.map((item) => {
            const evidence = item.evidence[0];
            const location = item.location ?? evidence?.location ?? null;
            return (
              <div key={item.id}>
                <span className={`change-kind change-kind--${item.changeKind}`}>
                  {item.changeKind === 'added' ? 'A' : 'R'}
                </span>
                <div>
                  <strong>
                    {behaviorCategoryLabel(item.category)} · {item.kind}
                  </strong>
                  <span>{item.label}</span>
                  {item.detail === null ? null : <small>{item.detail}</small>}
                  {location === null ? null : (
                    <small>
                      {item.snapshot.toUpperCase()} · {location.filePath}:L
                      {location.startLine}
                    </small>
                  )}
                  {evidence === undefined ? null : (
                    <small>{evidence.reason}</small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ImpactInspector({
  selectedChange,
  snapshot,
  flow,
  results,
  selectedResult,
  onSelectResult,
  onOpenFunction,
}: {
  selectedChange: SemanticChangeEntity | null;
  snapshot: SnapshotKind;
  flow: FlowProjection;
  results: ImpactResult[];
  selectedResult: ImpactResult | null;
  onSelectResult: (result: ImpactResult) => void;
  onOpenFunction: (
    snapshot: SnapshotKind,
    flow: FlowProjection,
    entityId: string,
  ) => void;
}) {
  if (selectedChange === null) {
    return (
      <section>
        <p className="panel-kicker">Potential downstream</p>
        <p className="change-empty">
          Select a semantic change to trace impact.
        </p>
      </section>
    );
  }
  const selectedEntityId =
    snapshot === 'base'
      ? selectedChange.baseEntityId
      : selectedChange.headEntityId;
  return (
    <section className="change-impact-section">
      <header className="change-pane-heading">
        <div>
          <p className="panel-kicker">Potential downstream</p>
          <h3>{selectedChange.name}</h3>
          <p>
            {snapshot.toUpperCase()} snapshot · {results.length} known
            downstream
          </p>
        </div>
        {selectedChange.entityKind === 'Function' &&
        selectedEntityId !== null ? (
          <Button
            size="sm"
            onClick={() => onOpenFunction(snapshot, flow, selectedEntityId)}
          >
            Open flow
          </Button>
        ) : null}
      </header>

      {results.length === 0 ? (
        <div className="change-empty-state">
          <strong>No known downstream dependency found.</strong>
          <span>
            Supported static analysis found no downstream relationship for this
            mapped change target. This does not mean the change is safe.
          </span>
        </div>
      ) : (
        <div className="change-impact-list">
          {results.map((result) => (
            <button
              key={result.entityId}
              type="button"
              aria-pressed={selectedResult?.entityId === result.entityId}
              onClick={() => onSelectResult(result)}
            >
              <div>
                <strong>{result.name}</strong>
                <span>
                  {result.entityKind} · {result.path ?? 'configured boundary'}
                </span>
              </div>
              <small>
                {result.distance === 1 ? 'direct' : `${result.distance} hops`}
              </small>
            </button>
          ))}
        </div>
      )}

      {selectedResult === null ? null : (
        <ImpactEvidence
          result={selectedResult}
          flow={flow}
          snapshot={snapshot}
          onOpenFunction={onOpenFunction}
        />
      )}
    </section>
  );
}

function ImpactEvidence({
  result,
  flow,
  snapshot,
  onOpenFunction,
}: {
  result: ImpactResult;
  flow: FlowProjection;
  snapshot: SnapshotKind;
  onOpenFunction: (
    snapshot: SnapshotKind,
    flow: FlowProjection,
    entityId: string,
  ) => void;
}) {
  const path = result.paths[0];
  return (
    <div className="change-evidence">
      <div className="change-evidence-heading">
        <p className="panel-kicker">Why impacted</p>
        {result.entityKind === 'Function' ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenFunction(snapshot, flow, result.entityId)}
          >
            Open function flow
          </Button>
        ) : null}
      </div>
      {path === undefined ? (
        <p className="change-empty">No evidence path is available.</p>
      ) : (
        <ol>
          {path.steps.map((step, index) => {
            const evidence = step.evidence[0];
            return (
              <li
                key={`${step.kind}:${step.sourceId}:${step.targetId}:${index}`}
              >
                <strong>{step.kind}</strong>
                <span>
                  {step.sourceId} → {step.targetId}
                </span>
                {evidence === undefined ? null : (
                  <small>
                    {evidence.kind} · {evidence.location.filePath}:L
                    {evidence.location.startLine} · {evidence.reason}
                  </small>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function RelationshipDeltas({ deltas }: { deltas: RelationshipDelta[] }) {
  return (
    <section className="relationship-deltas">
      <div className="change-section-heading">
        <p className="panel-kicker">Relationship delta</p>
        <span>{deltas.length}</span>
      </div>
      {deltas.length === 0 ? (
        <p className="change-empty">
          No supported semantic relationship was added or removed between the
          frozen revisions.
        </p>
      ) : (
        <div className="relationship-delta-list">
          {deltas.slice(0, 40).map((delta) => (
            <div key={delta.id}>
              <span className={`change-kind change-kind--${delta.changeKind}`}>
                {delta.changeKind === 'added' ? 'A' : 'R'}
              </span>
              <div>
                <strong>{delta.relationshipKind}</strong>
                <span>
                  {delta.source.name} → {delta.target.name}
                </span>
                <small>
                  {delta.source.path ?? delta.source.kind} →{' '}
                  {delta.target.path ?? delta.target.kind}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function groupChanges(
  entities: SemanticChangeEntity[],
  analysis: PullRequestAnalysis,
): Array<{ label: string; entities: SemanticChangeEntity[] }> {
  const groups = new Map<string, SemanticChangeEntity[]>();
  for (const entity of entities) {
    const packageName = packageNameForPath(entity.path, analysis);
    const label = packageName ?? dirname(entity.path);
    const current = groups.get(label) ?? [];
    current.push(entity);
    groups.set(label, current);
  }
  return [...groups.entries()]
    .map(([label, groupedEntities]) => ({ label, entities: groupedEntities }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function packageNameForPath(
  path: string,
  analysis: PullRequestAnalysis,
): string | null {
  for (const flow of [analysis.head, analysis.base]) {
    const packageId = flow.topology?.fileOwners[path];
    if (packageId === undefined) continue;
    const entity = flow.topology?.entities.find(
      (candidate) => candidate.id === packageId && candidate.kind === 'Package',
    );
    if (entity !== undefined) return entity.name;
  }
  return null;
}

function dirname(path: string): string {
  const parts = path.split('/');
  return parts.length <= 1 ? 'Repository root' : parts.slice(0, -1).join('/');
}

function snapshotForChange(entity: SemanticChangeEntity | null): SnapshotKind {
  return entity?.changeKind === 'removed' ? 'base' : 'head';
}

function changeKindLabel(kind: SemanticChangeEntity['changeKind']): string {
  return kind === 'added' ? 'A' : kind === 'removed' ? 'R' : 'M';
}

function countBehaviorDeltas(change: PullRequestAnalysis['change']): number {
  return change.behaviorDeltas.reduce(
    (count, delta) => count + delta.items.length,
    0,
  );
}

function behaviorCategoryLabel(
  category: FunctionBehaviorDelta['items'][number]['category'],
): string {
  if (category === 'parameter') return 'Input';
  if (category === 'return') return 'Return';
  if (category === 'relationship') return 'Data flow';
  return 'Step';
}

function countImpact(change: PullRequestAnalysis['change']): number {
  const ids = new Set<string>();
  for (const result of change.impact.base?.results ?? [])
    ids.add(`base:${result.entityId}`);
  for (const result of change.impact.head?.results ?? [])
    ids.add(`head:${result.entityId}`);
  return ids.size;
}

function shortSha(sha: string): string {
  return sha.slice(0, 12);
}
