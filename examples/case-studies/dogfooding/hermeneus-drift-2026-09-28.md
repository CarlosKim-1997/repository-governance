# Hermeneus Governance drift — 2026-09-28

## Status of this document

This is a historical dogfooding case study. It has no normative authority.

Repository Governance upstream baseline used in the investigation:

`CarlosKim-1997/repository-governance @ fdcdea87ce7fb8ff60821356706b1148ea00d056`

Hermeneus incident baseline:

`CarlosKim-1997/Hermeneus @ ee0b366218051eb938acbd4d280713fc3a04cbdb`

Normalization was later merged through PR #13 at:

`e41b3da09f1ae47d697ee35a398d95f01759352d`

The installed Governance Core in Hermeneus was checked against the upstream template and was byte-identical for the bootstrap, SPEC, schemas, checker, and tooling version artifacts under review. The incident therefore did not depend on an old or locally modified Core.

## Incident summary

Hermeneus remained structurally governed, but repeated feature milestones and human PR integration produced semantic drift in Governance records.

The strongest observed failures were:

- Current State still described Milestone 11 as pending human merge after Milestone 11 was already integrated into `main`.
- COMPLETE Tasks T-007 through T-010 had their historical `Authority` text replaced after merge with integration-outcome text.
- Current State accumulated branch, PR, milestone, and detailed verification history beyond current-position compression.
- An ACTIVE Decision contained temporal implementation wording that became ambiguous after later Decisions introduced the previously deferred capability.
- Merge-followed-by-reconciliation became a recurring administrative pattern.

The structural checker could pass these records because the files remained syntactically valid. That behavior is consistent with v1's structural-only checker design.

## Evidence map

| Claim | Recoverable support |
| --- | --- |
| Installed Governance Core was not stale or locally modified | Hermeneus `ee0b366218051eb938acbd4d280713fc3a04cbdb` matches upstream `fdcdea87ce7fb8ff60821356706b1148ea00d056` by blob SHA for AGENTS, SPEC, README, all five schemas, checker, and tooling version |
| T-007–T-010 Authority had been repurposed as integration outcome | Incident baseline `ee0b366...`; post-merge reconciliation history includes PR/commit changes such as T-008 reconciliation `2416feb...` and M10 reconciliation merge `53c9212...` |
| T-011 preserved historical execution authority after merge | T-011 at incident baseline still states its feature-branch authorization and `Not authorized to merge` |
| Current State was stale after M11 integration | M11 was already on `main @ ee0b366...` while Current State still said the M11 branch was pending human merge |
| Mechanical normalization was completed without Core/runtime mutation | Hermeneus PR #13 merged at `e41b3da09f1ae47d697ee35a398d95f01759352d` |

## Confirmed finding: Task Authority was repurposed as outcome

Before integration, Tasks recorded the execution authority actually held by the agent. Examples included:

- T-007: authorized on its feature branch; not authorized to merge or change specified Canon without a Decision Request.
- T-008: authorized on its feature branch; not authorized to merge or modify specified Canon.
- T-009: authorized on its feature branch; not authorized to merge.
- T-010: authorized on its feature branch; not authorized to merge.

Post-merge reconciliation later replaced several of those Authority sections with wording such as `Integrated into main via PR ...`.

Those are different facts.

- **Authority** answers what the execution episode was permitted to do.
- **Outcome** answers what later happened to the work.
- A later human merge does not retroactively enlarge the agent's historical authority.

T-011 provided a natural control case: it remained COMPLETE after human merge while preserving `Not authorized to merge`, which is historically correct.

The normalization restored T-007 through T-010 Authority from recoverable pre-merge history and left T-011 unchanged.

## Confirmed finding: Current State attracted transient history

Before normalization, Current State included combinations of:

- milestone chronology,
- feature branch state,
- PR merge state,
- merge SHA,
- detailed suite counts,
- E2E counts,
- migration numbers.

The individual facts were often useful, but the aggregate behaved more like a recent closure report than a current-position compression artifact.

This created a repeated pattern:

```text
feature complete
→ Current State records "pending human merge"
→ human merge
→ Current State becomes stale
→ reconciliation work
```

The directly observed fact is that State accumulated transient history. One plausible explanation is **information gravity**: because every new worker reads Current State on the bootstrap hot path, operators have an incentive to place important facts there. That causal explanation is incident analysis rather than directly observed repository fact.

Normalization compressed State back to current position, active work, blockers, material risks, and a representative verification basis.

## Confirmed finding: integration outcome was treated as a Canon bookkeeping trigger

Several reconciliation commits existed mainly to record that a human had merged already-complete work.

The incident supports the narrower rule:

> A branch or PR integration event is not, by itself, a reason to mutate Canon.

Canon or Current State should change after integration only when the integration materially changes current normative or actionable truth.

## Review finding: temporal language inside an ACTIVE Decision

D-005 stated that Creator authentication, ownership enforcement, and production route authorization remained deferred. Later D-006/C-006 introduced Creator identity and owner authorization while D-005 remained ACTIVE.

This is not a mechanical corruption finding. It is a semantic review finding.

The useful distinction is:

- durable normative boundary: suitable for a Decision;
- transient implementation state such as "not implemented yet" or "deferred for this milestone": usually better in State, Task, or report.

D-005 was intentionally not mechanically rewritten during normalization because changing an ACTIVE Decision's material meaning requires human normative review.

## Corrective action performed

Hermeneus normalization:

- restored T-007 through T-010 historical Authority;
- preserved T-011 Authority;
- compressed Current State;
- added a non-normative Governance health audit report;
- left D-005 as REVIEW rather than silently changing it;
- changed no product/runtime behavior and no reusable Governance Core.

Structural verification passed before merge.

## What this incident supports

The evidence directly supports review of the following vNext clarifications or guidance:

1. **Terminal Task Authority preservation** — terminal Tasks preserve the authority of the closed execution episode.
2. **Outcome does not overwrite Authority** — later integration/release facts belong elsewhere.
3. **Current State transience exclusion** — branch/PR chronology and detailed verification history should not accumulate unless they change the next valid action, blocker, or material risk.
4. **Integration is not a default Canon event.**
5. **Decision timelessness guidance** — distinguish durable normative boundaries from transient implementation status.
6. **Periodic semantic health audit** — supplement, not replace, the structural checker.

## What this incident does not yet prove

The incident does not by itself justify:

- a new first-class Outcome object;
- a new Evidence object;
- a semantic AI checker;
- automatic Canon rewriting;
- automatic Decision expiry;
- a new Conflict or Challenge object.

An optional Task `Outcome` or `Closure` section is an ergonomics hypothesis, not a demonstrated need for a new protocol object.

## Replay scenarios derived from the incident

A future candidate should pass at least these scenarios:

1. Agent completes a Task without merge authority; a human later merges it; historical Authority remains unchanged.
2. Human merge of already-complete work does not force a reconciliation PR.
3. Ten sequential milestones do not make Current State grow approximately with milestone count.
4. A later implementation of a previously deferred capability does not leave two ACTIVE Decisions ambiguous about current normative truth.
5. Detailed verification remains recoverable without turning Current State into a test ledger.
