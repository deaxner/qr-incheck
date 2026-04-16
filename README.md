# QR-Incheck

Compacte demo-opdracht voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

Het doel van deze repo is nadrukkelijk niet om een volledige workforce-oplossing neer te zetten. Dit is een afgebakende demo-opdracht waarin ik in beperkte tijd laat zien hoe ik een geloofwaardige verticale slice opzet, keuzes onderbouw en scope bewust klein houd.

## Installatie

De demo is opgezet om met minimale stappen te draaien. De enige vereiste is een werkende Docker-installatie.

### Vereisten

- Docker
- Docker Compose (meestal inbegrepen bij Docker Desktop)

### Starten

```bash
docker compose up --build
```

### Database initialiseren (eenmalig)

```bash
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
docker compose exec backend php bin/console doctrine:fixtures:load --append --no-interaction
```

### Toegang

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8082`

### Stoppen

```bash
docker compose down
```

Geen extra setup nodig, alleen Docker Compose.

## Waarom de `.env` bewust is geëxposed

In dit demo project is de `.env` bewust zichtbaar gemaakt om de nadruk te leggen op functionaliteit, reproduceerbaarheid en transparantie, in plaats van productiebeveiliging.

### Doel

- **Snelle reproduceerbaarheid**
  - Het project kan direct worden gedraaid zonder extra configuratie
  - Geen afhankelijkheid van handmatig ingestelde environment variables

- **Focus op kernfunctionaliteit**
  - Werkende end-to-end check-in/check-out flow
  - Backend als bron van waarheid voor businessregels en productdata
  - Kleine beheerflow voor badge-rotatie

- **Transparantie**
  - Inzicht in hoe services met elkaar communiceren
  - Duidelijke configuratie van API’s en afhankelijkheden
  - Begrijpbare dataflow tussen frontend en backend

- **Ondersteuning van testen**
  - Gerichte tests op kernlogica
  - Validatie van kritieke UI/API flows zonder extra setup

### Belangrijke nuance

De `.env` bevat uitsluitend dummy- of testgegevens en vormt geen securityrisico.

In een productieomgeving zouden environment variables **nooit** in de repository staan, maar veilig worden beheerd via bijvoorbeeld:
- CI/CD secrets
- Secret management tools (zoals vaults)
- Server-side configuratie


## Wat deze demo laat zien

- Werkende end-to-end check-in/check-out flow
- Backend als bron van waarheid voor businessregels en productdata
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica en kritieke UI/API-flow

## Architectuurkeuzes

Dit project is opgezet als een modulaire monolith. Backend en frontend draaien los, maar vormen samen een compacte applicatie die lokaal eenvoudig te starten en te begrijpen is.

De structuur is feature-first:

- Backend: domeinen zoals `Clocking` en `Employees`
- Frontend: `app`, `modules`, `shared`

De backend is bewust de bron van waarheid:

- Status, historie en weektotalen komen uit de API
- De frontend assembleert geen eigen businesslogica

Technologiekeuzes zijn bewust conventioneel gehouden:

- `Symfony` + `Doctrine`
- `React` + `Vite`
- `Docker` voor consistente runtime

De focus ligt op denken en structureren, niet op infrastructuurcomplexiteit.

## Structuur

- `backend/`: Symfony API, domeinlogica, entities, tests
- `frontend/`: React-app voor badge, historie en teamoverzicht
- `compose.yaml`: containers voor frontend, backend en database
- `memory-bank/`: ontwerpprincipes en context

## Demo-flow

1. Kies een medewerker en toon de badge
2. Registreer een klokmoment via de badgecode
3. Bekijk historie en samenvatting
4. Bekijk teamstatus en roteer badge

## API-overzicht

- `POST /api/scan`: check-in / check-out
- `GET /api/employees`: teamoverzicht
- `GET /api/employees/{id}/history`: historie
- `POST /api/employees/{id}/regenerate-qr`: badge-rotatie

## Demo-codes

- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Waarom de `.env` bewust is geexposed

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
- Geen Redis, auth of enterprise-hardening in v1

## Richting productie

- Autorisatie en rollen toevoegen
- Clock events koppelen aan echte locaties
- API-contracten formaliseren
- Historie en auditability uitbreiden
