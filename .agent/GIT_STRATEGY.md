# CodeFlow Git Strategy

CodeFlow uses trunk-oriented continuous delivery around `master`.

Git is an integration mechanism, not a planning framework. Milestones and slices must not be encoded as long-lived branch stacks.

## Integration branch

`master` is the canonical integration branch.

Start new implementation work from the current `master` unless a repository emergency/release policy explicitly requires another base.

## Default logical-change flow

```text
current master
 -> short-lived feat|fix|chore|docs/<logical-change>
 -> implement + focused verify
 -> PR when appropriate
 -> CI/review/fix on same branch
 -> squash merge promptly when green/approved
 -> delete branch
 -> next approved logical change starts again from current master
```

A branch represents a short-lived integration vehicle for a logical change, not a sprint, milestone, or persistent workstream.

## Forbidden default patterns

Do not create these merely for workflow ceremony:

- `sprint-*` branches
- `iteration-*` branches
- milestone branches
- `final-*` / `retry-*` / `review-fix-*` branches for the same change
- a new slice branch stacked on the previous unmerged slice branch
- broad long-lived feature branches accumulating a whole milestone

If a branch is waiting on CI/review, fix that branch. Do not create a new task identity for feedback.

## Continuous integration rule

Once the milestone scope/slices are approved:

```text
logical change green -> integrate -> continue
```

Do not wait until every milestone slice is complete before merging safe verified changes.

Do not require a new sprint-plan approval between already-approved slices.

If the next slice depends on the previous one, merge the previous logical change first, update from `master`, then begin the next change.

## PR scope

Prefer a focused PR that is:

- independently understandable;
- proportional to one logical change or a tightly coherent set that cannot be safely separated;
- verified at its current head;
- free of unrelated cleanup;
- easy to revert/reason about.

Do not split a small vertical behavior into artificial layer-by-layer PRs solely to reduce diff size.

## Merge policy

Prefer squash merge unless repository policy changes.

For user-approved, non-material work:

- use auto-merge when repository support/policy makes it safe;
- let CI/review gates decide integration rather than adding a manual ceremony pause;
- never claim merge occurred until it is observed.

Material product/architecture/security/data decisions still require user authority before their implementation can be treated as approved.

## Existing stacked PRs

PRs #5-#8 are legacy stacked M2 execution created before this strategy became canonical.

Treat them as migration debt to integrate safely, not as a template for future slices. Do not create another stacked branch on top of PR #8.

After that stack is integrated, all new M2 work starts from current `master` and integrates at logical-change boundaries.

## Commits

Commit history should help local reasoning, but commit count is not a metric.

Use clear intent-oriented commit messages. Temporary implementation commits are acceptable on a short-lived branch because squash merge produces the integration history.

Do not create ceremonial commits solely to mark sprint start/end, checkpoints, or state transitions.

## Branch cleanup

After integration, delete/abandon short-lived merged branches when practical. Stale branches must not be treated as live iteration state; `.agent/CURRENT_ITERATION.md` is authoritative for that.
