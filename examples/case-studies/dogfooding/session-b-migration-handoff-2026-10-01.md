# Session B migration handoff — 2026-10-01

## Status

This is a non-normative migration/dogfooding handoff packet.

Session A is complete. Session B is authorized to begin.

Upstream target:

- repository: `CarlosKim-1997/repository-governance`
- target main: `e963a8df02f715912bd420d2539f47622ef3e1ec`
- Governance Version: `1.0.0`
- Distribution Version: `0.2.0`
- Checker Version: `0.1.0`
- merge verification: hosted `Verify Governance` Run #20 SUCCESS

This packet authorizes no adopter merge by itself. Adopter work should occur on isolated branches/worktrees and return a reviewable result for human integration.

---

# 1. Semantic delta from Distribution 0.1.0

Governance Version remains `1.0.0`. No schema, ID namespace, lifecycle state, relation type, manifest field, or permission class is added.

The compatible Core clarification makes already-implied v1 boundaries explicit:

1. terminal Task Authority preserves the permissions held during that execution episode;
2. later integration, release, deployment, or verification outcome does not overwrite historical Task Authority;
3. ordinary merge/integration/release/verification events do not by themselves require Canon mutation;
4. Current State normally excludes ordinary branch/PR status, merge chronology, completed Task registries, long CI/deployment histories, historical test counts, and superseded operational observations;
5. State Verification Basis is representative rather than an exhaustive evidence ledger;
6. repository records need not continuously mirror the latest live state of an external system.

Distribution 0.2.0 additionally installs non-normative `governance/OPERATIONS.md` and optional read-only helpers:

- `tooling/governance/preflight.mjs`
- `tooling/governance/context.mjs`

The structural checker remains version `0.1.0`.

---

# 2. Compatibility assumptions

The Session A replay suite R1–R10 passed without new Governance semantics.

Therefore the target assumes:

- existing valid Governance 1.0 Canon records remain semantically valid;
- adopter `manifest.governance_version` stays `1.0.0`;
- no Canon migration is required merely because Distribution changes from 0.1.0 to 0.2.0;
- historical coherent 1.0 snapshots without the new optional 0.2 files remain recognizable;
- ordinary installer apply does not auto-upgrade an installed snapshot;
- Core/schema/checker are normally upstream-owned;
- Canon and Work are project-owned;
- `AGENTS.md` and manifest are mixed ownership and must not be blindly overwritten;
- project-specific entrypoints/scripts may require compatibility adaptation without changing Governance semantics.

If an adopter reveals a real binding semantic conflict, stop and report it instead of forcing convergence.

---

# 3. Migration rules

For each adopter:

1. **Read-only entry gate**
   - identify exact repository root/worktree;
   - fetch/revalidate `main` or the intended integration baseline;
   - record exact HEAD;
   - inspect branch, ahead/behind, cleanliness, and linked worktrees where available;
   - do not mutate from a stale sibling checkout.

2. **A/B/C comparison**
   - A = recoverable original upstream source for the adopter's installed Governance snapshot;
   - B = adopter's current Governance/tooling copy;
   - C = Distribution 0.2.0 target at `e963a8df...`.
   - classify each relevant file as unchanged-from-upstream, local-only, upstream-only, or both-changed.

3. **Ownership**
   - preserve Canon and Work;
   - merge mixed files deliberately;
   - do not overwrite project-specific `AGENTS.md`;
   - do not update `manifest.governance_version`;
   - update distribution metadata only after the target snapshot is coherently applied and verified.

4. **No automatic Canon cleanup**
   - do not compress State or rewrite Decisions/Tasks merely because 0.2 guidance now exists;
   - if a real current semantic inconsistency is discovered, report it separately;
   - do not create post-merge bookkeeping solely to record integration.

5. **External safety**
   - no production mutation, release, destructive operation, secret handling, cost-bearing external action, or deployment is authorized by this migration;
   - hosted CI may be used for repository verification if already configured and ordinary push/PR CI is safe.

6. **Integration**
   - branch/worktree mutation and a reviewable PR are allowed for the migration episode;
   - human integration remains a separate action;
   - do not merge the adopter migration without explicit human instruction.

7. **Verification**
   - run the adopter's existing Governance checker before and after;
   - run the target checker where installed;
   - verify target Core/schema/helper bytes and version metadata as appropriate;
   - run existing repository validation needed to prove the migration did not break ordinary workflows;
   - if hosted CI exists, report its exact head/result but do not create a follow-up commit merely to record that CI result.

---

# 4. New invariants for Session B execution

These are Session B operating constraints, not new Governance protocol Invariants.

- **B-INV-1 — no silent semantic migration:** same `governance_version` does not permit silently changing project authority.
- **B-INV-2 — Canon preservation:** Project Canon and Work are never bulk-replaced from upstream.
- **B-INV-3 — historical Task Authority preservation:** migration must not rewrite terminal Task Authority into outcome text.
- **B-INV-4 — no CI bookkeeping recursion:** latest hosted result remains external live evidence.
- **B-INV-5 — workspace identity first:** no mutation until repository/worktree/baseline identity is explicit.
- **B-INV-6 — optional helpers remain advisory:** `preflight` and `context` never become permission or completeness oracles.
- **B-INV-7 — no adopter merge from the migration agent:** human integration is separately authorized.

---

# 5. Experimental-only scope

The following remain experiments or deferred candidates and must not become required adopter semantics during Session B:

- optional Task Outcome/Closure heading;
- field-level Decision amendment;
- first-class Operational Authorization;
- formal applicability selectors;
- validity-bearing ratification metadata;
- first-class Evidence object / `E-*`;
- semantic AI checker;
- automatic State generation/repair;
- central lock manager.

The `context.mjs` helper is advisory discovery only. The `preflight.mjs` helper is read-only local Git observation only.

---

# 6. Adopter classification

## 6.1 Hermeneus — standard same-Governance distribution upgrade

Current adopter baseline:

- repository: `CarlosKim-1997/Hermeneus`
- `main`: `e41b3da09f1ae47d697ee35a398d95f01759352d`
- manifest Governance Version: `1.0.0`
- installed version metadata:
  - Governance `1.0.0`
  - Distribution `0.1.0`
  - Checker `0.1.0`
- `governance/OPERATIONS.md`: absent
- normalized post-M11 Governance records already integrated.

Prior dogfooding verification established that the installed reusable 0.1 Core/schema/checker snapshot matched the upstream 0.1 baseline for the examined artifacts. Therefore Hermeneus is the clean control case.

### Hermeneus migration class

`STANDARD_0_1_TO_0_2`

Recommended A/B/C:

- A: upstream Distribution 0.1 baseline `fdcdea87ce7fb8ff60821356706b1148ea00d056`
- B: Hermeneus `main @ e41b3da...`
- C: upstream Distribution 0.2 target `e963a8df...`

Expected shape:

- upstream-compatible Core clarification;
- add `governance/OPERATIONS.md`;
- add optional `preflight.mjs` and `context.mjs`;
- update installed distribution metadata to `0.2.0`;
- preserve manifest `governance_version: 1.0.0`;
- preserve Canon/Work;
- merge project-specific/mixed files only if the target actually requires it.

No post-migration State reconciliation is expected solely because the migration merges.

---

## 6.2 ReDiscovery — local/precursor v1 convergence migration

Current adopter baseline:

- repository: `CarlosKim-1997/ReDiscovery`
- `main`: `74128282f1e36299181f1b310df97675f747d5ab`
- manifest Governance Version: `1.0.0`
- `governance/OPERATIONS.md`: absent
- standard `tooling/governance/version.json`: absent
- project entrypoint: `pnpm governance:check` → `node tooling/governance-check.mjs`
- project runtime requires Node `>=24.19.0 <25`.

The current ReDiscovery reusable Governance files are **not exact blob matches** for the standalone upstream 0.1 or 0.2 template across the inspected AGENTS, README, SPEC, schemas, and checker. This repository must therefore not be treated as a mechanical 0.1 snapshot upgrade.

### ReDiscovery migration class

`LOCAL_V1_FORK_TO_0_2_CONVERGENCE`

Historical A is only partially recoverable as a standalone-upstream reference. Do not claim that `fdcdea87...` is the exact source of ReDiscovery's current v1 fork.

Recommended comparison:

- A: best recoverable historical/local Governance provenance from Git history, explicitly marked `PARTIALLY_RECOVERABLE` if exact source cannot be established;
- B: ReDiscovery `main @ 74128282...`;
- C: upstream Distribution 0.2 target `e963a8df...`.

Required analysis before write:

1. classify each local Governance difference as:
   - reusable Core divergence to converge upstream;
   - intentional project-specific routing/guidance to preserve outside reusable Core;
   - obsolete precursor behavior;
   - uncertain — stop/report.
2. preserve project-specific AGENTS instructions, including repository architecture/runtime instructions.
3. decide the smallest compatibility path for the existing `pnpm governance:check` entrypoint:
   - retain a compatibility wrapper, or
   - deliberately repoint the package script to the standard installed checker.
   Do not silently remove the existing command contract.
4. introduce standard distribution metadata only after the resulting snapshot is coherent.
5. do not treat Current State's existing size as automatic migration scope. Run a semantic-health review and report findings; Canon normalization remains separate unless required for correctness and explicitly authorized.

ReDiscovery is the stress case for workspace preflight, external evidence ownership, and State-transience guidance.

---

# 7. Open migration questions

These are Session B questions, not Project Canon Open Questions unless an adopter independently ratifies them.

### B-OQ-1 — ReDiscovery precursor provenance

Can Git history identify an exact source/baseline for the current local Governance fork, or must historical upstream authority remain `PARTIALLY_RECOVERABLE`?

### B-OQ-2 — ReDiscovery checker convergence

Should `pnpm governance:check` preserve its current path via a wrapper or be repointed directly to `tooling/governance/check.mjs`? Choose the smallest change that preserves the public repository command contract and avoids two competing structural checkers.

### B-OQ-3 — Project-specific generic Governance text

Which ReDiscovery local SPEC/schema/README differences are genuinely project-specific requirements versus precursor generic Governance text that should converge to upstream 0.2?

### B-OQ-4 — State-health findings

After installing 0.2 guidance, do either adopter repositories still contain a **current correctness conflict** requiring separate normalization, or only historical/style debt? Do not turn style debt into migration scope.

---

# 8. Required return packet from each adopter agent

Return exactly enough evidence for central review:

1. repository and exact starting baseline;
2. workspace/preflight facts;
3. migration class;
4. A/B/C comparison summary;
5. files changed and ownership classification;
6. any Canon/Work files changed — expected normally none — with explicit reason;
7. checker/tooling entrypoint before and after;
8. distribution/governance/checker version before and after;
9. local verification commands/results;
10. hosted CI exact head/result if applicable;
11. unresolved migration questions or deviations;
12. branch/PR;
13. explicit statement that no production/external mutation occurred;
14. explicit statement that no merge was performed unless separately human-authorized.

Central Session B will compare Hermeneus and ReDiscovery results before declaring the migration/dogfooding phase complete.
