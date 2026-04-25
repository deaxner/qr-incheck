# Operating Model

## Servicegrenzen

- `scanner-app`: untrusted edge client voor badge-invoer
- `admin-app`: privileged read/write client voor operations en beheer
- `employee-app`: least-privilege self-service client
- `backend`: system of record voor status, historie, autorisatiebesluiten en contractstabiliteit
- `mercure`: best-effort realtime distributie; functioneel belangrijk voor UX, maar niet de primaire bron van waarheid

## Failure modes

### Database down

- verwacht gedrag: `/healthz` wordt `503 degraded`
- impact: write-flows en read-models zijn onbetrouwbaar of unavailable
- actie: geen nieuw verkeer toelaten; root cause eerst op datastore/connectiviteit

### Mercure down

- verwacht gedrag: primaire scan- en badgeflows blijven werken
- impact: admin/employee realtime signaal degradeert naar stale UI totdat een volgende fetch plaatsvindt
- actie: incidentclassificatie als partial degradation, niet als totale outage

### Device-token abuse of scanner burst

- verwacht gedrag: throttle voor businesslogica, `429 rate_limited`, operationeel event in logs
- impact: kioskflow vertraagt lokaal, maar backend beschermt write-pad en datastore

### Contract drift

- verwacht gedrag: voorkomen via DTO's, controller-tests en contractversie-header
- actie: geen breaking wijziging zonder expliciete compatibiliteitskeuze

## Deployment invarianten

1. database healthy
2. backend healthy
3. pas daarna scanner/admin/employee verkeer accepteren
4. realtime is aanvullend, niet blocker voor write-correctness

## Senior-level claim van deze repo

Deze codebase claimt niet dat alle platformcapaciteiten al zijn uitgewerkt. De claim is smaller en technischer:

- bounded demo-scope met expliciete system-of-record grenzen
- contracts als first-class artefact
- zichtbare request-correlatie, readiness en response-metadata
- scheiding tussen core correctness en best-effort realtime
- duidelijke volgende stap van baseline naar echte SLO/metrics/CI-governance
