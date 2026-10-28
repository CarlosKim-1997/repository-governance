# Repository Governance Distribution 0.3.0

This prerelease adds optional local execution verification to the existing repository-owned Governance snapshot.

## Version model

- Governance semantics: **1.0.0**
- Distribution: **0.3.0**
- Structural checker: **0.1.0**

No required schema, Task lifecycle, recognition landmark or authority rule changes.

## Optional verification

- Inspect a plan before execution; execution requires explicit approval of its current SHA-256.
- Record native executable arguments, working directory, time bounds, bounded stdout/stderr, process outcomes and declared-content hashes.
- Recheck observations against current plan, helper, content and logs; incomplete or contradictory records cannot remain satisfied evidence.
- Distinguish actual named Node tests from empty-file TAP wrappers, including escaped hashes and meaningful filename whitespace. Unsupported or ambiguous observations remain UNVERIFIED.
- Keep mechanical observations separate from semantic acceptance, which remains UNVERIFIED and requires human judgment.

The installed helper has no runtime dependencies beyond Node 20+. It does not upload observations or automatically change Canon, Tasks or installed snapshots. Child processes retain the execution environment's permissions: this is not a sandbox, signature system or assertion-quality proof.

## Upgrade

Existing coherent Governance 1.0 snapshots remain recognized. Ordinary init does not auto-upgrade them. Review the helper, sample, verification guidance and mixed entry-point links explicitly using the A/B/C upgrade procedure. Preserve project-owned Canon and Work. Regenerate helper evidence after upgrading; old incomplete observations are not backfilled into accepted results.

## Verification and artifacts

The release gate requires a clean committed source, platform test matrix, source/template equality, actual packed Node/Python consumer checks and source-bound release checksums. The attached release metadata identifies the final source commit. Historical Work reports describe earlier snapshots, not the final release result.

Assets: `repository-governance-0.3.0.tgz`, `distribution-manifest.json`, `SHA256SUMS`, `release-metadata.json`, and `RELEASE-SHA256SUMS`.

## Limits

npm registry publication: **out of scope**.

This remains a prerelease. Hashes and logs do not prove semantic correctness or resist coordinated malicious rewriting. Detached process descendants and undeclared dependencies remain outside the helper's guarantees. No automatic upgrade or stable Distribution 1.0 claim is made.
