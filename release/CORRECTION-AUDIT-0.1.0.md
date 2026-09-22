# Targeted correction audit — 0.1.0 development

## Baseline

The correction pass began on `main` at `be7a4b9db55f4e530693183c3bd8499a3ae52cd5`, exactly the independent audit baseline. The working tree was clean; there were no intervening user edits. The original [first-cycle audit](IMPLEMENTATION-AUDIT.md) remains historical.

## Corrections

1. **Partial/unknown install:** `tooling/init/init.mjs` now blocks ordinary apply with `RECOVERY_REQUIRED` and leaves files untouched. Generic `work/`, `canon/`, or `AGENTS.md` alone do not imply Governance presence. Plans still list every path.
2. **Supersession:** `tooling/check/check.mjs`, the Core SPEC, and Decision/Constraint schema summaries now require the target of an ACTIVE Decision or Constraint's `supersedes` edge to be SUPERSEDED.
3. **Verification vocabulary:** the SPEC and its generated template copy use `NOT_SATISFIED` in place of `FAILED` for the conceptual verification gate.
4. **Authority:** the SPEC replaces a total precedence list with absolute Invariants, binding applicable Hard Constraints, explicit scoped exceptions only where overridable, ordinary Decisions within Constraints, and Task restrictions that only narrow authority.
5. **Integrity coverage:** `tooling/release-manifest.mjs` enumerates every installer-copied template file. The release test independently enumerates the template tree and requires full manifest coverage; the development manifest now lists 24 hashed artifacts.
6. **Source commit:** checked-in generated manifest/checksum files were removed. Development output is ignored under `dist/development/` and says `DEVELOPMENT_WORKTREE`. `--release` requires a clean committed tree and writes ignored `dist/release/` output tied to its stable HEAD, without committing that output back into the source.
7. **Reverse alias:** `resolved` now receives `GOV-REL-REVERSE` ERROR, with a focused fixture.
8. **Path safety:** required bootstrap files and structured collection directories are realpath-checked before parsing/discovery. Outside-root links receive structural errors. Windows file-symlink creation is unavailable in this test context (`EPERM`); directory junction tests exercise both bootstrap and collection escapes.
9. **Authority wording:** the SPEC is identified as semantic authority, schema files as compact normative structural references derived from it, and guides as procedural guidance.

The reference checkout was not modified. The disposable reference experiment now tests the review hypothesis `depends_on: [C-003]` for D-018 rather than deleting its relation; an actual migration remains subject to project-authority review.

## Verification

| Command | Result |
| --- | --- |
| `npm run build` | PASS; bundled checker and exact Core copies regenerated. |
| `npm test` | PASS: 47 passed, 1 Windows file-symlink test skipped, 0 failed; 48 total. Baseline was 39 tests. |
| `node template/tooling/governance/check.mjs template` | PASS. |
| `npm run release:manifest` | PASS; 24 development artifact hashes in ignored `dist/development/`. |
| `git diff --check` | PASS; only Git line-ending notices. |
| `node examples/case-studies/reference-g1-checker.mjs .reference` | PASS on unchanged reference. |
| `node tooling/check/check.mjs .reference` | Five known compatibility findings; no new finding. |
| `node examples/case-studies/validate-reference.mjs .reference` | PASS on disposable copy. |

Installer tests continue to cover clean-room Greenfield, Python/non-Node code preservation, no consumer `node_modules`, AGENTS collision, nonconflicting dirty Git, and offline checker operation without Git. The release test builds a separate temporary Git fixture: clean committed source produces a SHA-bound ignored manifest, and dirty source is rejected. No release was published.

## Remaining gaps and Git state

Missing verification: Node 20 execution (host ran Node 24.20.0), Python fixture's own unit test (Python absent), and direct file-symlink creation on this Windows host. Directory junction escape checks passed. Stable-release blockers remain: full stable gate review, versioned archive, and actual reference-consumer adoption. No new conceptual Governance object was introduced.

At correction-audit time the branch was `main`, HEAD remained `be7a4b9`, and this pass had changed source/tests/docs and removed the two tracked generated metadata files. `dist/` is ignored. This pass made no commit, push, tag, or remote mutation. The next narrow step is an independent read-only review of these nine corrections before any stable-release work.
