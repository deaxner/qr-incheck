# Engineering Standards

This repository follows a small but explicit set of engineering invariants. The goal is not to simulate a full platform handbook, but to make the technical standards visible once the demo is scaled further.

## API and Contract Discipline

- backend-owned contracts are authoritative; frontend clients do not reconstruct status or history semantics
- every critical success response is modeled as a DTO or view object, not as an ad-hoc array in controllers
- every application error follows the same `ApiProblem` model
- responses carry `X-Contract-Version`; breaking contract changes require a new version or an explicit compatibility decision

## Observability

- every response carries `X-Request-Id` and `X-Response-Time-Ms`
- every response carries `X-Trace-Id`; inbound and outbound tracing context uses W3C `traceparent`
- the backend logs request completion events with `requestId`, route, status code, and duration
- logging runs through explicit Monolog channels: `http`, `security`, and `audit`
- auth and scan rejects are logged as `security` events so rate limits, invalid tokens, and malformed input remain visible
- state-changing workflows such as accepted scans and badge rotations are logged as `audit` events
- metrics are exported at minimum for HTTP volume and latency, login outcomes, scan outcomes, and badge rotations
- example alert rules should connect directly to those metrics; the repository contains a baseline in `ops/prometheus/alert-rules.yml`
- tracing is exported through OTLP to a collector; the collector is expected to forward traces to a queryable backend such as Jaeger
- dashboards should be provisioned from repository artifacts rather than being created manually in a UI
- test environments may suppress operational event emission through `APP_OPERATIONAL_LOGGING_ENABLED=0` to keep signal-to-noise acceptable
- `/healthz` is the minimum readiness probe; an endpoint only counts as healthy when the database is reachable

## Performance

- the scan flow is latency-critical and should be treated with explicit budgets
- guiding budget for scanner traffic within this architecture: p95 < 250 ms server-side under normal local use
- burst behavior is bounded before business logic runs through request throttling at the device-token level
- read-model endpoints should remain linearly explainable; when query complexity grows, explicit read optimizations or projections are required

## Security

- scanner auth and user auth remain separate trust boundaries
- responses receive defensive security headers, even in demo environments
- tokens and secrets are hardcoded in demo config for reproducibility; outside the demo scope, secrets management is mandatory, not optional
- security hardening is treated as system behavior, not as the mere presence of login

## Release and Change Safety

- schema changes should remain compatible with the immediately following application version unless explicitly decided otherwise
- health and readiness must be green before dependent clients start or accept traffic
- rollback thinking begins with contract and schema compatibility, not after a production incident
- pull requests should at minimum pass backend dependency and config validation, backend tests, frontend tests, and frontend production builds
- pull requests should also pass compose config and Doctrine mapping validation
- MySQL-focused migrations should also run in CI on a clean MySQL smoke database
- deployed smoke tests should validate at least health, metrics, login, scan, and trace visibility against running containers after image build
