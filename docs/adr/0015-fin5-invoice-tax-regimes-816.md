# ADR 0015 — FIN-5 Rechnungssteuerregime (§8.16) mit Mandanten-Default und Projekt-Override

## Status

Accepted (Implementierung im Repo). **Produktentscheidung Option A:** voller im Scope definierter Umfang für die drei §8.16-Sonderfall-Typen als **konfigurierbare Regime** (kein stiller Fallback auf 19 %-Standard-USt bei aktivem Sonderregime).

## Kontext

[`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) **8.16** verlangt u. a. Unterstützung für Reverse Charge / Steuerschuldnerschaft des Leistungsempfängers, Kleinunternehmerregelung und §13b-Bauleistungen — mit Mandantenkonfiguration für Grenzfälle (technische Felder, keine Rechtsberatung).

Historisch dokumentierte **Fail-Closed-Option B** für das MVP: [`0014-fin5-mvp-tax-fail-closed.md`](./0014-fin5-mvp-tax-fail-closed.md) und Gate [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md). Diese ADR **ersetzt** die verbindliche Produkt-Haltung „kein aktivierbarer Sonderfall“ durch die hier beschriebene **Option-A-Umsetzung**.

[`ADR-0007`](./0007-finance-persistence-and-invoice-boundaries.md) bleibt maßgeblich für EUR-only, Traceability und Buchungsgrenzen.

## Entscheidung

### Regime-Enum (OpenAPI-kompatibel)

| Code | Kurzbeschreibung |
|------|------------------|
| `STANDARD_VAT_19` | Bisheriger MVP-Pfad: 19 % USt auf Netto nach 8.4(1–6) MVP. |
| `SMALL_BUSINESS_19` | Kleinunternehmer: `vatCents = 0`, `totalGrossCents = lvNetCents`, effektiver Satz 0 BPS ausgewiesen. |
| `REVERSE_CHARGE` | Reverse Charge / §13b LE: ausgewiesene Umsatzsteuer 0; Netto = Brutto aus Sicht der Rechnungszeile; semantische Kennzeichnung über Regime und optionale `tax_reason_code`. |
| `CONSTRUCTION_13B` | Bauleistungen §13b UStG: gleiche **Rechen**logik wie Reverse Charge im MVP-Slice; Abgrenzung über optionale JSON-Konfiguration am Mandanten/Projekt (technisch). |

### Konfiguration

- **Mandant:** `tenant_invoice_tax_profiles.default_invoice_tax_regime` (optional `construction_13b_config_json`).
- **Projekt:** `project_invoice_tax_overrides` mit `(tenant_id, project_id)` überschreibt Mandanten-Default.
- **Effektives Regime für neue Rechnung:** Projekt-Override vor Mandanten-Profil, sonst `STANDARD_VAT_19` (Resolver im Repository).

### Rechnungs-Snapshot

Rechnungen persistieren `invoice_tax_regime`, `vat_rate_bps_effective`, optional `tax_reason_code`, damit Ausweis und Export konsistent bleiben.

### Buchung

Beim Buchen wird das effektive Regime erneut aufgelöst und mit dem Entwurfs-Snapshot verglichen; bei Abweichung: `INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT`.

### §8.10 Pflicht-Hinweise

Server liefert `mandatoryTaxNoticeLines` auf Entwurf und GET aus stabilen Mustertexten pro Regime — Darstellung/Export-Hinweis, keine Rechtsauskunft.

### Export / XRechnung

`POST /exports` mit `XRECHNUNG` und Rechnung: wenn Regime nicht `STANDARD_VAT_19`, Preflight mit `EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED` (**fail-closed**), bis Mapping implementiert ist.

### Audit

Mutationen an Mandanten- oder Projekt-Steuerprofilen erzeugen Audit-Ereignisse mit Vorher/Nachher.

## Konsequenzen

- OpenAPI `info.version`, `error-codes.json`, PWA `ApiClient` und Persistenz bei Änderungen gemeinsam pflegen (G8).

## Verweise

- [`docs/api-contract.yaml`](../api-contract.yaml)
- [`docs/contracts/error-codes.json`](../contracts/error-codes.json)
- [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) — FIN-5 / M5
