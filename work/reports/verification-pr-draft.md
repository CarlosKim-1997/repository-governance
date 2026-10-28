# PR draft — not created remotely

Title: Add optional local verification plans and artifact-bound Work observations

Verification claims previously had procedural guidance but no small distribution-owned runner binding commands and observations to the current working files. This adds an optional plan-only helper with explicit plan-hash execution authorization, bounded logs, distinct process outcomes and declared-file hashes before/after execution. Rechecking rejects stale scope, changed plans/helper or missing observations; human/semantic acceptance remains unverified.

Operations guidance connects requirement sources, preimplementation expected results, permissions, observations and rerun scope to existing Task Verification/Completion Criteria and Work reports. Build reproduces the installed helper/guide/sample. Development staging bundles the installer, narrows consumer files/scripts and proves the actual local archive works in fresh unrelated Node/Python consumers without Git or npm runtime dependencies.

Governance 1.0.0 schemas, IDs, manifest, Task lifecycle, Checker behavior, installer recognition, dependencies and all version values remain unchanged. Older snapshots without the optional additions stay installed and require explicit upgrade review. No automatic Task completion, Canon mutation, remote service or mandatory retroactive gate is introduced. This is unpublished distribution work.

Validation: baseline 57 pass / 0 fail / 2 existing Windows file-symlink EPERM skips; final 72 pass / 0 fail / the same 2 skips (74 total). Build/exact copies, template Checker, 30 manifest hashes and actual offline archive → fresh install → helper run/check passed. Final helper audit binds 50 files with unchanged hashes and conservatively reports UNVERIFIED due to the two skips. Read-only review found no additional blocker. Windows x64 with Node 24/Python 3.11 was exercised; Node 20 and Linux/macOS remain unverified locally. Formal clean-commit release metadata remains blocked by the uncommitted working tree, as required.

Limits: change tracking and declared mechanical observations only; semantic acceptance, assertion quality, undeclared dependencies and malicious tampering are not proven. Native child effects depend on the execution environment; process cleanup is best effort. The narrow TAP reader and literal text conditions do not replace human acceptance.

Local details: [Work report](verification-implementation.md). Project commit, push, actual PR, merge, tags, publication and consumer upgrades require separate authorization.
