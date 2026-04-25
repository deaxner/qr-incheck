# Production Baseline

Deze demo claimt geen volledig uitgewerkt platform, maar bevat nu wel een minimale production baseline die zichtbaar in code en runtime aanwezig is.

## Operability en observability

- `GET /healthz` geeft een machine-leesbare readiness-indicatie terug voor de backend, inclusief databasecheck en realtime-configuratiestatus
- `GET /metrics` exporteert telbare backend-signalen in Prometheus-achtig tekstformaat
- iedere response krijgt een `X-Request-Id`; applicatiefouten echoen dezelfde waarde in het response-body contract
- iedere response krijgt ook `X-Contract-Version` en `X-Response-Time-Ms`
- iedere response krijgt ook `X-Trace-Id`; tracing-context wordt teruggegeven via `traceparent`
- backend emit operationele request-completion en reject-events via gestructureerde JSON logs
- backend exporteert OpenTelemetry traces via OTLP naar een collector die doorstuurt naar Jaeger
- kritieke API-flows zijn afgedekt met controller-tests op auth, autorisatie, rate limiting, scanflow en foutpaden
- de repo bevat concrete observability-backends en provisioning voor Prometheus, Alertmanager, Jaeger en Grafana in `ops/`
- voorbeeld dashboards en alertregels zijn direct gekoppeld aan de geexporteerde metrics en traces
- releasevolgorde en rollback-denken staan expliciet beschreven in `docs/operations/release-runbook.md`

## Security hardening

- scannerverkeer is gescheiden van user-auth via `X-DEVICE-TOKEN`
- burst-protectie op scanverkeer loopt via Symfony RateLimiter
- backend-responses krijgen vaste security headers: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` en `Permissions-Policy`
- auth- en scannerverkeer blijven gescheiden trust boundaries met eigen reject-signalen

## Performance en wijzigingsveiligheid

- de scanflow heeft expliciete burst-bescherming op requestniveau
- DTO-gebaseerde contracts reduceren accidental contract drift tussen backend en de drie frontend-clients
- migraties blijven lineair en reproduceerbaar via Docker startup en test-reset
- backend startup herprobeert migraties wanneer de database-container al healthy is maar nog niet direct verbinding accepteert
- clients starten in Compose pas nadat de backend healthy is
- de repository bevat nu CI-gates voor backend-validatie/tests en frontend test/build checks
- de repository valideert ook `docker compose config` en Doctrine mapping in CI
- de repository voert in CI een MySQL migration smoke-test uit op een schone database
- de repository voert ook een deployed smoke-test uit tegen draaiende containers inclusief health, metrics, login, scan en trace-zichtbaarheid in Jaeger

## Nog bewust buiten scope

- formele SLO's, latency-budgetten en load-test rapporten
- secrets management buiten demo-config
- dependency scanning, SBOM's en strengere policy gates zoals verplichte code owners of environment approvals

Deze restpunten blijven relevant, maar de repo toont nu in elk geval een concrete baseline voor contractdiscipline, operability en hardening in plaats van alleen een roadmap.

Aanvullende technische standaarden staan in [engineering-standards.md](./engineering-standards.md) en [operating-model.md](./operating-model.md).
