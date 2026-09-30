# ReDiscovery consistency incident — 2026-09-28

## Status of this document

This is a historical dogfooding case study. It has no normative authority.

Repository:

`CarlosKim-1997/ReDiscovery`

Incident investigation baseline used for repository reconciliation:

`4de9388e7f63612bc96252c8bc94f595c6271249`

Reconciled `main`:

`74128282f1e36299181f1b310df97675f747d5ab`

Hosted verification after reconciliation:

- workflow: `M3 deterministic checks`
- run: #108
- run ID: `36403807695`
- exact head: `74128282f1e36299181f1b310df97675f747d5ab`
- conclusion: SUCCESS

The incident was a coordination-consistency problem, not an application runtime or production-data corruption incident.

## Incident summary

ReDiscovery exercised Governance under a different stress profile from Hermeneus: long-running development, hosted CI, production deployment, external services, wall-clock release gates, and multiple execution workspaces.

The incident exposed several interacting problems:

- Current State, a current Task, and a legacy milestone all represented the same execution state.
- Hosted CI advanced while repository bookkeeping still described older failed runs as current.
- Task state lagged actual execution.
- repository-local attempts to record the latest hosted CI evidence created a self-referential bookkeeping loop.
- incident-time local observation reported a desktop `main` and remote `origin/main` diverging into sibling histories after similar reconciliation work in different execution contexts.
- a local tool artifact created dirty-worktree noise.
- later Decisions changed only parts of an earlier operational package, while current precedence remained distributed across multiple ACTIVE Decisions and prose.
- Governance documentation grew substantially under the safety-heavy workflow; the causal role of safety pressure is analyzed below.

## Evidence map

| Claim | Recoverable support |
| --- | --- |
| Final reconciliation is on repository history | `main @ 74128282f1e36299181f1b310df97675f747d5ab` |
| Hosted verification succeeded after reconciliation | Workflow `M3 deterministic checks`, Run #108, ID `36403807695`, exact head `74128282...`, SUCCESS |
| Current status was duplicated across multiple writable surfaces | `canon/state/current.md`, `work/tasks/T-020.md`, and legacy `docs/milestones/M9.md` at the reconciliation baseline |
| Partial-precedence friction existed in active Decisions | D-026, D-032, and D-033 remained ACTIVE while later Decisions replaced only date/`release_at` portions of the earlier package |
| Desktop/local-main sibling divergence occurred | Preserved from the incident-time local checkout report; the local-only `a3c8600...` commit and forensic branch are not currently addressable from remote GitHub, so this item is incident-reported/local evidence rather than independently remote-verifiable evidence |

## Confirmed finding: too many truth surfaces

At the incident point, one operational fact could be represented in at least:

- `canon/state/current.md`,
- `work/tasks/T-020.md`,
- `docs/milestones/M9.md`.

The milestone document already identified itself as legacy provenance / implementation detail, yet it continued to be updated as a current status surface.

This multiplied synchronization obligations. When implementation and hosted CI moved forward, one or more documents could remain behind even though each document was individually well-formed.

The incident therefore supports a general rule:

> The same current truth should have as few writable authoritative/current-status surfaces as practical.

Historical detail should move toward Work reports, immutable external records, or intentionally historical documents rather than being copied into every current-status surface.

## Confirmed finding: hosted evidence cannot be made repository-current by endless bookkeeping

Hosted CI exists only after a commit is pushed.

A naive attempt to keep the repository itself updated with the exact latest CI run creates a recurrence:

```text
commit A
→ CI verifies A
→ commit B records A's CI
→ CI verifies B
→ commit C would be needed to record B's CI
→ ...
```

ReDiscovery had already developed "closure bookkeeping run" language around this pattern.

The reconciliation deliberately stopped the loop: Run #108 verifies the reconciliation commit externally, and no follow-up commit was made merely to record Run #108 inside the repository.

This supports an important boundary:

- repository records may state the verification class, verified artifact, or a representative basis;
- the latest hosted CI health may remain authoritative in the hosted CI system itself.

Repository intent, external operational reality, and repository-recorded knowledge are not the same thing.

## Incident-reported finding: workspace isolation needs lifecycle discipline

The incident report recovered a desktop checkout whose local `main` pointed to local-only commit `a3c8600...` while `origin/main` had advanced on a sibling history.

The local commit and a remote reconciliation commit had similar purpose but different trees. The local-only history was reported as preserved on forensic branch:

`forensics/vercel-bootstrap-divergence-a3c8600`

That local-only commit and forensic branch were observed during the incident-time local investigation but are not currently addressable from remote GitHub. This part of the case study is therefore preserved as incident-reported/local evidence, not as independently remote-verifiable repository evidence.

The incident analysis concluded that the information was already materially preserved elsewhere, so the local commit did not need to be merged or cherry-picked into current `main`.

The significant Governance lesson is not that branch/worktree isolation failed. Isolation worked. The missing discipline was the lifecycle after isolation:

- what checkout is the integration/reference baseline;
- what baseline SHA a mutating worker must start from;
- which workspace owns mutation;
- when an isolated workspace is retired.

This is an execution-topology gap adjacent to, but not necessarily inside, the normative Canon model.

## Confirmed finding: State / Task / report boundaries collapsed

Current State accumulated extensive hosted run history, deployment identifiers, exact test counts, old failures, and historical observations.

Some Tasks grew into execution diaries and operational matrices.

Meanwhile `work/reports/` was comparatively underused.

This increased:

- bootstrap context;
- stale-statement search cost;
- writable surfaces;
- ambiguity between historical and current facts.

The incident supports stronger guidance that:

- Current State is current actionable compression;
- Task is a bounded execution contract plus the verification needed to close that episode;
- Report is the preferred sink for detailed historical execution and verification provenance that must remain recoverable.

## Incident analysis: safety pressure can defeat minimality

v1 strongly enforces negative safety constraints: do not mutate without authority, do not claim verification without evidence, do not widen scope, and separate production authority.

The observed fact is documentation growth under a safety-heavy workflow. The causal interpretation is that, when minimality is expressed mainly as general advice, a cautious worker may optimize toward:

`when uncertain, record more`.

Over many episodes that behavior can produce Governance inflation even while each local action appears conservative.

This interpretation supports testing stronger **non-recording rules** and **information-lifetime** guidance, but the causal mechanism itself is analysis rather than directly observed repository fact.

## Review hypothesis: partial amendment

The M9-D authority chain included later Decisions that changed only portions of an earlier package, including date/release timing.

The repository used multiple ACTIVE Decisions plus prose such as "later authority" or "date superseded" to express the resulting precedence.

This is evidence of resolver friction, but not yet proof that v1 requires a new amendment primitive.

Questions still requiring experiment include:

- Can a narrowly scoped successor Decision plus better applicability/scope conventions solve the problem?
- Would field-level amendment semantics create more complexity than the problem warrants?
- Can a machine resolver remain deterministic without turning Decisions into mutable records?

Partial amendment therefore remains a protocol experiment candidate, not an accepted vNext requirement.

## Review hypothesis: ephemeral operational authorization

Time-bounded production actions created pressure to represent short-lived approvals as durable Decisions.

This suggests a possible distinction between durable product authority and ephemeral operational authorization, but the case study does not yet establish that a new first-class object is required.

An alternative may be tighter Task authority plus an external approval event or report.

## Corrective action performed

The incident repair:

- aligned the repository baseline to the remote current history;
- preserved the divergent local history for forensics rather than merging it;
- reconciled Current State, T-020, and the legacy M9 document narrowly;
- stopped new feature/milestone progression during reconciliation;
- verified the final repository head through hosted Run #108;
- deliberately created no follow-up CI-bookkeeping commit.

## Immediate operating lessons

Before protocol evolution, v1 adopters can reduce recurrence by:

- checking repo root, worktree identity, branch, HEAD, remote baseline, ahead/behind, cleanliness, and linked worktrees before mutation;
- treating a primary `main` checkout as reference/integration surface when practical;
- retiring completed isolated mutation workspaces;
- not mirroring every hosted CI result into Current State;
- freezing deprecated milestone/status documents as historical provenance;
- explicitly choosing tracked, ignored, or external policy for tool-local artifacts such as `.cursor/` and `.codex/`.

## What this incident supports

The evidence directly supports review of:

1. stronger State freshness and transience rules;
2. fewer writable current-truth surfaces;
3. external evidence ownership rules;
4. workspace entry and retirement discipline;
5. stronger operational minimality;
6. periodic semantic health review.

## What it does not yet prove

The incident does not by itself justify:

- a first-class Evidence object;
- a first-class Operational Authorization object;
- field-level Decision amendment semantics;
- centralized workspace locking;
- automatic State generation;
- semantic AI repair of Canon.

Those remain hypotheses to test against the smallest compatible alternative.
