# QR-Incheck

Compacte demo-opdracht voor QR-gebaseerde check-in en check-out met `Symfony`, een opgesplitste `React` frontend-monorepo, `MySQL`, `PHP 8.5` en `Docker`.

Compact demo assignment for QR-based check-in and check-out built with `Symfony`, a split `React` frontend monorepo, `MySQL`, `PHP 8.5`, and `Docker`.

Deze repository documenteert dezelfde applicatie volledig in twee talen.
This repository fully documents the same application in two languages.

## Documentatie

- Nederlands:
  - Overzicht: [docs/README.nl.md](./docs/README.nl.md)
  - Applicatiegids: [docs/application.nl.md](./docs/application.nl.md)
- English:
  - Index: [docs/README.en.md](./docs/README.en.md)
  - Application guide: [docs/application.en.md](./docs/application.en.md)

Het doel van deze repo is nadrukkelijk niet om een volledige workforce-oplossing neer te zetten. Dit is een afgebakende demo-opdracht waarin ik in beperkte tijd laat zien hoe ik een geloofwaardige verticale slice opzet, keuzes onderbouw en scope bewust klein houd.

## Installatie

De demo is opgezet om met minimale stappen te draaien. De enige vereiste is een werkende Docker-installatie.

### Vereisten

- Docker
- Docker Compose
- PHP `8.5.x` voor lokale backend-tests

### Lokale PHP-tests

De backend-tests draaien lokaal op `PHP 8.5` met `pdo_sqlite` en `sqlite3` ingeschakeld.

Controleer lokaal:

```bash
php -v
php -m
php bin/phpunit
```

### Starten

```bash
docker compose up --build
```

Geen extra setup nodig.

Bij de eerste start voert de backend automatisch migraties uit en seedt hij demo-data als de database nog leeg is.

Voor de volledige observability stack:

```bash
docker compose --profile observability up --build
```

### Toegang

- Scanner App: `http://localhost:8081`
- Backend: `http://localhost:8082`
- Admin App: `http://localhost:8083`
- Employee App: `http://localhost:8084`

### Stoppen

```bash
docker compose down
```

## Demo-login

Log direct in via het login-scherm met een van deze accounts:

- Admin: `bob.admin@timesignal.demo` / `Admin123!`
- Medewerker: `alice@timesignal.demo` / `User123!`

De admin gebruikt de Admin App voor teamoverzicht, historie en badge-rotatie.

De medewerker gebruikt de Employee App voor de eigen badge en huidige incheckstatus.

## Wat Deze Demo Laat Zien

- Werkende multi-client demo met scanner-, admin- en employee-app
- Camera-first scanner kiosk met handmatige fallback
- In-product login met demo-accounts voor admin en medewerker
- Backend als bron van waarheid voor businessregels en productdata
- Device-token beveiligde scannerflow met rate limiting per device
- Live updates via Mercure in admin- en employee-app
- Admin console met live activity feed voor scans en badgevernieuwing
- Dedicated admin-activiteitstopic voor een realtime operations wall
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica, kritieke UI/API-flow en contract-/operability-basics

## Architectuurkeuzes

Dit project is opgezet als een modulaire monolith met meerdere frontend-clients. Backend en frontends draaien los, maar vormen samen een compacte applicatie die lokaal eenvoudig te starten en te begrijpen is.

De structuur is feature-first:

- Backend: domeinen zoals `Clocking`, `Employees` en `Auth`
- Frontend: `apps/*` en `shared/*`

De backend is bewust de bron van waarheid:

- Status, historie en teamdata komen uit de API
- De frontend assembleert geen eigen businesslogica

Technologiekeuzes zijn bewust conventioneel gehouden:

- `Symfony` + `Doctrine`
- `React` + `Vite`
- `Mercure` voor realtime UI-updates
- `Docker` voor consistente runtime

De focus ligt op denken en structureren, niet op infrastructuurcomplexiteit.

## Structuur

- `backend/`: Symfony API, domeinlogica, entities, tests, migrations
- `frontend/`: npm workspace met `scanner-app`, `admin-app`, `employee-app` en gedeelde frontend-code
- `compose.yaml`: containers voor scanner, admin, employee, backend, Mercure en database
- `ops/`: Prometheus, Alertmanager, OTel Collector, Grafana en smoke-test artefacten
- `docs/adr/`: vastgelegde architectuurbesluiten
- `memory-bank/`: ontwerpprincipes, context en v2-doelarchitectuur

## V2-richting

De beoogde volgende stap staat uitgewerkt in [memory-bank/v2-target-architecture.md](./memory-bank/v2-target-architecture.md).

De kern van die richting:

- van een frontend naar drie aparte clients: scanner, admin en employee
- een gedeelde Symfony backend als bron van waarheid
- verplichte shared frontend-laag voor API, types, utils en UI
- aanvullende `/me/*` endpoints en device-beveiliging voor scanverkeer

## Demo-flow

1. Gebruik Scanner App om een badgecode via camera of handmatige fallback te registreren
2. Log in als admin in Admin App
3. Bekijk als admin historie en teamstatus of roteer badges
4. Bekijk live statusupdates in Admin App en Employee App zodra scans of badge-rotaties plaatsvinden
5. Log in als medewerker in Employee App om eigen badge, status en persoonlijke historie te bekijken

## API-overzicht

- `POST /api/auth/login`: login met demo-account
- `GET /api/auth/me`: huidige gebruiker en gekoppelde medewerker
- `GET /api/employees/me/status`: eigen check-instatus en laatste klokmoment
- `GET /api/employees/me/history`: eigen historie en weekoverzicht
- `POST /api/scan`: check-in / check-out, alleen voor scannerverkeer met `X-DEVICE-TOKEN` en rate limiting per device
- `GET /api/employees`: teamoverzicht
- `GET /api/employees/{id}/history`: historie
- `POST /api/employees/{id}/regenerate-qr`: badge-rotatie
- `GET /healthz`: machine-leesbare readiness check met dependencystatus en `requestId`
- `GET /metrics`: Prometheus-achtige metrics-export voor backend-signalen

Volledige contractbeschrijving staat in [docs/api/contracts.md](./docs/api/contracts.md).

## Demo-codes

- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Omgevingsconfiguratie

De repository commit geen actieve backend-`.env` bestanden meer.

Voor lokaal werken buiten Docker:

- gebruik [backend/.env.example](./backend/.env.example) als sjabloon
- zet je eigen overrides in `backend/.env.local`

De Docker Compose stack levert de benodigde backend-omgeving al via `compose.yaml`, dus voor de standaard demo-flow is geen extra `.env` setup nodig.

## Bewuste keuzes

- Scanner-app start camera automatisch en houdt handmatige badge-invoer als fallback
- MySQL voor runtime, SQLite voor tests
- Focus op productlogica boven UI polish
- JWT-authenticatie voor admin/medewerker en apart device-token plus rate limiting voor scanner
- Mercure voor zichtbare realtime updates zonder custom websocket-infrastructuur
- Demo-data wordt automatisch gezaaid bij een lege database om de app direct bruikbaar te maken

## Production Baseline

Deze repository blijft bewust demo-first, maar bevat nu wel expliciete basismaatregelen die production-discipline aantoonbaar maken:

- formele endpoint-contracten en uniform foutmodel in [docs/api/contracts.md](./docs/api/contracts.md)
- `X-Request-Id`, `X-Contract-Version` en `X-Response-Time-Ms` op responses
- `GET /healthz` voor readiness en dependencystatus
- `GET /metrics` voor telbare operationele signalen
- gestructureerde operationele events via Monolog-kanalen voor `http`, `security` en `audit`
- OpenTelemetry traces via OTLP export naar een collector en Jaeger backend
- Grafana provisioning voor Prometheus, Jaeger en Alertmanager
- lokale alert delivery via Alertmanager webhook receiver
- security headers op backend-responses
- backend healthcheck in Docker Compose
- voorbeeld Prometheus scrape- en alertconfig in `ops/prometheus/`

Wat nog expliciet buiten de huidige scope valt:

- metrics, tracing, alerting-backends en runbooks op platformniveau
- migratie- en rollbackstrategie over meerdere onafhankelijke releases
- formele load-/stress-test rapporten en latency-SLO's
- secret management, dependency scanning en policy gates buiten demo-config

De huidige production baseline staat uitgewerkt in [docs/operations/production-baseline.md](./docs/operations/production-baseline.md). De technische standaarden en het operating model staan in [docs/operations/engineering-standards.md](./docs/operations/engineering-standards.md) en [docs/operations/operating-model.md](./docs/operations/operating-model.md). De bredere vervolgrichting blijft beschreven in [ADR 0003](./docs/adr/0003-demo-scope-en-production-readiness-roadmap.md).

## CI Gates

De repository bevat een GitHub Actions pipeline in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) met deze minimale gates:

- backend dependency/config-validatie
- Symfony container- en YAML-lint
- Doctrine mapping-validatie
- MySQL migration smoke-test
- backend test-suite
- frontend workspace tests
- frontend productiebuilds
- docker compose-config validatie
- deployed smoke-test tegen draaiende containers met health, metrics, login, scan en trace-export checks

Een compacte release- en rollbackvolgorde staat in [docs/operations/release-runbook.md](./docs/operations/release-runbook.md).
