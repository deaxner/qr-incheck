# API Contracts

Deze repository behandelt backend-responses als expliciete contracts. De leidende bron daarvoor is de combinatie van typed DTO's in `backend/src/**/Dto`, controller-tests in `backend/tests/Controller/ApiControllerTest.php` en onderstaande vaste payload-shapes.

## Contractprincipes

- iedere succesresponse op kritieke read- en write-endpoints komt uit een dedicated view/DTO
- iedere foutresponse volgt hetzelfde `ApiProblem`-model met `code`, `message` en `requestId`
- clients mogen vertrouwen op stabiele veldnamen; breaking changes vragen een ADR of expliciete versie-afspraak
- responses dragen `X-Contract-Version: 2026-04` als expliciete marker voor de huidige contractbaseline
- responses dragen `X-Response-Time-Ms` voor eenvoudige latency-observatie op requestniveau
- responses dragen `X-Trace-Id`; daarnaast kan `traceparent` worden teruggegeven voor correlatie met tracing-backends

## Foutmodel

Alle 4xx/5xx-achtige applicatiefouten gebruiken deze shape:

```json
{
  "code": "invalid_request",
  "message": "Voer een geldige QR-code in.",
  "requestId": "4d8d4a4d7b5d4a15b5d954d18bdb1ac3"
}
```

`requestId` wordt ook teruggegeven als `X-Request-Id` header voor correlatie met logs, incidentnotities en supportflows.
Bij tracing-enabled runtimes wordt dezelfde requestflow daarnaast herkenbaar via `X-Trace-Id` en `traceparent`.

## Kritieke endpoint-contracten

### `POST /api/auth/login`

Succes:

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

Fouten:

- `400 invalid_request`
- `401 invalid_credentials`

Response headers:

- `X-Request-Id`
- `X-Contract-Version`
- `X-Response-Time-Ms`
- `X-Trace-Id`
- `traceparent`

### `GET /api/auth/me`

Succes:

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

Succes:

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

Fouten:

- `400 invalid_request`
- `401 invalid_device_token`
- `404 unknown_qr_code`
- `429 rate_limited`

### `GET /api/employees`

Succes is een lijst van `EmployeeOverviewView` records met:

- `id`
- `name`
- `qrCode`
- `status`
- `statusLabel`
- `lastActionAt`
- `profile.department`
- `profile.employmentType`
- `profile.location`

### `GET /api/employees/{id}/history` en `GET /api/employees/me/history`

Succes:

```json
{
  "employee": {
    "id": 1,
    "name": "Alice Janssen",
    "qrCode": "ALICE-DEMO-001",
    "status": "IN",
    "statusLabel": "Ingecheckt",
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
      "stateLabel": "Ingecheckt"
    }
  ]
}
```

### `GET /healthz`

Succes:

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

Succes geeft Prometheus-compatibele plain text terug.

Voorbeelden van geëxporteerde series:

- `qr_http_requests_total`
- `qr_http_response_time_ms`
- `qr_auth_login_attempts_total`
- `qr_scan_requests_total`
- `qr_badge_rotations_total`
