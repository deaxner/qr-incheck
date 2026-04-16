# ADR 0001: Feature-based monolith met backend-owned productwaarheid

- Status: Accepted
- Datum: 2026-04-16

## Context

Deze repository is bewust opgezet als compacte demo-opdracht rond een QR check-in/check-out product. De scope is klein en tijdgebonden, maar de uitwerking moet wel geloofwaardig zijn:

- badge tonen
- klokmoment registreren
- historie tonen
- teamstatus beheren

De belangrijkste spanning in deze opdracht zit niet in schaal, maar in geloofwaardigheid. Een demo kan technisch werken en tegelijk een verkeerd architectuursignaal geven, bijvoorbeeld:

- frontend die businessdata verzint of lokaal reconstrueert
- codebase die alleen op technische lagen is ingedeeld en daardoor feature ownership verbergt
- te vroege microservice- of event-architectuur voor een probleem dat nog klein en lokaal is

In de huidige code zijn al duidelijke signalen zichtbaar:

- backend-features zijn gegroepeerd onder `Clocking`, `Employees` en `Auth`
- frontend-features zijn gegroepeerd onder `modules/`, met `app/` voor orchestratie en `shared/` voor hergebruik
- businessregels voor check-in/check-out leven in de backend, onder andere in `ScanService`
- profieldata, historie, weektotalen en teamstatus komen uit backend responses en niet uit frontend-afleidingen

## Besluit

We kiezen voor een feature-based monolith waarin de backend de bron van waarheid is voor businessregels en productdata.

Concreet betekent dat:

- de repo blijft opgesplitst in een losse `frontend/` en `backend/`, maar functioneert conceptueel als een enkele applicatie
- de backend groepeert code primair per domeinfeature en pas secundair per technische rol
- de frontend consumeert backend-contracten en houdt zich bij voorkeur bezig met presentatie, interactie en lichte view-mapping
- productdata die functioneel betekenis heeft, zoals status, historie, actieve sessie en badgegegevens, wordt niet in de frontend verzonnen

## Waarom deze keuze

Deze keuze past het best bij het karakter van deze demo-opdracht: beperkte tijd, beperkte scope en wel de verwachting dat keuzes uitlegbaar en verdedigbaar zijn.

1. Een monolith is hier sneller en eerlijker dan vroeg opsplitsen

De applicatie heeft een kleine scope en een beperkt aantal use-cases. Een modulaire monolith houdt deployment, debugging, transacties en lokale ontwikkeling eenvoudig. Voor een demo-opdracht is dat waardevoller dan distributievoordelen die nog niet nodig zijn.

2. Feature-based structuur maakt ownership zichtbaar

De belangrijkste flows zitten rond clocking en employee management. Door code per feature te groeperen is sneller te zien waar gedrag hoort en waar wijzigingen moeten landen. Dat is leesbaarder dan een generieke indeling als `Controllers`, `Services` en `Utils` op repo-niveau.

3. Backend-owned productwaarheid voorkomt misleidende demo-logica

Een demo oogt snel compleet wanneer de frontend totalen, statussen en historie lokaal samenstelt, maar dat maakt het productmodel onbetrouwbaar. Door de backend eigenaar te maken van deze data blijft de UI een weergave van echte applicatielogica in plaats van een mock met een nette skin.

4. Vertical slice eerst, zonder cosmetische boundaries

De codebase laat al zien dat de functionele grenzen belangrijker zijn dan theoretische zuiverheid. Doctrine entities en repositories blijven centraal waar dat praktisch is, maar applicatielogica ligt wel per feature. Dat is een bewuste middenweg: duidelijke boundaries waar ze helpen, conventie waar dat goedkoper is.

## Overwogen alternatieven

### 1. Klassieke technische lagen als hoofdstructuur

Voorbeeld:

- `Controller/`
- `Service/`
- `Repository/`
- `DTO/`

Voordelen:

- bekend Symfony-patroon
- lage instap voor kleine teams

Nadelen:

- feature ownership wordt diffuus
- wijzigingen aan een enkele use-case raken sneller meerdere generieke mappen
- de code leest meer als framework-inrichting dan als productmodel

Niet gekozen omdat deze demo-opdracht juist moet laten zien dat functionele grenzen bewust zijn gekozen.

### 2. Frontend die read models en afgeleide productdata zelf opbouwt

Voordelen:

- snelle UI-iteratie
- minder backend-endpoints nodig in het begin

Nadelen:

- grotere kans op inconsistentie tussen schermen
- businesssemantiek lekt naar de frontend
- demo wordt visueel overtuigend maar inhoudelijk minder betrouwbaar

Niet gekozen omdat dit botst met het doel om in een demo eerlijke productwaarheid zichtbaar te maken.

### 3. Microservices of aparte services per domein

Voordelen:

- sterk gescheiden deployment-units
- kan later helpen bij onafhankelijke schaalbaarheid

Nadelen:

- hogere complexiteit in ontwikkeling en operatie
- extra contract- en integratielast
- disproportioneel voor de huidige scope

Niet gekozen omdat de complexiteit niet in verhouding staat tot de opdracht en de beperkte scope.

## Consequenties

Positief:

- kernflows blijven snel te volgen
- wijzigingen per feature blijven lokaal
- de UI blijft dicht op echte backend-data
- tests kunnen zich richten op businessgedrag in plaats van frontend-nabootsing

Negatief:

- de backend levert relatief rijke responses, waardoor endpoint-contracten belangrijker worden
- sommige read models zitten nog als arrays in application services en zijn nog niet volledig geformaliseerd
- entities en repositories zijn deels gedeeld, waardoor featuregrenzen nog niet volledig hard zijn

## Afwegingen en grenzen van dit besluit

Dit besluit betekent nadrukkelijk niet:

- dat alle logica altijd in de backend moet blijven, ook als presentatiegedrag puur UI-specifiek is
- dat de huidige modulaire monolith de eindarchitectuur voor productie moet zijn
- dat alle boundaries nu al perfect zijn uitgewerkt

Wel betekent het:

- eerst correcte ownership van data en gedrag
- daarna pas verdere verfijning van contracten, autorisatie, auditability en schaalkeuzes

## Signalen in de huidige code

Voorbeelden die dit besluit ondersteunen:

- `backend/src/Clocking/Application/ScanService.php` verwerkt check-in/check-out en bepaalt de uitkomst van een scan
- `backend/src/Employees/Application/EmployeeOverviewService.php` levert teamstatus en profieldata als backend-owned overzicht
- `backend/src/Employees/Application/EmployeeHistoryService.php` bouwt medewerkerhistorie en weektotalen op basis van echte `TimeEntry` data
- `frontend/src/lib/api.js` behandelt de frontend als consumer van backend-contracten
- `frontend/src/modules/` groepeert UI per feature in plaats van per technisch type

## Herzien wanneer

Ik zou dit besluit herzien wanneer een of meer van deze signalen optreden:

- meerdere onafhankelijke deployment-cycli worden nodig
- frontend en backend krijgen verschillende teams met duidelijke contract-eigenaars
- read models worden zo complex dat expliciete response DTO's en contractversies noodzakelijk zijn
- autorisatie, auditability en locatie-/terminalmodel zwaarder gaan wegen dan de huidige demo-scope
