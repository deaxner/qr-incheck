# Application Guide

## Purpose

QR-Incheck is a compact demo application for QR-based check-in and check-out. It provides a credible vertical slice of a workforce-style product with three clients, a Symfony backend as the system of record, and a small but explicit production baseline.

## Functional Overview

The application supports these primary flows:

- scanning a badge through a kiosk-style scanner app
- registering check-in and check-out events based on a badge code
- admin login for team overview, history, and badge rotation
- employee login for self-service, personal badge access, and personal history
- live updates through Mercure for admin and employee screens

## Components

### Frontend Clients

- `scanner-app`: untrusted edge client for badge input, camera usage, and manual fallback
- `admin-app`: privileged client for team status, history, badge rotation, and live activity
- `employee-app`: least-privilege client for personal status, badge data, and personal history

### Backend

The backend is built with `Symfony` and remains the source of truth for:

- authentication decisions
- scan outcomes
- team status
- employee history
- contract stability
- realtime publication of domain events

### Supporting Infrastructure

- `MySQL` for runtime data
- `Mercure` for realtime updates
- `Prometheus` for metrics scraping
- `Alertmanager` for alert delivery
- `OpenTelemetry Collector` for trace export
- `Jaeger` as the trace backend
- `Grafana` for dashboards

## Architecture

The repository follows a modular monolith with a feature-first structure:

- backend features primarily live under `Auth`, `Clocking`, `Employees`, `Realtime`, and `Shared`
- frontend apps live under `frontend/apps/*`
- shared frontend contracts and utilities live under `frontend/shared/*`

Key architectural choices:

- business rules live in the backend rather than in the clients
- scanner traffic uses a device token instead of regular user login
- realtime is UX-supporting but not the primary source of truth
- endpoint contracts are treated as explicit artifacts

See the rationale in:

- [ADR 0001](./adr/0001-feature-based-monolith-and-backend-owned-product-truth.en.md)
- [ADR 0002](./adr/0002-multi-client-frontend-with-shared-contract-layer-and-separate-access.en.md)
- [ADR 0003](./adr/0003-explicit-demo-scope-and-production-readiness-follow-up.en.md)

## Domain Model

The main domain concepts are:

- `Employee`: employee with profile information and QR code
- `TimeEntry`: clocking event that records a check-in or check-out
- `User`: login identity for an admin or employee
- scanner device: technical actor that sends scans to `/api/scan`

Important domain services:

- `ScanService`: determines check-in or check-out based on badge code and current status
- `EmployeeOverviewService`: provides backend-owned team status
- `EmployeeHistoryService`: builds history and summaries
- `QrCodeRotationService`: performs badge rotation

## Authentication and Authorization

There are two access models:

- JWT-based user auth for admin and employee flows
- device auth through `X-DEVICE-TOKEN` for scanner traffic

Security invariants:

- scanner permissions are not inherited from admin or employee sessions
- backend responses include security headers
- rate limiting protects the scan write path from bursts and misuse

## API

Main endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/employees`
- `GET /api/employees/{id}/history`
- `GET /api/employees/me/status`
- `GET /api/employees/me/history`
- `POST /api/employees/{id}/regenerate-qr`
- `POST /api/scan`
- `GET /healthz`
- `GET /metrics`

The formal contracts are described in [api/contracts.en.md](./api/contracts.en.md). The Dutch counterpart is [api/contracts.md](./api/contracts.md).

## Observability

The application exposes operational signals through:

- `X-Request-Id` for request correlation
- `X-Contract-Version` for the contract baseline
- `X-Response-Time-Ms` for simple latency observation
- `X-Trace-Id` and `traceparent` for trace correlation
- Monolog channels `http`, `security`, and `audit`
- `/healthz` for readiness
- `/metrics` for Prometheus-compatible metrics
- OTLP export to the collector and Jaeger

The operational baseline and standards are documented in:

- [operations/production-baseline.en.md](./operations/production-baseline.en.md)
- [operations/engineering-standards.en.md](./operations/engineering-standards.en.md)
- [operations/operating-model.en.md](./operations/operating-model.en.md)
- [operations/release-runbook.en.md](./operations/release-runbook.en.md)

## Local Development

### Requirements

- Docker
- Docker Compose
- PHP `8.5.x` for local backend tests

### Start

```bash
docker compose up --build
```

For the full observability stack:

```bash
docker compose --profile observability up --build
```

### Access

- Scanner App: `http://localhost:8081`
- Backend: `http://localhost:8082`
- Admin App: `http://localhost:8083`
- Employee App: `http://localhost:8084`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Jaeger: `http://localhost:16686`

### Stop

```bash
docker compose down
```

## Demo Accounts and Codes

### Login Accounts

- Admin: `bob.admin@timesignal.demo` / `Admin123!`
- Employee: `alice@timesignal.demo` / `User123!`

### Demo Badges

- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Test and Quality Gates

The repository contains automated checks for:

- Composer validation
- Symfony container and YAML linting
- Doctrine mapping validation
- MySQL migration smoke test
- backend PHPUnit suite
- frontend tests
- frontend builds
- `docker compose config`
- deployed smoke tests against running containers

The CI workflow lives in [../.github/workflows/ci.yml](../.github/workflows/ci.yml).

## Known Scope Boundaries

This project is intentionally demo-first. That means:

- it is not a full workforce suite
- it does not provide formal SLOs or load-test reports
- it does not implement production secrets management in this repo
- it does not claim full platform governance beyond the application boundary

What the demo does claim:

- clear system-of-record boundaries
- explicit contracts
- visible observability and release thinking
- explainable architectural decisions
