# Optional verification implementation — local Work report

2026-10-28. Unpublished implementation; this report supplies provenance, not normative authority or Task completion.

## Basis, authority and compatibility

The user's supplied `repository_governance_verification_codex_prompt_v2.md` authorizes local code/docs/tests and a PR draft, with no project commit, push, actual PR, merge, tag, release, publication or existing consumer mutation. Those boundaries were observed. Existing tests create and commit disposable Git fixtures only.

Actual starting and final HEAD: `fdcdea87ce7fb8ff60821356706b1148ea00d056`, rather than the attachment's historical `0aa52c6bb760471de242ac393d4e06728babe525`. Started on `main`; implementation is on local `feature/optional-verification`. Initial user work was the untracked `.codex-remote-attachments/` directory, which was preserved. Implementation changes remain uncommitted and new files remain untracked; nothing was staged.

No root AGENTS, manifest, Canon or Current State exists in this distribution checkout; none was invented. `template/AGENTS.md` is a consumer router. No ancestor AGENTS was found. Read the actual README, Core/SPEC, Task schema, adoption/upgrade/release guidance, installer, Checker, build, manifest generator, tests and CI. There was no normative/permission conflict requiring a contract change.

Checkout differences from the attachment: `adoption/OPERATIONS.md`, `tooling/release-package.mjs`, `tooling/release-bundle.mjs` and `tooling/verify-release.mjs` did not exist. Added operations and a small development staging helper; did not invent a full release service. The actual formal gate is `release-manifest.mjs --release`, which still requires a clean committed source tree. `.git` writes and temporary fixture Git writes required tool permission escalation; it succeeded, with no automatic approval rejection.

Governance 1.0.0, its five schemas, IDs, manifest, Task lifecycle, Core/template normative copies, Checker source/role, installer recognition profile, lockfile, dependencies, CI and version values are unchanged. Distribution/checker remain 0.1.0 development. The optional files do not become installed-recognition landmarks. Existing snapshots without them remain installed; ordinary init does not fill or upgrade them.

## Implementation and files

| Files | Result |
| --- | --- |
| `adoption/OPERATIONS.md`, `examples/verification/plan.json` | Requirement source/scope, preimplementation expectations/basis, authority, observations, Work reporting, rerun scope and an editable example. |
| `tooling/verify/verify.mjs` | Default read-only plan; explicit `--run --approve SHA256`; native executable/argument arrays, shell false; time/output bounds; process outcomes; human review; narrow Node TAP and literal observations; content/log hashes and `--check`. |
| `tooling/build.mjs` | Reproduces helper, operations and sample in template. |
| `template/tooling/governance/verify.mjs`, `template/tooling/governance/verification-plan.example.json`, `template/governance/OPERATIONS.md` | Generated exact copies, not manually edited. |
| `template/AGENTS.md`, `README.md`, `adoption/UPGRADE.md` | Short optional entry point, usage and explicit snapshot adoption. |
| `package.json`, `tooling/release-package.mjs`, `release/RELEASE.md` | Explicit default test list, files/script allowlists, fresh offline installer staging, local archive smoke and release boundary. |
| `tooling/release-manifest.mjs` | Adds the three installed files and three canonical sources to development artifact hashes: 24 → 30. |
| `tests/verification/verify.test.mjs`, `tests/release/package.test.mjs` | Actual command and evidence edge cases; archive extraction and fresh Node/Python consumers. |
| `tests/installer/init.test.mjs`, `tests/release/release.test.mjs` | Old optional-file absence remains installed; updated artifact count with hashes and source coverage. Existing assertions retained. |
| `work/reports/verification-implementation.md`, `work/reports/verification-pr-draft.md` | Local report and reviewable PR draft, excluded from packaging. |

The JSON names are non-normative tooling formats, absent from `supported_schemas`. No new Canon kind, ID or Task status was added. Results distinguish process exit, declared mechanical conditions and semantic acceptance; semantic acceptance always remains UNVERIFIED. Human entries are never automatically satisfied. No command runs from mere plan presence. All target files under declared directories are included without an exclusion list; artifact/target overlap is rejected.

## Environment and commands

Windows x64, PowerShell, Node `v24.20.0`, npm `11.19.0`, Python `3.11.8`. No dependency installation was needed. The local suite uses native tar and `npm pack --ignore-scripts --offline`; there was no remote call, publication or existing consumer upgrade.

| Execution | Observation |
| --- | --- |
| Baseline `npm test` under sandbox | 59 tests: 52 pass, 3 fail, 4 skip. Three failures were temporary Git fixture config writes denied; two additional directory-link skips were also environment permissions. |
| Baseline `npm test` with fixture writes permitted | 59 tests: **57 pass, 0 fail, 2 skip**. The two file symlink tests report EPERM. No preexisting code failure remained. |
| `npm run build` | PASS; exact normative copies and optional copies reproduced. |
| Final `npm test` | 74 tests: **72 pass, 0 fail, 2 existing skip**. Fifteen new tests passed. |
| `node --check tooling/verify/verify.mjs` and `node --check tooling/release-package.mjs` | PASS. |
| `node template/tooling/governance/check.mjs template` | `PASS: governance structure`. |
| `npm run release:manifest` | 30 hashes, all byte-verified by the suite; `DEVELOPMENT_WORKTREE`. |
| `node tooling/release-manifest.mjs --release` | **BLOCKED as intended**: clean committed source required. Gate unchanged; no formal release generated. |
| Default package smoke | PASS: actual `.tgz` packed/extracted, bundled installer applied to fresh Git-free Node and existing Python fixture copies, installed Checker/helper ran, evidence rechecked, original source bytes preserved, no consumer `node_modules`. |
| `git diff --check` | PASS; Git emitted only local LF/CRLF conversion notices. |

The two retained skips are `authoritative bootstrap symlinks cannot escape the repository` and `structured record file symlink outside root is rejected`. Windows directory junction cases, including the new external target/log directory rejection, executed and passed. No tests were removed, skipped by this implementation or relaxed to hide a failure. The manifest count changed because there are exactly six additional declared artifacts, each independently hashed.

New failures encountered and fixed: inherited `NODE_TEST_CONTEXT` hid an invoked test runner's TAP observations; the helper now removes that internal harness key while inheriting other environment values. Node can count an empty named test file as a passing file test; the narrow TAP reader conservatively requires named cases beyond file-only observations. Package smoke exposed a precreated destination directory conflict and bundled YAML's dynamic CommonJS builtin requirement; staging now creates only parent directories and supplies the same `createRequire` approach used by the existing Checker bundle. Targeted package tests and then the entire suite passed after repairs.

## Artifact-bound final observation

The final execution used the new CLI itself, not just imported functions:

```sh
node tooling/verify/verify.mjs dist/verification-audit/plan.json
node tooling/verify/verify.mjs dist/verification-audit/plan.json --run --approve d108912eb2485338907d115856922fb9b4ff4a631d7176bba0e8d11d43e71670
node tooling/verify/verify.mjs dist/verification-audit/plan.json --check dist/verification-audit/runs/1793161995577-5b6d0d97-82a0-48d0-afac-ddcd5198d5d3/result.json
```

Plan: `dist/verification-audit/plan.json`. Result/logs: `dist/verification-audit/runs/1793161995577-5b6d0d97-82a0-48d0-afac-ddcd5198d5d3/`. Execution: 2026-10-28 04:33:15–04:33:23 UTC. Fifty declared source/test/config/guidance files were hashed before/after. Scope includes tooling, tests, Core/template, adoption, sample, package/lock, README, release guide, CI and gitignore; it excludes these Work reports and generated dist outputs. The raw plan and helper also have separate hashes. Helper SHA-256: `ce0c966c1f1d95918c8e561a39ba2af7e05103906612563e66e5a57ba8e7b308`.

Both child commands EXITED with code 0. Regression observed 74/72/0/2 tests/pass/fail/skip. Structural observation was mechanically SATISFIED; regression remained **UNVERIFIED** because skips were present. Overall helper exit was **1**, status **UNVERIFIED**, binding **UNCHANGED**. Subsequent `--check` returned `current: true`, `status: UNVERIFIED`, empty stale reasons; current evidence does not erase its gaps. Semantic acceptance remains UNVERIFIED.

Retained local smoke package: `dist/verification-audit/repository-governance-0.1.0.tgz`, 33 entries, SHA-256 `2debf9ba5d4dd7cb3e7f182076c559cc3ebdb224fa28fc29c62d663e37230509`. Reviewable stage: `dist/package-smoke-zctDxb/`; entry metadata: `dist/verification-audit/package-metadata.json`. Package is private and has only init/verify/check:template scripts, without development reports, fixtures, logs, lifecycle hooks or runtime npm dependencies. These ignored local artifacts are development evidence, not a published or committed release.

## Read-only review and limits

After the final implementation and passing regression, a separate no-edit review checked code/tests/docs, authorization, stale evidence, missing observations, packaging and recognition compatibility against actual executions. No additional blocking issue was found. Same-model review is not independent proof.

What was demonstrated: explicit execution, real success/failure/missing executable, invalid/empty plan blocking, timeout/AbortSignal interruption, bounded stdout/stderr, human and zero/skip observations, same-HEAD uncommitted source/test/rule/lock/plan changes, target addition/deletion, execution-time target/plan changes, helper changes, log damage/missing records, non-circular logs, Git-free consumers, path escape/junction rejection, exact build copies and fresh package installation.

What is not established: semantic correctness or completion, trustworthy test assertions, tamper-proof provenance, automatic dependency coverage, child network/file isolation, detection of changes reverted during execution, or universal test parsing. Only declared content and retained observations are bound. Cleanup is best effort; detached descendants, hard links and filesystem races are not a sandbox. Environment variables are not dumped, but arguments/logs can contain secrets and require review before sharing. Environment changes require separate review; they are not all fingerprinted. Timeouts bound commands, not all filesystem reads or the entire plan.

Native execution paths are implemented for Windows, Linux and macOS. **Only Windows x64 / Node 24 / Python 3.11 was executed here**. Node 20, Linux/macOS process groups/signals, Windows file symlink cases, detached descendants and full GitHub CI remain unverified. The unchanged CI targets Linux/Node 20/Python 3.11 and will exercise the explicit default list only after separately authorized publication. No extra model subscription or external reviewer was required.

## Follow-up requiring separate authorization

Review the local diff, new files, logs and PR draft first. A later authorized source commit must include the generated optional copies and tests; rerun build/regression on the integrated artifact. Push/actual PR/merge/tag/release/publication each need separate authority. Formal release checks need a committed, clean source and the existing gate; do not reset user work or weaken it. Existing consumers adopt through explicit A/B/C upgrade review, preserving local AGENTS, Canon and Work; ordinary init remains unchanged. Recheck the evidence after any material source, test, plan, dependency, configuration or environment change.
