# vNext candidate classification — 2026-09-30

## Status

This document is a non-normative research artifact.

It starts from the evidence foundation merged through PR #1 at:

`ce5bc597796e3a0c943ca9b3b1f8d8c264dd3497`

It does not modify Repository Governance semantics, ratify a vNext design, change schemas, or authorize adopter migration.

Its purpose is to decide which observed failures are already covered by v1 but need stronger clarification, which need guidance/tooling, which deserve bounded experiments, and which would cross the line into a future semantic protocol version.

## Classification vocabulary

### CLASS-A — v1-compatible clarification

The candidate makes an implication already present in Governance 1.0.0 more explicit.

A CLASS-A change must not:

- create a new authority source;
- make a previously valid v1 record invalid solely because of new semantics;
- add a required schema field, lifecycle state, ID class, or formal relation;
- change precedence, ratification, or permission resolution;
- require adopter Canon migration.

A candidate may still be written first as guidance and replayed before any Core wording changes.

### CLASS-B — guidance / deterministic tooling

The candidate changes operating practice or adds a non-authoritative helper without changing Governance semantics.

Examples:

- reusable audit checklist;
- read-only workspace preflight;
- context discovery helper;
- reporting guidance;
- authoring guidance.

Governance Version can remain `1.0.0` if the shipped change is genuinely non-semantic. Distribution/tooling versions may change independently.

### CLASS-C — bounded experiment

The candidate is plausible but its effectiveness or information model is not yet demonstrated.

Experiments must remain non-canonical and must not silently become required practice.

Promotion requires replay evidence.

### CLASS-D — future semantic-version candidate

The candidate would change the protocol's information model, authority resolution, lifecycle, or required structure.

Examples include:

- new first-class types;
- new ID prefixes;
- formal field-level amendment semantics;
- formal applicability semantics that affect which authority is binding;
- required ratification provenance that changes validity;
- new authorization object classes.

Under v1 Part II.N, these require an explicit future protocol version and migration if adopted.

### CLASS-E — deprioritized / rejected for current vNext

The candidate is not justified by current dogfooding evidence, adds more authoritative surface than the incidents support, or conflicts with v1 design goals.

It can be reconsidered only with new evidence.

---

# 1. Strongest candidates

## C1 — Terminal Task Authority preservation

**Classification:** CLASS-A — v1-compatible clarification

### Existing v1 basis

v1 already states:

- a Task is a bounded execution contract;
- Authority says which actions are allowed;
- a Task consumes existing authority and cannot create it;
- COMPLETE/CANCELLED end an execution episode;
- later work gets a new Task;
- integration is a distinct permission from implementation, commit, and push.

Therefore a terminal Task's Authority naturally refers to the permissions held during that closed episode.

### Dogfooding evidence

Hermeneus T-007–T-010 were later rewritten from execution authorization into merge/integration outcome. T-011 remained historically correct with `Not authorized to merge` after human integration.

### Candidate clarification

> Task Authority records the permissions held during that execution episode. After a Task is terminal, Authority must not be repurposed to record later integration, release, deployment, or other outcome facts. A later human action does not retroactively enlarge the agent's historical authority.

Post-terminal correction remains possible only to restore the actual historical authorization.

### Why this is not v2

This does not create a new permission rule. It preserves the meaning already implied by the existing Task contract and distinct permission boundaries.

### Replay

R1, R2.

---

## C2 — Outcome does not replace Authority

**Classification:** CLASS-A — v1-compatible clarification

### Existing v1 basis

Authority, verification, observable truth, and normative truth are already distinct concepts.

### Dogfooding evidence

Hermeneus stored later merge outcome in Authority. ReDiscovery stored verification/outcome history across State, Task, and legacy milestone surfaces.

### Candidate clarification

> Integration, release, deployment, or verification outcome does not replace execution authority. Outcome belongs in Verification, a report, external history, or current-position material only when needed for recovery.

### Boundary

This clarification does **not** introduce an Outcome object.

### Replay

R1, R2, R5.

---

## C3 — Integration is not a default Canon event

**Classification:** CLASS-B initially; possible CLASS-A wording after replay

### Existing v1 basis

- Canon preserves durable coordination truth.
- State is current-position compression.
- Git integration is a distinct execution action.
- Reports preserve provenance outside Canon.

### Dogfooding evidence

Hermeneus repeatedly produced merge-followed-by-reconciliation bookkeeping. ReDiscovery also developed closure bookkeeping around externally produced evidence.

### Candidate operating rule

> A branch or PR integration event does not by itself require Canon mutation. Mutate Canon only if current normative truth, current actionable position, blocker, risk, or other durable coordination truth actually changed.

### Why start as CLASS-B

The principle is strongly implied by v1, but exact "no reconciliation by default" behavior should be replayed before it is stated normatively in Core.

### Replay

R2, R3.

---

## C4 — Current State transience exclusion

**Classification:** CLASS-A for the semantic boundary; CLASS-B for authoring heuristics

### Existing v1 basis

v1 already says:

> State is current-position compression, not a history, roadmap, Task registry, or test log.

The state schema additionally says it summarizes current position, not history or evidence.

### Dogfooding evidence

Both Hermeneus and ReDiscovery accumulated milestone chronology, PR state, CI run history, test counts, historical observations, and completed work in Current State.

### Candidate clarification

State should normally exclude:

- ordinary branch names and PR status;
- merge chronology;
- completed Task registries;
- long CI run history;
- historical test-count ledgers;
- superseded operational observations;
- details already durably recoverable elsewhere.

A transient fact belongs in State only when it materially changes the next valid action, current blocker, current risk, or current project position.

### Authoring heuristic

Ask:

> If this fact vanished from Current State but remained recoverable from its natural source, would a fresh worker choose a wrong next action?

If no, it probably does not belong in Current State.

### Replay

R3, R5, R6.

---

## C5 — Representative Verification Basis

**Classification:** CLASS-B — guidance

### Existing v1 basis

State requires a `Verification Basis` heading, but State is explicitly not an evidence log.

### Dogfooding evidence

Detailed test and hosted-run ledgers accumulated in State because agents wanted future workers to see the evidence.

### Candidate guidance

State Verification Basis should preserve only enough information to support recovery of current claims:

- verified artifact identity where material;
- verification class;
- representative observation;
- pointer to Task/report/external system where detail lives.

It should not mirror complete verification history.

### Important non-goal

Do not define a maximum line count or evidence-count ERROR at this stage.

### Replay

R3, R5.

---

## C6 — Decision timelessness and normative scoping

**Classification:** CLASS-B — authoring guidance; possible CLASS-A clarification later

### Existing v1 basis

- Governance preserves durable coordination truth.
- A material change to an ACTIVE Decision creates a new Decision.
- State and Work carry current position and execution detail.

### Dogfooding evidence

Hermeneus D-005 retained transient-looking wording that authentication and ownership "remain deferred" after later Decisions introduced those capabilities.

### Candidate guidance

Decision authors should distinguish:

**Durable normative boundary**
- "Provider choice must remain replaceable."
- "This route must not become public without a later Decision."

from:

**Transient implementation state**
- "Authentication is not implemented yet."
- "Deferred for this milestone."
- "Currently unavailable."

Temporal words such as `currently`, `not yet`, `for now`, `deferred`, and `future milestone` should trigger review, not automatic rejection.

### Replay

R4.

---

# 2. Operating-health candidates

## C7 — Reusable Semantic Governance Health Audit

**Classification:** CLASS-B — guidance/procedure

### Existing v1 basis

`adoption/FINAL-AUDIT.md` already checks:

- duplicated authority;
- Canon/reality mismatch;
- stale Current State;
- Task authority creep;
- inflated OQs/Tasks;
- unsupported verification;
- conflicting legacy authority.

The missing element is reuse during normal operation rather than only adoption/final audit.

### Candidate

Promote the audit pattern into a reusable read-only operating procedure.

Suggested smell categories:

- State/reality mismatch;
- State history accumulation;
- terminal Task Authority creep;
- duplicated current truth;
- stale temporal statements in ACTIVE Decisions;
- missing or ambiguous supersession;
- Work detail leaking into Canon;
- deprecated status documents still being updated;
- unsupported "latest" external-state claims;
- workspace baseline divergence.

### Suggested triggers

Not every commit.

Consider audit after:

- major milestone boundaries;
- several significant Task closures;
- public/production rollout;
- Governance upgrade preparation;
- repeated reconciliation;
- discovered Canon/reality mismatch.

### Boundary

The audit may recommend action but has no authority to mutate Canon or decide normative meaning.

### Replay

R1–R6.

---

## C8 — Workspace entry and retirement discipline

**Classification:** CLASS-B — guidance/tooling

### Existing v1 basis

v1 already requires branch/worktree isolation or serialized writes and revalidation at integration.

### Dogfooding evidence

ReDiscovery incident-time local evidence reported a stale/divergent desktop `main` after isolated work had continued elsewhere. The remote repository independently supports the presence of parallel reconciliation history, while the local-only sibling commit itself is not remotely addressable.

### Candidate preflight

Before mutation, a deterministic helper may report:

- repository root;
- current worktree;
- branch/detached state;
- HEAD;
- expected integration baseline;
- ahead/behind where Git remote data is available;
- tracked cleanliness;
- linked worktrees;
- whether another workspace appears to own the same mutation episode.

### Candidate retirement guidance

At Task/integration closure:

- identify the surviving integration/reference baseline;
- retire or clearly label finished mutation workspaces;
- preserve forensic divergence only when it has recovery value;
- do not silently continue later work from a stale sibling checkout.

### Boundary

Workspace metadata is operational coordination information, not Project Canon by default.

No central lock service is proposed.

### Replay

R6.

---

## C9 — External evidence ownership

**Classification:** CLASS-B — guidance

### Existing v1 basis

v1 distinguishes observable truth from Canonical State and allows external evidence without an Evidence object.

### Dogfooding evidence

ReDiscovery demonstrated the evidence-after-commit recursion: recording exact latest hosted CI into the repository creates another commit that itself has a newer CI result.

### Candidate guidance

For live external state:

- external systems remain the primary observation source for their own current operational state;
- repository records may preserve exact verified artifact identity, a bounded observation, evidence class, or recovery pointer;
- do not require repository commits whose sole purpose is mirroring the latest CI/deployment health result.

### Boundary

This does not outsource normative authority to CI, Vercel, Supabase, or any external system.

### Replay

R5.

---

## C10 — Minimality as explicit exclusion

**Classification:** CLASS-B — guidance

### Existing v1 basis

v1 says:

- preserve only durable coordination truth;
- create Tasks only when justified;
- keep repository truth smaller than the work;
- do not create dummy records.

### Dogfooding evidence

Both adopter repositories accumulated durable records beyond the intended compact model.

The precise causal role of safety pressure remains analysis, but the inflation itself is observed.

### Candidate guidance

The following normally should **not** become durable Canon merely because they are useful during execution:

- short-lived operational observations;
- live CI health already available in CI;
- ordinary merge events;
- history already preserved in Git/PR/report;
- transient observations with no recovery value after Task closure;
- execution diaries;
- duplicate current-status mirrors.

### Replay

R3, R5.

---

# 3. Bounded experiments

## E1 — Optional Task Outcome / Closure heading

**Classification:** CLASS-C

### Hypothesis

A natural prose home for final outcome may reduce pressure to misuse Authority or overload Verification.

### Why experiment first

v1 already permits Work prose and reports. The incident does not prove a new Task schema field is needed.

### Experiment

Allow an optional prose heading in selected replay Tasks:

`## Outcome`

Possible contents:

- implementation completed;
- later human integration occurred;
- release was not performed;
- final artifact pointer.

Do not make it required, add frontmatter, or introduce lifecycle semantics.

### Success condition

Outcome facts stop leaking into Authority without causing Task bloat.

### Failure condition

The heading becomes another append-only history ledger or duplicates Git/PR history without recovery value.

### Replay

R1, R2, R3.

---

## E2 — Ratification provenance

**Classification:** CLASS-C

### Hypothesis

Cold-start recovery may sometimes need to know the human ratification event behind a Decision.

### Experiment forms

Prefer smallest first:

- prose note;
- report-side provenance;
- non-authoritative sidecar.

Possible observations:

- ratified by;
- observed at;
- source event/link;
- canonicalized by.

### Non-goal

Do not treat metadata as cryptographic proof.

### Promotion condition

Repeated cold-start replay shows actual ambiguity over whether an ACTIVE Decision was human-ratified, and provenance materially resolves it.

### Future boundary

If provenance becomes required for Decision validity or authority resolution, it becomes CLASS-D.

---

## E3 — Applicability/context discovery helper

**Classification:** CLASS-C tooling experiment

### Hypothesis

A fresh worker may miss governing Decisions/Constraints even when they exist.

### Experiment

A deterministic read-only command such as:

`governance context T-123`

may gather:

- global material;
- overlapping areas;
- direct dependencies;
- blockers;
- referenced Decisions/Constraints;
- current State pointer.

### Safety requirement

Output must state:

> discovery aid, not proof that all applicable authority has been found.

### Promotion condition

Demonstrated reduction in missed-authority failures without false confidence.

### Future boundary

Formal selectors that determine binding applicability are CLASS-D.

---

## E4 — Specification-layer adapter

**Classification:** CLASS-C

### Hypothesis

Detailed behavior specifications and change proposals are useful but should remain outside Governance authority objects.

### Experiment

Replay an OpenSpec/Spec Kit-style current-spec/change bundle while Governance governs:

- who may approve the spec change;
- which Constraints bind;
- when implementation is allowed;
- conflict handling.

### Promotion condition

The adapter improves recovery without duplicating or contradicting Canon.

### Current position

No first-class Governance `Change` object.

---

## E5 — Decision review triggers

**Classification:** CLASS-C / CLASS-B guidance experiment

### Hypothesis

Advisory review cues can catch temporal drift without automatic expiry.

Possible triggers:

- milestone boundary;
- dependent capability implemented;
- explicit review date;
- related Decision superseded;
- repeated temporal-language lint.

### Non-goal

Authority must not disappear automatically because time passes.

---

## E6 — Evidence bundle ergonomics

**Classification:** CLASS-C

### Hypothesis

Some rich verification episodes may benefit from a reusable evidence bundle without creating a first-class normative object.

### Experiment

Use Work reports with a compact stable structure:

- claim;
- artifact;
- environment;
- observation;
- external source;
- invalidation condition.

### Promotion condition

Repeated evidence reuse, invalidation, and cross-reference needs cannot be handled cleanly by Task Verification + reports + external links.

### Warning from ReDiscovery

Do not mirror live external health into a self-updating repository ledger.

---

# 4. Future semantic-version candidates

## V1 — Partial Decision amendment semantics

**Classification:** CLASS-D candidate, not approved

### Evidence

ReDiscovery D-026 → D-032 → D-033 changed date/`release_at` while leaving most package terms in earlier Decisions. Multiple Decisions remained ACTIVE, with current precedence explained partly in prose.

### Problem

Whole-object supersession is awkward when only a narrow slice changes.

### Before v2

Replay a smaller alternative:

- narrowly scoped successor Decision;
- explicit statement of unchanged authority;
- clearer current applicability guidance;
- optional resolver report/tooling that does not invent semantics.

### Promote only if

Fresh workers still cannot deterministically recover current authority without manual prose interpretation.

### If adopted

Field/slice amendment affects Decision resolution and therefore requires explicit protocol versioning and migration.

---

## V2 — Ephemeral operational authorization

**Classification:** CLASS-D candidate, not approved

### Evidence

ReDiscovery time-bound production actions created pressure to encode short-lived approvals as durable Decisions.

### Before v2

Replay whether the combination of:

- existing durable Decisions/Constraints;
- bounded Task Authority;
- explicit human approval;
- external action provenance/report

is sufficient.

### Promote only if

Short-lived operational authority repeatedly cannot be represented without either durable Canon pollution or unsafe ambiguity.

### If adopted

A new first-class authorization class or lifecycle is a semantic protocol change.

---

## V3 — Formal applicability semantics

**Classification:** CLASS-D candidate, not approved

### Problem

Areas are discovery filters, explicitly not ownership or permission. Formal selectors could make authority discovery more machine-resolvable.

### Risk

A false-negative applicability selector could hide binding authority.

### Before v2

Run E3 context-discovery experiments first.

### Promote only if

Advisory discovery repeatedly fails and a deterministic applicability model can be stated without unsafe omission.

---

## V4 — Formal ratification provenance

**Classification:** CLASS-D candidate if made validity-bearing

E2 remains experimental.

It becomes CLASS-D only if fields such as `ratified_by` or `ratified_at` become required or affect Decision lifecycle/validity.

---

## V5 — First-class Evidence object

**Classification:** CLASS-D candidate, low current priority

### Current evidence

ReDiscovery has rich verification pressure, but also demonstrates the danger of turning changing external observations into repository-maintained records.

### Promote only if

Cross-project replay demonstrates all of:

- stable evidence identity;
- evidence reused by multiple records;
- explicit invalidation lifecycle;
- meaningful cross-reference needs;
- reports/Task Verification are insufficient;
- external-live-state recursion is avoided.

No `E-*` namespace is proposed now.

---

# 5. Deprioritized candidates

The current evidence foundation does not justify prioritizing:

- first-class Change object;
- first-class Conflict object;
- Challenge/Dissent object;
- automatic Decision expiry;
- central lock manager;
- automatic State generation;
- semantic AI checker;
- automatic Canon repair;
- mandatory Outcome object;
- mandatory Evidence object.

**Classification:** CLASS-E for the current vNext cycle.

Reason:

The observed incidents primarily show too much transient information being pulled into durable coordination surfaces. Adding more writable or authoritative surfaces before exhausting smaller clarifications and tooling would move in the wrong direction.

---

# 6. Replay suite

These replays should be designed before normative Core changes.

## R1 — Human merge after agent completion

Setup:

- Task Authority allows implementation/commit/push on a feature branch.
- Task explicitly denies merge.
- Task reaches COMPLETE.
- Human later merges.

Pass:

- Task Authority remains historical.
- no agent authority is retroactively enlarged;
- outcome remains recoverable.

Tests:

C1, C2, E1.

---

## R2 — Merge without reconciliation

Setup:

- completed feature Task;
- accurate Current State does not depend on pre-merge branch status;
- human merges.

Pass:

- no Canon mutation is required solely because merge occurred;
- no stale actionable truth remains.

Tests:

C2, C3, E1.

---

## R3 — Ten sequential milestones

Setup:

- ten significant Tasks with verification and human integrations.

Pass:

- Current State size does not grow approximately with milestone count;
- completed history remains recoverable;
- fresh worker identifies current position without reading all ten histories.

Tests:

C3, C4, C5, C10, E1.

---

## R4 — Deferred capability later implemented

Setup:

- Decision A contains a durable boundary plus a statement that a capability is not yet implemented;
- later Decision B implements the capability.

Pass:

- current authority is unambiguous;
- transient state is not mistaken for an enduring prohibition;
- historical meaning remains recoverable.

Tests:

C6, E5.

---

## R5 — Rich hosted evidence

Setup:

- multiple CI runs;
- deployment revisions;
- runtime observation;
- one failed run followed by correction and success.

Pass:

- detailed evidence is recoverable;
- Current State remains compact;
- no infinite CI-bookkeeping chain;
- external system remains the live observation source;
- repository identifies the artifact/basis needed for recovery.

Tests:

C2, C4, C5, C9, C10, E6.

---

## R6 — Multi-workspace recovery

Setup:

- reference checkout;
- active mutation worktree;
- stale sibling checkout;
- completed worktree awaiting retirement.

Pass:

- fresh mutating worker identifies intended baseline before write;
- stale sibling does not silently become mutation source;
- no central lock service required;
- forensic work can be preserved without confusing current baseline.

Tests:

C4, C7, C8.

---

## R7 — Partial Decision update

Setup:

- ratified package has ten durable terms;
- human changes only two terms twice;
- prior values remain historically relevant.

Pass for v1-smallest alternative:

- fresh worker recovers current ten-term package deterministically;
- old values remain traceable;
- no field-level mutable rewrite required.

Failure condition:

- current authority still depends on hand-resolving prose precedence across ACTIVE Decisions.

Tests:

V1.

---

## R8 — Short-lived production approval

Setup:

- durable product policy already exists;
- one production mutation is approved for a narrow time/action scope.

Pass for v1-smallest alternative:

- authorization is explicit;
- action is safely bounded;
- expiration/consumption is clear enough for recovery;
- durable Canon is not polluted with routine operational events.

Failure condition:

- neither Task Authority nor human approval provenance can safely represent the action without ambiguity.

Tests:

V2.

---

## R9 — Cold-start authority discovery

Setup:

- several areas;
- global and area-specific Constraints/Decisions;
- indirect dependencies.

Pass:

- advisory context helper improves retrieval;
- no binding authority is hidden by a claimed complete selector;
- worker still knows unloaded authority may exist.

Tests:

E3, V3.

---

## R10 — Ratification provenance recovery

Setup:

- several ACTIVE Decisions with varied historical creation paths;
- fresh worker must distinguish explicit human ratification from agent proposal/canonicalization.

Pass without formal semantics:

- prose/report provenance is sufficient to recover confidence.

Failure condition:

- authority remains materially ambiguous without validity-bearing metadata.

Tests:

E2, V4.

---

# 7. Version boundary rule

Before implementation, every proposed change should answer:

1. Does this alter which action is authorized?
2. Does this alter which record is binding?
3. Does it add required fields, statuses, relations, or object types?
4. Does it make an existing v1 repository semantically invalid?
5. Does it require Canon migration?

If **yes** to any, treat the change as semantic unless a narrower formulation removes the effect.

Non-semantic guidance/tooling may ship with Governance Version still `1.0.0`.

Any future semantic change must receive an explicit protocol version and migration plan before adopter application.

---

# 8. Current research conclusion

The evidence supports a conservative sequence:

1. replay and ratify C1–C10 as clarification/guidance candidates;
2. implement C7/C8/C9-style read-only operating aids only after replay confirms value;
3. run E1–E6 experiments without changing v1 schemas;
4. replay R7–R10 before deciding whether V1–V5 deserve a future protocol version;
5. keep CLASS-E candidates out of the current upgrade unless new evidence appears.

No Core mutation is authorized by this document.
