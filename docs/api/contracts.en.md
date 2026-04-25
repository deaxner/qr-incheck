# API Contracts

This repository treats backend responses as explicit contracts. The leading source is the combination of typed DTOs in `backend/src/**/Dto`, controller tests in `backend/tests/Controller/ApiControllerTest.php`, and the fixed payload shapes below.

## Contract Principles

- every success response on critical read and write endpoints comes from a dedicated view or DTO
- every error response follows the same `ApiProblem` model with `code`, `message`, and `requestId`
- clients can rely on stable field names; breaking changes require an ADR or an explicit versioning decision
- responses carry `X-Contract-Version: 2026-04` as the marker for the current contract baseline
- responses carry `X-Response-Time-Ms` for request-level latency observation
- responses carry `X-Trace-Id`; `traceparent` may also be returned for correlation with tracing backends

## Error Model

All application-level 4xx and 5xx style errors use this shape:

```json
{
  "code": "invalid_request",
  "message": "Provide a valid QR code.",
  "requestId": "4d8d4a4d7b5d4a15b5d954d18bdb1ac3"
}
```

`requestId` is also returned as the `X-Request-Id` header for correlation with logs, incident notes, and support flows. In tracing-enabled runtimes the same flow is also visible through `X-Trace-Id` and `traceparent`.

## Critical Endpoint Contracts

### `POST /api/auth/login`

Success:

```json
{
  "token": "jwt",
  "user": {
    "id": "admin-bob",
    "email": "bob.admin@timesignal.demo",
    "name": "Bob de Vries",
    "role": "admin",
    "employeeId": 2
  }
}
```

Errors:

- `400 invalid_request`
- `401 invalid_credentials`

Response headers:

- `X-Request-Id`
- `X-Contract-Version`
- `X-Response-Time-Ms`
- `X-Trace-Id`
- `traceparent`

### `GET /api/auth/me`

Success:

```json
{
  "user": {
    "id": "demo-admin-bob",
    "email": "bob.admin@timesignal.demo",
    "name": "Bob de Vries",
    "role": "admin",
    "employeeId": 2
  },
  "employee": {
    "id": 2,
    "name": "Bob de Vries",
    "qrCode": "BOB-DEMO-002",
    "profile": {
      "department": "Operations",
      "employmentType": "Shift-based",
      "location": "North Lobby"
    }
  }
}
```

### `POST /api/scan`

Request:

```json
{
  "code": "ALICE-DEMO-001"
}
```

Success:

```json
{
  "action": "checked_in",
  "timestamp": "2026-04-24 13:37:00 UTC",
  "employee": {
    "id": 1,
    "name": "Alice Janssen",
    "qrCode": "ALICE-DEMO-001",
    "profile": {
      "department": "Product Engineering",
      "employmentType": "Full-time",
      "location": "Main Entrance"
    }
  }
}
```

Errors:

- `400 invalid_request`
- `401 invalid_device_token`
- `404 unknown_qr_code`
- `429 rate_limited`

### `GET /api/employees`

Success is a list of `EmployeeOverviewView` records with:

- `id`
- `name`
- `qrCode`
- `status`
- `statusLabel`
- `lastActionAt`
- `profile.department`
- `profile.employmentType`
- `profile.location`

### `GET /api/employees/{id}/history` and `GET /api/employees/me/history`

Success:

```json
{
  "employee": {
    "id": 1,
    "name": "Alice Janssen",
    "qrCode": "ALICE-DEMO-001",
    "status": "IN",
    "statusLabel": "Checked in",
    "lastActionAt": "2026-04-24 13:37:00 UTC",
    "profile": {
      "department": "Product Engineering",
      "employmentType": "Full-time",
      "location": "Main Entrance"
    }
  },
  "summary": {
    "weekMinutes": 480,
    "activeSessionMinutes": 42
  },
  "entries": [
    {
      "id": "time-entry-id",
      "action": "checked_in",
      "timestamp": "2026-04-24 13:37:00 UTC",
      "location": "Main Entrance",
      "state": "IN",
      "stateLabel": "Checked in"
    }
  ]
}
```

### `GET /healthz`

Success:

```json
{
  "status": "ok",
  "service": "qr-incheck-backend",
  "timestamp": "2026-04-24T13:37:00+00:00",
  "requestId": "4d8d4a4d7b5d4a15b5d954d18bdb1ac3",
  "dependencies": {
    "database": {
      "status": "up"
    },
    "realtime": {
      "status": "configured",
      "enabled": true
    }
  }
}
```

Headers:

- `X-Request-Id`
- `X-Contract-Version`
- `X-Response-Time-Ms`
- `X-Trace-Id`
- `traceparent`

### `GET /metrics`

Success returns Prometheus-compatible plain text.

Examples of exported series:

- `qr_http_requests_total`
- `qr_http_response_time_ms`
- `qr_auth_login_attempts_total`
- `qr_scan_requests_total`
- `qr_badge_rotations_total`
