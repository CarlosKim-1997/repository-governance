# Upgrade protocol

An installed project owns its snapshot. Upgrade explicitly: plan, review, apply, verify. Classify the proposed change as `TOOLING_ONLY`, `MECHANICAL`, or `SEMANTIC` before action. Compare A (original upstream snapshot), B (current project copy), and C (target upstream) and label each file `UNCHANGED_FROM_UPSTREAM`, `LOCAL_ONLY_CHANGE`, `UPSTREAM_ONLY_CHANGE`, or `BOTH_CHANGED`.

Ownership is `UPSTREAM_OWNED` for Core/schema/checker, `PROJECT_OWNED` for Canon and Work, `MIXED` for AGENTS and manifest, and `GENERATED` for derived files. Local Core changes require explicit reconciliation. Never automatically overwrite Project Canon. Mixed versions must be resolved visibly. Update `manifest.governance_version` last, after semantic migration and verification; it is an adoption claim. Significant upgrades warrant a Work report. No automatic upgrade CLI is promised in this prerelease.


## Same-Governance distribution upgrades

A newer distribution may keep the same `governance_version` while adding compatible clarification, guidance, or optional tooling.

For that case:

- do not change `manifest.governance_version` merely because the distribution version changed;
- preserve the published recognition contract for the adopted Governance version;
- treat newly added non-landmark guidance/helper files as explicit upstream additions, not proof that an older coherent snapshot is partial;
- review Core clarification as upstream-owned text, but verify that it does not change binding authority, required structure, lifecycle, relations, or adopter validity;
- add optional upstream files deliberately; ordinary installer `init --apply` does not auto-upgrade an installed snapshot.

If the target changes what is binding, authorized, structurally required, or migration-sensitive, reclassify the upgrade as `SEMANTIC` and use a new explicit Governance version before adoption.

The Distribution 0.3.0 optional verification addition is `TOOLING_ONLY`: review `governance/VERIFICATION.md`, `tooling/governance/verify.mjs`, its sample, and the mixed AGENTS/OPERATIONS entry links against A/B/C. Preserve the existing operating guidance and local instructions. These are not recognition landmarks and ordinary init does not add them to existing snapshots. Governance 1.0.0 and Checker 0.1.0 remain unchanged; the target Distribution is 0.3.0. Updated result completeness checks require fresh helper evidence; do not convert older incomplete records into accepted observations.
