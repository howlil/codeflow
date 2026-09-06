import { useMemo, useState } from 'react';

import type {
  FlowEdge,
  FlowEvidence,
  FlowNode,
  FlowProjection,
  StaticFlowRelationshipKind,
} from '../../integrations/api/flow-client';
import { Button } from '../../components/ui/primitives';

export type RelationshipLens = 'ALL' | 'CALLS' | StaticFlowRelationshipKind;

const EMPTY_STATIC_STEPS: NonNullable<FlowProjection['staticFlow']>['steps'] =
  [];
const EMPTY_STATIC_RELATIONSHIPS: NonNullable<
  FlowProjection['staticFlow']
>['relationships'] = [];

export function FunctionDataPanel({
  flow,
  selectedNode,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
}) {
  const functionData = useMemo(
    () =>
      selectedNode === null
        ? null
        : (flow.functionData?.find(
            (candidate) => candidate.functionId === selectedNode.id,
          ) ?? null),
    [flow.functionData, selectedNode],
  );

  if (selectedNode === null || functionData === null) {
    return (
      <p className="panel-copy">
        Select a function with projected data to inspect its inputs and outputs.
      </p>
    );
  }

  return (
    <div className="inspector-stack">
      <section className="inspector-section">
        <p className="panel-kicker">Inputs</p>
        {functionData.parameters.length === 0 ? (
          <p className="panel-copy">No declared parameters.</p>
        ) : (
          <div className="data-rows">
            {functionData.parameters.map((parameter) => (
              <div className="data-row" key={parameter.id}>
                <strong>{parameter.name}</strong>
                <span>{parameter.typeText ?? 'type not declared'}</span>
                <small>
                  {parameter.location.filePath}:L{parameter.location.startLine}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="inspector-section">
        <p className="panel-kicker">Outputs</p>
        {functionData.returns.length === 0 ? (
          <p className="panel-copy">No explicit return path.</p>
        ) : (
          <div className="data-rows">
            {functionData.returns.map((returnPath) => (
              <div className="data-row" key={returnPath.id}>
                <strong>RETURN</strong>
                <span>{returnPath.expressionText ?? 'return'}</span>
                <small>
                  {returnPath.location.filePath}:L
                  {returnPath.location.startLine}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      {functionData.callArguments.length > 0 ? (
        <section className="inspector-section">
          <p className="panel-kicker">Argument mappings</p>
          <div className="data-rows">
            {functionData.callArguments.map((mapping) => (
              <div className="data-row" key={mapping.id}>
                <strong>PASSES_ARGUMENT</strong>
                <span>
                  {mapping.argumentText} →{' '}
                  {mapping.parameterName ??
                    `parameter ${mapping.argumentIndex + 1}`}
                </span>
                <small>
                  {mapping.location.filePath}:L{mapping.location.startLine}
                </small>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

interface RelationshipView {
  id: string;
  kind: string;
  label: string;
  evidence: FlowEvidence | null;
}

export function RelationshipEvidencePanel({
  flow,
  selectedNode,
  selectedEdge,
  lens,
}: {
  flow: FlowProjection;
  selectedNode: FlowNode | null;
  selectedEdge: FlowEdge | null;
  lens: RelationshipLens;
}) {
  const staticRelationships =
    flow.staticFlow?.relationships ?? EMPTY_STATIC_RELATIONSHIPS;
  const relationships = useMemo<RelationshipView[]>(() => {
    if (selectedEdge !== null) {
      const source = labelForNode(flow, selectedEdge.sourceId);
      const target = labelForNode(flow, selectedEdge.targetId);
      return [
        {
          id: selectedEdge.id,
          kind: selectedEdge.kind,
          label: `${source} → ${target}`,
          evidence: selectedEdge.evidence[0] ?? null,
        },
      ];
    }

    const selectedNodeId = selectedNode?.id ?? null;
    const calls: RelationshipView[] = flow.edges
      .filter(
        (edge) =>
          selectedNodeId === null ||
          edge.sourceId === selectedNodeId ||
          edge.targetId === selectedNodeId,
      )
      .map((edge) => ({
        id: edge.id,
        kind: 'CALLS',
        label: `${labelForNode(flow, edge.sourceId)} → ${labelForNode(
          flow,
          edge.targetId,
        )}`,
        evidence: edge.evidence[0] ?? null,
      }));
    const staticViews: RelationshipView[] = staticRelationships
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

    return [...calls, ...staticViews].filter(
      (relationship) => lens === 'ALL' || relationship.kind === lens,
    );
  }, [flow, lens, selectedEdge, selectedNode, staticRelationships]);

  if (relationships.length === 0) {
    return <p className="panel-copy">No relationships match this context.</p>;
  }

  return (
    <div className="evidence-rows">
      {relationships.slice(0, 16).map((relationship) => (
        <article className="evidence-row" key={relationship.id}>
          <div className="evidence-row-heading">
            <strong>{relationship.kind}</strong>
            <span
              className={`evidence-chip evidence-chip--${
                relationship.evidence?.kind ?? 'evidence-unavailable'
              }`}
            >
              {relationship.evidence?.kind ?? 'evidence-unavailable'}
            </span>
          </div>
          <p>{relationship.label}</p>
          {relationship.evidence === null ? (
            <small>No supporting provenance was projected.</small>
          ) : (
            <>
              <span>{relationship.evidence.reason}</span>
              <small>
                {relationship.evidence.source} ·{' '}
                {relationship.evidence.location.filePath}:L
                {relationship.evidence.location.startLine}
              </small>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

export function StaticStepPanel({
  flow,
  onSelectNode,
}: {
  flow: FlowProjection;
  onSelectNode: (nodeId: string) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = flow.staticFlow?.steps ?? EMPTY_STATIC_STEPS;
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
    <div className="inspector-stack">
      <p className="panel-copy">
        Deterministic source exploration only. This is not observed runtime
        execution and does not choose branch outcomes or fabricate values.
      </p>
      {activeStep === null ? (
        <p className="panel-copy">No supported static data-flow steps.</p>
      ) : (
        <>
          <article className="step-detail">
            <div className="evidence-row-heading">
              <strong>{activeStep.kind}</strong>
              <span
                className={`evidence-chip evidence-chip--${
                  activeStep.evidence[0]?.kind ?? 'evidence-unavailable'
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
          <div className="step-controls">
            <Button
              disabled={boundedStepIndex === 0}
              onClick={() => moveStep(boundedStepIndex - 1)}
            >
              Previous step
            </Button>
            <Button
              disabled={boundedStepIndex >= steps.length - 1}
              onClick={() => moveStep(boundedStepIndex + 1)}
            >
              Next step
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function labelForNode(flow: FlowProjection, nodeId: string): string {
  return flow.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
}
