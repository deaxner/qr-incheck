# Operating Model

## Service Boundaries

- `scanner-app`: untrusted edge client for badge input
- `admin-app`: privileged read and write client for operations and management
- `employee-app`: least-privilege self-service client
- `backend`: system of record for status, history, authorization decisions, and contract stability
- `mercure`: best-effort realtime distribution; functionally important for UX, but not the primary source of truth

## Failure Modes

### Database Down

- expected behavior: `/healthz` becomes `503 degraded`
- impact: write flows and read models become unreliable or unavailable
- action: do not allow new traffic; first resolve datastore or connectivity root cause

### Mercure Down

- expected behavior: primary scan and badge flows continue to work
- impact: admin and employee realtime signaling degrades to stale UI until the next fetch
- action: classify as partial degradation rather than total outage

### Device-Token Abuse or Scanner Burst

- expected behavior: throttling before business logic, `429 rate_limited`, operational event in logs
- impact: kiosk flow slows down locally, but the backend protects the write path and datastore

### Contract Drift

- expected behavior: prevented through DTOs, controller tests, and the contract version header
- action: no breaking change without an explicit compatibility decision

## Deployment Invariants

1. database healthy
2. backend healthy
3. only then allow scanner, admin, and employee traffic
4. realtime is additive, not a blocker for write correctness

## Senior-Level Claim of This Repository

This codebase does not claim that every platform capability is already implemented. The claim is narrower and more technical:

- bounded demo scope with explicit system-of-record boundaries
- contracts treated as first-class artifacts
- visible request correlation, readiness, and response metadata
- separation between core correctness and best-effort realtime
- a clear next step from baseline toward real SLOs, metrics, and CI governance
