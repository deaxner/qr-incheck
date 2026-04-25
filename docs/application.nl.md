# Applicatiegids

## Doel

QR-Incheck is een compacte demo-applicatie voor QR-gebaseerde check-in en check-out. De applicatie laat een geloofwaardige verticale slice zien van een workforce-achtig product met drie clients, een Symfony-backend als system of record en een kleine maar expliciete production baseline.

## Functioneel overzicht

De applicatie ondersteunt deze hoofdflows:

- badge scannen via een kioskachtige scanner-app
- check-in en check-out registreren op basis van een badgecode
- admin-login voor teamoverzicht, historie en badge-rotatie
- employee-login voor self-service, eigen badge en eigen historie
- live updates via Mercure voor admin- en employee-schermen

## Componenten

### Frontend-clients

- `scanner-app`: untrusted edge client voor badge-invoer, camera-gebruik en handmatige fallback
- `admin-app`: privileged client voor teamstatus, historie, badge-rotatie en live activity
- `employee-app`: least-privilege client voor eigen status, badge en persoonlijke historie

### Backend

De backend is gebouwd in `Symfony` en blijft de bron van waarheid voor:

- auth-beslissingen
- scanuitkomsten
- teamstatus
- medewerkerhistorie
- contractstabiliteit
- realtime publicatie van domeingebeurtenissen

### Ondersteunende infrastructuur

- `MySQL` voor runtime data
- `Mercure` voor realtime updates
- `Prometheus` voor metrics scraping
- `Alertmanager` voor alert delivery
- `OpenTelemetry Collector` voor trace-export
- `Jaeger` als trace-backend
- `Grafana` voor dashboards

## Architectuur

De repo volgt een modulaire monolith met feature-first structuur:

- backend-features zitten primair onder `Auth`, `Clocking`, `Employees`, `Realtime` en `Shared`
- frontend-apps zitten onder `frontend/apps/*`
- gedeelde frontend-contracten en hulplogica zitten onder `frontend/shared/*`

Belangrijke architectuurkeuzes:

- businessregels leven in de backend en niet in de clients
- scannerverkeer gebruikt een device-token en geen normale user-login
- realtime is UX-ondersteunend maar niet de primaire bron van waarheid
- endpoint-contracten worden als expliciete artefacten behandeld

Zie voor de rationale:

- [ADR 0001](./adr/0001-feature-based-monolith-en-backend-owned-productwaarheid.md)
- [ADR 0002](./adr/0002-multi-client-frontend-met-gedeelde-contractlaag-en-gescheiden-toegang.md)
- [ADR 0003](./adr/0003-demo-scope-en-production-readiness-roadmap.md)

## Domeinmodel

De belangrijkste domeinbegrippen zijn:

- `Employee`: medewerker met profielinformatie en QR-code
- `TimeEntry`: klokmoment dat check-in of check-out vastlegt
- `User`: login-identiteit voor admin of medewerker
- scanner device: technische actor die scans naar `/api/scan` stuurt

Belangrijke domeinservices:

- `ScanService`: bepaalt check-in of check-out op basis van badgecode en huidige status
- `EmployeeOverviewService`: levert backend-owned teamstatus
- `EmployeeHistoryService`: bouwt historie en samenvattingen op
- `QrCodeRotationService`: voert badge-rotatie uit

## Authenticatie en autorisatie

Er zijn twee toegangsmodellen:

- user-auth via JWT voor admin- en employee-flows
- device-auth via `X-DEVICE-TOKEN` voor scannerverkeer

Security-invarianten:

- scannerrechten erven niet impliciet uit admin- of employee-sessies
- backend-responses dragen security headers
- rate limiting beschermt het scan-write-pad tegen bursts en misuse

## API

Belangrijkste endpoints:

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

De formele contracten staan in [api/contracts.md](./api/contracts.md). De Engelstalige equivalent staat in [api/contracts.en.md](./api/contracts.en.md).

## Observability

De applicatie exposeert operationele signalen via:

- `X-Request-Id` voor requestcorrelatie
- `X-Contract-Version` voor contractbaseline
- `X-Response-Time-Ms` voor eenvoudige latency-observatie
- `X-Trace-Id` en `traceparent` voor trace-correlatie
- Monolog-kanalen `http`, `security` en `audit`
- `/healthz` voor readiness
- `/metrics` voor Prometheus-compatibele metrics
- OTLP-export naar collector en Jaeger

De operationele standaard en baseline staan in:

- [operations/production-baseline.md](./operations/production-baseline.md)
- [operations/engineering-standards.md](./operations/engineering-standards.md)
- [operations/operating-model.md](./operations/operating-model.md)
- [operations/release-runbook.md](./operations/release-runbook.md)

## Lokale ontwikkeling

### Vereisten

- Docker
- Docker Compose
- PHP `8.5.x` voor lokale backend-tests

### Starten

```bash
docker compose up --build
```

Voor de volledige observability stack:

```bash
docker compose --profile observability up --build
```

### Toegang

- Scanner App: `http://localhost:8081`
- Backend: `http://localhost:8082`
- Admin App: `http://localhost:8083`
- Employee App: `http://localhost:8084`
- Grafana: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Alertmanager: `http://localhost:9093`
- Jaeger: `http://localhost:16686`

### Stoppen

```bash
docker compose down
```

## Demo-accounts en codes

### Loginaccounts

- Admin: `bob.admin@timesignal.demo` / `Admin123!`
- Medewerker: `alice@timesignal.demo` / `User123!`

### Demo-badges

- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Test- en quality gates

De repository bevat geautomatiseerde checks voor:

- Composer-validatie
- Symfony container- en YAML-lint
- Doctrine mapping-validatie
- MySQL migration smoke-test
- backend PHPUnit-suite
- frontend tests
- frontend builds
- `docker compose config`
- deployed smoke-test tegen draaiende containers

De CI-workflow staat in [../.github/workflows/ci.yml](../.github/workflows/ci.yml).

## Bekende scopegrenzen

Dit project is bewust demo-first. Dat betekent:

- geen volledige workforce-suite
- geen formele SLO's of load-test rapporten
- geen productie-secrets management in deze repo
- geen volledige platformgovernance buiten de applicatiegrens

De demo claimt wel:

- heldere system-of-record grenzen
- expliciete contracts
- zichtbare observability en release-denken
- uitlegbare architectuurkeuzes
