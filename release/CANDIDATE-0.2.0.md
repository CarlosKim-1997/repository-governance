# Distribution 0.2.0 candidate review

## Status

Draft review packet. No publication or adopter migration is authorized by this file.

Target:

- Governance Version: **1.0.0**
- Distribution Version: **0.2.0**
- Checker Version: **0.1.0**

Baseline for this upgrade line:

`55cff02b8f2a5d17d10631beabf26dbcaecd9305`

## Why this is not Governance 2.0

Hermeneus and ReDiscovery dogfooding produced ten replay scenarios. R1–R10 all passed under the existing five-schema Governance 1.0.0 information model without a new first-class type, ID namespace, lifecycle, binding applicability selector, or authorization class.

The upgrade therefore addresses observed failures through:

1. compatible clarification of meanings already implied by v1;
2. non-normative operating guidance;
3. optional read-only helpers.

If review finds that any proposed Core wording changes binding authority or invalidates a previously valid 1.0 repository, stop and reclassify the change as semantic instead of merging this candidate.

## Core clarification delta

No required headings, fields, statuses, relations, IDs, or manifest fields change.

Clarifications proposed:

- terminal Task Authority remains the permission set of the closed execution episode;
- later integration/release/deployment/verification outcome does not overwrite historical Task Authority;
- integration/merge/release/verification events do not automatically require Canon mutation;
- Current State excludes ordinary branch/PR/CI history unless it changes current actionable position;
- State Verification Basis is representative rather than an exhaustive evidence ledger;
- repository records need not continuously mirror live external-system health.

## New installed guidance

`governance/OPERATIONS.md` provides non-normative procedures for:

- information lifetime and natural storage surfaces;
- Task closure;
- State compression;
- integration without automatic reconciliation;
- Decision timelessness;
- external live-state boundaries;
- workspace entry/retirement;
- semantic health audits;
- explicit minimality exclusions.

## New optional installed helpers

### Workspace preflight

`tooling/governance/preflight.mjs`

Read-only local Git observation:

- root;
- branch/detached state;
- HEAD;
- cleanliness;
- linked worktrees;
- local upstream comparison;
- optional comparison against a named local ref.

It never fetches and never mutates.

### Context discovery

`tooling/governance/context.mjs`

Read-only advisory preload suggestions based on:

- target record;
- formal direct relations;
- global/overlapping area candidates;
- active Governance Constraints.

It explicitly does not prove complete applicability, ownership, or permission.

## Compatibility contract

The immutable Governance 1.0.0 recognition profile is unchanged.

A historical coherent 1.0 snapshot that lacks the new 0.2 optional files must remain:

- `GOVERNANCE_INSTALLED`;
- not blocked;
- eligible for explicit upgrade review;
- untouched by ordinary `init --apply`.

## Intentionally not added

- Evidence object or `E-*`;
- Operational Authorization object;
- field-level Decision amendment semantics;
- formal applicability selectors;
- required ratification metadata;
- Outcome schema;
- semantic AI checker;
- automatic State generation or repair;
- central lock manager.

## Verification gates before human approval

The candidate should not be approved until hosted CI establishes:

- all existing checker/installer/release tests pass;
- R1–R10 replay tests pass;
- helper tests pass;
- template Core copies equal Core;
- installed OPERATIONS/helper copies equal sources after build;
- historical 1.0 snapshot recognition regression passes;
- distribution manifest reports 0.2.0 / Governance 1.0.0 / checker 0.1.0;
- clean-room non-JavaScript installation still passes;
- build leaves tracked source clean.

Human review must separately decide whether the Core clarification is truly compatible and should be ratified.
