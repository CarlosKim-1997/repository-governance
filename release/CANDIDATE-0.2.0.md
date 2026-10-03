# Distribution 0.2.0 release candidate review

## Status

Distribution 0.2.0 is a **prerelease candidate**.

This file records release-readiness intent. It does not authorize publication.

Current version layers:

- Governance Version: **1.0.0**
- Distribution Version: **0.2.0**
- Checker Version: **0.1.0**

Session C baseline:

`662f1fe4cc17abdb5f679af271eedd7b39655476`

## Evidence already established

### Session A

- Hermeneus and ReDiscovery incidents were converted into curated evidence.
- vNext candidates were classified before implementation.
- R1–R10 replay scenarios all passed under Governance 1.0.0.
- no tested scenario required a new first-class object, lifecycle, permission class, or applicability selector.

### Session B

Distribution 0.2.0 was applied and human-integrated into:

- Hermeneus — coherent Distribution 0.1 control case;
- ReDiscovery — local/precursor v1 convergence stress case.

Both ended at:

- Governance `1.0.0`
- Distribution `0.2.0`
- Checker `0.1.0`

ReDiscovery's migration also exposed unrelated calendar-dependent test rot. That repair was isolated, independently verified, integrated first, and excluded from the refreshed Governance migration diff.

The Session B synthesis is preserved under `examples/case-studies/dogfooding/`.

## Why this remains Governance 1.0.0

No required heading, schema field, status, relation type, object type, ID namespace, manifest selector, or authorization class was added.

The 0.2 Core delta clarifies meanings already implied by v1:

- terminal Task Authority preserves episode permissions;
- later outcome does not overwrite Authority;
- integration is not automatically a Canon event;
- Current State is current-position compression rather than a history ledger;
- Verification Basis is representative;
- repository observations do not own later external live state.

If release-readiness work discovers that these claims are not actually backward compatible, stop the release and return to semantic protocol work.

## Distribution 0.2 additions

Installed non-normative guidance:

- `governance/OPERATIONS.md`

Installed optional read-only helpers:

- `tooling/governance/preflight.mjs`
- `tooling/governance/context.mjs`

The published Governance 1.0.0 recognition profile remains unchanged.

## Session C release engineering

The intended public artifact is a GitHub **prerelease**, not an npm publication.

Expected tag:

`v0.2.0`

Expected assets:

- `repository-governance-0.2.0.tgz`
- `distribution-manifest.json`
- `SHA256SUMS`
- `release-metadata.json`
- `RELEASE-SHA256SUMS`

The source package remains `private: true`.

CI must build the archive from one clean committed source SHA, verify release integrity, install the packed archive into a clean harness, and then apply Governance from that packed artifact to an unrelated Python consumer.

## Required final gates

Before publication authorization:

- all checker/installer/replay/helper/release tests PASS;
- Linux symlink proofs execute with zero skipped tests;
- template Core copies equal Core;
- OPERATIONS/helper installed copies equal their sources;
- historical Governance 1.0 snapshot recognition regression PASS;
- source-bound release bundle builds from exact candidate SHA;
- release checksum verification PASS;
- packed file set is bounded and excludes tests, adopter evidence, GitHub workflow implementation, and Session C candidate material;
- packed archive clean-room installation PASS;
- unrelated Python consumer PASS after archive-based installation;
- source remains clean after release generation;
- hosted artifact is retained for final inspection;
- exact candidate main SHA receives a final read-only audit.

## Intentionally not added

- Evidence object or `E-*`;
- Operational Authorization object;
- field-level Decision amendment semantics;
- formal applicability selectors;
- required ratification metadata;
- Outcome schema;
- semantic AI checker;
- automatic State repair/generation;
- central lock manager;
- npm registry publication.

## Publication boundary

Release-ready does not mean released.

The final `v0.2.0` tag and GitHub prerelease require a separate explicit human publication instruction identifying the exact verified source SHA.

Any source change after final verification invalidates that publication basis and requires rerunning the release gate.
