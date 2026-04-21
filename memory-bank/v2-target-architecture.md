# V2 Target Architecture

- Status: Proposed
- Datum: 2026-04-21

## 1. Target architecture

De repository beweegt van een frontend-applicatie naar drie aparte frontend-applicaties die allemaal dezelfde Symfony backend gebruiken.

Definitieve systeemschets:

```text
[ Scanner App ]      [ Admin App ]      [ Employee App ]
        \                 |                  /
         \                |                 /
              [ Symfony API ]
                    |
                 [ MySQL ]
```

## 2. Core principles

### Backend is the source of truth

Alle businesslogica blijft in Symfony:

- check-in en check-out regels
- medewerkerstatus
- historie
- permissies

Frontends tonen data en triggeren acties, maar bepalen geen businessuitkomst.

### Strict separation of apps

Iedere app heeft precies een verantwoordelijkheid:

- `Scanner App`: QR scannen en klokevents registreren
- `Admin App`: beheer en operationeel overzicht
- `Employee App`: self-service voor de medewerker

### Shared code is mandatory

Alle frontend-apps delen minimaal:

- API-client
- type definitions
- utility functions
- gedeelde UI-bouwstenen waar dat zinvol is

## 3. Frontend structure

Aanbevolen monorepo-structuur:

```text
frontend/
  apps/
    scanner-app/
    admin-app/
    employee-app/
  shared/
    api/
    types/
    utils/
    ui/
```

Gevolgen:

- de huidige frontend wordt opgesplitst in app-specifieke entry points
- gedeelde code mag niet gekopieerd worden tussen apps
- businesslogica blijft backend-owned; frontend-sharing gaat over contracten, presentatie en utilities

## 4. Backend changes

Het grootste deel van de backend ondersteunt deze richting al.

### Bestaande endpoints die blijven

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/scan`
- `GET /api/employees`
- `GET /api/employees/{id}/history`
- `POST /api/employees/{id}/regenerate-qr`

### Nieuwe endpoints

Employee self status:

- `GET /api/employees/me/status`

Respons:

```json
{
  "status": "IN",
  "lastClock": "2026-04-21T09:00:00Z"
}
```

Optionele employee history:

- `GET /api/employees/me/history`

### Device protection for scanner

Aanbevolen uitbreiding op scanverkeer:

- `POST /api/scan`
- header `X-DEVICE-TOKEN`

Dit maakt een kiosk/scanner-client onderscheidbaar van admin- en employee-verkeer.

### Security rules

- `Admin`: volledige toegang
- `Employee`: alleen eigen data onder `/me/*`
- `Scanner`: alleen toegang tot `/api/scan`

Deze regels moeten hard worden afgedwongen in Symfony, bijvoorbeeld via access-control, dedicated authenticatie voor devices en waar nodig voters of application guards.

## 5. Scanner App

### Purpose

Een minimale kiosk-applicatie voor QR scanning en het versturen van scanacties naar de backend.

### Features

- camera automatisch openen
- QR code detecteren
- resultaat sturen naar `/api/scan`
- check-in/check-out feedback tonen
- scanner automatisch resetten

### Camera handling

Gebruik de browser camera API:

```js
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})
```

Fallback naar de frontcamera als de environment camera niet beschikbaar is.

### Recommended library

- `@zxing/browser`

### Flow

1. Open app
2. Start camera
3. Detect QR code
4. Verstuur `POST /api/scan`
5. Toon resultaat
6. Reset scanner

### UX constraints

- fullscreen
- geen navigatie
- grote feedbackmeldingen
- automatische reset na scan

## 6. Admin App

### Purpose

Volledige beheer- en operationele dashboard-app.

### Features

- login
- employee overview
- check-in historie
- badge regeneratie
- statusmonitoring

### Changes from current app

Verwijderen:

- scanninglogica

Behouden:

- administratieve features uit de huidige app

Voorgestelde structuur:

```text
admin-app/
  modules/
    auth/
    employees/
    history/
    dashboard/
```

## 7. Employee App

### Purpose

Self-service applicatie voor medewerkers.

### Features

- login
- eigen QR-code bekijken
- huidige check-in status bekijken
- laatste activiteitstijd tonen

Optioneel:

- persoonlijke historie

### Core UI

- QR-code weergave
- huidige statusindicator
- laatste check-in/check-out tijd

### QR code generation

Gebruik bijvoorbeeld:

```jsx
<QRCode value={employee.qrCode} />
```

Passende library:

- `qrcode.react`

### Flow

1. Login
2. Fetch `/api/auth/me`
3. Fetch `/api/employees/me/status`
4. Render QR en status

## 8. Shared layer

Dit is verplicht voor onderhoudbaarheid.

### API client example

- `login()`
- `me()`
- `scan()`
- `getMyStatus()`

### Shared types

```ts
type ScanResponse = {
  status: "IN" | "OUT";
  employee: string;
  timestamp: string;
};

type EmployeeStatus = {
  status: "IN" | "OUT";
  lastClock: string;
};
```

## 9. Docker changes

Iedere app draait zelfstandig:

```yaml
services:
  scanner:
    build: ./frontend/apps/scanner-app
    ports:
      - "8081:80"

  admin:
    build: ./frontend/apps/admin-app
    ports:
      - "8083:80"

  employee:
    build: ./frontend/apps/employee-app
    ports:
      - "8084:80"

  backend:
    ports:
      - "8082:8000"

  database:
```

## 10. URLs

- Scanner App: `http://localhost:8081`
- Admin App: `http://localhost:8083`
- Employee App: `http://localhost:8084`
- Backend: `http://localhost:8082`

## 11. Implementation phases

### Phase 1: Frontend split

- huidige React-app extraheren naar `admin-app`
- shared folder opzetten

### Phase 2: Scanner app

- camera-integratie
- QR scanning
- API-integratie met `/api/scan`

### Phase 3: Employee app

- authenticatie
- QR-code weergave
- statusendpoint-integratie

### Phase 4: Backend extensions

- `/me/status` endpoint toevoegen
- optioneel `/me/history`
- device token validatie voor scanner

### Phase 5: Docker integration

- drie frontend-containers toevoegen
- volledige startup lokaal valideren

### Phase 6: Security and hardening

- role enforcement in Symfony
- rate limiting op scanendpoint
- strengere inputvalidatie

## 12. Design outcomes

Na deze upgrade moet de repository deze uitkomst ondersteunen:

- duidelijke scheiding van verantwoordelijkheden over drie clients
- backend-gedreven businesslogica
- herbruikbare frontend-architectuur
- realistische multi-client systeemopzet
- productie-achtig ontwerp, terwijl de scope een demo blijft

## Concrete next steps

Als implementatierichting voor v2 betekent dit:

1. de huidige frontend omvormen tot `admin-app`
2. een gedeelde `frontend/shared/` laag formaliseren
3. scanner- en employee-app als nieuwe entry points toevoegen
4. Symfony uitbreiden met `/api/employees/me/status` en optioneel `/me/history`
5. scanverkeer scheiden van userverkeer via een device-token model
