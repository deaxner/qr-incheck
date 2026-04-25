# ADR 0002: Multi-client frontend met gedeelde contractlaag en gescheiden toegang

- Status: Accepted
- Datum: 2026-04-24

## Context

ADR 0001 legt vast dat deze repository een feature-based monolith blijft waarin de backend eigenaar is van businessregels en productdata.

Sindsdien is de repository doorontwikkeld van een enkele frontend naar drie aparte clients:

- `scanner-app` voor kioskgedrag en scanverkeer
- `admin-app` voor operationeel beheer
- `employee-app` voor self-service

Deze opsplitsing was nodig omdat de oorspronkelijke frontend verschillende verantwoordelijkheden tegelijk droeg:

- scaninteractie met apparaat- en camera-afhankelijk gedrag
- administratieve beheerflows
- medewerkergerichte self-service

Die combinatie werkte voor een vroege verticale slice, maar werd minder geloofwaardig zodra autorisatie, device-verkeer en realtime updates belangrijker werden.

De huidige code laat al duidelijke signalen zien:

- `frontend/apps/` bevat drie aparte entry points
- `frontend/shared/` centraliseert API-client, Mercure-integratie, types, utilities en gedeelde UI
- `/api/scan` gebruikt een device-token in plaats van gewone user-authenticatie
- `/api/employees/me/status` en `/api/employees/me/history` geven self-service data via backend-owned contracten
- admin- en employee-ervaringen ontvangen live updates via Mercure

## Besluit

We kiezen in v2 voor een multi-client frontend-architectuur met drie aparte apps op een gedeelde Symfony backend, ondersteund door een verplichte shared contractlaag en expliciete scheiding tussen user- en device-toegang.

Concreet betekent dat:

- elke frontend-app een eigen entry point, runtime en gebruikersdoel heeft
- gedeelde frontend-code alleen via `frontend/shared/` loopt en niet via kopieergedrag tussen apps
- businesscontracten vanuit de backend leidend blijven voor status, historie, scanuitkomsten en badgegegevens
- scannerverkeer technisch onderscheiden blijft van admin- en medewerkerverkeer
- realtime productstatus via backend-publicatie en niet via frontend polling of lokale reconstructie zichtbaar wordt

## Waarom deze keuze

1. Losse clients maken verantwoordelijkheden expliciet

Een scanner-kiosk heeft andere UX-, beveiligings- en runtime-eisen dan een admin-dashboard of employee self-service app. Door deze flows te scheiden wordt sneller duidelijk waar gedrag hoort en welke wijzigingen impact hebben op welk productoppervlak.

2. Een shared laag houdt de split betaalbaar

Meerdere apps zonder gedeelde contractlaag leiden snel tot duplicatie in API-calls, auth-afhandeling, datumformattering en foutvertaling. `frontend/shared/` houdt de codebase consistent zonder de apps weer conceptueel samen te trekken.

3. Device-verkeer verdient een eigen toegangsmodel

De scanner is geen gewone eindgebruiker. Een device-token op `/api/scan` maakt het onderscheid tussen kioskverkeer en JWT-gebaseerd userverkeer expliciet en voorkomt dat employee- of admin-sessies scanrechten impliciet erven.

4. Realtime updates horen backend-gedreven te zijn

Admin- en employee-schermen tonen operationele status die direct volgt uit scan- en badge-events. Mercure-publicatie vanuit de backend houdt die updates gekoppeld aan echte domeingebeurtenissen in plaats van frontend-specifieke afleidingen.

## Overwogen alternatieven

### 1. Een enkele frontend met rolafhankelijke schermen

Voordelen:

- minder entry points
- minder build- en deploy-oppervlak

Nadelen:

- scanner-, admin- en employee-gedrag raken alsnog vermengd
- kiosk-specifieke eisen blijven in dezelfde app leven als self-service en beheer
- autorisatie- en navigatielogica worden diffuser

Niet gekozen omdat de productoppervlakken functioneel te verschillend zijn.

### 2. Drie frontend-apps zonder gedeelde laag

Voordelen:

- maximale autonomie per app
- weinig upfront structuurwerk

Nadelen:

- duplicatie in API-contracten en hulplogica
- grotere kans op inconsistente foutafhandeling en datamapping
- hogere onderhoudslast bij contractwijzigingen

Niet gekozen omdat deze repository juist klein genoeg is om consistentie centraal af te dwingen.

### 3. Scanverkeer via gewone JWT-gebruikersaccounts

Voordelen:

- een enkel authenticatiemechanisme
- minder expliciete infrastructuur

Nadelen:

- apparaat en gebruiker worden semantisch vermengd
- scanrechten zijn moeilijker hard te begrenzen
- operationele kioskflow wordt minder geloofwaardig

Niet gekozen omdat scannerverkeer een andere actor vertegenwoordigt dan een medewerker of admin.

## Consequenties

Positief:

- verantwoordelijkheden per client zijn direct leesbaar
- gedeelde frontend-contracten blijven centraal onderhoudbaar
- securitygrenzen tussen scanner, admin en employee zijn explicieter
- realtime updates passen natuurlijk in het productmodel

Negatief:

- er zijn meer frontend entry points en dus meer test- en buildoppervlak
- gedeelde code vraagt discipline om app-specifieke logica niet alsnog centraal te trekken
- backend-contracten worden nog belangrijker omdat meerdere clients ervan afhangen

## Signalen in de huidige code

- `frontend/apps/scanner-app/src/ScannerApp.jsx` behandelt camera, scanflow en handmatige fallback als kioskgedrag
- `frontend/apps/admin-app/src/AdminApp.jsx` richt zich op teamoverzicht, historie, badge-rotatie en live activity
- `frontend/apps/employee-app/src/EmployeeApp.jsx` richt zich op badge, status en eigen historie
- `frontend/shared/api/client.js` centraliseert login, self-service, admincalls en device-token scanrequests
- `frontend/shared/api/mercure.js` centraliseert live subscriptions
- `backend/src/Auth/Http/JwtAuthSubscriber.php` scheidt JWT-auth en device-token gedrag
- `backend/src/Realtime/Application/EmployeeRealtimePublisher.php` publiceert domeingedreven realtime updates

## Herzien wanneer

Ik zou dit besluit herzien wanneer een of meer van deze signalen optreden:

- een app een eigen release- of repositorygrens nodig krijgt
- de shared laag zo groot wordt dat een apart frontend platformteam of package-strategie nodig is
- scannerdevices een zwaarder apparaatbeheer nodig krijgen, zoals device-registratie, rotatie of remote revocation
- realtime communicatie functioneel breder wordt dan de huidige Mercure-gedreven updatebehoefte
