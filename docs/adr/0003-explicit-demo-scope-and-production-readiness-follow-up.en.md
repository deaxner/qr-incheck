# ADR 0003: Make Demo Scope Explicit and Treat Production Readiness as the Next Phase

- Status: Accepted
- Date: 2026-04-24

## Context

This repository intentionally shows a credible vertical slice, but it is not by itself proof of complete production readiness or a full lead-level operating model.

That distinction must be explicit, otherwise the demo appears more complete than intended. The original weak points were:

- informal, partly array-based API contracts in read models
- limited observability beyond functional logging and test feedback
- migrations without an explicit long-term rollout and rollback story
- little visible performance profiling or capacity thinking
- security mainly at the application level, not yet at hardening and operations level
- few explicit agreements on ownership, standards, and decision-making across teams

## Decision

We still treat this codebase as a demo-first modular monolith, but we explicitly record that the next phase is not primarily about more features. The next phase is about maturing contracts, operability, and organizational standards.

That next phase should at minimum contain these tracks:

1. contract maturity
2. observability and operability
3. change safety over time
4. performance and security hardening
5. team direction and standardization

## Why This Decision

A lead is judged not only on clean code but also on the ability to give a team direction and to make the next maturity step explicit.

By documenting this as a decision:

- it stays clear what this demo does and does not try to prove
- it becomes visible that production concerns are not forgotten, but deliberately phased
- the conversation shifts from "more features" to "more reliable delivery and operations"

## Consequences

Positive:

- the demo remains compact and explainable
- the repository explicitly shows where architecture turns into operating model
- follow-up investments become testable against a few fixed tracks

Negative:

- not every production claim is directly executable in this repository
- part of the evidence remains documentary rather than technically enforced
- further maturity also requires team agreements and platform choices outside application code
