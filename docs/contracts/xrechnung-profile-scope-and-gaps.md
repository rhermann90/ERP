# XRechnung — Zielprofil, Scope und Gap-Liste (Repo-MVP)

**Zweck:** Festlegung des **Default-Zielprofils** für die Implementierung in diesem Repository und tabellarische **Lücken** gegenüber einem vollständigen Behörden-/PEPPOL-Konformitätsnachweis. **Keine Rechtsberatung** — finale Profile und Validator-Pflichten organisatorisch abstimmen ([`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), [`README.md`](../../README.md)).

## Gewähltes Default-Zielprofil (Implementierung)

| Dimension | Default im Repo | Anmerkung |
|-----------|-----------------|-----------|
| Markt / CIUS | **XRechnung 3.0** (KoSIT) auf **UBL 2.1 Invoice** | Entspricht `CustomizationID` im Builder ([`src/services/xrechnung-xml-builder.ts`](../../src/services/xrechnung-xml-builder.ts)). |
| Transport / Netzwerk | **Kein aktiver PEPPOL-/AS4-Versand** | Es wird nur **XML als Payload** (`ExportRun.xrechnungXml`) erzeugt; Leitweg-ID / Endpoint-ID für Netzwerk sind **nicht** End-to-End implementiert. |
| Peppol BIS Billing | **ProfileID** im XML entspricht PEPPOL Billing Referenz | Dient der typischen **UBL-Kontextualisierung**; ohne registrierten Endpoint **kein** PEPPOL Go-Live. |
| B2G / Leitweg-ID | **Out of Scope (MVP)** | Kein Feld für Buyer Reference / Leitweg-ID am Datenmodell — siehe Gap-Tabelle. |
| Positionsmodell | **Aggregierte Rechnungszeile** | Domäne [`Invoice`](../../src/domain/types.ts) ohne Positionsliste; semantische Grenze für manche Abnehmer — siehe Gap. |

**Non-Goals (explizit):** Konformitätszusage ohne KoSIT-/externen Validator-Lauf; Hybrid-PDF **ZUGFeRD/Factur-X** Produktivgang (siehe ADR-0016 und Ticket); automatischer Versand über PEPPOL.

**API-Pflege (Repo):** `GET|PUT|DELETE /finance/e-invoice-parties/…` — siehe OpenAPI `1.29.4-e-invoice-party-api` und [`FIN4-external-client-integration.md`](./FIN4-external-client-integration.md).

## Gap-Liste: BT-/fachliche Felder vs. aktuellem Builder

Legende: **Ja** = wird aus persistierten Stammdaten oder Rechnung geliefert (wenn gepflegt); **Teil** = nur unter Bedingungen; **Nein** = nicht im MVP-Datenmodell / nicht umgesetzt.

| Thema | Umsetzung (kurz) |
|-------|------------------|
| Seller Name, Adresse, Land | **Ja** — `tenant_e_invoice_parties` → UBL AccountingSupplierParty |
| Seller USt-Id | **Ja** — optional Spalte `vat_id`, UBL `PartyTaxScheme` scheme VA |
| Seller Kontakt E-Mail | **Ja** — optional `email` |
| Buyer Name, Adresse, Land | **Ja** wenn `customer_e_invoice_parties`; sonst **Platzhalter** (nur Land DE fix im Fallback, dokumentiert im Export-Service) |
| Buyer USt-Id | **Teil** — wenn Kundenzeile gepflegt |
| Buyer interne ID | **Ja** — `PartyIdentification` = `invoice.customerId` (UUID) |
| Zahlungsbedingungen Freitext | **Teil** — FIN-1 `terms_label` über gebundene oder letzte Projekt-Version (`PaymentTerms` / `cbc:Note`) |
| IBAN / Zahlungsmittel-Code / Überweisungsreferenz | **Nein** — kein Bankfelder-Modell angebunden |
| Rechnungspositionen (LV-Zeilen) | **Nein** — nur eine aggregierte `InvoiceLine` |
| Bestellreferenz / Projektreferenz (BT-13 u. ä.) | **Nein** — keine Felder am `Invoice`-Aggregate |
| Lieferdatum / Lieferort | **Nein** |
| B2G Leitweg-ID / Buyer Reference | **Nein** |

Steuerliche UBL-Abbildung der FIN-5-Regime bleibt in [`xrechnung-tax-regime-mapping.md`](./xrechnung-tax-regime-mapping.md).

## Verweise

- Validator / CI optional: [`docs/runbooks/xrechnung-kosit-validator.md`](../runbooks/xrechnung-kosit-validator.md)
- ZUGFeRD-Spike: [`docs/adr/0016-zugferd-factur-x-hybrid-spike.md`](../adr/0016-zugferd-factur-x-hybrid-spike.md), Ticket [`docs/tickets/ZUGFERD-FOLLOWUP-SPIKE.md`](../tickets/ZUGFERD-FOLLOWUP-SPIKE.md)
