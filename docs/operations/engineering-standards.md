# Engineering Standards

Deze repository volgt een kleine maar expliciete set engineering-invarianten. Het doel is niet om een volledig platformhandboek te simuleren, maar om zichtbaar te maken welke technische standaarden leidend zijn zodra de demo verder wordt opgeschaald.

## API en contractdiscipline

- backend-owned contracts zijn leidend; frontend-clients reconstrueren geen status- of historiebetekenis
- elke kritieke succesresponse wordt gemodelleerd als DTO/view object, niet als ad-hoc array in controllers
- elke applicatiefout volgt hetzelfde `ApiProblem`-model
- responses dragen `X-Contract-Version`; breaking contractwijzigingen vragen een nieuwe versie of een expliciete compatibiliteitsafspraak

## Observability

- elke response draagt `X-Request-Id` en `X-Response-Time-Ms`
- elke response draagt `X-Trace-Id`; inkomende en uitgaande tracing-context gebruikt W3C `traceparent`
- backend logt request-completion events met `requestId`, route, statuscode en duur
- logging loopt via expliciete Monolog-kanalen: `http`, `security` en `audit`
- auth- en scanrejects worden als `security`-events gelogd, zodat rate limits, ongeldige tokens en malformed input zichtbaar blijven
- state-changing workflows zoals scanacceptatie en badge-rotatie worden als `audit`-events gelogd
- metrics worden minimaal geëxporteerd voor HTTP-volume/latency, login-uitkomsten, scan-uitkomsten en badge-rotaties
- voorbeeld alertregels horen rechtstreeks aan die metrics gekoppeld te zijn; de repo bevat een eerste baseline in `ops/prometheus/alert-rules.yml`
- tracing wordt via OTLP geëxporteerd naar een collector; de collector hoort traces door te zetten naar een querybare backend zoals Jaeger
- dashboards horen geprovisioneerd te worden vanuit repo-artefacten, niet handmatig in een UI
- testomgevingen mogen operationele event-emissie dempen via `APP_OPERATIONAL_LOGGING_ENABLED=0` om signal-to-noise hoog te houden
- `/healthz` is de minimale readiness probe; een endpoint telt alleen als gezond wanneer de database bereikbaar is

## Performance

- de scanflow is latency-critical en hoort budgetgedreven te worden behandeld
- richtbudget voor scannerverkeer binnen deze architectuur: p95 < 250 ms server-side bij normaal lokaal gebruik
- burstgedrag wordt begrensd voordat businesslogica draait via request throttling op device-token niveau
- read-model endpoints horen lineair uitlegbaar te blijven; zodra querycomplexiteit toeneemt zijn expliciete read-optimisaties of projections vereist

## Security

- scannerauth en userauth blijven gescheiden trust boundaries
- responses krijgen defensieve security headers, ook in demo-omgevingen
- tokens en secrets zijn in demo-config hardcoded voor reproduceerbaarheid; buiten demo-scope is secrets management verplicht, niet optioneel
- security hardening wordt behandeld als systeemgedrag, niet als alleen login-aanwezigheid

## Release en wijzigingsveiligheid

- schema-wijzigingen horen compatibel te zijn met de directe volgende applicatieversie, tenzij expliciet anders besloten
- health/readiness moet groen zijn voordat afhankelijke clients starten of verkeer accepteren
- rollback-denken begint bij contract- en schema-compatibiliteit, niet pas na productie-incidenten
- PR's horen minimaal backend dependency/config-validatie, backend tests, frontend tests en frontend productiebuilds te passeren
- PR's horen ook compose-config en Doctrine mapping-validatie te passeren
- MySQL-gerichte migrations horen in CI ook op een schone MySQL smoke database uitgevoerd te worden
- deployed smoke-tests horen na image-build tegen draaiende containers minimaal health, metrics, login, scan en tracezichtbaarheid te valideren
