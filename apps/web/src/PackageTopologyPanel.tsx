import { useMemo, useState } from 'react';

import type {
  FlowProjection,
  PackageTopologyEntity,
  RepositoryEntity,
} from './flow-client';
import { Button } from './ui/primitives';
import './package-topology.css';

export function PackageTopologyPanel({
  flow,
  onOpenFunction,
}: {
  flow: FlowProjection;
  onOpenFunction: (entity: RepositoryEntity) => void;
}) {
  const topology = flow.topology;
  const packages = useMemo(
    () =>
      (topology?.entities ?? [])
        .filter((entity) => entity.kind === 'Package')
        .sort((left, right) => left.name.localeCompare(right.name)),
    [topology],
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  if (topology === undefined || packages.length === 0) {
    return null;
  }

  const selectedPackage =
    packages.find((entity) => entity.id === selectedPackageId) ?? packages[0]!;
  const entityById = new Map(topology.entities.map((entity) => [entity.id, entity]));
  const outgoing = topology.relationships
    .filter(
      (relationship) =>
        relationship.kind === 'DEPENDS_ON' &&
        relationship.sourceId === selectedPackage.id,
    )
    .map((relationship) => ({
      relationship,
      entity: entityById.get(relationship.targetId),
    }))
    .filter(
      (item): item is { relationship: (typeof topology.relationships)[number]; entity: PackageTopologyEntity } =>
        item.entity !== undefined,
    );
  const incoming = topology.relationships
    .filter(
      (relationship) =>
        relationship.kind === 'DEPENDS_ON' &&
        relationship.targetId === selectedPackage.id,
    )
    .map((relationship) => ({
      relationship,
      entity: entityById.get(relationship.sourceId),
    }))
    .filter(
      (item): item is { relationship: (typeof topology.relationships)[number]; entity: PackageTopologyEntity } =>
        item.entity !== undefined,
    );
  const external = topology.externalDependencies.filter(
    (dependency) => dependency.packageId === selectedPackage.id,
  );
  const filePaths = Object.entries(topology.fileOwners)
    .filter(([, packageId]) => packageId === selectedPackage.id)
    .map(([filePath]) => filePath)
    .sort();
  const selectedFile =
    selectedFilePath !== null && filePaths.includes(selectedFilePath)
      ? selectedFilePath
      : filePaths[0] ?? null;
  const symbols =
    selectedFile === null
      ? []
      : (flow.architecture?.entities ?? [])
          .filter(
            (entity) =>
              entity.path === selectedFile &&
              entity.kind !== 'File' &&
              entity.kind !== 'Module' &&
              entity.kind !== 'Repository',
          )
          .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <section className="package-topology" aria-label="System topology">
      <header className="package-topology__header">
        <div>
          <p className="panel-kicker">System topology</p>
          <h2>Workspace → package → implementation</h2>
          <p>
            Package boundaries come from repository configuration; source imports add
            static evidence without inventing runtime services.
          </p>
        </div>
        <div className="package-topology__summary" aria-label="Topology summary">
          <span>{packages.length} packages</span>
          <span>
            {topology.relationships.filter((item) => item.kind === 'DEPENDS_ON').length}{' '}
            dependencies
          </span>
          <span>{topology.status}</span>
        </div>
      </header>

      <div className="package-topology__grid">
        <nav className="package-topology__packages" aria-label="Workspace packages">
          {packages.map((entity) => (
            <button
              key={entity.id}
              type="button"
              aria-pressed={entity.id === selectedPackage.id}
              onClick={() => {
                setSelectedPackageId(entity.id);
                setSelectedFilePath(null);
              }}
            >
              <strong>{entity.name}</strong>
              <span>{entity.path}</span>
            </button>
          ))}
        </nav>

        <div className="package-topology__detail">
          <div className="package-topology__identity">
            <div>
              <p className="panel-kicker">Package</p>
              <h3>{selectedPackage.name}</h3>
              <span>{selectedPackage.path}</span>
            </div>
            <span className="package-topology__evidence">
              {selectedPackage.evidence[0]?.kind ?? 'configured'}
            </span>
          </div>

          <div className="package-topology__relations">
            <DependencyGroup title="Depends on" items={outgoing} />
            <DependencyGroup title="Used by" items={incoming} />
            <section>
              <p className="panel-kicker">External</p>
              {external.length === 0 ? (
                <span className="package-topology__empty">No declared external dependencies.</span>
              ) : (
                <ul>
                  {external.slice(0, 12).map((dependency) => (
                    <li key={`${dependency.packageId}:${dependency.name}`}>
                      {dependency.name}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="package-topology__drilldown">
            <section>
              <p className="panel-kicker">Files</p>
              <div className="package-topology__file-list">
                {filePaths.length === 0 ? (
                  <span className="package-topology__empty">
                    No analyzed source is owned by this package.
                  </span>
                ) : (
                  filePaths.map((filePath) => (
                    <button
                      key={filePath}
                      type="button"
                      aria-pressed={selectedFile === filePath}
                      onClick={() => setSelectedFilePath(filePath)}
                    >
                      {filePath}
                    </button>
                  ))
                )}
              </div>
            </section>
            <section>
              <p className="panel-kicker">Symbols</p>
              <div className="package-topology__symbol-list">
                {symbols.length === 0 ? (
                  <span className="package-topology__empty">
                    Select an analyzed file with projected symbols.
                  </span>
                ) : (
                  symbols.map((symbol) => (
                    <div key={symbol.id} className="package-topology__symbol">
                      <div>
                        <strong>{symbol.name}</strong>
                        <span>{symbol.kind}</span>
                      </div>
                      {symbol.kind === 'Function' ? (
                        <Button size="sm" variant="ghost" onClick={() => onOpenFunction(symbol)}>
                          Open flow
                        </Button>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {topology.issues.length > 0 ? (
        <details className="package-topology__issues">
          <summary>{topology.issues.length} topology issue(s)</summary>
          <ul>
            {topology.issues.map((issue, index) => (
              <li key={`${issue.filePath ?? 'topology'}:${index}`}>
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

function DependencyGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{
    relationship: NonNullable<FlowProjection['topology']>['relationships'][number];
    entity: PackageTopologyEntity;
  }>;
}) {
  return (
    <section>
      <p className="panel-kicker">{title}</p>
      {items.length === 0 ? (
        <span className="package-topology__empty">None inside this repository.</span>
      ) : (
        <ul>
          {items.map(({ entity, relationship }) => (
            <li key={relationship.id}>
              <strong>{entity.name}</strong>
              <span>{relationship.evidence.map((item) => item.kind).join(' + ')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
