# vNext replay results R1–R6 — 2026-09-30

## Status

This is non-normative research evidence.

Replay implementation:

- branch: `research/vnext-replay-r1-r6-20260930`
- replay head before this report: `98af92cfcdb946e8180e40064290ea9a3fee1d0d`
- PR: #3
- hosted workflow: `Verify Governance`
- run: #11
- run ID: `36661965486`
- result: SUCCESS
- full Node suite: 65 tests, 65 pass, 0 fail, 0 skipped

The replay suite ran against the existing Governance 1.0.0 template and checker. No Core, schema, checker, installer, template, or Governance Version semantics were changed to make R1–R6 pass.

## What a PASS means

A replay PASS establishes only that the scenario can be represented and exercised under the current v1 model with the tested discipline.

It does **not** by itself prove that:

- the proposed guidance will prevent recurrence in every real project;
- semantic health can be fully automated;
- the checker should enforce the replay expectation;
- the candidate has been human-ratified into Governance;
- the scenario generalizes beyond the tested shape.

The result is evidence against adding new protocol semantics **solely** to represent these six scenarios.

---

## R1 — Human merge after agent completion

**Result: PASS**

Fixture:

- Task Authority allowed implementation/commit/push on a feature branch.
- Task Authority explicitly denied merge.
- Task was COMPLETE.
- Verification recorded that a human later merged the branch.

Observed:

- existing `task/v1` remained structurally valid;
- historical `Not authorized to merge` remained intact;
- later integration outcome remained recoverable outside Authority.

### Interpretation

Strong support for:

- C1 Terminal Task Authority preservation as CLASS-A clarification;
- C2 Outcome does not replace Authority as CLASS-A clarification.

No Outcome object is required for this scenario.

---

## R2 — Merge without reconciliation

**Result: PASS**

Fixture:

- a completed Task preserved branch-scoped authority;
- later human integration was recorded as Work provenance;
- Current State bytes were intentionally left unchanged.

Observed:

- Governance checker remained PASS;
- no Canon mutation was needed solely because integration occurred.

### Interpretation

The current information model already permits:

`complete Task → human integration → no State/Canon rewrite`

when the integration does not change current actionable or normative truth.

This supports promoting C3 from “CLASS-B initially” toward a **v1-compatible clarification**, subject to human ratification of wording.

It does not prove that every integration event is irrelevant to State; some integrations genuinely change current position.

---

## R3 — Ten sequential milestones

**Result: PASS**

Fixture:

- ten COMPLETE Tasks each retained their own detailed authority/verification;
- Current State stayed compact and contained no Task registry.

Observed:

- all records remained valid under current schemas;
- State remained below the replay compactness bound;
- State did not enumerate T-001 through T-010.

### Interpretation

Current State growth is not structurally required by v1.

This supports:

- C4 State transience exclusion;
- C5 Representative Verification Basis;
- C10 Minimality as explicit exclusion.

The replay line-count assertion is a research fixture, **not** a proposed normative maximum.

---

## R4 — Deferred capability later implemented

**Result: PASS**

Fixture:

- durable provider-neutral identity policy remained in Decision D-001;
- transient “not implemented yet” status lived in a Task;
- later D-002 introduced authenticated external-subject mapping while preserving D-001.

Observed:

- no semantic object beyond existing Decision + Task was needed;
- current policy remained readable without stale temporal text in D-001.

### Interpretation

This supports Decision timelessness primarily as authoring guidance.

The Hermeneus D-005 incident does not currently justify:

- automatic Decision expiry;
- a new lifecycle state;
- a new amendment object merely for transient implementation status.

---

## R5 — Rich hosted evidence

**Result: PASS**

Fixture:

- detailed CI history lived in a Work report;
- Current State retained only representative verified artifact/basis and a pointer to detail;
- live workflow health remained conceptually external.

Observed:

- State did not mirror individual Run #105–#108 entries;
- detailed history remained durable and recoverable;
- no repository-side “record latest CI, create new CI, record again” loop was required.

### Interpretation

Strong support for:

- C5 Representative Verification Basis;
- C9 External evidence ownership;
- C10 Minimality exclusions.

This replay is evidence **against** adding a first-class Evidence object merely to solve the observed CI bookkeeping incident.

---

## R6 — Multi-workspace recovery

**Result: PASS for deterministic identity facts**

Fixture:

- reference `main` checkout at baseline commit;
- named mutation worktree from that baseline;
- mutation worktree advanced while reference checkout remained at baseline.

Plain Git recovered:

- repository/worktree root;
- branch identity;
- HEAD;
- clean status;
- linked worktree list;
- distinct reference and mutation heads.

### Interpretation

The essential workspace identity facts are deterministically available from Git without Project Canon or a central lock service.

This supports C8 as guidance/tooling.

### Remaining limitation

This replay does not yet model:

- a remote `origin/main` advancing independently;
- ahead/behind calculation against a fetched remote;
- two agents claiming the same mutation episode;
- workspace retirement after integration;
- remote/local sibling histories exactly matching the ReDiscovery incident.

Therefore R6 supports a preflight helper but does not fully validate a workspace-ownership protocol.

---

# Cross-replay conclusion

R1–R6 all passed without changing Governance 1.0.0 semantics.

The strongest inference is:

> The first six dogfooding problems are primarily record-discipline, authoring, and operational-lifecycle problems—not demonstrated failures of the five-schema information model.

This materially lowers the justification for new first-class types in the current vNext cycle.

## Candidate movement after R1–R6

| Candidate | Before replay | After replay evidence |
| --- | --- | --- |
| C1 Terminal Task Authority preservation | CLASS-A | **CLASS-A strengthened** |
| C2 Outcome ≠ Authority | CLASS-A | **CLASS-A strengthened** |
| C3 Integration not default Canon event | CLASS-B → possible A | **eligible for CLASS-A wording review** |
| C4 State transience exclusion | CLASS-A + B | **CLASS-A boundary strengthened; heuristics remain B** |
| C5 Representative Verification Basis | CLASS-B | **CLASS-B strengthened** |
| C6 Decision timelessness | CLASS-B → possible A | **CLASS-B strengthened; no new semantics indicated** |
| C8 Workspace entry/retirement | CLASS-B | **preflight side strengthened; retirement still needs replay** |
| C9 External evidence ownership | CLASS-B | **CLASS-B strengthened** |
| C10 Minimality exclusion | CLASS-B | **CLASS-B strengthened** |
| E1 Optional Outcome/Closure | CLASS-C | **still C; not required to pass R1/R2** |
| V5 First-class Evidence | CLASS-D low priority | **further deprioritized for observed CI case** |

C7 Semantic Governance Health Audit was not directly tested as a preventive mechanism by R1–R6; its usefulness remains a CLASS-B operating candidate.

## Next gate

R7–R10 remain necessary before deciding whether any current pressure genuinely requires future semantic-version work:

- R7 Partial Decision update
- R8 Short-lived production approval
- R9 Cold-start authority discovery
- R10 Ratification provenance recovery

No Core change is authorized by these replay results.
