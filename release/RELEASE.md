# Release procedure and gates

Release engineering does not authorize publication. A release candidate may be built, verified, and reviewed without creating a Git tag or GitHub Release.

## Version layers

Repository Governance tracks independent versions:

- Governance Version — semantic protocol compatibility;
- Distribution Version — packaged templates, guidance, installer, and helpers;
- Checker Version — structural checker implementation.

For Distribution 0.2.0:

- Governance: `1.0.0`
- Distribution: `0.2.0`
- Checker: `0.1.0`

A Distribution release does not imply a new Governance semantic version.

## Distribution 0.2.0 prerelease gate

Before publishing `v0.2.0` as a GitHub prerelease:

1. source HEAD must be committed and clean;
2. hosted Verify Governance must pass on the exact candidate SHA;
3. Core and five schemas must exactly match their installed template copies;
4. installed OPERATIONS/helper copies must exactly match their sources;
5. checker, installer, R1–R10 replay, helper, symlink, compatibility, and release tests must pass;
6. reusable files must pass project-leakage checks;
7. the package version and installed Distribution version must agree;
8. CHANGELOG and release notes must include 0.2.0;
9. `npm run release:bundle` must generate source-bound release material;
10. `npm run release:verify` must verify checksums, version/source binding, manifest hashes, and packed file selection;
11. CI must install the packed `.tgz` into a clean harness and use that packed artifact to govern an unrelated Python repository;
12. a final read-only audit must verify the exact candidate main SHA and CI-produced artifact;
13. an explicit human publication instruction is still required before creating the tag or GitHub Release.

Expected release assets:

- `repository-governance-0.2.0.tgz`
- `distribution-manifest.json`
- `SHA256SUMS`
- `release-metadata.json`
- `RELEASE-SHA256SUMS`

The intended GitHub Release should be marked **prerelease**. npm registry publication is out of scope and `package.json.private` remains `true`.

## Building release material

Development metadata:

```sh
npm run release:manifest
```

writes ignored metadata to `dist/development/` with `source_commit: DEVELOPMENT_WORKTREE`.

Release-candidate material:

```sh
npm run release:bundle
npm run release:verify
```

requires a clean committed source tree and writes ignored output to `dist/release/`.

`release:bundle`:

- runs the source-bound distribution manifest generator;
- packs the versioned `.tgz`;
- records the exact source commit and packed-file set;
- writes release-level SHA-256 material.

`release:verify`:

- requires the current clean HEAD to equal the recorded source commit;
- checks version coherence;
- verifies source artifact hashes;
- verifies release checksums;
- verifies that current npm pack selection equals the recorded packed-file set.

Generated output is not checked back into the source commit, avoiding a self-reference.

## Publication

Publication must use the exact final SHA that passed the release gate.

A human publication decision should identify:

- exact source commit;
- tag `v0.2.0`;
- release classification: prerelease;
- CI run that produced the verified artifact;
- attached artifact/checksum set.

If any source commit changes after final verification, rerun the complete release gate before tagging.

## Future stable Distribution 1.0

A stable Distribution 1.0 requires a separate release decision and may impose stricter evidence than the 0.2 prerelease gate, including broader clean-room adoption sampling and an explicit stability review.

Building or publishing Distribution 0.2.0 does not satisfy that future stable gate.

The structural checker validates shape only. Semantic adoption and release readiness remain human-reviewed.
