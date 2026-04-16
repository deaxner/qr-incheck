# QR-Incheck

Compacte demo-opdracht voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

Het doel van deze repo is nadrukkelijk niet om een volledige workforce-oplossing neer te zetten. Dit is een afgebakende demo-opdracht waarin ik in beperkte tijd wilde laten zien hoe ik een geloofwaardige verticale slice opzet, keuzes onderbouw en scope bewust klein houd: badge tonen, klokken, historie tonen en teamstatus beheren.

## Wat deze demo laat zien
- Werkende end-to-end check-in/check-out flow
- Backend als bron van waarheid voor businessregels en productdata
- Kleine beheerflow voor badge-rotatie
- Gerichte tests op kernlogica en kritieke UI/API-flow


## Architectuurkeuzes
Omdat dit een demo-opdracht is, heb ik bewust gekozen voor een modulaire monolith. De backend en frontend draaien los van elkaar, maar vormen samen nog steeds een compacte applicatie die je lokaal eenvoudig kunt starten, debuggen en uitleggen. Voor een opdracht als deze is dat een betere keuze dan te vroeg nadenken in services, queues of andere extra infrastructuur.

De structuur is feature-first opgezet. In de backend zie je dat terug in domeinen als `Clocking` en `Employees`; in de frontend in `app`, `modules` en `shared`. Dat helpt juist in een demo-context: je ziet snel waar gedrag hoort en welke onderdelen samen een use-case vormen, in plaats van dat alles verspreid raakt over algemene mappen als controllers, services en helpers.

Een tweede bewuste keuze is dat de backend eigenaar is van de productwaarheid. Status, historie, weektotalen en badgegegevens komen uit de API en worden niet door de frontend bij elkaar bedacht. Dat maakt de demo misschien iets minder een snelle mock, maar wel veel eerlijker: wat je in de UI ziet, is gebaseerd op echte applicatielogica in plaats van op slim geassembleerde placeholder-data.

Ik heb verder vooral conventionele technologie gekozen waar dat helpt: `Symfony` en `Doctrine` voor de API, `React` en `Vite` voor de UI, en `Docker` voor een consistente lokale runtime. In een demo-opdracht wil ik namelijk vooral laten zien hoe ik denk, structureer en afweeg, niet hoeveel extra infrastructuur ik kan optuigen.

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
