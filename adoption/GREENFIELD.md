# Greenfield adoption

1. Build the distribution and run `node tooling/init/init.mjs init --greenfield --target PATH` to inspect every proposed path. The plan does not write.
2. Resolve any `EXISTS_DIFFERENT` or `MERGE_REQUIRED` entry deliberately. Run the same command with `--apply`; apply repeats preflight and runs the installed checker.
3. The initial State is `NOT_READY`. Empty Decision, Constraint, OQ, and Task collections are valid. Zero to five concise Principles is normal; do not invent starter authority.
4. Record an explicit human-ratified Decision when a durable choice must survive implementation rewrites. Keep proposed choices outside active authority until approved; mechanically canonicalize approved meaning only when authorized.
5. Promote a Constraint when a reusable hard execution boundary is ratified. Promote an OQ for material unresolved future-relevant uncertainty, and a Task when risk, coordination, dependency, verification, or handoff pressure warrants one. Update Current State when the project's actual position materially changes.
6. Run `node tooling/governance/check.mjs` after structural edits. Separately verify project reality and semantic consistency.

The [SPEC](../core/SPEC.md) is authoritative if this guide differs.
