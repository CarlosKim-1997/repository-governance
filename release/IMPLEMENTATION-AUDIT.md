# First implementation cycle audit

## Baseline

The target directory was empty and not a Git repository. It was initialized locally with `git init`; branch is `master`, with no HEAD commit. A read-only clone of the reference repository's `main` branch at `b865765847a0cabb9f62bc1ab0115d5fad196bb7` was placed in ignored `.reference/`. Its manifest declares Governance 1.0.0. Its checker is `tooling/governance-check.mjs`, with tests in `tests/unit/governance-check.test.ts`. The copied reference checker reported PASS on that unchanged snapshot. No remote repository was modified.

## Architecture and generalization

`core/SPEC.md` is the single normative Core; five compact schemas are exact-copied into the installed template. `tooling/check/check.mjs` is development source and `template/tooling/governance/check.mjs` is the bundled offline artifact. The installer supports explicit Greenfield/Brownfield plan and apply, collision reporting, partial recovery, idempotency, Git inspection, and post-install check. Adoption guides and release manifest/checksum tooling are present.

Removed assumptions include reference-project area taxonomy, web application dependencies, package-manager scripts in the installed project, Git dependence in the checker, fixed project Decisions and Tasks, permissive `E-*` references, list-form `resolved_by`, and mixed `global` object areas. The copied checker is retained only as separated reference material in `examples/case-studies/`. The standalone checker substantially generalizes its validation architecture; it is not claimed to be byte-for-byte or full behavioral parity with the old checker. See [reference comparison](../examples/case-studies/reference-comparison.md).

## Verification on 2026-09-22

| Command | Result | Scope |
| --- | --- | --- |
| `npm run build` | PASS | Exact Core copies and a single-file checker bundle generated. |
| `npm test` | PASS, 39/39 | 27 generic checker cases, 9 installer cases, 3 release checks. |
| `node template/tooling/governance/check.mjs template` | PASS | Installed template structural check. |
| `node examples/case-studies/reference-g1-checker.mjs .reference` | PASS | Unchanged reference checker on unchanged reference snapshot. |
| `node tooling/check/check.mjs .reference` | ERROR, 5 expected findings | Four intentional contract differences, including two missing new tooling files; details in reference comparison. |
| `node examples/case-studies/validate-reference.mjs .reference` | PASS | Disposable copy with explicit compatibility edits; original untouched. |
| `npm run release:manifest` | PASS, 21 hashes | Generated distribution manifest and SHA-256 list; test verified hashes against bytes. Source commit is `UNCOMMITTED`. |
| `py -3 -m unittest discover -s tests` in Python fixture | NOT RUN | Python launcher reported no installed Python. |

The installer tests created temporary repositories with no package.json, node_modules, Git, JavaScript application, cloud configuration, or network requirement. The bundled checker passed there. A separate Python utility fixture with package metadata, CLI code, tests, and documentation also installed and passed the checker without altering its code. Its Python test could not run in this host.

## Installer safety

Plan mode performs reads only. Apply performs fresh preflight, writes only absent files with exclusive creation, rejects differing files and existing AGENTS, detects partial installations, and runs the vendored checker. An identical installation is idempotent. Brownfield apply explicitly reports skeleton installation, not completed semantic adoption. Nonconflicting dirty Git state is accepted; conflicting target files block. No Git add, commit, push, force overwrite, or semantic migration occurs.

## Read-only final audit

Inspected reusable Core, schema, template, checker source, installer, and bundle for reference-project names, web-stack assumptions, package.json/node_modules requirements, Git calls in checker, unsupported Evidence or waiver schemas, Principle schema, wrong relation targets, missing cycle checks, second-State acceptance, unsafe overwrite, and nondeterministic finding order. No reference-project name appeared in reusable sources; the only `evidence/v1` mention is an explicit non-support statement. The checker has typed target checks and separate cycle checks for depends_on, Task execution, supersedes, and implements. Tests cover the main negative paths. This audit does not claim a full semantic or security proof.

## Remaining gaps

| Class | Gap |
| --- | --- |
| Stable-release blocker | The original reference repository has not adopted the new protocol; only a disposable compatibility copy passes. Any actual migration requires project authority and semantic review. |
| Stable-release blocker | Distribution has no committed source SHA or versioned archive. Current manifest says `UNCOMMITTED`; no release was published. |
| Missing verification | Node 20 was targeted but only Node 24 was available for execution. |
| Missing verification | Python fixture's own unit test could not run because Python is absent; Governance install/check passed. |
| Missing verification | Brownfield semantic adoption in a mature unrelated repository has not been completed; skeleton safety is covered by fixtures. |
| Future optional feature | Automated upgrade CLI is deferred. |

## Git and next step

At audit time, local `master` had no HEAD commit and all implementation files were untracked; `.reference/` and `node_modules/` were ignored. No remote mutation occurred during implementation. The next narrow step is to obtain project-authority review of the reference repository's three semantic compatibility edits before any actual consumer migration. Do not mutate the reference remote from this implementation cycle.
