# Current Iteration

Status: ACTIVE

Active Milestone: None

Active Engineering Outcome: Fast, high-signal, risk-proportional CI verification.

Last Integrated Product Outcome: Chatspace-derived CodeFlow design-system foundations and semantic-workbench reshaping merged to `master` in PR #24 (`29ed692f5ca5cc3c5062896bd419927f4cd06d44`).

## Current Position

CodeFlow already has the evidence-backed TypeScript semantic-analysis path, bounded local repository input, semantic workspace, production Compose packaging, and Chatspace-aligned UI foundation.

The current authorized work is reliability/engineering-enabler work, not a new product milestone. Its purpose is to reduce verification latency without reducing confidence.

CI now has complete-change-set scope detection, conservative fallback, pure-CSS/static verification, focused web-test scope, full shared/runtime scope, named failure boundaries, dependency caching, superseded-run cancellation, and failure-only test diagnostics.

## Verification Evidence

Run `33777291853` established the original shared web-test failure and proved failure artifacts. Run `33777724570` then proved selective verification chose the focused web-test path for a web-test-harness change: frozen install, formatting, lint, and build passed, while the same Radix Select setup failure remained.

The failure artifact and Radix implementation establish the harness defect precisely:

- `selectEntrySource` sends `pointerdown` to the Radix Select trigger;
- Radix's mouse-open path requires `event.pointerType === 'mouse'`;
- Testing Library creates pointer events from the jsdom window constructor;
- the previous shim did not reliably guarantee a `window.PointerEvent` carrying `pointerType`/`pointerId`;
- the portal therefore stayed closed and nine downstream tests stopped at the same option lookup.

The correction installs one deterministic desktop PointerEvent constructor on both the test global and jsdom window, preserving the actual Radix pointer branch instead of bypassing the component through its hidden native select.

## Delta

- verify the corrected jsdom PointerEvent boundary with focused web tests;
- if web tests pass, run one full CI/workflow validation that also reaches required Compose checks for the earlier workflow change;
- then return repository state to idle with truthful evidence and verify the lightweight agent-only path.

## Blockers

- current blocker: focused verification of the window/global PointerEvent correction.

## Next Move

Run CI with the corrected PointerEvent constructor. If `Test` still fails, consume the failure artifact and fix only the next concrete boundary. Do not weaken or remove Radix interaction coverage.
