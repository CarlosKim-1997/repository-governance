# Independent verification fixes and latest-main integration — v3

2026-10-28. Local, uncommitted Work provenance; no new Governance authority or release claim.

## Baselines, instructions and preservation

The human requested opening the supplied regression ZIP, using CODEX_FIX_PROMPT_v3.md as the correction basis, preserving existing work, reproducing before fixing, and making no remote changes. The attachment was used within that delegated scope; it does not independently grant publication, project commit, or policy authority.

Original checkout: `feature/optional-verification`, HEAD `fdcdea87ce7fb8ff60821356706b1148ea00d056`, Distribution 0.1.0 plus the uncommitted optional implementation. All 61 tracked/untracked files, including the original user attachment, were copied into an internal snapshot before mutation. Backup location in the original checkout: `dist/review-fix-v3/preserved-working-tree.zip`, with `preserved-manifest.json`, `preserved-tracked.patch`, `preserved-status.txt` and a SHA-256 summary. Ignored dependencies and previous review artifacts were left in place. This internal preservation ZIP includes the user attachment and is not an external-sharing package.

Actual remote main was read using `git ls-remote origin refs/heads/main`: **0aa52c6bb760471de242ac393d4e06728babe525**. The locally available origin/main matched and its object already existed, so no fetch was needed. Local main was not reset or moved. No remote ref, file or publication changed.

Integration is on a separate managed worktree:

~~~text
branch: feature/optional-verification-v3
HEAD:   0aa52c6bb760471de242ac393d4e06728babe525
path:   ~/.codex/worktrees/optional-verification-v3/repository-governance
~~~

Only new optional helper/tests/sample and historical Work reports were copied from the original checkout. Existing latest-main package, OPERATIONS, Core/schema, installer, preflight/context, replay and release sources were retained and edited narrowly where needed. Existing dependency-lock entries matched the original checkout exactly; yaml 2.9.1 and esbuild/native package 0.25.12 were copied for local tooling, without changing the lockfile or downloading dependencies.

The provided ZIP contained only `review_regression.test.mjs`, not the REVIEW.md or evidence/ directory mentioned in the fix prompt. Findings R2/R3 were reproduced from the executable cases and the supplied description; no missing review evidence was invented. Original regression SHA-256: `49bd68df1b7d510446a3c03aed07f557be8d75c400adddfb05f8be693a69c490`; the repository copy is byte-identical.

After implementation, all 61 original checkout files still matched their preservation hashes. Earlier implementation/PR reports are retained unchanged as historical records; this report supersedes their current integration claims. The original worktree deliberately still contains the old implementation. Use the v3 worktree for the fixes.

## Review R1 — latest-main integration

Distribution stays **0.2.0**, Governance **1.0.0**, Checker **0.1.0**. Core, schema, Task lifecycle, checker source, installer recognition, preflight/context sources, dependency lock and CI workflow remain unchanged from the actual main baseline. The existing ten replay cases and helper tests remain in the default suite.

- `adoption/VERIFICATION.md` holds the optional procedure separately. Existing OPERATIONS content is preserved in full, with one short additional section/link; `template/AGENTS.md` remains a short router.
- `tooling/build.mjs` keeps its current Core/OPERATIONS/preflight/context/Checker outputs and adds exact helper/guide/sample copies.
- Sample source is `tooling/verify/verification-plan.example.json`, rather than an examples/ source omitted by the current package rules. Build and packaged build can both find it.
- `package.json.files`, `releasePackagePaths` and the staged script whitelist retain the 0.2.0 surface and add verification. The existing createReleaseStaging implementation is used; the older replacement staging/bundle model was not transplanted.
- Existing release-bundle and verify-release checks now require the optional packaged paths. Their clean-commit gates are intact. Development artifact coverage grows from 28 to 34: three installed additions plus their three canonical sources, all hashed.
- Existing snapshot recognition is unchanged; a new test proves missing optional verification files do not trigger automatic upgrade or PARTIAL recognition.

Main baseline had three failures before any integration. The release-note test expected an explicit npm publication exclusion phrase absent from the note; it was added with no permission change. Replay R6 compared Git's canonical long/slash paths against Windows short/backslash paths; both sides now use realpath while retaining root/branch/HEAD separation assertions. Replay R9's LF-only fixture substitution silently failed on a CRLF checkout; fixture text is normalized before the same area insertion. No expected outcome was weakened or case removed/skipped.

## Review R2 — empty-file false satisfaction

Removed extension-based Subtest guessing. The narrow reader now requires the current native Node executable, explicit --test/TAP invocation and regular workspace-local file arguments. It resolves argument paths against the approved cwd and compares observed top-level Subtest names with those invocation targets. File-only wrappers, regardless of suffix or no suffix, remain UNVERIFIED. Genuine named cases still satisfy their mechanical gate, including a legitimate case name ending in .jsx. Ambiguous same-as-file names and unsupported flags/globs/directories/discovery remain UNVERIFIED.

This is bounded runner observation, not source parsing or assertion-quality proof. Existing zero/skip/fail/timeout handling remains covered.

## Review R3 — execution record consistency

The existing `verification-result/local-v1` format now has a minimum structural/type/consistency check, separate from Governance supported_schemas. Executed entries record a normalized executable/argument-array/cwd invocation, and checkEvidence independently resolves the approved plan using the same rules.

Required checks include result/check timestamps and ordering, environment types, content binding, explicit outcome/exit/signal/failure/observationMissing/cleanup, per-stream integer byte counts, exact retained/truncated relationships, digest and expected run-local path, and actual retained log bytes/hash. Missing fields never default to false/success. Invalid dates and malformed environment values are rejected. JSON property order does not matter.

Human and NOT_RUN entries have timestamped non-execution shapes without invented process/log metadata. Genuine failed-start, timeout/interruption and truncation records remain current when structurally complete, while retaining BLOCKED/UNVERIFIED gates. Incomplete observations and missing/contradictory records return current:false, BLOCKED/UNVERIFIED and concrete reasons. Older incomplete records are not backfilled; fresh execution is required.

These checks detect accidental omission, corruption and contradiction. They do not sign records or prevent a worker from rewriting the helper, logs and hashes together. PATH commands remain bounded observations of the configured name, not proof of all executable/environment dependencies.

## Verification and failure history

Environment: Windows x64, PowerShell, Node **v24.20.0**, npm **11.19.0**, Python **3.11.8**.

| Execution | Result |
| --- | --- |
| Original helper + unmodified supplied regression | **8 total / 3 pass / 5 fail / 0 skip**. Empty, empty.test, empty.jsx and both record scenarios reproduced. |
| Untouched actual-main default suite | **78 total / 73 pass / 3 fail / 2 skip**. The preexisting documentation/fixture failures are described above. |
| Fixed independent regression + original helper suite | **20/20 pass** before packaging integration. |
| New record-consistency and packaged-consumer cases | **6/6 pass**. |
| Final `npm run build` | PASS; optional and existing sources/templates regenerated. |
| Final `npm test` | **105 total / 103 pass / 0 fail / 2 existing skip**, exit 0. Includes all original seven suite files plus four verification suite files. |
| `node --check tooling/verify/verify.mjs` | PASS. |
| `node template/tooling/governance/check.mjs template` | PASS: governance structure. |
| Source/template equality and manifest suite | PASS, including Core, OPERATIONS, preflight/context and all new copies; **34** development hashes byte-verified. |
| Packaged fresh Node/Python consumers | PASS. Actual staging archive packed and installed offline into a fresh temporary harness, using the already-installed lock-matched yaml as a local dependency. Installed distribution init/checker/helper run/check passed; consumer Git and node_modules absent. preflight/context files retained. |
| `git diff --check` | PASS; local LF/CRLF notices only. |
| `npm run release:bundle` | **BLOCKED**: clean committed source tree required, before release generation. |
| `npm run release:verify` | **BLOCKED**: clean committed source tree required. |

Final independent regression cases are included byte-for-byte in the 105-test run: eight pass. The additional record suite independently deletes each required field, introduces contradictory types/invocations/times/log metadata, exercises CLI rejection and confirms legitimate human/NOT_RUN/failed-start/timeout/interruption/truncation forms. The packaged smoke uses local archive and local yaml only, with --offline and --ignore-scripts; it is not a claim that a network registry install was exercised.

Two existing skip cases remain Windows file-symlink creation EPERM: authoritative bootstrap symlinks and structured record file symlink. Directory junction cases ran and passed. No new skip, test deletion or expectation relaxation was introduced. A sandbox-only attempt to inspect managed-worktree Git/generate metadata was denied by local access restrictions; rerunning with authorized local worktree access produced the correct development hashes and clean-commit gate errors above. This was an environment restriction, not a passing gate or an automatic approval rejection.

Logs: original checkout `dist/review-fix-v3/reproduction-before.tap`; v3 worktree `dist/review-v3/main-baseline.tap`, `integrated-suite.tap` and `final-suite.tap`. Logs may contain local paths and require review before sharing. Final hash inventory and local diff are under the v3 dist/review-v3 directory. The old external-review ZIP remains historical and was not silently replaced.

## Read-only review, limits and next authority boundary

After the final build/test, a separate no-edit review checked invocation/file identity, record validation/control flow, packaging allowlists, unchanged safety gates, original change preservation, historical reports and the actual executions. No further blocking defect was found in that pass. Same-model review is not independent proof.

Node 20, Linux/macOS, hosted CI, POSIX signal/process-group cleanup, detached descendants and Windows file symlinks remain unverified here. No universal parser, source-assertion analysis, signed evidence, whole-environment fingerprint or child network/filesystem sandbox was added. Hashes still miss execution-time changes later reverted and undeclared dependencies; semantic acceptance remains UNVERIFIED. The conservative parser may decline valid unsupported invocations.

No project commit/staging, push, actual PR, merge, tag, Release or consumer auto-upgrade was performed. Test-only disposable fixture commits are part of the existing authorized tests. A separate publication instruction and clean committed source are still required for formal release/CI verification. Review the v3 diff/PR draft, then obtain any next authority explicitly; do not reset or clean either worktree.
