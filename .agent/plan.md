# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension by letting keyboard users traverse semantic caller/callee relationships directly from the canvas without losing source inspection context.

This sprint is the smallest semantic keyboard-navigation slice:

```text
focus semantic function
 -> ArrowRight follows a projected callee
 -> ArrowLeft follows a projected caller
 -> selected function + inspector stay synchronized
 -> keyboard focus follows the destination node
```

Arrow navigation follows existing projected graph direction only. It does not create relationships, infer ordering semantics, or replace native Tab / Enter behavior.

When more than one directional candidate exists, CodeFlow chooses the first candidate using deterministic source-location ordering so repeated navigation is stable.

Durable visual and interaction language remains owned by root `DESIGN.md`; this feature-specific shortcut behavior remains iteration/product behavior.

## Current Position

M0/M1, M2.1, and M2.2 are integrated into `master`.

M2.3 is release-ready on PR #5 / `feat/m2-source-split` and remains unmerged.

M2.4 is release-ready on PR #6 / `feat/m2-analysis-states`, stacked on M2.3, and remains unmerged.

M2.5 is implemented and verified on PR #7 / `feat/m2-keyboard-navigation`, stacked on the verified M2.4 head:

- semantic node buttons expose `ArrowLeft ArrowRight` through `aria-keyshortcuts`
- `ArrowRight` follows an existing outgoing relationship to a projected callee
- `ArrowLeft` follows an existing incoming relationship to a projected caller
- navigation updates canonical selection state and clears stale relationship inspection through the existing node-selection path
- source/evidence inspector follows the keyboard-selected function
- browser focus follows the destination semantic node after React updates the view
- directional candidates are ordered deterministically by source file, line, column, then semantic ID
- keys with no valid directional neighbor are left untouched
- native Tab, Enter, click, search, focus mode, source split, and relationship inspection behavior remain unchanged
- focused regression coverage protects caller -> callee -> caller keyboard traversal and inspector/focus synchronization
- standard format/lint/build/typecheck/test gates passed on CI run #56

No analyzer, semantic IR, API, dependency, persistence, runtime, AI, multi-language, or material architecture boundary changed.

## Delta

None inside the authorized M2.5 slice.

Remaining M2 roadmap capabilities intentionally outside this sprint:

- relationship filters/lenses once multiple useful relationship kinds exist
- stable automatic layout for larger arbitrary graphs

## Next Move

STOP. M2.5 is release-ready. PR #5, PR #6, and PR #7 remain separate integration decisions.
