# QR-Incheck

Compacte demo voor QR-gebaseerde check-in en check-out met `Symfony`, `React`, `MySQL` en `Docker`.

## Wat het laat zien
- Een werkende verticale slice: scan, valideren, registreren, terugkoppelen
- Domeinlogica op de backend als bron van waarheid
- Kleine beheerflow voor QR-regeneratie
- Gerichte tests op business rules en kritieke API/front-end flow

## Lokale run
```bash
cd app
composer install
npm install
npm run build
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
symfony server:start
```

Of via Docker:
```bash
docker compose up --build
docker compose exec app php bin/console doctrine:migrations:migrate --no-interaction
docker compose exec app php bin/console doctrine:fixtures:load --append --no-interaction
```

Open daarna `http://localhost:8000` lokaal of `http://localhost:8081` via Docker.

## Demo-codes
- `ALICE-DEMO-001`
- `BOB-DEMO-002`
- `CHARLIE-DEMO-003`

## Bewuste keuzes
- Scanflow is handmatige code-invoer in plaats van live camera-scanning
- MySQL voor runtime, SQLite voor snelle en geïsoleerde tests
- Redis is bewust niet gebouwd in v1

## Buiten scope
- Volledige autorisatie
- Complete enterprise-hardening
- Grote feature breadth of uitgebreide documentatie
