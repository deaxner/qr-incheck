# ADR 0002: Multi-Client Frontend with Shared Contract Layer and Separate Access

- Status: Accepted
- Date: 2026-04-24

## Context

ADR 0001 established that this repository remains a feature-based monolith in which the backend owns business rules and product data.

Since then, the repository evolved from a single frontend into three separate clients:

- `scanner-app` for kiosk behavior and scan traffic
- `admin-app` for operational management
- `employee-app` for self-service

This split became necessary because the original frontend carried different responsibilities at once:

- scan interaction with device and camera-dependent behavior
- administrative management flows
- employee-oriented self-service

## Decision

We choose a multi-client frontend architecture in v2 with three separate apps on a shared Symfony backend, supported by a mandatory shared contract layer and an explicit separation between user and device access.

Concretely, this means:

- each frontend app has its own entry point, runtime, and user goal
- shared frontend code only flows through `frontend/shared/` and not through copy-paste between apps
- backend contracts remain authoritative for status, history, scan outcomes, and badge data
- scanner traffic remains technically distinct from admin and employee traffic
- realtime product status becomes visible through backend publication rather than frontend polling or local reconstruction

## Why This Choice

1. Separate clients make responsibilities explicit
2. A shared layer keeps the split affordable
3. Device traffic deserves its own access model
4. Realtime updates should be backend-driven

## Alternatives Considered

### 1. A Single Frontend with Role-Dependent Screens

Not chosen because the product surfaces are functionally too different.

### 2. Three Frontend Apps Without a Shared Layer

Not chosen because this repository is small enough to enforce consistency centrally.

### 3. Scan Traffic Through Normal JWT User Accounts

Not chosen because scanner traffic represents a different actor than an employee or admin.

## Consequences

Positive:

- responsibilities per client are directly readable
- shared frontend contracts remain maintainable in one place
- security boundaries between scanner, admin, and employee become more explicit
- realtime updates fit naturally into the product model

Negative:

- there are more frontend entry points and therefore more build and test surface
- shared code requires discipline so app-specific logic does not drift into the center
- backend contracts matter even more because multiple clients depend on them
