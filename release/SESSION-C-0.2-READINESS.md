# Session C — Distribution 0.2 release readiness

## Status

Session C is active.

Session A established the v1-compatible Distribution 0.2 design and replay evidence.
Session B applied that distribution to two adopter repositories:

- Hermeneus control case — PASS / integrated;
- ReDiscovery local-v1 convergence stress case — PASS / integrated.

Session C asks a different question:

> Is Distribution 0.2.0 ready to be published as a reproducible, reviewable prerelease artifact for third-party adopters?

This session does **not** change Governance semantics unless a release-readiness defect proves that the current information model or compatibility contract is unsound.

## Baseline

Repository:

`CarlosKim-1997/repository-governance`

Session C starting main:

`662f1fe4cc17abdb5f679af271eedd7b39655476`

Versions at start:

- Governance: `1.0.0`
- Distribution: `0.2.0`
- Checker: `0.1.0`

Existing public tags: none.

Existing GitHub releases: none.

## Intended release shape

The intended first public distribution release is:

- Git tag: `v0.2.0`
- GitHub Release: `0.2.0`
- GitHub Release classification: **prerelease**
- primary downloadable artifact: versioned `.tgz` distribution archive
- integrity material: source-bound distribution manifest + SHA-256 checksum files
- npm registry publication: **out of scope**
- `package.json.private`: remains `true`

The archive is a GitHub release artifact, not an npm-registry publication contract.

## Publication gate

Session C may:

- change release engineering, packaging, verification, documentation, and CI;
- create branches and reviewable PRs;
- build release-candidate artifacts in CI;
- download and inspect CI artifacts;
- merge release-readiness implementation after human approval.

Session C may **not**, without a separate explicit human publication instruction:

- create the final `v0.2.0` tag;
- publish a GitHub Release;
- upload final public release assets;
- publish to npm or another package registry;
- announce a release externally.

"Release-ready" and "released" remain different states.

## Release gates

### C-G1 — version coherence

All version surfaces must agree:

- package distribution version;
- installed version metadata;
- release manifest;
- release notes/changelog;
- archive filename and package metadata.

Governance remains `1.0.0`; checker remains `0.1.0`.

### C-G2 — clean source provenance

Release metadata must bind to one clean committed source SHA.

Generated release output remains ignored and must not create a self-referential source commit.

### C-G3 — exact installed snapshot

The packaged distribution must contain the same Core/schema/guidance/helper/checker bytes already validated by the source-tree release tests.

No project-specific adopter material may leak into the archive.

### C-G4 — bounded release contents

The public archive must include only reusable distribution material needed to understand, build, install, and operate Repository Governance.

It should exclude:

- adopter case-study evidence;
- repository tests/fixtures;
- GitHub workflow implementation;
- development-only candidate packets.

### C-G5 — artifact integrity

The release bundle must produce:

- the versioned archive;
- source-bound `distribution-manifest.json`;
- internal `SHA256SUMS`;
- release-bundle metadata;
- top-level release checksum material.

Release verification must fail on byte drift or version/source mismatch.

### C-G6 — archive clean-room install

CI must install and use the **packed archive**, not merely the source checkout, against an unrelated non-JavaScript consumer.

The installed project checker must run from the copied governed snapshot without project package dependencies.

### C-G7 — existing regression gates

The existing hosted gates remain required:

- checker tests;
- installer tests;
- R1–R10 replay tests;
- helper tests;
- Linux symlink proofs;
- template checker;
- source cleanliness.

Session B adopter results remain compatibility evidence; they are not replaced by packaging tests.

### C-G8 — release documentation

Before publication:

- CHANGELOG includes Distribution 0.2.0;
- release notes state compatibility and limitations;
- README distinguishes prerelease Distribution 0.2 from future stable 1.0;
- release procedure gives exact artifact, checksum, tag, and publication steps.

### C-G9 — final read-only audit

Before asking for publication authorization, perform a final read-only audit of the exact release-candidate main SHA and its CI-produced artifact.

Publication must use that exact verified source SHA. No "small cleanup" may occur between final verification and tagging without rerunning the gate.

## Stop conditions

Stop and reclassify before release if any proposed fix would:

- change which record is binding;
- change authorization semantics;
- add a required schema field/status/relation/object;
- invalidate an existing Governance 1.0 adopter solely because of new semantics;
- require Project Canon migration;
- weaken release verification to make a failing candidate pass.

Such a defect belongs back in semantic protocol work rather than release engineering.

## Session C completion

Session C is complete when:

1. release-readiness changes are integrated;
2. exact main passes hosted verification;
3. CI produces a verified Distribution 0.2.0 archive and checksum set from that exact source SHA;
4. a final release-readiness packet identifies the exact source SHA and artifact evidence;
5. the only remaining action is the explicit human publication decision.

Session C completion does not itself mean `v0.2.0` is published.
