# QR-Incheck

Compacte demo-opdracht voor QR-gebaseerde check-in en check-out met `Symfony`, een opgesplitste `React` frontend-monorepo, `MySQL`, `PHP 8.5` en `Docker`.

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
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica en kritieke UI/API-flow

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
- `Docker` voor consistente runtime

De focus ligt op denken en structureren, niet op infrastructuurcomplexiteit.

## Structuur

- `backend/`: Symfony API, domeinlogica, entities, tests, migrations
- `frontend/`: npm workspace met `scanner-app`, `admin-app`, `employee-app` en gedeelde frontend-code
- `compose.yaml`: containers voor scanner, admin, employee, backend en database
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
4. Log in als medewerker in Employee App om eigen badge en status te bekijken

## API-overzicht

- `POST /api/auth/login`: login met demo-account
- `GET /api/auth/me`: huidige gebruiker en gekoppelde medewerker
- `GET /api/employees/me/status`: eigen check-instatus en laatste klokmoment
- `POST /api/scan`: check-in / check-out, alleen voor scannerverkeer met `X-DEVICE-TOKEN` en rate limiting per device
- `GET /api/employees`: teamoverzicht
- `GET /api/employees/{id}/history`: historie
- `POST /api/employees/{id}/regenerate-qr`: badge-rotatie

## Demo-codes

- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Waarom de `.env` Bewust Is Geexposed

De `.env` is onderdeel van de repository om het project direct reproduceerbaar te maken zonder extra configuratie.

Dit maakt het mogelijk om:

- De end-to-end flow direct te testen
- De interactie tussen frontend en backend te begrijpen
- Kritieke UI/API-flows te valideren zonder setup-frictie

De waarden bevatten uitsluitend dummy data en lokale configuratie.

In productie zou dit worden vervangen door secure secrets management.

## Bewuste keuzes

- Scanner-app start camera automatisch en houdt handmatige badge-invoer als fallback
- MySQL voor runtime, SQLite voor tests
- Focus op productlogica boven UI polish
- JWT-authenticatie voor admin/medewerker en apart device-token plus rate limiting voor scanner
- Demo-data wordt automatisch gezaaid bij een lege database om de app direct bruikbaar te maken

## Richting productie

- Autorisatie en rollen verder aanscherpen
- Clock events koppelen aan echte locaties
- API-contracten formaliseren
- Historie en auditability uitbreiden
