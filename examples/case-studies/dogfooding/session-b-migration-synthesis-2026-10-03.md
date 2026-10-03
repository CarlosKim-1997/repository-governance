# Session B migration synthesis — 2026-10-03

## Status

This is a non-normative dogfooding synthesis.

Session B applied Repository Governance Distribution 0.2.0 to two materially different Governance 1.0 adopter repositories:

1. Hermeneus — a clean Distribution 0.1.0 control case.
2. ReDiscovery — a local/precursor Governance v1 fork used as a convergence stress case.

Both adopter migrations were human-integrated successfully.

No finding in Session B requires changing Governance Version 1.0.0.

Final upstream target used by both migrations:

- repository: `CarlosKim-1997/repository-governance`
- target main: `e963a8df02f715912bd420d2539f47622ef3e1ec`
- Governance Version: `1.0.0`
- Distribution Version: `0.2.0`
- Checker Version: `0.1.0`

---

# 1. Evidence classification

This synthesis distinguishes:

- **Observed evidence** — recoverable repository, PR, commit, or hosted CI facts.
- **Agent-reported verification** — local execution results supplied by the migration agent but not independently recoverable from GitHub.
- **Analysis** — interpretation of the observed migration behavior.
- **Design consequence** — what Session B supports or does not support for future Governance work.

---

# 2. Hermeneus — control case

Migration class:

`STANDARD_0_1_TO_0_2`

Starting baseline:

`e41b3da09f1ae47d697ee35a398d95f01759352d`

Migration head:

`74973af6f4fee8a7c4d3c132ab273cfe64e2c30e`

Integrated merge:

`27d4d1554f38030162e945f1be6c1ad08d61b076`

PR:

Hermeneus PR #14.

## Observed evidence

Before integration:

- `main` matched the expected starting baseline.
- PR #14 contained exactly eight changed files.
- no `canon/**` or `work/**` file changed;
- `governance/manifest.yaml` remained byte-identical to the baseline;
- `AGENTS.md` remained byte-identical to the baseline;
- all eight applied Distribution 0.2 files were exact blob matches to the upstream target;
- the existing structural checker was already an exact upstream-target blob and was not unnecessarily rewritten.

Applied upstream-owned delta:

- `governance/SPEC.md`
- `governance/README.md`
- `governance/OPERATIONS.md`
- `governance/schemas/state-v1.md`
- `governance/schemas/task-v1.md`
- `tooling/governance/version.json`
- `tooling/governance/preflight.mjs`
- `tooling/governance/context.mjs`

After integration:

- PR #14 is merged and closed;
- `main` is exactly merge commit `27d4d1554f38030162e945f1be6c1ad08d61b076`;
- installed metadata reports Governance `1.0.0`, Distribution `0.2.0`, Checker `0.1.0`;
- project-specific manifest areas remain `global` and `handoff`;
- Hermeneus has no hosted GitHub Actions workflow, so there is no independent hosted post-merge CI record.

## Agent-reported verification

The migration agent reported:

- structural Governance checker PASS before and after;
- project Governance command PASS;
- typecheck PASS;
- optional preflight/context helper smoke PASS;
- clean migration workspace.

These local results are supporting evidence but are not equivalent to hosted verification.

## Analysis

Hermeneus behaved as the expected control case: a coherent Distribution 0.1.0 snapshot could receive the 0.2 compatible upstream delta without Project Canon migration, command-contract redesign, or post-merge reconciliation.

---

# 3. ReDiscovery — convergence stress case

Migration class:

`LOCAL_V1_FORK_TO_0_2_CONVERGENCE`

Starting baseline:

`74128282f1e36299181f1b310df97675f747d5ab`

Historical local adoption:

`2119c6341d72c710c8c14d216c8bb02765d95a7b`

Initial migration head:

`95161bfe0586f30402e71728acc1ab086553806b`

Refreshed migration head after independent test repair:

`dfa9fc4f85fccc91a1043928fcbc303a5819ff17`

Integrated migration merge:

`9558cd4f4f7047a90333dde9d5af7f0634f3723a`

Migration PR:

ReDiscovery PR #1.

Independent maintenance repair:

- repair head `e0cbc6e6525f91fe386c051a3e1b1eb98fe13440`
- repair merge `e45e0105a70d4bb460f5dca7ddd037f32ce67b26`
- repair PR #2

## 3.1 Historical provenance result

Observed Git history showed that the local Governance adoption commit `2119c634...` introduced the reusable Governance README, SPEC, five schemas, and local checker, and those reusable artifacts remained unchanged through the Session B starting baseline.

The exact pre-publication standalone-upstream source could not be established.

Final classification:

`PARTIALLY_RECOVERABLE`

with high confidence in local provenance and no claim of an exact historical standalone-upstream precursor.

## 3.2 Convergence result

Observed migration behavior:

- the local independent checker was replaced by a thin compatibility wrapper;
- the existing public command contract `pnpm governance:check` was preserved;
- structural checking converged to one standard installed checker;
- the now-unused direct `yaml` dependency was removed;
- project-specific `AGENTS.md`, manifest areas, runtime/architecture instructions, and Current State path were preserved;
- all twelve upstream-owned installed Governance artifacts were exact target blob matches.

The target installed artifacts included:

- Governance README;
- Governance SPEC;
- five schemas;
- OPERATIONS guidance;
- structural checker;
- preflight helper;
- context helper;
- version metadata.

## 3.3 Project-owned compatibility normalization

Unlike Hermeneus, ReDiscovery contained local structured records that were not valid under the final standard Governance 1.0 contracts.

The migration therefore made narrow structural compatibility changes while preserving record bodies, lifecycle meaning, authority, and outcome text.

Observed normalizations:

- Open Question `resolved_by`: list form → scalar Decision ID;
- mixed `global` plus scoped areas → scoped areas;
- Decision → Constraint `implements` references → `related_to`.

The last change preserved the same referenced Constraint while moving the relationship to a relation valid for that source/target pair. The affected Decisions described the referenced Constraint as an execution boundary rather than an implemented Decision.

The migration did **not** perform general Current State compression or style normalization.

## 3.4 Unexpected hosted verification failure

The initial migration head triggered hosted CI failure in two pre-existing PostgreSQL account-deletion tests.

Observed facts:

- migration push Run #109 failed;
- migration PR Run #110 failed in the same two tests;
- Governance check, lint, and typecheck had already passed;
- the failing test and fixture blobs were unchanged by the migration;
- the tests used fixed reference time `2026-10-01T00:00:00.000Z`;
- the fixture generated `evaluation_started_at` from runtime `new Date()`;
- after the calendar advanced beyond the fixed scenario date, lease timestamps could become earlier than `evaluation_started_at`, violating the existing database check;
- the exact pre-migration baseline had passed hosted Run #108 on 2026-09-28, when the fixed October 1 lease values were still in the future.

Analysis:

This was calendar-dependent verification rot, not evidence that the Governance migration changed account-deletion behavior.

## 3.5 Causal isolation of the repair

The test repair was deliberately separated from the Governance migration.

Repair changed only:

- `tests/support/account-deletion-fixture.ts`
- `tests/integration/m8-d2-postgres-deletion.test.ts`

It introduced an explicit scenario start time so the structural ordering became:

`started_at < expired lease < deletion/reference instant < live lease`

Observed hosted verification:

- repair push Run #111 — SUCCESS;
- repair PR Run #112 — SUCCESS;
- repaired main Run #113 — SUCCESS.

Only after the repair merged was the migration branch refreshed onto the repaired main.

The refreshed migration PR remained:

- one migration commit;
- 25 migration files;
- one commit ahead / zero behind repaired main;
- free of the two test-repair files.

Observed hosted verification on the refreshed migration head:

- push Run #114 — SUCCESS;
- PR Run #115 — SUCCESS.

After human integration:

- migration PR #1 is merged and closed;
- `main` is exactly `9558cd4f4f7047a90333dde9d5af7f0634f3723a`;
- merge-triggered Run #116 — SUCCESS, including E2E;
- installed metadata reports Governance `1.0.0`, Distribution `0.2.0`, Checker `0.1.0`;
- ReDiscovery-specific manifest area vocabulary remains preserved.

## Analysis

ReDiscovery demonstrates that a project can converge from a locally evolved/precursor Governance v1 shape to the standard Distribution 0.2 shape without requiring a Governance 2.0 migration, provided the migration distinguishes reusable protocol text from project-owned authority and preserves explicit project command contracts.

It also demonstrates why local verification and hosted live verification are different evidence classes. The migration agent's local suite did not expose the calendar-dependent PostgreSQL failure that hosted CI later surfaced.

---

# 4. Session B question disposition

The Session B handoff carried four migration questions.

## B-OQ-1 — ReDiscovery precursor provenance

**Disposition: resolved for migration purposes.**

Exact standalone-upstream precursor remains unknown, but local adoption history was recoverable enough to establish a stable A/B/C comparison without fabricating upstream provenance.

Use `PARTIALLY_RECOVERABLE`; no new Governance semantic is required.

## B-OQ-2 — ReDiscovery checker convergence

**Disposition: resolved.**

Preserve `pnpm governance:check` through a thin compatibility wrapper while converging actual validation to the standard installed checker.

This avoided both command-contract breakage and two competing structural checkers.

## B-OQ-3 — project-specific generic Governance text

**Disposition: resolved for the observed repository.**

Reusable generic Governance text and schemas converged upstream. Project-specific AGENTS instructions, manifest routing/areas, and application architecture instructions remained project-owned.

No new formal ownership primitive was required.

## B-OQ-4 — State-health findings

**Disposition: no migration-blocking correctness conflict.**

ReDiscovery still has normalization debt:

- Current State retains more historical CI/run detail than ideal under 0.2 guidance;
- legacy milestone/current-position surfaces still overlap.

These are follow-up semantic-health/normalization concerns, not required Distribution 0.2 migration changes.

Hermeneus exposed no equivalent current correctness conflict.

---

# 5. Session B invariant outcome

## B-INV-1 — no silent semantic migration

**Held.**

Both adopters remain Governance Version `1.0.0`.

## B-INV-2 — Canon preservation

**Held with one narrow compatibility exception in ReDiscovery.**

Hermeneus Canon/Work was untouched.

ReDiscovery changed only structured frontmatter necessary to satisfy the standard v1 contracts; record bodies, lifecycle meaning, authority, and outcome content were preserved.

## B-INV-3 — historical Task Authority preservation

**Held.**

No terminal Task Authority was rewritten into merge or outcome text.

## B-INV-4 — no CI bookkeeping recursion

**Held.**

Hosted CI remained external live evidence. No follow-up commit was created merely to record the latest run number.

## B-INV-5 — workspace identity first

**Held.**

Both migrations established exact baselines before mutation. ReDiscovery later refreshed the migration only after the independent repair was integrated.

## B-INV-6 — optional helpers remain advisory

**Held.**

No helper output was treated as permission, ownership, or proof of complete applicability.

## B-INV-7 — no adopter merge from migration agent authority

**Held.**

Migration agents stopped before integration. Human authorization occurred separately.

---

# 6. Cross-project conclusions

## Observed support

Session B supports the following claims:

1. Distribution 0.2.0 can upgrade a coherent Distribution 0.1.0 adopter without Project Canon migration.
2. Distribution 0.2.0 can also serve as a convergence target for a precursor/local Governance v1 fork when ownership and provenance are handled explicitly.
3. Keeping Governance Version at `1.0.0` was compatible with both observed migrations.
4. No new first-class object, ID namespace, lifecycle, permission class, or manifest selector was required by either migration.
5. Project command contracts can be preserved through compatibility routing without keeping duplicate checker semantics.
6. Current State compression guidance should remain guidance/audit work rather than automatic migration behavior.
7. External hosted verification can expose real repository-health failures that local migration verification misses.
8. Separating unrelated repairs from migration commits materially improves causal attribution.

## Not established by Session B

Session B does **not** establish that:

- every historical Governance 1.0 fork can automatically converge to 0.2;
- local provenance can always be reconstructed;
- all project-specific Core forks are safely replaceable;
- Distribution 0.2 is a stable published release;
- semantic health can be proven by the structural checker;
- the optional helpers discover all applicable authority;
- further adopter repositories can skip A/B/C comparison.

---

# 7. Design consequence

Session B does not produce evidence for Governance 2.0.

The Session A design thesis survives adopter migration:

> reduce durable-state pressure and clarify information lifetime, ownership, and surface boundaries before adding new first-class objects.

The existing Governance 1.0 information model plus Distribution 0.2 guidance/tooling was sufficient for both the control and stress migrations.

The strongest new operational lesson is not a new object proposal. It is evidence discipline:

> a migration result, a local test result, a hosted CI observation, and a live external system state are related evidence, but they are not interchangeable ownership surfaces.

---

# 8. Session B closure

Session B migration/dogfooding objectives are satisfied for the two planned adopters:

- Hermeneus control case — PASS / integrated;
- ReDiscovery stress case — PASS / integrated.

No further adopter mutation is required to close this Session B experiment.

Follow-up work, if desired, should be separate from Session B:

- ReDiscovery semantic-health normalization debt;
- additional adopter sampling;
- release-readiness work for Distribution 0.2;
- later evidence-driven vNext research.

This synthesis does not itself authorize any of those follow-up activities.
