# Release Runbook

This runbook intentionally keeps the release sequence small and concrete for this repository. The goal is not to simulate full platform automation, but to make the correct order of deploy, migration, and verification steps explicit.

## Pre-Merge Gates

- CI must be green
- backend gates:
  - Composer validation
  - Symfony container and YAML linting
  - Doctrine mapping validation
  - MySQL migration smoke test
  - PHPUnit
- frontend gates:
  - workspace tests
  - production builds
- infrastructure gate:
  - `docker compose config`
- deployed-environment smoke gate:
  - start containers with the observability profile
  - validate health, metrics, login, scan, and trace visibility in Jaeger

## Release Order

1. validate that the target environment is healthy at the infrastructure level
2. validate that metrics, tracing, and alert backends are reachable
3. run database migrations
4. deploy the backend
5. wait until `/healthz` is green
6. run a smoke journey for login and scan
7. confirm that traces become visible in Jaeger and that Prometheus scraping of `/metrics` succeeds
8. only then allow dependent clients to accept new traffic
9. inspect alert signals for abnormal login or scan failures and rate limits

## Verification After Release

- `GET /healthz` returns `ok`
- Prometheus scraping of `/metrics` succeeds
- `qr_http_requests_total` increases
- the smoke journey trace appears in Jaeger for service `qr-incheck-backend`
- there is no unexpected spike in:
  - `qr_auth_login_attempts_total{outcome="invalid_credentials"}`
  - `qr_scan_requests_total{outcome="rate_limited"}`
- critical user journeys remain operational:
  - admin login
  - scan check-in and check-out
  - badge rotation

## Rollback Thinking

- rollback starts with impact analysis, not reflexive reversal
- schema-first changes must remain compatible with the immediately following application version
- for a backend regression without schema conflict:
  - roll the backend back
  - verify health and metrics again
- for a migration conflict:
  - stop further rollout
  - assess whether a forward-fix is safer than a direct `down()` migration
  - use `down()` only when it was explicitly assessed as safe in advance

## What This Runbook Still Does Not Do

- canary or blue-green rollout
- automatic rollback
- paging or incident-management integration
- long-term metrics storage or formal SLO enforcement

The repository still shows the correct order and responsibilities without pretending that a full platform already exists around it.
