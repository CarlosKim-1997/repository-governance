# Repository Governance

Repository Governance is a small repository-owned protocol for durable coordination between people and coding agents. It records the rules that govern work, a project's settled choices and boundaries, one current position, and significant execution contracts. A new worker can recover authority from the repository instead of reconstructing a chat history.

It is not a project-management suite, audit database, automatic policy maker, or source of truth about runtime reality. Structural validation cannot approve a policy choice or prove the product correct.

## Quick start

Node 20 or newer is needed for the installer and checker only. The governed project needs no JavaScript, package manager, `node_modules`, Git, cloud service, or network at runtime. From this distribution:

```sh
npm install
npm run build
node tooling/init/init.mjs init --greenfield --target /path/to/project
node tooling/init/init.mjs init --greenfield --target /path/to/project --apply
```

The first `init` is a read-only plan. `--apply` repeats preflight, refuses conflicting files, creates the snapshot, and invokes the installed checker. Partial or uncertain Governance presence blocks ordinary apply and requires deliberate recovery. An existing coherent snapshot remains installed after local Canon, AGENTS, or manifest edits; ordinary init leaves it untouched and reports upstream differences for explicit upgrade review. A Brownfield repository uses `--brownfield` in both commands; that installs a skeleton and leaves semantic adoption to [the Brownfield guide](adoption/BROWNFIELD.md). There is no broad `--force` overwrite.

The installed shape is:

```text
AGENTS.md                 bootstrap router
governance/manifest.yaml  adopted protocol, areas, Current State pointer
governance/SPEC.md        Governance rules
governance/schemas/       compact record contracts
canon/                    project Principles, Decisions, Constraints, OQs, State
work/                     significant Tasks and provenance reports
tooling/governance/       offline checker and tooling versions
```

Run the checker directly from the governed repository:

```sh
node tooling/governance/check.mjs
```

Exit codes are 0 for PASS or warnings only, 1 for structural errors, and 2 for tool failure. The installed checker is a single bundled script. It does not inspect Git, call a service, modify files, or require project dependencies.

## Recovering context

Read `AGENTS.md`, manifest, Part I of the SPEC, the Current State, applicable active Constraints, the current Task, and direct dependencies. Search more broadly only when needed. Governance defines coordination rules. Project Canon records project-specific durable authority and current position. Work records bounded execution and provenance; it cannot grant normative authority. Humans ratify normative choices. An agent may implement delegated work and propose changes but must stop when authority is unclear.

## Versions and upgrades

Governance semantics target **1.0.0**. This distribution and its checker are **0.1.0 development**. Each project owns its copied snapshot and adopts upgrades explicitly. Installed snapshots are recognized against the compatibility profile for their adopted Governance version, independent of the latest upstream template shape. Core/schema/checker are generally upstream-owned, Canon and Work project-owned, while `AGENTS.md` and manifest are mixed. Compare the original snapshot, local copy, and target release before applying an upgrade. See [UPGRADE](adoption/UPGRADE.md).

## Scope and limits

Empty Canon collections are valid. Do not create dummy Decisions, Constraints, Open Questions, Tasks, reports, or evidence. The checker verifies shape, IDs, target types, and cycles; human review must reconcile meaning, historical approval, actual runtime state, and verification quality. Brownfield semantic migration cannot be inferred by the installer. The stable distribution gate remains open until all release checks in [RELEASE](release/RELEASE.md) pass.
