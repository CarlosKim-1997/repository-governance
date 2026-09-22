# Upgrade protocol

An installed project owns its snapshot. Upgrade explicitly: plan, review, apply, verify. Classify the proposed change as `TOOLING_ONLY`, `MECHANICAL`, or `SEMANTIC` before action. Compare A (original upstream snapshot), B (current project copy), and C (target upstream) and label each file `UNCHANGED_FROM_UPSTREAM`, `LOCAL_ONLY_CHANGE`, `UPSTREAM_ONLY_CHANGE`, or `BOTH_CHANGED`.

Ownership is `UPSTREAM_OWNED` for Core/schema/checker, `PROJECT_OWNED` for Canon and Work, `MIXED` for AGENTS and manifest, and `GENERATED` for derived files. Local Core changes require explicit reconciliation. Never automatically overwrite Project Canon. Mixed versions must be resolved visibly. Update `manifest.governance_version` last, after semantic migration and verification; it is an adoption claim. Significant upgrades warrant a Work report. No automatic upgrade CLI is promised in this prerelease.
