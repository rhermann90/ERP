# Weiterentwicklung — laufender Plan

Zielpriorität (ohne wirtschaftlichen Druck): **Zuverlässigkeit und Sicherheit** zuerst, dann **Nutzerfreundlichkeit** (möglichst viele Kernprozesse in **≈3 Klicks**, Informationen in **≈3 Klicks** erreichbar).

Dieses Dokument wird nach jedem abgeschlossenen Entwicklungsschritt aktualisiert: **erledigt**, **nächster Schritt**, **danach in Aussicht**.

---

## Schritt 1 — Technische Basis / CI-Parität (abgeschlossen, Risiken gemindert)

### Ergebnis

- `npm run verify:ci` bleibt die schnelle Mindestkette ohne Live-Postgres.
- **`npm run ensure:local-test-db`** / **`npm run verify:ci:local-db`** (Host **15432**, DB **erp_test**).
- **CI-Strategie:** ein Job **`backend`** als kanonische Merge-Evidence; kein redundanter zweiter Job.

### Offene Punkte

- Keine.

---

## Schritt 2 — Readiness, Header-Härtung (abgeschlossen)

### Ergebnis

- `GET /ready`, CSP, optional HSTS (`ERP_ENABLE_HSTS=1`).

### Offene Punkte

- **Playwright-E2E** „Login → Finanz“ optional nach Schritt 4, wenn Traceability-Pfade stabil dokumentiert sind.

---

## Schritt 3 — Rollen × Top-5 / 3-Klick-IA (abgeschlossen, Slice 1+2)

### Ergebnis

- **Schnellzugriff** je API-Rolle + **v1.3-Hinweiszeilen** (`v13DomainRolesForApiRole`) + Link/Mapping-Pfad **`docs/contracts/ui-role-mapping-v1-3.md`** (Tabelle v1.3 §11.1 → `UserRole`, SoD-Hinweis).
- **Finanz-Vorbereitung:** **FIN-3** Zahlungseingang — geführter **3-Klick-Ablauf** (Rechnung laden → offenen Betrag übernehmen → POST mit neuem `Idempotency-Key`); **`recordPaymentIntake`** im `ApiClient` inkl. Header.
- **`docs/contracts/module-contracts.json`:** `POST /finance/payments/intake` ergänzt.

### Offene Punkte

- Keine (für diesen Schritt).

---

## Schritt 4 — Traceability / Rechnung → Zahlung → Audit (begonnen)

### Ergebnis (Slice 1)

- **Finanz-Vorbereitung:** `GET /audit-events` (letzte 15) — Mandanten-Audit nachlesen, z. B. nach FIN-3-Buchung; `ApiClient.getAuditEvents`.

### Ergebnis (Slice 2)

- **Finanz-Vorbereitung:** `GET /documents/:id/allowed-actions?entityType=INVOICE` — SoT für die aktuelle Rechnungs-ID (Traceability / Export-Gates).

### Ergebnis (Slice 3)

- **Finanz-Vorbereitung:** SoT-Explorer — `entityType` wählbar (inkl. `OFFER_VERSION`, `SUPPLEMENT_VERSION`, `MEASUREMENT_VERSION`, `LV_*`, `INVOICE`), Seed-Voreinstellungen und „Rechnungs-ID übernehmen“.

### Noch offen (für Schritt 4)

- Optional **Playwright-Rauchtest** (Login → Finanz-Shell); ggf. **Lesepfade** (z. B. `GET` Ergänzungen) außerhalb der Finanz-Seite in der Haupt-Shell.

### Schritt 4 — Status

- **Abgeschlossen** für die geplanten PWA-Slices (Audit, SoT Rechnung, SoT mehrsprachig in Finanz-Vorbereitung).

### Rollenumbenennung (Nebenänderung)

- API-Wert **`VERTRIEB` → `VERTRIEB_BAULEITUNG`** (Anzeige „Vertrieb / Bauleitung“); Migration `users.role`; Legacy-Token/Request-Body `VERTRIEB` wird weiterhin akzeptiert und normalisiert.

---

## Nächster Schritt (Empfehlung)

1. **Playwright-Rauchtest** „Login → Finanz (Vorbereitung)“ (Schritt 2-Hinweis): stabilisiert Regression für Token, Hash-Route und SoT-Buttons.
2. Alternativ oder danach: **Mandanten-Policies** / Rollenfeinschliff laut „Danach in Aussicht“.

## Danach in Aussicht

- Produktionsnahe Mandanten-Policies (Kalkulation/Disposition exakt zuordnen) und erweiterte Rollen, falls das Backend mehr als fünf API-Rollen erhält.
