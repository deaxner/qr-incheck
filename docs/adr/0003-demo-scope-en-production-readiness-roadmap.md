# ADR 0003: Demo-scope expliciteren en production-readiness als vervolgfase vastleggen

- Status: Accepted
- Datum: 2026-04-24

## Context

Deze repository laat bewust een geloofwaardige verticale slice zien, maar is nog geen bewijs van volledige production readiness of van lead-level operating model op zichzelf.

Dat onderscheid moet expliciet zijn, anders oogt de demo sterker uitgewerkt dan hij feitelijk bedoeld is. De belangrijkste signalen die nog niet zwaar in de codebase zaten waren oorspronkelijk:

- informele, deels array-based API-contracten in read models
- beperkte observability voorbij functionele logging en testfeedback
- migraties zonder expliciet rollout- en rollback-verhaal over langere tijd
- weinig zichtbare performanceprofiling of capaciteitskeuzes
- security vooral op application-niveau, nog niet op hardening- en operations-niveau
- weinig expliciete afspraken over ownership, standaarden en besluitvorming tussen teams

Sinds deze ADR is een minimale baseline toegevoegd in de codebase:

- vaste contractdocumentatie voor kritieke endpoints
- uniform foutmodel met `requestId` correlatie
- een `/healthz` endpoint plus backend healthcheck
- baseline security headers op backend-responses

Die baseline maakt de repo geloofwaardiger als production-minded demo, maar verandert niet dat het zwaardere operating model nog vervolgwerk vraagt.

## Besluit

We behandelen deze codebase nog steeds als demo-first modulaire monolith, maar leggen vast dat een volgende fase niet primair over meer features gaat. De vervolgfase draait om volwassen maken van contracts, operability en organisatie-afspraken.

Concreet hoort die volgende fase minimaal deze sporen te bevatten:

1. Contractvolwassenheid

- response DTO's of view models als standaard voor backend-owned read models
- expliciete contracttests op kritieke endpoints
- versioneringsstrategie zodra meerdere clients of externe consumers harder van dezelfde contracten afhangen

2. Observability en operability

- structurele logging met correlation ids en domeinspecifieke events
- metrics en alerts op scanfouten, authfouten, rate limiting, realtime delivery en migratiestatus
- health checks en runbooks voor database, Mercure en device-token flows

3. Wijzigingsveiligheid over tijd

- migraties behandelen als rollout artefacts met forward/backward-compatibility waar nodig
- expliciete rollback-aanpak per wijzigingstype
- release discipline met feature flags of compatibele schema/app-volgorde zodra deployments onafhankelijker worden

4. Performance en security hardening

- profiling van scanflow, teamoverzicht en historie-endpoints
- load- en burst-tests op scanner- en realtimeverkeer
- hardening buiten de demo-basics: secret management, audit logging, token rotatie, dependency scanning en rate-limit tuning

5. Teamrichting en standaardisering

- duidelijke eigenaarschap per domein en per contract
- vaste besliscriteria voor wanneer iets een ADR, standaard of platformkeuze wordt
- repo-brede standaarden voor API-shapes, foutmodellen, logging, testlagen en migrations

## Waarom dit besluit

Een lead wordt niet alleen beoordeeld op nette code, maar op het vermogen om een team richting te geven en de volgende volwassenheidsstap expliciet te maken.

Door dit als besluit vast te leggen:

- blijft helder wat deze demo wel en niet probeert te bewijzen
- wordt zichtbaar dat production concerns niet vergeten zijn maar bewust gefaseerd
- verschuift het gesprek van "meer features" naar "betrouwbaarder leveren en opereren"

## Consequenties

Positief:

- de demo blijft compact en uitlegbaar
- de repo laat expliciet zien waar architectuur overgaat in operating model
- vervolginvesteringen worden toetsbaar op een paar vaste sporen

Negatief:

- niet alle production claims zijn in deze repository direct uitvoerbaar gemaakt
- een deel van het bewijs blijft voorlopig documentair in plaats van technisch afgedwongen
- verdere volwassenheid vraagt ook teamafspraken en platformkeuzes buiten applicatiecode

## Eerste concrete stap in deze repo

De eerstvolgende stap binnen deze codebase was het formaliseren van contracts op kritieke read models en responses, zodat de backend-owned productwaarheid minder informeel wordt.

Daarmee staat nu een basis. Daarna ligt de nadruk op:

- contracttests
- gestandaardiseerde fout- en observabilitymodellen
- expliciete operationsdocumentatie voor deploy, migratie en incidentrespons
