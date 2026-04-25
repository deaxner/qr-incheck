# Production Baseline

This demo does not claim a fully built platform, but it does contain a visible minimum production baseline in code and runtime behavior.

## Operability and Observability

- `GET /healthz` returns a machine-readable readiness signal for the backend, including database checks and realtime configuration status
- `GET /metrics` exports countable backend signals in a Prometheus-style text format
- every response gets an `X-Request-Id`; application errors echo the same value in the response body contract
- every response also gets `X-Contract-Version` and `X-Response-Time-Ms`
- every response also gets `X-Trace-Id`; tracing context is returned through `traceparent`
- the backend emits operational request-completion and reject events through structured JSON logs
- the backend exports OpenTelemetry traces through OTLP to a collector that forwards them to Jaeger
- critical API flows are covered by controller tests for auth, authorization, rate limiting, scan flow, and error paths
- the repository contains concrete observability backends and provisioning for Prometheus, Alertmanager, Jaeger, and Grafana in `ops/`
- example dashboards and alert rules are directly tied to the exported metrics and traces
- release order and rollback thinking are explicitly described in `docs/operations/release-runbook.en.md`

## Security Hardening

- scanner traffic is separated from user auth through `X-DEVICE-TOKEN`
- burst protection on scan traffic runs through the Symfony RateLimiter
- backend responses receive fixed security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`
- auth and scanner traffic remain separate trust boundaries with distinct reject signals

## Performance and Change Safety

- the scan flow has explicit burst protection at the request level
- DTO-based contracts reduce accidental contract drift between the backend and the three frontend clients
- migrations remain linear and reproducible through Docker startup and test resets
- backend startup retries migrations when the database container is already healthy but not yet accepting connections
- clients only start in Compose after the backend is healthy
- the repository includes CI gates for backend validation and tests plus frontend tests and builds
- the repository also validates `docker compose config` and Doctrine mapping in CI
- the repository runs a MySQL migration smoke test on a clean database in CI
- the repository also runs a deployed smoke test against running containers including health, metrics, login, scan, and Jaeger trace visibility

## Still Intentionally Out of Scope

- formal SLOs, latency budgets, and load-test reports
- secrets management beyond demo configuration
- dependency scanning, SBOMs, and stricter policy gates such as mandatory code owners or environment approvals

These gaps still matter, but the repository now shows a concrete baseline for contract discipline, operability, and hardening rather than only a roadmap.
