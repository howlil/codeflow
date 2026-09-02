import { useMemo, useState } from 'react';

import type {
  FlowNode,
  FlowProjection,
  StaticFlowRelationshipKind,
} from './flow-client';

type RelationshipLens = 'ALL' | 'CALLS' | StaticFlowRelationshipKind;

export function StaticFlowPanel({
  flow,
  selectedNode,
  onSelectNode,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
  onSelectNode: (nodeId: string) => void;
}) {
  const [lens, setLens] = useState<RelationshipLens>('ALL');
  const [stepIndex, setStepIndex] = useState(0);
  const functionData = useMemo(
    () =>
      selectedNode === null
        ? null
        : (flow.functionData.find(
            (candidate) => candidate.functionId === selectedNode.id,
          ) ?? null),
    [flow.functionData, selectedNode],
  );
  const availableLenses = useMemo(() => {
    const kinds = new Set<RelationshipLens>();
    if (flow.edges.length > 0) {
      kinds.add('CALLS');
    }
    for (const relationship of flow.staticFlow.relationships) {
      kinds.add(relationship.kind);
    }
    return ['ALL', ...Array.from(kinds).sort()] as RelationshipLens[];
  }, [flow.edges, flow.staticFlow.relationships]);
  const visibleRelationships = useMemo(() => {
    const selectedNodeId = selectedNode?.id ?? null;
    const calls = flow.edges
      .filter(
        (edge) =>
          selectedNodeId === null ||
          edge.sourceId === selectedNodeId ||
          edge.targetId === selectedNodeId,
      )
      .map((edge) => ({
        id: edge.id,
        kind: 'CALLS' as const,
        label: `${labelForNode(flow, edge.sourceId)} → ${labelForNode(
          flow,
          edge.targetId,
        )}`,
        evidence: edge.evidence[0] ?? null,
      }));
    const staticRelationships = flow.staticFlow.relationships
      .filter(
        (relationship) =>
          selectedNodeId === null || relationship.functionId === selectedNodeId,
      )
      .map((relationship) => ({
        id: relationship.id,
        kind: relationship.kind,
        label: relationship.label,
        evidence: relationship.evidence[0] ?? null,
      }));

    return [...calls, ...staticRelationships].filter(
      (relationship) => lens === 'ALL' || relationship.kind === lens,
    );
  }, [flow, lens, selectedNode]);
  const steps = flow.staticFlow.steps;
  const boundedStepIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const activeStep = steps[boundedStepIndex] ?? null;

  function moveStep(nextIndex: number) {
    if (steps.length === 0) {
      return;
    }
    const bounded = Math.max(0, Math.min(nextIndex, steps.length - 1));
    const step = steps[bounded];
    setStepIndex(bounded);
    if (step !== undefined) {
      onSelectNode(step.functionId);
    }
  }

  return (
    <div className="evidence-list" aria-label="Static data flow">
      <section>
        <p className="panel-kicker">Function data</p>
        {selectedNode === null || functionData === null ? (
          <p className="panel-copy">
            Select a function to inspect source-backed inputs and outputs.
          </p>
        ) : (
          <>
            <strong>{selectedNode.label}</strong>
            <div className="evidence-list">
              <div>
                <p className="panel-kicker">Inputs</p>
                {functionData.parameters.length === 0 ? (
                  <p className="panel-copy">No declared parameters.</p>
                ) : (
                  functionData.parameters.map((parameter) => (
                    <article className="evidence-item" key={parameter.id}>
                      <div>
                        <span className="relationship-label">
                          {parameter.name}
                        </span>
                        <span className="evidence-chip evidence-chip--verified-static">
                          parameter
                        </span>
                      </div>
                      <p>{parameter.typeText ?? 'type not declared'}</p>
                      <small>
                        {parameter.location.filePath}:L
                        {parameter.location.startLine}
                      </small>
                    </article>
                  ))
                )}
              </div>

              <div>
                <p className="panel-kicker">Outputs</p>
                {functionData.returns.length === 0 ? (
                  <p className="panel-copy">No explicit return path.</p>
                ) : (
                  functionData.returns.map((returnPath) => (
                    <article className="evidence-item" key={returnPath.id}>
                      <div>
                        <span className="relationship-label">RETURN</span>
                        <span className="evidence-chip evidence-chip--verified-static">
                          static path
                        </span>
                      </div>
                      <p>{returnPath.expressionText ?? 'return'}</p>
                      <small>
                        {returnPath.location.filePath}:L
                        {returnPath.location.startLine}
                      </small>
                    </article>
                  ))
                )}
              </div>

              {functionData.callArguments.length > 0 ? (
                <div>
                  <p className="panel-kicker">Argument mappings</p>
                  {functionData.callArguments.map((mapping) => (
                    <article className="evidence-item" key={mapping.id}>
                      <div>
                        <span className="relationship-label">
                          PASSES_ARGUMENT
                        </span>
                        <span
                          className={`evidence-chip evidence-chip--${
                            mapping.evidence[0]?.kind ?? 'unavailable'
                          }`}
                        >
                          {mapping.evidence[0]?.kind ?? 'evidence-unavailable'}
                        </span>
                      </div>
                      <p>
                        {mapping.argumentText} →{' '}
                        {mapping.parameterName ??
                          `parameter ${mapping.argumentIndex + 1}`}
                      </p>
                      <small>
                        {mapping.location.filePath}:L{mapping.location.startLine}
                      </small>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>

      <section>
        <p className="panel-kicker">Relationship lens</p>
        <div className="comprehension-controls" aria-label="Relationship lens">
          {availableLenses.map((kind) => (
            <button
              className="focus-toggle"
              type="button"
              aria-pressed={lens === kind}
              key={kind}
              onClick={() => setLens(kind)}
            >
              {kind}
            </button>
          ))}
        </div>
        {visibleRelationships.length === 0 ? (
          <p className="panel-copy">No relationships match this lens.</p>
        ) : (
          visibleRelationships.slice(0, 12).map((relationship) => (
            <article className="evidence-item" key={relationship.id}>
              <div>
                <span className="relationship-label">{relationship.kind}</span>
                <span
                  className={`evidence-chip evidence-chip--${
                    relationship.evidence?.kind ?? 'unavailable'
                  }`}
                >
                  {relationship.evidence?.kind ?? 'evidence-unavailable'}
                </span>
              </div>
              <p>{relationship.label}</p>
              {relationship.evidence === null ? null : (
                <small>
                  {relationship.evidence.location.filePath}:L
                  {relationship.evidence.location.startLine}
                </small>
              )}
            </article>
          ))
        )}
      </section>

      <section>
        <p className="panel-kicker">Static step-through</p>
        <p className="panel-copy">
          Deterministic source exploration only. This is not observed runtime
          execution and does not choose branch outcomes or fabricate values.
        </p>
        {activeStep === null ? (
          <p className="panel-copy">No supported static data-flow steps.</p>
        ) : (
          <>
            <article className="evidence-item">
              <div>
                <span className="relationship-label">{activeStep.kind}</span>
                <span
                  className={`evidence-chip evidence-chip--${
                    activeStep.evidence[0]?.kind ?? 'unavailable'
                  }`}
                >
                  {activeStep.evidence[0]?.kind ?? 'evidence-unavailable'}
                </span>
              </div>
              <p>{activeStep.label}</p>
              {activeStep.valueText === null ? null : (
                <code>{activeStep.valueText}</code>
              )}
              <small>
                Step {boundedStepIndex + 1}/{steps.length} ·{' '}
                {activeStep.location.filePath}:L{activeStep.location.startLine}
              </small>
            </article>
            <div className="comprehension-controls">
              <button
                className="focus-toggle"
                type="button"
                disabled={boundedStepIndex === 0}
                onClick={() => moveStep(boundedStepIndex - 1)}
              >
                Previous step
              </button>
              <button
                className="focus-toggle"
                type="button"
                disabled={boundedStepIndex >= steps.length - 1}
                onClick={() => moveStep(boundedStepIndex + 1)}
              >
                Next step
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function labelForNode(flow: FlowProjection, nodeId: string): string {
  return flow.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
}
