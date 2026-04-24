# M4 — Mini-Slice 3: E-Mail-Impressum / Footer-Stammdaten (§8.10, ohne Versand)

**Status:** Erledigt (Repo, 2026-04-23) — `verify:ci` + `verify:ci:local-db` grün  
**PL-Default:** Option **A** in [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) — strukturierte Stammdaten für den späteren **System-Footer** bei Mahn-E-Mail; kein Versand, kein Rendering der Mahnvorlage.

## Ableitung aus §8.10

- **Pflicht-Footer E-Mail:** Impressum-/Geschäftsbriefpflichtangaben aus **strukturierten Stammdaten** (kein HTML-Freifeld für den Impressum-Block).
- **Optional:** Zusätzliche **Signaturzeile** in eigenem Teilfeld (Zeichenlimit, **kein** HTML) — vgl. [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) §8.10.
- **Validierung Versand:** E-Mail-Versand bleibt **blockiert**, wenn Pflichtfelder unvollständig — in diesem Slice wird nur `readyForEmailFooter` + `missingMandatoryFields` ausgeliefert (kein SMTP).

## Disclaimer (technisch vs. rechtlich)

- **`readyForEmailFooter`:** Nur **Produkt-Mindestregel** (sechs Pflichtfelder im Code), **keine** Zusicherung einer rechtskonformen **Geschäftsbrief-/Impressumspflicht** für alle Rechtsformen und Länder.
- **`impressumComplianceTier` / `impressumGaps`:** Optionale **Transparenz** (Folge-Ergänzung Risikoabbau): Heuristiken und stabile Gap-Codes — **kein** Ersatz für StB/DSB/Anwalt; Pflicht je Rechtsform bleibt **mandantenextern** zu klären.

## Feld-Matrix (Orientierung §8.10 / strukturierte Stammdaten)

| API-Feld | Rolle im Produkt | Bemerkung |
|----------|------------------|-----------|
| `companyLegalName`, `streetLine`, `postalCode`, `city`, `countryCode` | **Mindest-Adresse** | `readyForEmailFooter` setzt voraus, dass Adress- und Kontaktkern gefüllt ist. |
| `publicEmail`, `publicPhone` | **Erreichbarkeit (Impressum)** | Teil der Mindestregel. |
| `legalRepresentative` | **Häufig Pflicht / empfohlen** | Für `impressumComplianceTier: EXTENDED` im Produkt als Pflicht modelliert (Heuristik). |
| `registerCourt`, `registerNumber` | **Handelsregister** | Wenn eines gesetzt ist, muss das andere gesetzt sein (Gap sonst); beide leer zulässig für EXTENDED. |
| `vatId` | **USt-Id** | Für `countryCode === "DE"`: für EXTENDED erforderlich, Format grob `DE` + 9 Ziffern (keine Vollvalidierung). |
| `signatureLine` | **Optional** §8.10 | Eigenes Teilfeld, kein HTML. |

## HTTP

- **`GET /finance/dunning-email-footer`**  
  Antwort: `200` + `DunningEmailFooterReadResponse` — `footerSource`: `NOT_CONFIGURED` (keine DB-Zeile) oder `TENANT_DATABASE`; Felder für Impressum; `readyForEmailFooter`, `missingMandatoryFields`; zusätzlich **`impressumComplianceTier`**, **`impressumGaps`** (stabile Codes, siehe ADR-0010).

- **`PATCH /finance/dunning-email-footer`**  
  Body: Teilfelder + `reason` (min. 5 Zeichen). Mindestens ein pflegbares Feld muss gesetzt sein.  
  Antwort: `200` + gleiches Read-Modell wie GET.

## Persistenz und Transaktion

- Tabelle **`dunning_tenant_email_footer`** (1 Zeile pro `tenant_id`, PK `tenant_id`).
- **Upsert** bei PATCH; **Audit** `DUNNING_EMAIL_FOOTER_PATCHED` in derselben DB-Transaktion (`entityType`: `DUNNING_TENANT_STAGE_CONFIG`, `entityId`: `tenantId` — Konvention wie Vorlagen-PATCH).

## Auth und Fehler

- **Lesen:** `assertCanReadInvoice` (wie Vorlagen-GET).
- **Schreiben:** `assertCanManageDunningTenantStageConfig` (wie Mahnstufen-Konfiguration).
- **`DUNNING_EMAIL_FOOTER_VALIDATION`** (400): ungültige Werte (E-Mail-Format, Längen, verbotene Zeichen `<>` für Plain-Text-Felder).
- **`DUNNING_EMAIL_FOOTER_NOT_PERSISTABLE`** (503): ohne Postgres / ohne Upsert in Tx.

## Non-Goals

- Versand, SMTP, Massenversand, Vorschau-Rendering der Mahnvorlage.
- Vom System vorgegebener **Rechtshinweis**-Text im Footer (fest codierbar später beim Versand-Slice).
- HTML-Sanitization der Mahnvorlage `body` (eigenes Inkrement).

## Referenzen

- [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md) — Abschnitt **M4 Slice 3**  
- Vorher: [`M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md`](./M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md)
