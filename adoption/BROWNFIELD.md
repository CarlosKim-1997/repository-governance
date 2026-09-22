# Brownfield adoption

1. Record branch, HEAD, working-tree status, linked worktrees, and current verification baseline. Survey existing instructions, ADRs, specs, issues, and reports read-only.
2. Reconstruct authority sources. Classify each as `CANON_CANDIDATE`, `SUPPORTING_EVIDENCE`, `WORKING_CONTEXT`, or `OBSOLETE_OR_NOISE`; mark historical approval `KNOWN`, `PARTIALLY_RECOVERABLE`, or `UNKNOWN`. Do not infer approval from existence or favorable prose.
3. Run `node tooling/init/init.mjs init --brownfield --target PATH` and review its per-path plan. Existing `AGENTS.md` requires a deliberate merge. Apply with `--apply` only after resolving collisions. This yields **SKELETON INSTALLED — ADOPTION NOT COMPLETE**.
4. Reconstruct justified Principles, ratified Decisions, Hard Constraints, material OQs, and current significant Tasks. Do not mechanically convert every TODO, ADR, issue, or milestone. Write Current State late, after reconciling Canon with observable reality.
5. Preserve legacy history. Where current authority moved, add a notice pointing to the new authoritative home; do not delete old material automatically. Run the structural checker and project-specific verification, then perform [the final audit](FINAL-AUDIT.md).
6. Record the adoption basis, unresolved authority, verification, and remaining work in `work/reports/governance-adoption-v1.md`. The report is provenance, not authority. Commit and push require separate authorization.

The [SPEC](../core/SPEC.md) governs unresolved interpretation.
