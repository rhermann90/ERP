# XRechnung / EN 16931 — Zuordnung Rechnungssteuerregime (FIN-5 Option A)

**Zweck:** Technische Abbildung der vier in [ADR-0015](../adr/0015-fin5-invoice-tax-regimes-816.md) definierten `invoice_tax_regime`-Werte auf **UNCL 5305**-kompatible USt-Kategorien in UBL 2.1 (`cbc:ID` mit `schemeID="UNCL5305"`). Dient der konsistenten XRechnung-XML-Erzeugung im Backend ([`src/services/xrechnung-xml-builder.ts`](../../src/services/xrechnung-xml-builder.ts)) und Tests.

**Keine Rechtsberatung:** Konkrete B2B-/B2G-Pflichtprofile, KoSIT-Versionen und landesspezifische VATEX-Codes sind mit **StB / Release** und dem Produkt-Scope (z. B. nur DE) abzustimmen — siehe [Checklisten/compliance-rechnung-finanz.md](../../Checklisten/compliance-rechnung-finanz.md) (E-Rechnung). Diese Matrix ist eine **implementierungsnahe Referenz** für das Repo-MVP, keine Zusage gegenüber Behörden oder Abnehmern.

## Regime → UNCL 5305 / Ausweis

| `invoice_tax_regime` | UNCL 5305 (`cbc:ID`) | `cbc:Percent` (UBL) | Hinweis / Befreiungstext |
|----------------------|----------------------|---------------------|---------------------------|
| `STANDARD_VAT_19` | **S** (Normal besteuert) | effektiver Satz aus `vat_rate_bps_effective` (Snapshot), z. B. 19 | keine §8.10-Pflichtzeilen |
| `SMALL_BUSINESS_19` | **E** (befreit) | 0 | Freitext: Zeilen aus [`src/domain/invoice-tax-mandatory-notices.ts`](../../src/domain/invoice-tax-mandatory-notices.ts) (`getMandatoryTaxNoticeLines`) in `cbc:Note` / `cbc:TaxExemptionReason` |
| `REVERSE_CHARGE` | **AE** (Reverse Charge) | 0 | dieselben Pflicht-Hinweise wie Kleinunternehmer-Block, inhaltlich RC |
| `CONSTRUCTION_13B` | **AE** | 0 | §13b-Bauleistung — MVP-Rechenlogik wie RC (ADR-0015); semantische Trennung über Regime + Texte aus `getMandatoryTaxNoticeLines` |

**Fachliche Annahme (MVP):** `REVERSE_CHARGE` und `CONSTRUCTION_13B` teilen in UBL dieselbe Kategorie **AE** mit 0 % ausgewiesener Umsatzsteuer; die **Abgrenzung** erfolgt über Regime-Snapshot und die **deutschen Pflicht-Hinweiszeilen** (kein Ersatz für behördliche Kodex-Pflichten).

## Fehlercode `EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED`

Wird nur noch geliefert, wenn das auf der Rechnung gespeicherte Regime **nicht** in der geschlossenen Menge `INVOICE_TAX_REGIMES` ([`src/domain/invoice-tax-regime.ts`](../../src/domain/invoice-tax-regime.ts)) liegt (z. B. Datenmigration / künftige Erweiterung ohne Mapping). Alle vier Option-A-Regime sind **gemappt** und lösen keinen fail-closed-Preflight mehr aus.

## Verweise

- Ticket-Paket C: [FIN-5-FOLLOWUP-INCREMENTS.md](../tickets/FIN-5-FOLLOWUP-INCREMENTS.md)
- OpenAPI / Fehler: [api-contract.yaml](../api-contract.yaml), [error-codes.json](./error-codes.json)
- Mapping-Tabelle QA: [finance-fin0-openapi-mapping.md](./finance-fin0-openapi-mapping.md)
