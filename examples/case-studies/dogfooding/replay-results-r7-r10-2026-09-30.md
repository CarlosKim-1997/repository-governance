# vNext replay results R7–R10 — 2026-09-30

## Status

This is non-normative research evidence.

Replay implementation:

- branch: `research/vnext-replay-r7-r10-20260930`
- replay head before this report: `dc7187d41ffe570b55f42892273b325b2318a3b0`
- PR: #4
- hosted workflow: `Verify Governance`
- run: #15
- run ID: `36662305314`
- result: SUCCESS
- full Node suite: 69 tests, 69 pass, 0 fail, 0 skipped

R7–R10 ran against the existing Governance 1.0.0 schemas and checker. No Core, schema, checker, installer, template, or Governance Version semantics were changed to make them pass.

As with R1–R6, PASS proves representability of the tested pattern, not universal operational effectiveness or human ratification.

---

## R7 — Repeated partial package updates

**Result: PASS using existing whole-object supersession**

Fixture:

- D-026 held a complete ten-term package and was SUPERSEDED;
- D-032 restated the complete package with only date and release time changed, then became SUPERSEDED;
- D-033 restated the complete current package, superseded D-032, and remained the single ACTIVE Decision.

Observed:

- current authority was recoverable from one ACTIVE Decision;
- historical package values remained recoverable;
- no field-level amendment relation or mutable Decision rewrite was required;
- existing v1 supersession rules remained sufficient.

### Interpretation

The ReDiscovery incident demonstrates **ergonomic friction**, but not a demonstrated semantic gap.

A safe v1 workaround already exists:

> when a material slice changes and deterministic recovery matters, create a complete successor Decision and supersede the prior package.

Cost:

- repetition;
- potentially large successor Decisions;
- authoring burden when packages are large.

Benefit:

- one current ACTIVE package;
- no prose precedence resolver;
- no new amendment semantics.

### Candidate movement

Partial Decision amendment semantics should move from an active CLASS-D candidate to a **CLASS-C ergonomics experiment / deferred future candidate**.

Promote toward a semantic protocol change only if real projects repeatedly show that complete successor Decisions create unacceptable duplication or error risk that guidance/tooling cannot reduce.

---

## R8 — Short-lived production approval

**Result: PASS using durable policy + bounded Task Authority**

Fixture:

- one durable Decision required explicit human approval for production publication;
- a Task recorded observed human approval for exactly one named production action before an exact time;
- Authority explicitly denied other production mutation;
- Stop Conditions handled deadline expiry, identity drift, one-shot consumption, and scope expansion;
- Verification recorded the single executed action.

Observed:

- no Operational Authorization object was required;
- no short-lived production approval had to become a durable product Decision;
- the closed Task preserved the historical execution authority and outcome.

### Important limitation

A Task does not create authority. The fixture assumes the Task accurately records a real human approval observed outside or during the execution episode.

This replay does not provide cryptographic proof of approval and does not change the v1 rule that agents may not invent authority.

### Candidate movement

A first-class ephemeral Operational Authorization object is **not currently justified**.

Move it from active CLASS-D consideration to **CLASS-C deferred experiment**. Revisit only if repeated real operations cannot be safely represented by:

- durable Decision/Constraint policy;
- explicit human approval;
- bounded Task Authority;
- Verification/report provenance.

---

## R9 — Cold-start authority/context discovery

**Result: PASS for an advisory helper model**

Fixture:

- global and area-specific Constraints;
- a payments Task;
- an unrelated robotics Constraint;
- a robotics Decision directly referenced by the payments Task.

A small research helper selected:

- global candidates;
- overlapping-area candidates;
- direct references even across areas;

while returning an explicit disclaimer:

> Advisory discovery only; unloaded authoritative material may still apply.

Observed:

- useful context narrowing is possible with existing areas and relations;
- the helper did not need to redefine areas as permission or ownership;
- the helper did not claim completeness;
- unrelated area material could be omitted from the suggested preload while direct cross-area authority remained discoverable.

### Interpretation

This strengthens the case for E3 advisory context discovery tooling.

It weakens the case for formal applicability semantics.

### Candidate movement

Formal applicability semantics should remain **deprioritized CLASS-D / no current promotion**.

A read-only CLASS-B/C helper can be prototyped first.

Formal selectors should be reconsidered only if advisory discovery repeatedly causes real missed-authority failures and a safe complete selector can be specified.

---

## R10 — Ratification provenance recovery

**Result: PASS using Decision prose + Work provenance**

Fixture:

- an ACTIVE Decision included a Context statement identifying a human ratification observation and event;
- a Work report preserved supporting provenance;
- no required `ratified_by` or `ratified_at` fields were added.

Observed:

- Decision remained valid under current schema;
- fresh readers can recover a ratification basis from the Decision and report;
- provenance remains distinguishable from authority;
- no validity-bearing metadata was required for the tested case.

### Interpretation

This strengthens E2 lightweight ratification provenance as an authoring/provenance experiment.

It weakens the case for formal required ratification metadata.

### Candidate movement

Validity-bearing formal ratification provenance should remain **deprioritized CLASS-D / no current promotion**.

Promote only after real cold-start failures show that prose/report provenance is materially insufficient.

---

# Cross-replay conclusion R1–R10

All ten replay scenarios now have a passing representation under Governance 1.0.0 without introducing a new first-class type, ID namespace, lifecycle, permission rule, or binding applicability selector.

This is stronger evidence than the original vNext hypothesis set.

The current evidence supports:

> The observed dogfooding failures are primarily failures of boundary clarity, authoring discipline, information lifetime, semantic health review, and operational tooling—not demonstrated insufficiency of the v1 five-schema information model.

## Current semantic-version assessment

At this point, **no tested incident requires a Governance 2.0 semantic change**.

That does not prove v1 is universally complete. It means the present evidence no longer justifies semantic expansion.

### Strong v1-compatible clarification candidates

- terminal Task Authority preservation;
- outcome does not overwrite Authority;
- integration is not a default Canon event;
- Current State transience boundary.

### Strong guidance/tooling candidates

- representative State Verification Basis;
- Decision timelessness guidance;
- reusable semantic health audit;
- workspace preflight and retirement discipline;
- external live-evidence ownership boundary;
- explicit minimality exclusions;
- advisory context discovery.

### Experiments that remain optional

- optional Task Outcome/Closure heading;
- lightweight ratification provenance convention;
- specification-layer adapter;
- Decision review triggers;
- evidence-bundle report ergonomics;
- partial-amendment ergonomics;
- ephemeral-authorization ergonomics.

### Further-deprioritized semantic additions

- field-level Decision amendment semantics;
- first-class Operational Authorization;
- formal applicability selectors;
- validity-bearing ratification fields;
- first-class Evidence object.

None should enter Core semantics in the current upgrade without new counterevidence.

---

# Recommended upgrade shape

The empirical result now favors a **Governance 1.0-compatible upgrade** rather than a semantic v2.

Possible layers:

1. **Core clarification**
   - tighten wording for Task Authority history;
   - clarify that merge/outcome does not replace Authority;
   - clarify State transience and integration bookkeeping boundary.

2. **Adoption/operations guidance**
   - semantic health audit;
   - representative verification guidance;
   - Decision timelessness authoring;
   - minimality exclusions;
   - external evidence boundary;
   - workspace lifecycle.

3. **Non-authoritative deterministic tooling**
   - workspace preflight;
   - advisory context discovery;
   - possibly heuristic WARN/lint only after separate validation.

4. **Research-only experiments**
   - keep optional Outcome/Closure, amendment ergonomics, provenance ergonomics, and evidence bundles outside required protocol structure.

## Version implication

If the final Core edits only make already-implied v1 meanings explicit and pass the compatibility criteria from the candidate classification, Governance Version may remain `1.0.0`.

Distribution/checker/tooling versions may advance independently.

If any proposed implementation later changes binding authority, required structure, lifecycle, relation semantics, or adopter validity, stop and reclassify it as a semantic protocol upgrade before merge.

No Core mutation is authorized by this result document alone.
