# QR-Incheck

Compacte demo voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

Het doel van deze repo is niet om een volledige workforce-oplossing neer te zetten, maar om in korte tijd een geloofwaardige verticale slice te laten zien: badge tonen, klokken, historie tonen en teamstatus beheren.

## Wat deze demo laat zien
- Werkende end-to-end check-in/check-out flow
- Backend als bron van waarheid voor businessregels en productdata
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica en kritieke UI/API-flow


## Architectuurkeuzes
- **Feature-based structuur**
  Backend is opgesplitst in `Clocking` en `Employees`. Frontend is opgesplitst in `app`, `modules` en `shared`.
- **Backend-owned productdata**
  Profielinformatie, historie, weektotalen en actieve sessie komen uit de API. De frontend verzint deze data niet.
- **Pragmatische verticale slice**
  Eerst de kernflow, daarna scherpere boundaries en eerlijkere contracts.
- **Conventioneel waar dat helpt**
  Symfony + Doctrine op de backend, React + Vite op de frontend, Docker voor lokale runtime.

## Structuur
- `backend/`
  Symfony API, domeinlogica, Doctrine entities/repositories, migrations en tests
- `frontend/`
  React-app voor badge, historie en teamoverzicht
- `compose.yaml`
  Losse containers voor frontend, backend en database
- `memory-bank/`
  Werkcontext en ontwerpprincipes voor deze demo

## Demo-flow
1. Kies een medewerker en toon de badge
2. Registreer een klokmoment via de badgecode
3. Bekijk medewerker-specifieke historie en samenvatting
4. Bekijk teamstatus en roteer een badgecode

## API-overzicht
- `POST /api/scan`
  Verwerkt een badgecode als check-in of check-out
- `GET /api/employees`
  Teamoverzicht met status, profieldata en laatste klokmoment
- `GET /api/employees/{id}/history`
  Medewerker-specifieke historie en samenvatting
- `POST /api/employees/{id}/regenerate-qr`
  Roteert de actieve badgecode

## Snel starten
De eenvoudigste manier om de demo consistent lokaal te draaien is via Docker:

```bash
docker compose up --build
docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
docker compose exec backend php bin/console doctrine:fixtures:load --append --no-interaction
```

Open daarna:
- frontend: `http://localhost:8081`
- backend API: `http://localhost:8082`

## Demo-codes
- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Bewuste keuzes
- Camera-scanning is niet gebouwd; de scanflow is gesimuleerd via badgecode-input
- MySQL wordt gebruikt voor runtime, SQLite voor snelle en geisoleerde tests
- Productwaarheid is belangrijker dan extra schermen of flashy UI
- Redis, uitgebreide autorisatie en enterprise-hardening zijn bewust geen onderdeel van v1

## Wat ik als eerste zou verbeteren richting productie
- Autorisatie en rollen expliciet maken
- Clock events koppelen aan echte terminals/locaties in plaats van employee-level locatie
- API-contracten verder formaliseren met expliciete response models
- Historie, auditability en foutsemantiek verder aanscherpen
