# QR-Incheck

Compacte demo-opdracht voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

Het doel van deze repo is nadrukkelijk niet om een volledige workforce-oplossing neer te zetten. Dit is een afgebakende demo-opdracht waarin ik in beperkte tijd laat zien hoe ik een geloofwaardige verticale slice opzet, keuzes onderbouw en scope bewust klein houd.

## Installatie

De demo is opgezet om met minimale stappen te draaien. De enige vereiste is een werkende Docker-installatie.

### Vereisten

- Docker
- Docker Compose

### Starten

```bash
docker compose up --build
```

Geen extra setup nodig.

Bij de eerste start voert de backend automatisch migraties uit en seedt hij demo-data als de database nog leeg is.

### Toegang

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8082`

### Stoppen

```bash
docker compose down
```

## Demo-login

Log direct in via het login-scherm met een van deze accounts:

- Admin: `bob.admin@timesignal.demo` / `Admin123!`
- Medewerker: `alice@timesignal.demo` / `User123!`

De admin ziet de volledige demo inclusief teamoverzicht, historie en badge-rotatie.

De medewerker ziet bewust alleen de eigen badge en huidige incheckstatus.

## Wat Deze Demo Laat Zien

- Werkende end-to-end check-in/check-out flow
- In-product login met demo-accounts
- Backend als bron van waarheid voor businessregels en productdata
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica en kritieke UI/API-flow

## Architectuurkeuzes

Dit project is opgezet als een modulaire monolith. Backend en frontend draaien los, maar vormen samen een compacte applicatie die lokaal eenvoudig te starten en te begrijpen is.

De structuur is feature-first:

- Backend: domeinen zoals `Clocking`, `Employees` en `Auth`
- Frontend: `app`, `modules`, `shared`

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
- `frontend/`: React-app voor login, badge, historie en teamoverzicht
- `compose.yaml`: containers voor frontend, backend en database
- `memory-bank/`: ontwerpprincipes en context

## Demo-flow

1. Log in als admin of medewerker
2. Registreer een klokmoment via de badgecode
3. Bekijk als admin historie en samenvatting
4. Bekijk als admin teamstatus en roteer badges

## API-overzicht

- `POST /api/auth/login`: login met demo-account
- `GET /api/auth/me`: huidige gebruiker en gekoppelde medewerker
- `POST /api/scan`: check-in / check-out
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

- Geen camera-scanning, input is gesimuleerd
- MySQL voor runtime, SQLite voor tests
- Focus op productlogica boven UI polish
- JWT-authenticatie is aanwezig, maar uitgebreide autorisatie en enterprise-hardening vallen buiten v1
- Demo-data wordt automatisch gezaaid bij een lege database om de app direct bruikbaar te maken

## Richting productie

- Autorisatie en rollen verder aanscherpen
- Clock events koppelen aan echte locaties
- API-contracten formaliseren
- Historie en auditability uitbreiden
