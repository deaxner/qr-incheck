# QR-Incheck

Compacte demo voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

## Wat het laat zien
- Een werkende verticale slice: badge tonen, klokken, registreren, terugkoppelen
- Domeinlogica op de backend als bron van waarheid
- Kleine beheerflow voor badgevernieuwing
- Gerichte tests op business rules en kritieke API/frontend-flow

## Structuur
- `backend/`: Symfony-app, domeinlogica, API, migrations, tests, templates
- `frontend/`: React/Vite-app voor badge, historie en teamoverzicht
- `compose.yaml`: lokale Docker-runtime voor frontend + backend + MySQL

## Lokale run
Eerste terminal:

```bash
cd backend
composer install
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --append --no-interaction
symfony server:start
```

Tweede terminal:

```bash
cd frontend
npm install
npm run build
```

Open daarna `http://localhost:8000`.

## Docker run
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
- Scanflow is handmatige code-invoer in plaats van live camera-scanning
- MySQL voor runtime, SQLite voor snelle en geisoleerde tests
- Redis is bewust niet gebouwd in v1

## Buiten scope
- Volledige autorisatie
- Complete enterprise-hardening
- Grote feature breadth of uitgebreide documentatie
