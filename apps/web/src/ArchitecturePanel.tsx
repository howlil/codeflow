import { useMemo, useState } from 'react';

import type {
  FlowProjection,
  RepositoryEntity,
  RepositoryRelationship,
} from './flow-client';
import { Button, Input } from './ui/primitives';
import './architecture.css';

export function ArchitecturePanel({
  flow,
  onOpenFunction,
}: {
  flow: FlowProjection;
  onOpenFunction: (entity: RepositoryEntity) => void;
}) {
  const architecture = flow.architecture;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(architecture === undefined ? [] : [architecture.rootId]),
  );

  const entityById = useMemo(
    () =>
      new Map(
        (architecture?.entities ?? []).map((entity) => [entity.id, entity]),
      ),
    [architecture],
  );
  const childrenById = useMemo(() => {
    const result = new Map<string, RepositoryEntity[]>();
    if (architecture === undefined) {
      return result;
    }
    for (const relationship of architecture.relationships) {
      if (relationship.kind !== 'CONTAINS' && relationship.kind !== 'DEFINES') {
        continue;
      }
      const target = entityById.get(relationship.targetId);
      if (target === undefined) {
        continue;
      }
      const children = result.get(relationship.sourceId) ?? [];
      children.push(target);
      result.set(relationship.sourceId, children);
    }
    for (const children of result.values()) {
      children.sort(compareEntities);
    }
    return result;
  }, [architecture, entityById]);

  if (architecture === undefined) {
    return null;
  }

  const selected =
    entityById.get(selectedId ?? architecture.rootId) ??
    entityById.get(architecture.rootId) ??
    null;
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults =
    normalizedQuery === ''
      ? []
      : architecture.entities
          .filter(
            (entity) =>
              entity.kind !== 'Repository' &&
              `${entity.name} ${entity.path} ${entity.kind}`
                .toLowerCase()
                .includes(normalizedQuery),
          )
          .slice(0, 24);
  const neighborhood =
    focusedId === null
      ? []
      : directNeighborhood(focusedId, architecture.relationships, entityById);
  const modules = architecture.entities.filter(
    (entity) => entity.kind === 'Module',
  ).length;
  const files = architecture.entities.filter(
    (entity) => entity.kind === 'File',
  ).length;
  const symbols = architecture.entities.filter((entity) =>
    isSymbol(entity),
  ).length;

  function selectEntity(entity: RepositoryEntity) {
    setSelectedId(entity.id);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section
      className="architecture-panel"
      aria-label="Repository architecture"
    >
      <div className="architecture-heading">
        <div>
          <p className="panel-kicker">Repository architecture</p>
          <h2>System → module → file → symbol</h2>
          <p className="architecture-copy">
            Deterministic structure and code relationships from the analyzed
            TypeScript source. Missing evidence stays missing.
          </p>
        </div>
        <div className="architecture-counts" aria-label="Architecture summary">
          <span>{modules} modules</span>
          <span>{files} files</span>
          <span>{symbols} symbols</span>
        </div>
      </div>

      <div className="architecture-toolbar">
        <Input
          aria-label="Search repository architecture"
          type="search"
          value={query}
          placeholder="Search module, file, or symbol…"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
        {focusedId === null ? null : (
          <Button variant="ghost" onClick={() => setFocusedId(null)}>
            Back to repository
          </Button>
        )}
      </div>

      {searchResults.length > 0 ? (
        <div className="architecture-search-results" role="listbox">
          {searchResults.map((entity) => (
            <button
              key={entity.id}
              type="button"
              role="option"
              aria-selected={selected?.id === entity.id}
              onClick={() => {
                selectEntity(entity);
                setQuery('');
              }}
            >
              <strong>{entity.name}</strong>
              <span>
                {entity.kind} · {entity.path}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="architecture-grid">
        <div className="architecture-tree" aria-label="Repository hierarchy">
          {focusedId === null ? (
            <ArchitectureTreeNode
              entity={entityById.get(architecture.rootId) ?? null}
              selectedId={selected?.id ?? null}
              expandedIds={expandedIds}
              childrenById={childrenById}
              onSelect={selectEntity}
              onToggle={toggleExpanded}
            />
          ) : (
            <div className="architecture-neighborhood">
              <p className="panel-kicker">Focused neighborhood</p>
              {neighborhood.map(({ entity, relationship, direction }) => (
                <button
                  key={`${relationship.id}:${direction}`}
                  type="button"
                  onClick={() => selectEntity(entity)}
                >
                  <strong>{entity.name}</strong>
                  <span>
                    {direction === 'outgoing' ? '→' : '←'} {relationship.kind} ·{' '}
                    {entity.kind}
                  </span>
                </button>
              ))}
              {neighborhood.length === 0 ? (
                <p className="architecture-empty">
                  No direct repository relationships were projected.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <ArchitectureDetail
          flow={flow}
          entity={selected}
          relationships={architecture.relationships}
          entityById={entityById}
          focused={selected !== null && focusedId === selected.id}
          onFocus={() => setFocusedId(selected?.id ?? null)}
          onSelect={selectEntity}
          onOpenFunction={onOpenFunction}
        />
      </div>
    </section>
  );
}

function ArchitectureTreeNode({
  entity,
  selectedId,
  expandedIds,
  childrenById,
  onSelect,
  onToggle,
  depth = 0,
}: {
  entity: RepositoryEntity | null;
  selectedId: string | null;
  expandedIds: Set<string>;
  childrenById: Map<string, RepositoryEntity[]>;
  onSelect: (entity: RepositoryEntity) => void;
  onToggle: (id: string) => void;
  depth?: number;
}) {
  if (entity === null) {
    return null;
  }
  const children = childrenById.get(entity.id) ?? [];
  const expanded = expandedIds.has(entity.id);
  const visibleChildren = children.filter(
    (child) => depth < 2 || child.kind !== 'Method',
  );

  return (
    <div className="architecture-tree-node">
      <div
        className="architecture-tree-row"
        style={{ paddingLeft: depth * 12 }}
      >
        {visibleChildren.length > 0 ? (
          <button
            className="architecture-expand"
            type="button"
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${entity.name}`}
            aria-expanded={expanded}
            onClick={() => onToggle(entity.id)}
          >
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <span className="architecture-expand-spacer" aria-hidden="true" />
        )}
        <button
          className="architecture-entity-button"
          type="button"
          aria-pressed={selectedId === entity.id}
          onClick={() => onSelect(entity)}
        >
          <strong>{entity.name}</strong>
          <span>{entity.kind}</span>
        </button>
      </div>
      {expanded
        ? visibleChildren.map((child) => (
            <ArchitectureTreeNode
              key={child.id}
              entity={child}
              selectedId={selectedId}
              expandedIds={expandedIds}
              childrenById={childrenById}
              onSelect={onSelect}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))
        : null}
    </div>
  );
}

function ArchitectureDetail({
  flow,
  entity,
  relationships,
  entityById,
  focused,
  onFocus,
  onSelect,
  onOpenFunction,
}: {
  flow: FlowProjection;
  entity: RepositoryEntity | null;
  relationships: RepositoryRelationship[];
  entityById: Map<string, RepositoryEntity>;
  focused: boolean;
  onFocus: () => void;
  onSelect: (entity: RepositoryEntity) => void;
  onOpenFunction: (entity: RepositoryEntity) => void;
}) {
  if (entity === null) {
    return (
      <div className="architecture-detail">
        <p className="architecture-empty">Select an architecture entity.</p>
      </div>
    );
  }

  const incoming = relationships.filter(
    (relationship) => relationship.targetId === entity.id,
  );
  const outgoing = relationships.filter(
    (relationship) => relationship.sourceId === entity.id,
  );
  const references = incoming.filter(
    (relationship) => relationship.kind === 'REFERENCES',
  );
  const canOpenFunction =
    entity.kind === 'Function' &&
    (flow.nodes.some((node) => node.id === entity.id) ||
      (flow.entryPoints ?? []).some(
        (entryPoint) =>
          entryPoint.filePath === entity.path &&
          entryPoint.name === entity.name,
      ));

  return (
    <aside className="architecture-detail" aria-label="Architecture selection">
      <div className="architecture-detail-heading">
        <div>
          <p className="panel-kicker">{entity.kind}</p>
          <h3>{entity.name}</h3>
          <p>{entity.path}</p>
        </div>
        <div className="architecture-detail-actions">
          <Button variant="ghost" aria-pressed={focused} onClick={onFocus}>
            Focus
          </Button>
          {canOpenFunction ? (
            <Button onClick={() => onOpenFunction(entity)}>
              Open function flow
            </Button>
          ) : null}
        </div>
      </div>

      {entity.location === null ? null : (
        <p className="architecture-location">
          Defined at {entity.location.filePath}:L{entity.location.startLine}
        </p>
      )}

      {references.length > 0 ? (
        <RelationshipGroup
          title={`References (${references.length})`}
          relationships={references}
          entityById={entityById}
          direction="incoming"
          onSelect={onSelect}
        />
      ) : null}
      <RelationshipGroup
        title="Outgoing"
        relationships={outgoing}
        entityById={entityById}
        direction="outgoing"
        onSelect={onSelect}
      />
      <RelationshipGroup
        title="Incoming"
        relationships={incoming.filter(
          (relationship) => relationship.kind !== 'REFERENCES',
        )}
        entityById={entityById}
        direction="incoming"
        onSelect={onSelect}
      />

      {entity.evidence[0] === undefined ? null : (
        <div className="architecture-evidence">
          <span>{entity.evidence[0].kind}</span>
          <p>{entity.evidence[0].reason}</p>
        </div>
      )}
    </aside>
  );
}

function RelationshipGroup({
  title,
  relationships,
  entityById,
  direction,
  onSelect,
}: {
  title: string;
  relationships: RepositoryRelationship[];
  entityById: Map<string, RepositoryEntity>;
  direction: 'incoming' | 'outgoing';
  onSelect: (entity: RepositoryEntity) => void;
}) {
  if (relationships.length === 0) {
    return null;
  }
  return (
    <section className="architecture-relationships">
      <p className="panel-kicker">{title}</p>
      {relationships.slice(0, 16).map((relationship) => {
        const peer = entityById.get(
          direction === 'outgoing'
            ? relationship.targetId
            : relationship.sourceId,
        );
        if (peer === undefined) {
          return null;
        }
        return (
          <button
            key={`${relationship.id}:${direction}`}
            type="button"
            onClick={() => onSelect(peer)}
          >
            <strong>{relationship.kind}</strong>
            <span>{peer.name}</span>
            <small>
              {relationship.evidence[0]?.kind ?? 'evidence-unavailable'}
            </small>
          </button>
        );
      })}
    </section>
  );
}

function directNeighborhood(
  entityId: string,
  relationships: RepositoryRelationship[],
  entityById: Map<string, RepositoryEntity>,
): Array<{
  entity: RepositoryEntity;
  relationship: RepositoryRelationship;
  direction: 'incoming' | 'outgoing';
}> {
  const results: Array<{
    entity: RepositoryEntity;
    relationship: RepositoryRelationship;
    direction: 'incoming' | 'outgoing';
  }> = [];
  for (const relationship of relationships) {
    if (relationship.sourceId === entityId) {
      const entity = entityById.get(relationship.targetId);
      if (entity !== undefined) {
        results.push({ entity, relationship, direction: 'outgoing' });
      }
    } else if (relationship.targetId === entityId) {
      const entity = entityById.get(relationship.sourceId);
      if (entity !== undefined) {
        results.push({ entity, relationship, direction: 'incoming' });
      }
    }
  }
  return results.slice(0, 32);
}

function isSymbol(entity: RepositoryEntity): boolean {
  return (
    entity.kind !== 'Repository' &&
    entity.kind !== 'Module' &&
    entity.kind !== 'File'
  );
}

function compareEntities(
  left: RepositoryEntity,
  right: RepositoryEntity,
): number {
  const rank: Record<RepositoryEntity['kind'], number> = {
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
    left.name.localeCompare(right.name)
  );
}
