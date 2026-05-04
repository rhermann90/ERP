# Authentifizierung: Passwort-Login (Multi-User, Mandanten-Scope)

## Zweck

Die Web-App meldet sich mit **Mandanten-ID, E-Mail und Passwort** an und erhält ein **signiertes v1-Bearer-Token** (`Authorization: Bearer …`, optional `X-Tenant-Id`). Damit bleiben **Tenant-Isolation**, **Multi-User pro Mandant** und **Audit** (`actorUserId` = persistente Benutzer-UUID) konsistent.

## Ablauf

1. Client: `POST /auth/login` mit JSON `{ "tenantId": "<uuid>", "email": "…", "password": "…" }` (ohne Bearer-Header).
2. Server: Zod-Validierung, **IP-Rate-Limit**, Lookup `(tenantId, email_normalisiert)` in Postgres-Tabelle **`users`**, Passwortprüfung mit **bcrypt** (Vergleichspfad auch ohne Treffer, um Timing-Hinweise zu reduzieren), dann `createSignedToken` (HMAC, `AUTH_TOKEN_SECRET`).
3. Antwort `200`: `LoginResponse` gemäß `docs/api-contract.yaml`.

### Postgres (Standard für Multi-User)

- Migration: `prisma/migrations/…_auth_users_table/migration.sql`, Modell `User` in `prisma/schema.prisma`.
- Bei `buildApp` mit `repositoryMode=postgres` und `seedDemoData` (Default): `seedAuthUsers` legt zwei Demo-Benutzer für den Seed-Mandanten an (E-Mails/Passwörter siehe unten).
- **Produktion:** `NODE_ENV=production` — ohne `ERP_SEED_ADMIN_PASSWORD` (min. 12 Zeichen) werden **keine** Demo-Benutzer gesät (`seedAuthUsers` bricht mit Warnung ab). Benutzer dann per Migration/Admin-Tool anlegen.

### In-Memory-Backend (ohne Postgres)

- Nur **ein** technischer Zugang über `ERP_LOGIN_PASSWORD` (+ optional `ERP_LOGIN_EMAIL`, …). `tenantId` im Request muss mit `ERP_LOGIN_TENANT_ID` übereinstimmen.

## Umgebungsvariablen

### Token / allgemein

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `AUTH_TOKEN_SECRET` | Ja (außer `NODE_ENV=test` / unsicherer Dev-Modus) | Signatur für alle Tokens; mindestens 32 Zeichen in Produktion. |

### Postgres-Seed (Demo-Benutzer)

Nur wenn `seedAuthUsers` läuft (`postgres` + `seedDemoData`).

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `ERP_SEED_ADMIN_PASSWORD` | In **production** ja (≥12 Zeichen) | Passwort für `ERP_SEED_ADMIN_EMAIL` (Default `admin@localhost`). |
| `ERP_SEED_VIEWER_PASSWORD` | Nein | Default in Dev/Test: `dev-seed-viewer-12`; in production sonst gleich Admin-Passwort. |
| `ERP_SEED_ADMIN_EMAIL` | Nein | Default `admin@localhost`. |
| `ERP_SEED_VIEWER_EMAIL` | Nein | Default `viewer@localhost` (Rolle `VIEWER`). |

Ohne `NODE_ENV=production` setzen `seedAuthUsers` feste Dev-Passwörter (**nur für lokale/CI-Umgebungen**): `dev-seed-admin-12` / `dev-seed-viewer-12`.

### In-Memory-Fallback (`ERP_LOGIN_*`)

| Variable | Beschreibung |
|----------|--------------|
| `ERP_LOGIN_PASSWORD` | ≥12 Zeichen; sonst deaktiviert. |
| `ERP_LOGIN_EMAIL` | Default `admin@localhost`. |
| `ERP_LOGIN_TENANT_ID` | Muss zum Request-`tenantId` passen. |
| `ERP_LOGIN_USER_ID` / `ERP_LOGIN_ROLE` | Technischer User für Token/Audit. |

Passwörter und Tokens **nicht** loggen. Produktion: **HTTPS**, strikte CORS-Origins (`CORS_ORIGINS`), Secret-Rotation nach Incident.

## Passwort vergessen (E-Mail-Link)

1. Client: `POST /auth/request-password-reset` mit `{ "tenantId": "<uuid>", "email": "…" }` (ohne Bearer).
2. Server: IP-Rate-Limit (gleiches Fenster-Konzept wie Login), Lookup aktiver Benutzer `(tenantId, email_normalisiert)`; bei Treffer wird eine Zeile in **`password_reset_challenges`** angelegt (Token nur als **SHA-256-Digest**), alte offene Challenges für denselben User werden entfernt, E-Mail mit Link `…/…#/password-reset?token=<opaque>` versendet (`src/mail/smtp-send.ts`, `src/services/password-reset-service.ts`).
3. **`NODE_ENV=production`:** ohne konfiguriertes SMTP und ohne **`ERP_PUBLIC_APP_BASE_URL`** bricht der Flow mit **503** / `PASSWORD_RESET_MAIL_NOT_CONFIGURED` ab (kein Enumeration).
4. Client: `POST /auth/confirm-password-reset` mit `{ "token": "<aus Link>", "password": "<neu, ≥12>" }` — setzt Passwort, markiert Challenge `usedAt`, Audit `USER` / `USER_UPDATED` mit `afterState.passwordRotated`.

Ohne Postgres (In-Memory-Modus): beide Reset-Endpunkte **503** / `USER_MANAGEMENT_REQUIRES_DB`.

## Benutzer-E-Mail ändern (Admin)

`PATCH /users/{userId}` mit optionalem Feld **`email`** (plus `reason` und ggf. weitere Felder); nur Rolle **ADMIN**, nur Postgres. Konflikt eindeutiger `(tenant_id, email_norm)`: **409** / `USER_EMAIL_CONFLICT`.

## Rate-Limiting

`POST /auth/login`: IP-Fenster (`src/api/auth-login-routes.ts`). Überschreitung: **429** / `AUTH_RATE_LIMITED` (`docs/contracts/error-codes.json`).

`POST /auth/request-password-reset` und `POST /auth/confirm-password-reset`: separates IP-Fenster in `src/api/password-reset-routes.ts` (gleicher Fehlercode bei Überschreitung).

## Rechtliches / Compliance

- Kein Ersatz für IAM (SSO, MFA, zentrales IdP). Passwort-Reset per E-Mail ist **Self-Service nur technisch** (kein Verifizierungs-KYC); Betreiber muss SMTP/TLS und Phishing-Risiken adressieren.
- **Audit:** `userId` im Token entspricht der Spalte `users.id` (pro Mandant).

## PWA / Frontend

- Hash-Routen: `#/login`, `#/password-reset`, `#/`, `#/arbeit`, `#/finanz-vorbereitung`.
- Optional **`VITE_DEFAULT_TENANT_ID`**: Mandantenfeld in der Login-Maske ausblenden (Ein-Mandanten-Deployments); Multi-Mandant: Feld sichtbar lassen oder pro Build setzen.
- Session: **sessionStorage** nach Login (Tab-Lebensdauer).

## Benutzerverwaltung (API + UI)

- **API:** `GET /users`, `POST /users`, `PATCH /users/{userId}` — nur mit **Postgres** und nur für die Rolle **ADMIN** (`AUTH_ROLE_FORBIDDEN` sonst). Ohne DB: `503` / `USER_MANAGEMENT_REQUIRES_DB`. **`GET /users`** ist paginiert (`page`, `pageSize`, Antwort `data`, `page`, `pageSize`, `total` — siehe OpenAPI).
- **UI:** Hash `#/benutzer` (Link in Navigation und auf der Startseite, nur wenn im Token die Rolle `ADMIN` steht).
- **Audit:** `entityType: USER`, Aktionen `USER_CREATED`, `USER_UPDATED` (kein Klartext-Passwort in `beforeState`/`afterState`).
- **Regeln:** kein Deaktivieren des eigenen Kontos; kein Entfernen/Herabstufen des letzten aktiven Administrators.
