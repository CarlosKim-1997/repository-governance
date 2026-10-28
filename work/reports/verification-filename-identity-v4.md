# TAP display/file identity correction — v4

2026-10-28 (Asia/Seoul). Local Work provenance, not Governance authority or a release claim.

## Authority, baseline and preservation

The human requested following the attached CODEX_FIX_PROMPT_v4.md within one correction: TAP display-name versus actual invocation-file identity (R4), preserving the v3 worktree, first reproducing the new regression, retaining existing tests, and making no project commit, push, PR or release. Attachment instructions were evaluated within that delegated scope; they do not independently grant authority. No conflict with repository instructions was found. The consumer template's Canon remains an unadopted skeleton; no Canon, schema, Task state or semantic acceptance was changed.

Worktree: `~/.codex/worktrees/optional-verification-v3/repository-governance`.
Branch: `feature/optional-verification-v3`.
Baseline HEAD: `0aa52c6bb760471de242ac393d4e06728babe525` (unchanged).
Distribution 0.2.0, Governance 1.0.0 and Checker 0.1.0 remain unchanged.

Before adding the test or editing source, all 88 existing tracked/untracked source and report files were preserved in `dist/review-v4/preserved-v3-working-tree.zip`, alongside per-file hashes, Git status, HEAD/branch and the tracked diff. Internal preservation ZIP SHA-256: `0ff7760270a6b66c8ca7d9e282a453cff7a6af381b3a59162671b47d2b478f5d`. This preservation ZIP is excluded from the external review archive. Ignored dependencies and previous review artifacts were retained. The original feature/optional-verification checkout was not used or modified, and no remote lookup or mutation was needed.

The supplied review ZIP's SHA256SUMS entries all matched. Its Linux observations were treated as prior independent evidence, not as results of this Windows execution. The new `tests/verification/tap_identity_regression.test.mjs` is byte-identical to the attachment, SHA-256 `4e73a6b35777be284ca2401080fc2bd9bea42e0f8744aaae97ce1329bfa4c16d`. The earlier independent regression remains byte-identical, SHA-256 `49bd68df1b7d510446a3c03aed07f557be8d75c400adddfb05f8be693a69c490`.

## Narrow correction and changed files

- `tooling/verify/verify.mjs`: decode only supported Node TAP hash/backslash escapes before comparing names with explicit invocation files. Preserve leading/trailing filename whitespace. Reject unsupported displays, control characters and ambiguous control-character escapes as UNVERIFIED. File wrappers remain UNVERIFIED regardless of extension. Normal named tests, hash-containing test names and genuine tests in hash-containing directories still work. Run and checkEvidence share this evaluation path.
- `template/tooling/governance/verify.mjs`: regenerated through the unchanged build script; byte-identical to source.
- `tests/verification/tap_identity_regression.test.mjs`: unmodified supplied six-case regression.
- `tests/verification/tap-names.test.mjs`: eight supplementary cases, with small internal matrices covering combined hashes/spaces, absolute/native-separator paths, trailing spaces, escaped backslashes, same-as-file ambiguity, control escapes, and multiple-file calls. POSIX-only filename branches are not claimed as executed on Windows.
- `tests/verification/package.test.mjs`: retain the existing positive Node/Python consumer assertions; additionally exercise installed CLI run/check for hash-containing and leading-space empty filenames, requiring UNVERIFIED, exit 1 and current evidence.
- `package.json`: append the two new test files to the default test command. Existing test paths, package allowlists, scripts, versions and dependency declarations are retained.
- `adoption/VERIFICATION.md` and generated `template/governance/VERIFICATION.md`: describe the bounded display handling and ambiguity rule.
- This Work report records the observations. Earlier reports remain unchanged historical records.

Exactly six preexisting files changed relative to the preserved v3 working tree: the source/template helper pair, source/template guidance pair, package.json and the packaged-consumer test. The other 82 preserved files remain byte-identical. Two test files and this report are new. Existing helper/record/installer/replay/release tests and their expectations were retained; the package test gained assertions without weakening existing ones.

The observed Node v24.20.0 TAP implementation escapes hashes and backslashes. Control-character substitutions can share their display with literal backslash-letter names, so those observations cannot establish a named case. The runtime excerpt and actual filename probes are retained locally. This remains a bounded Node TAP reader; no universal TAP parser, assertion-quality classifier, filename blacklist, sandbox or automatic semantic approval was introduced. `semanticAcceptance` remains UNVERIFIED.

## Executed verification

Environment: Windows x64, Node v24.20.0, npm 11.19.0, Python 3.11.8. Existing installed dependencies were used; no network install was needed.

| Command / observation | Actual result |
| --- | --- |
| Before source edits: `node --test --test-reporter=tap tests/verification/tap_identity_regression.test.mjs` | **6 total / 3 pass / 3 fail / 0 skip**, exit 1. Empty hash filename, hash directory and cwd-relative leading-space filename incorrectly returned SATISFIED in both run and check. |
| After edit: `node --test --test-reporter=tap tests/verification/tap_identity_regression.test.mjs tests/verification/tap-names.test.mjs tests/verification/review_regression.test.mjs` | **22 total / 22 pass / 0 fail / 0 skip**, exit 0: supplied new 6, previous independent 8, supplementary 8. |
| `node --check tooling/verify/verify.mjs` | PASS, exit 0. |
| `npm run build` | PASS, exit 0; existing build regenerated helper/guidance and existing outputs. |
| `npm run check:template` | PASS: governance structure, exit 0. |
| `npm run release:manifest` (development mode, no --release) | PASS, exit 0; 34 DEVELOPMENT_WORKTREE artifact hashes independently matched file bytes. |
| Source/template comparison | All 12 pairs matched byte-for-byte, including Core/schemas/guidance/preflight/context/helper/sample. |
| First `npm test`, restricted sandbox | **119 total / 107 pass / 7 fail / 5 skip**, exit 1; environment restrictions described below. |
| Same `npm test`, with local fixture permissions | **119 total / 117 pass / 0 fail / 2 skip**, exit 0. No source or expectations changed between these attempts. |
| `git diff --check` | PASS, exit 0. |

The final 119 tests consist of the existing 105 (103 pass, 2 skip) and 14 new tests (14 pass). The 22-test focused run overlaps the full suite and must not be added to its total. The original eight independent cases and six new supplied cases all pass in the final default run.

The first full attempt failed because sandbox policy denied temporary Git config writes in six existing fixture tests: dirty nonconflicting install, dirty conflicting install, clean-source release metadata fixture, replay R6, workspace preflight and same-HEAD content binding. The seventh failure was npm's local yaml link returning EPERM during the offline package install. Three directory-link cases also skipped under the restricted sandbox. The identical full command was rerun with authorized local fixture access and all seven failures plus those three skips cleared. No test was deleted, disabled or weakened. This was not an automatic approval rejection or a product fix.

The two final skips are the existing Windows file-symlink cases: authoritative bootstrap symlinks and structured record-file symlink, both EPERM. Directory junction cases ran and passed.

The packaged-consumer test creates the actual staged npm archive, checks that tests/examples/work/dist/node_modules/.github/log files are excluded, and installs it offline into a fresh harness using the already-installed local yaml dependency. The real installed init command creates fresh Git-free Node and Python consumers; installed checker/helper positive run/check assertions pass. The newly installed Node helper also rejects both selected empty-filename wrappers with current UNVERIFIED evidence. Consumer project node_modules is absent; preflight/context remain present. This does not claim a registry install or publication.

## Logs, review archive and unverified scope

Local evidence is under `dist/review-v4/`: `reproduction-before.tap`, `focused-after.tap`, `sandbox-suite.tap`, `final-suite.tap`, build/check logs, command/exit records, runtime display probes and `integrity-check.json`. The failed attempts remain evidence; they are not rewritten as passes. External copies mask personal path prefixes while preserving test names, status lines, summary counters and durations.

`dist/review-v4-export/repository-governance-review-v4.zip` contains the current managed-worktree files, including uncommitted/new source, tests, templates, build/install/package files and this report. Review materials include HEAD-relative and v3-working-tree-relative diffs, change lists, source hashes, major logs and export checksums. Raw user review attachments, internal preservation ZIPs, .git, node_modules, caches, credentials and unrelated dist outputs are excluded. The integrated regression source is included as a test, not as a raw attachment bundle. The review archive is not a release package.

Formal release:bundle/release:verify remain **BLOCKED** by their unchanged clean-committed-source prerequisites. They were not run against this dirty project during v4 work, and no project release was produced. Existing tests exercise their local disposable fixtures only. No project staging/commit, push, PR, merge, tag, release, publication, remote mutation or consumer auto-upgrade was performed.

Node 20/22, Linux, macOS, hosted CI, POSIX-only control/backslash filename branches, POSIX cleanup and detached descendants were not exercised in this run. Windows trailing spaces can alias filesystem names; the test establishes the observed runner display/invocation classification here, not POSIX filename equivalence. The helper still does not prove semantic correctness, assertion quality, malicious-log resistance or complete environment/dependency identity. A read-only post-test diff/integrity review confirmed the narrow change and preserved files; it is not independent proof that all possible defects are absent.
