# Release Runbook

Deze runbook houdt de releasevolgorde bewust klein en concreet voor deze repository. Het doel is niet volledige platformautomatisering te simuleren, maar wel expliciet te maken hoe deploy-, migratie- en verificatiestappen in de juiste volgorde horen te lopen.

## Pre-merge gates

- CI moet groen zijn
- backend gates:
  - Composer-validatie
  - Symfony container- en YAML-lint
  - Doctrine mapping-validatie
  - MySQL migration smoke-test
  - PHPUnit
- frontend gates:
  - workspace tests
  - productiebuilds
- infrastructure gate:
  - `docker compose config`
- deployed-environment smoke gate:
  - draai containers met observability-profiel
  - valideer health, metrics, login, scan en trace-zichtbaarheid in Jaeger

## Releasevolgorde

1. valideer dat de target-omgeving gezond is op infra-niveau
2. valideer dat metrics-, trace- en alert-backends bereikbaar zijn
3. voer database-migraties uit
4. deploy de backend
5. wacht tot `/healthz` groen is
6. voer een smoke-journey uit op login en scan
7. bevestig dat traces zichtbaar worden in Jaeger en dat Prometheus scrape op `/metrics` slaagt
8. laat pas daarna afhankelijke clients nieuw verkeer accepteren
9. controleer alertsignalen op afwijkende login-/scanfouten en rate limits

## Verificatie na release

- `GET /healthz` retourneert `ok`
- Prometheus scrape op `/metrics` slaagt
- `qr_http_requests_total` loopt op
- de requesttrace van de smoke-journey verschijnt in Jaeger voor service `qr-incheck-backend`
- er is geen onverwachte piek in:
  - `qr_auth_login_attempts_total{outcome="invalid_credentials"}`
  - `qr_scan_requests_total{outcome="rate_limited"}`
- kritieke user journeys blijven werken:
  - admin login
  - scan check-in/check-out
  - badge-rotatie

## Rollback-denken

- rollback start bij impactanalyse, niet bij reflexmatig terugdraaien
- schema-first wijzigingen moeten compatibel zijn met de direct volgende appversie
- bij backend regressie zonder schema-conflict:
  - rol backend terug
  - controleer health en metrics opnieuw
- bij migratieconflict:
  - stop verdere rollout
  - beoordeel of forward-fix veiliger is dan directe `down()`-migratie
  - gebruik `down()` alleen wanneer dat vooraf expliciet als veilig is beoordeeld

## Wat deze runbook bewust nog niet doet

- canary- of blue/green-rollout
- automatische rollback
- paging- of incidentmanagement-integratie
- long-term metrics storage of formele SLO-bewaking

De repo laat hiermee wel de juiste volgorde en verantwoordelijkheden zien, zonder te doen alsof er al een volledig platform omheen staat.
