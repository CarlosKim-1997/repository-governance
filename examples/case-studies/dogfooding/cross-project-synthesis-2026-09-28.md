# Cross-project dogfooding synthesis — 2026-09-28

## Status

This document is a research synthesis, not Repository Authority.

It combines the Hermeneus and ReDiscovery dogfooding incidents with the existing vNext research direction. It does not ratify a protocol change.

## Why the two incidents matter together

Hermeneus and ReDiscovery failed under different workloads.

Hermeneus primarily stressed:

- sequential feature milestones,
- agent-completed branches,
- human PR integration,
- repeated post-merge reconciliation.

ReDiscovery primarily stressed:

- long-running production preparation,
- hosted CI,
- external services,
- time gates,
- multiple workspaces and checkouts,
- rich operational verification.

Despite those differences, both incidents converged on the same pressure:

> transient execution and observation facts were pulled into durable coordination records because those records were the most reliable way to ensure the next agent saw them.

The central vNext question therefore changes.

It is not primarily:

> Which new object type is missing?

It is:

> Which truths deserve durable repository ownership, for how long, and on which surface?

## Strongly supported model

The incidents support separating at least these concepts:

### 1. Normative authority

Durable statements of what is binding, permitted, required, prohibited, or deliberately left open.

Typical sources are Governance, human-ratified active Decisions, applicable Constraints, and normative Principles. Current State and Open Questions are Canon, but they are not equivalent to normative authority: they preserve current position and unresolved uncertainty.

### 2. Execution-episode authority

The permissions actually delegated to one bounded Task episode.

This is historical once the Task closes. Later human integration does not rewrite it.

### 3. Execution outcome and verification provenance

What was implemented, observed, verified, integrated, released, or rejected during or after an episode.

This can be durable without becoming normative authority.

Typical homes should usually be Task Verification, a concise optional closure summary, reports, Git/PR history, or external verification systems.

### 4. Current position

The smallest durable compression needed for a fresh worker to understand the current actionable situation.

Current State should not become an append-only summary of all previous outcomes.

### 5. External operational reality

Hosted CI, deployment state, databases, external providers, production health, budgets, and other facts owned by systems outside the repository.

Repository records may preserve a bounded observation or verified artifact identity, but they cannot make external reality permanently current.

### 6. Workspace identity and execution topology

The checkout/worktree/branch/baseline from which mutation occurs.

This is operational coordination state. Some of it may need deterministic entry checks without becoming Project Canon.

These boundaries can be summarized as:

```text
Normative Authority
        ≠
Execution-Episode Authority
        ≠
Outcome / Evidence / Provenance
        ≠
Current Position
        ≠
External Live Reality
        ≠
Workspace Identity
```

The v1 model already distinguishes several of these in prose. The dogfooding gap is that record ergonomics and operating guardrails did not keep them separated over many episodes.

## Cross-project observed patterns and analyses

### A. Current State overload is observed; information gravity is analysis

Observed in both projects: Current State accumulated transient or historical detail beyond a compact current position.

A plausible cross-project explanation is **information gravity**: because State is on the bootstrap hot path, operators have an incentive to place important information there so the next worker will see it. That causal explanation is analysis; the overload itself is directly observed.

Observed consequences:

- branch/merge chronology;
- CI ledgers;
- test-count history;
- deployment observations;
- completed milestone registry;
- stale "latest" claims.

This is now a cross-project finding, not a single-repository style preference.

### B. Outcome leaking into the wrong durable surface

Hermeneus: later integration outcome overwrote historical Task Authority.

ReDiscovery: hosted outcomes and historical evidence accumulated in State, Task, and milestone surfaces.

The recurring problem is surface substitution: a useful fact is stored wherever future agents are guaranteed to read it, even when the semantics of that surface are different.

### C. Routine reconciliation becoming its own workload

Hermeneus repeatedly reconciled post-merge truth.

ReDiscovery developed closure-bookkeeping CI cycles and later required consistency reconciliation.

A healthy protocol should make ordinary successful work converge without requiring a second administrative episode simply to restate facts already represented by Git, PR, CI, or a closed Task.

### D. Structural correctness is not semantic health

Both incidents could remain structurally valid while current meaning drifted.

This confirms the v1 decision not to equate checker PASS with Governance health.

It also creates stronger evidence for a separate semantic health-audit procedure rather than expanding the checker into an authority-bearing semantic agent.

### E. Governance inflation is observed; the safety-pressure explanation is analysis

Both projects show durable-record growth beyond the intended minimal shape. One plausible explanation is that "keep records minimal" is less operationally specific than safety rules that require authority and verification, so a cautious worker may prefer recording more when uncertain.

The observed inflation supports testing clearer negative guidance about what **not** to persist; the precise causal mechanism still needs replay or broader dogfooding.

## Strongly supported problems and candidate v1-compatible responses

The incidents strongly support the underlying problems below. The listed responses are candidate compatible clarifications or guidance, not demonstrated remedies. They still require human ratification and, where practical, replay before implementation.

### Candidate 1 — Terminal Task Authority preservation

A terminal Task preserves the permissions held during that execution episode.

Later integration, release, or human action does not retroactively expand those permissions.

Post-terminal corrections to Authority should only restore historical authorization, not record subsequent events.

### Candidate 2 — Integration outcome is not Authority

Merge, release, or deployment outcome belongs to verification/provenance/current-position records only when operationally relevant.

It must not replace the Authority contract of the Task that produced the work.

### Candidate 3 — Integration is not a default Canon event

A branch/PR merge alone should not require Canon mutation.

Canon changes only when current normative or actionable truth actually changed.

This intentionally makes "feature PR → human merge → reconciliation PR" an exception rather than the default lifecycle.

### Candidate 4 — Current State transience exclusion

State should normally exclude:

- branch names and ordinary PR status;
- merge chronology;
- complete Task registry;
- long CI-run history;
- historical test-count ledgers;
- superseded operational observations.

A transient fact belongs in State only when it materially changes the next valid action, blocker, or current risk.

### Candidate 5 — Representative Verification Basis

State Verification Basis should identify the representative basis for current claims and point to detailed Task/report/external evidence when needed.

It should not be a complete verification ledger.

### Candidate 6 — Decision timelessness and explicit normative scope

Decision authors should prefer statements that remain meaningful after later implementation.

Words such as `currently`, `not yet`, `for now`, and `deferred` require review:

- if they describe a durable normative boundary, Decision may be correct;
- if they describe milestone implementation state, use Task/State/report instead.

### Candidate 7 — Semantic Governance Health Audit

Keep the structural checker deterministic and non-semantic.

Add a reusable read-only audit procedure for smells such as:

- State/reality mismatch;
- State growth and history accumulation;
- terminal Task Authority creep;
- duplicate current truth;
- stale temporal language in ACTIVE Decisions;
- missing supersession;
- Work detail leaking into Canon;
- deprecated current-status documents still being updated;
- workspace baseline divergence.

Likely triggers include major milestone boundaries, several significant Task closures, production/public rollout, Governance upgrade, repeated reconciliation, or discovery of Canon/reality mismatch.

### Candidate 8 — Workspace entry and retirement discipline

Before mutation, deterministically inspect at least:

- repository root;
- worktree identity;
- branch;
- HEAD;
- expected integration baseline;
- ahead/behind;
- tracked cleanliness;
- active linked worktrees where available.

The protocol should distinguish worktree isolation from worktree lifecycle. Completed mutation workspaces need an explicit retirement discipline.

This may remain guidance/tooling rather than Canon semantics.

### Candidate 9 — External evidence ownership

Do not require the repository to contain a self-updating mirror of external CI or operational health.

Record the verified artifact and evidence class where useful. Treat the external system as the primary observation source for its live operational state rather than trying to mirror that state continuously into the repository.

This avoids the evidence-after-commit bookkeeping recursion.

### Candidate 10 — Minimality as exclusion, not aspiration

Guidance should explicitly say that some facts normally should **not** become durable Canon:

- short-lived operational observations;
- live CI status already owned by CI;
- history already preserved by reports or Git;
- merge events that do not change actionable truth;
- transient facts with no recovery value after a Task closes.

## Ergonomic experiments, not yet protocol semantics

### Optional Task Outcome / Closure

An optional prose section may give later integration or final outcome a natural home and reduce pressure to misuse Authority.

This should first be tested as an optional heading. It does not justify a new object type yet.

### Ratification provenance

Earlier vNext research identified durable human-ratification provenance as a recovery gap.

The incidents do not invalidate that hypothesis, but they also warn against indiscriminately adding metadata.

Test a small non-authoritative or prose form first.

### Applicability/context discovery

Earlier research identified a risk that a fresh worker may miss governing Decisions/Constraints.

A deterministic read-only context-discovery tool remains attractive, but its output must remain advisory and must not claim complete authority discovery.

### OpenSpec / specification-layer adapter

Specification current truth and proposed change bundles remain a separate layer from Governance authority.

The incidents strengthen the case for integration rather than absorption: adding Change objects to Governance would not have prevented the failures observed here.

### Decision review triggers

Advisory review triggers remain preferable to automatic expiry. The temporal-language incident makes review useful, but authority should not disappear silently because a date elapsed.

### Evidence bundle

Rich production evidence in ReDiscovery makes evidence ergonomics worth testing, but the CI bookkeeping paradox is evidence **against** immediately making every external observation a first-class repository object.

## Protocol candidates that require more evidence

### Partial amendment semantics

ReDiscovery shows real friction when only part of an earlier Decision changes.

Before adding field-level amendment semantics, replay whether narrowly scoped successor Decisions plus better applicability/scope conventions solve the same problem with less complexity.

### Ephemeral operational authorization

ReDiscovery shows pressure from hour/day-scale production approvals.

Before adding a new object, test whether Task authority, explicit human instruction, and external approval provenance are sufficient.

### Formal applicability semantics

If the advisory context tool repeatedly misses governing authority, a later protocol version may need formal applicability selectors. A false-negative selector is dangerous, so this must not be added casually.

### Formal ratification provenance

Promote only if cold-start replay repeatedly shows actual confusion about whether an ACTIVE Decision was human-ratified and provenance materially resolves it.

### First-class Evidence

Promote only if repeated cross-project work demonstrates stable evidence identity, reuse, invalidation, and cross-reference requirements that Tasks/reports/external links cannot satisfy cleanly.

## Candidates currently pushed backward by dogfooding evidence

The incidents provide no reason to prioritize:

- a first-class Change object;
- a first-class Conflict object;
- a Challenge/Dissent object;
- automatic Decision expiry;
- a central lock manager;
- automatic State generation;
- a semantic AI checker;
- automatic Canon repair.

These increase authoritative or writable surface area, while the observed failures point in the opposite direction.

## Revised vNext design thesis

The earlier vNext research asked whether Governance needed richer object types.

The dogfooding evidence suggests a narrower thesis:

> vNext should first reduce durable-state pressure and make information lifetime, ownership, and surface boundaries explicit. New first-class objects should be introduced only after the existing five-object Canon plus Work/report model demonstrably cannot represent a recurring failure without ambiguity or information loss.

This keeps the original minimality principle but makes it operational.

## Empirical promotion gate

A candidate semantic change should advance toward a new protocol version only when:

1. the same failure appears in more than one real repository or in repeated replay;
2. the failure is not merely a violation already solved by clearer guidance;
3. guidance/tooling is tried before a new object/lifecycle rule;
4. the missing semantic causes actual authority ambiguity, information loss, or unsafe execution;
5. the smallest new semantic can be stated deterministically;
6. compatibility and migration are explicit;
7. the candidate can be replayed against both Hermeneus- and ReDiscovery-style stress cases.

## Recommended next research sequence

1. Ratify which confirmed clarifications belong in a v1-compatible guidance/tooling pass.
2. Design State-compression and terminal-Task replay tests before changing Core.
3. Design a read-only semantic health audit procedure.
4. Prototype workspace-entry and context-discovery tooling as non-authoritative helpers.
5. Test optional Task Outcome/Closure ergonomics without changing the official schema first.
6. Replay ReDiscovery partial-supersession and operational-authorization cases.
7. Only then decide whether any candidate crosses the boundary into v2 protocol semantics.

Until those steps are complete, Governance semantics should remain 1.0.0.
