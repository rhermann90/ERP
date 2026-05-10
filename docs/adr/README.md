# ADR-Index (Architecture Decision Records)

Kurzindex: **welches ADR** bei **welchen Code-Pfaden** lesen. Volltext jeweils in derselben Datei verlinkt.

| ADR | Titel (Kurz) | Bei Änderungen an … |
|-----|----------------|----------------------|
| [0001](0001-phase1-critical-decisions.md) | Phase 1 Critical Decisions | Grundlagen, historische Schnittstellen |
| [0002](0002-nachtrag-lifecycle.md) | Nachtrags-Lebenszyklus | `supplement*`, Nachtrags-Routen, Traceability Nachtrag |
| [0003](0003-persistence-spike.md) | Persistence Spike / Repository-Modus | `repository-mode.ts`, `buildApp`, Memory vs. Postgres |
| [0004](0004-measurement-lifecycle-phase2-inc1.md) | Aufmass-Lebenszyklus | `measurement-*`, Aufmass-Services, Messungs-Persistenz |
| [0005](0005-lv-hierarchy-phase2-inc2.md) | LV-Hierarchie und Textlogik | LV-Text, Hierarchie außerhalb ADR-0013-Lesepfad |
| [0006](0006-offer-vertical-slice-persistence.md) | Offer + OfferVersion Postgres | `offer-*`, Angebots-Persistenz, `prisma` Offer-Modelle |
| [0007](0007-finance-persistence-and-invoice-boundaries.md) | Finanz-Persistenz, Rechnungsgrenze | `invoice-*`, FIN-2-Grenzen, Rechnungs-Persistenz |
| [0008](0008-payment-terms-fin1.md) | Zahlungsbedingungen FIN-1 | `payment-terms*`, `/finance/payment-terms` |
| [0009](0009-fin4-mahnwesen-slice.md) | Mahnwesen FIN-4 Slice | `dunning-*`, Mahn-Routen, FIN-4 Lesepfade |
| [0010](0010-fin4-m4-dunning-email-and-templates.md) | FIN-4 M4 E-Mail und Vorlagen | Dunning-Templates, Footer, SMTP-M4 |
| [0011](0011-fin4-semi-dunning-context.md) | FIN-4 SEMI-Mahnkontext | SEMI-Fristlogik, Mahn-Zeitzonen |
| [0012](0012-finance-scope-tenant-customer-invoices-only.md) | Finanz-Scope Mandant→Endkunde | Rechnungsgegenparteien, Scope-FIN |
| [0013](0013-lv-section9-hierarchy-and-text-separation.md) | LV §9 Hierarchie-Lesepfade | `lv-hierarchy*`, `/lv/versions/.../structure`, Knoten/Positionen |
| [0014](0014-fin5-mvp-tax-fail-closed.md) | FIN-5 MVP Fail-Closed | Steuer-MVP-Gate, Fail-Closed-Verhalten |
| [0015](0015-fin5-invoice-tax-regimes-816.md) | FIN-5 Steuerregime §8.16 | `finance-invoice-tax-*`, Steuerprofile, XRechnung-Steuer |
| [0016](0016-fin2-path-c-intermediate-status-proposed.md) | FIN-2 Pfad C Zwischenstatus | Pfad C / Zwischenstatus (proposed) |
| [0017](0017-b5-formal-dunning-pdf-delivery-proposed.md) | B5 formelles Mahn-PDF | Mahn-PDF-Liefergrenze (proposed) |
| [0018](0018-pilot-lv-aufmass-invoice-convergence.md) | Pilot LV / Aufmass → Rechnung | Pilot-Wizard, Konvergenz 8.4(1), `GeschaeftsprozessWizard` |
| [0019](0019-w1-stammdaten-project-customer-object-option-c.md) | W1 CRM-Stamm Option C | `crm-stammdaten-*`, `crm_*` Tabellen |
| [0020](0020-difference-booking-measurement-8-6-slice.md) | Differenzbuchung §8.6 Slice | `difference-booking`, Aufmassbezug |
| [0021](0021-difference-booking-slice2-draft-integration-scope.md) | Differenzbuchung Slice 2 Scope | Entwurfseinbindung, Randfälle; Slice 3 Summary/Gutschrift siehe Umsetzungsstand; 8.4-Roll-in [0025](0025-dom86-deferred-difference-to-invoice-totals.md) |
| [0022](0022-difference-booking-slice2-allocation-settlement.md) | Differenzbuchung Zuordnung / Settlement | `allocate`, `deallocate`, Rechnungsbuchung |
| [0023](0023-dom86-slice2b-payment-terms-schluss-mitigation.md) | DOM-8-6 Slice 2b Schlussrechnung | Konditions-Differenz, `schlussrechnungMitigation` |
| [0024](0024-dom86-schluss-mitigation-auto-follow-up-draft.md) | DOM-8-6 Slice 2c Folge-Entwurf | `POST /invoices/…/book`, auto-ENTWURF FOLGERECHNUNG, Gutschrift fail-closed |
| [0025](0025-dom86-deferred-difference-to-invoice-totals.md) | DOM-8-6 — Differenz ≠ 8.4-Summen bis FIN-2-Gate | Kein automatisches Mischen zugeordneter Differenz in `lvNetCents`/`totalGrossCents`; Folgearbeit nur nach Gate |

**OpenAPI:** [`docs/api-contract.yaml`](../api-contract.yaml) — bei HTTP-Änderungen mitziehen, wo verbindlich.
