# Implementation Notes - ERP Backend Slice

## Feature 1 - Angebotsversionierung (ERP v1.2)
- Domaenenregel: Keine destruktiven Updates; neue Angebotsversion bis vor `ANGENOMMEN`; ab Annahme nur Nachtrag (`FOLLOWUP_DOCUMENT_REQUIRED`).
- Policy-SoT: `src/domain/offer-create-version-policy.ts` (gleiche Regel fuer API + `allowed-actions`).
- Betroffene Entitaeten: `Angebot`, `Angebotsversion`, `AuditEvent`.
- API-Vertrag: `POST /offers/version`.
- Validierungen: Auth, Rolle, Reason, Status laut Policy.
- Fehlerfaelle: Angebot/Version fehlt, Status nicht zulaessig fuer `OFFER_CREATE_VERSION`.
- Error-Codes: `FOLLOWUP_DOCUMENT_REQUIRED` (409), `OFFER_NOT_FOUND`, `OFFER_VERSION_NOT_FOUND`.
- Tests: Positiv (u.a. nach `VERSENDET`), Negativ `ANGENOMMEN`, SoT IN_FREIGABE + POST.

## Feature 2 - Kritische Statuswechsel mit Audit
- Domaenenregel: Kritische Aktionen (Freigabe/Statuswechsel) nur mit AuditEvent.
- Betroffene Entitaeten: `Angebotsversion`, `AuditEvent`.
- API-Vertrag: `POST /offers/status`.
- Validierungen: Gueltige Zielstatus, erlaubte Statuskanten, Reason-Pflicht.
- Fehlerfaelle: Ungueltiger Wechsel, fremder Tenant, Version nicht gefunden.
- Tests: Negativfall fuer ungueltigen Wechsel, Audit-Nachweis ueber `GET /audit-events`.

## Feature 3 - Exportlauf-Vorbereitung (XRechnung/GAEB)
- Domaenenregel: Fehlerhafte Exporte duerfen keine rechtsverbindlichen Dokumente erzeugen.
- Betroffene Entitaeten: `Exportlauf`, `Angebotsversion`, `AuditEvent`.
- API-Vertrag: `POST /exports`.
- Validierungen: Format enum (`XRECHNUNG`, `GAEB`), Source-Entitaet vorhanden, fachliche Exportreadiness.
- Fehlerfaelle: Quellentitaet fehlt, Dokument nicht rechtlich freigegeben.
- INVOICE-Preflight: Existenz, gueltiger Rechnungsstatus, Pflichtfelder und Unveraenderbarkeit; fail-closed via `EXPORT_PREFLIGHT_FAILED`.
- Tests: Negativfall fuer Export von Entwurfsdokument.

## Feature 4 - Traceability-Pruefung vor Rechnungs-Export
- Domaenenregel: Rechnung muss lueckenlos auf Aufmass, LV, Angebot, Projekt, Kunde rueckverfolgbar sein.
- Betroffene Entitaeten: `Rechnung`, `Aufmass`, `LV`, `Angebot`, `Projekt`, `Kunde`, `Exportlauf`.
- API-Vertrag: `POST /exports` mit `entityType=INVOICE`.
- Validierungen: Traceability-Link fuer Tenant vorhanden.
- Fehlerfaelle: Kette fehlt oder tenant-fremd.
- Tests: Negativfall bei fehlender Kette.

## Explizite Annahmen
- Dieses Inkrement ist ein bewusst kleiner, lauffaehiger Vertical Slice auf In-Memory-Storage.
- Authentifizierung/Rollenpruefung sind als naechster Schritt vorgesehen; aktuell wird `x-user-id` vertraut.
- Export ist als fachliche Vorpruefung modelliert, nicht als finale XML/PDF-Dateigenerierung.
- Persistenz, Transaktionen, DSGVO-Vorgaenge und echte Rechnungslogik folgen in den naechsten Phasen.
- Rollen kommen aktuell ueber Header und werden in Phase 2 durch AuthN/AuthZ-Claims ersetzt.
