# V2 Target Architecture

- Status: Implemented direction
- Datum: 2026-04-24

## 1. Target architecture

De repository is geëvolueerd van een enkele frontend-applicatie naar drie aparte frontend-applicaties die allemaal dezelfde Symfony backend gebruiken.

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

Iedere app heeft precies een primaire verantwoordelijkheid:

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

Gerealiseerde monorepo-structuur:

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

- de oorspronkelijke frontend is opgesplitst in app-specifieke entry points
- gedeelde code mag niet gekopieerd worden tussen apps
- businesslogica blijft backend-owned; frontend-sharing gaat over contracten, presentatie en utilities

## 4. Backend changes

De backend ondersteunt deze richting inmiddels inhoudelijk.

### Kernendpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/scan`
- `GET /api/employees`
- `GET /api/employees/{id}/history`
- `POST /api/employees/{id}/regenerate-qr`

### Self-service endpoints

Employee self status:

- `GET /api/employees/me/status`

Respons:

```json
{
  "status": "IN",
  "lastClock": "2026-04-21T09:00:00Z"
}
```

- `GET /api/employees/me/history`

### Device protection for scanner

Gerealiseerde uitbreiding op scanverkeer:

- `POST /api/scan`
- header `X-DEVICE-TOKEN`

Dit maakt een kiosk/scanner-client onderscheidbaar van admin- en employee-verkeer.

### Security rules

- `Admin`: volledige toegang
- `Employee`: alleen eigen data onder `/me/*`
- `Scanner`: alleen toegang tot `/api/scan`

Deze regels worden hard afgedwongen in Symfony via JWT-authenticatie voor users, device-token validatie voor scanners en endpoint-specifieke toegangscontrole.

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

### Changes from the original single app

Niet meer onderdeel van deze app:

- scanninglogica

Wel onderdeel van deze app:

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

Dit is verplicht voor onderhoudbaarheid en consistent gedrag.

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

## 11. Implementation outcome

De v2-richting heeft in de huidige repo concreet geleid tot:

- drie frontend-apps onder `frontend/apps/`
- een gedeelde laag onder `frontend/shared/`
- self-service endpoints onder `/api/employees/me/*`
- device-token beveiliging op `/api/scan`
- rate limiting op scannerverkeer
- Mercure-gedreven live updates voor admin- en employee-schermen

## 12. Design outcomes

Met deze upgrade ondersteunt de repository deze uitkomst:

- duidelijke scheiding van verantwoordelijkheden over drie clients
- backend-gedreven businesslogica
- herbruikbare frontend-architectuur
- realistische multi-client systeemopzet
- productie-achtig ontwerp, terwijl de scope een demo blijft

## Verdere verfijning

Als vervolgstap na v2 ligt de nadruk eerder op aanscherping dan op structuurwissel:

1. realtime topics en eventcontracten verder formaliseren
2. autorisatie- en auditabilitygrenzen uitbreiden
3. frontend-contracten waar nodig explicieter typeren of versioneren
4. scannerdevice-beheer verder uitwerken als de demo naar productieachtig gebruik beweegt
