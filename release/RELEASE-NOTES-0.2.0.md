# Repository Governance Distribution 0.2.0

Distribution 0.2.0 is the first release candidate prepared for public GitHub prerelease distribution.

## Version model

- Governance semantics: **1.0.0**
- Distribution: **0.2.0**
- Structural checker: **0.1.0**

Distribution 0.2.0 does not introduce Governance 2.0 semantics.

## What changed from Distribution 0.1.0

### Compatible Governance clarification

The v1 Core now makes several already-implied boundaries explicit:

- terminal Task Authority preserves the permissions held during that execution episode;
- later merge, release, deployment, or verification outcomes do not overwrite historical Task Authority;
- ordinary integration events do not automatically require Canon mutation;
- Current State is current-position compression rather than a branch/PR/CI history ledger;
- Verification Basis is representative rather than an exhaustive evidence ledger;
- repository records do not need to mirror the latest live state of external systems.

No required schema field, lifecycle state, ID namespace, relation type, or permission class was added.

### Operating guidance

The installed snapshot now includes `governance/OPERATIONS.md` covering:

- information lifetime and natural storage surfaces;
- Task closure and Authority preservation;
- State compression;
- integration without default reconciliation;
- Decision timelessness;
- external live-state boundaries;
- workspace entry/retirement;
- semantic-health review;
- minimality exclusions.

### Optional read-only helpers

- `tooling/governance/preflight.mjs` — local Git/worktree observation; never fetches or mutates.
- `tooling/governance/context.mjs` — advisory preload discovery; never proves permission or complete applicability.

## Compatibility evidence

Session A replayed ten migration/operation scenarios under Governance 1.0.0 without requiring a new semantic object model.

Session B then applied Distribution 0.2.0 to:

- Hermeneus — coherent Distribution 0.1 control case;
- ReDiscovery — local/precursor v1 convergence stress case.

Both migrations were integrated successfully while retaining Governance Version 1.0.0.

ReDiscovery additionally exposed unrelated calendar-dependent test rot. That maintenance repair was isolated from the Governance migration before final integration, preserving causal evidence.

## Upgrade notes

Installed repositories own their Governance snapshots.

Do not overwrite Canon or Work from upstream. Compare:

- A — original/recoverable upstream snapshot;
- B — current project copy;
- C — Distribution 0.2.0 target.

Core/schema/checker are generally upstream-owned. Canon and Work are project-owned. `AGENTS.md` and the manifest are mixed ownership.

A coherent Governance 1.0 repository does **not** change `manifest.governance_version` merely because its distribution metadata moves to 0.2.0.

See `adoption/UPGRADE.md`.

## Release artifact

The GitHub prerelease is intended to attach:

- `repository-governance-0.2.0.tgz`
- `distribution-manifest.json`
- `SHA256SUMS`
- `release-metadata.json`
- `RELEASE-SHA256SUMS`

The release metadata binds the archive to one exact clean source commit.

## Limits

This prerelease does not claim:

- stable Governance 1.0 distribution status;
- automatic semantic migration of arbitrary brownfield repositories;
- complete authority discovery by the context helper;
- semantic correctness from structural checker PASS;
- npm registry support;
- automatic upgrade or Canon repair.

Humans retain normative authority. External/live reality remains distinct from repository Canon.
