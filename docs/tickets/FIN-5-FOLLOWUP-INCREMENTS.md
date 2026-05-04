# FIN-5 Folge-Inkremente nach Merge #86 (Spur B aktiv)

**Stand:** 2026-05-04 — nach Merge PR [#86](https://github.com/rhermann90/ERP/pull/86) (squash, [`a65b331`](https://github.com/rhermann90/ERP/commit/a65b3313c2c3d049c909ce34e052250fb9f25a7c)) ist FIN-5 §8.16 **Option A** im Backend produktiv ([ADR-0015](../adr/0015-fin5-invoice-tax-regimes-816.md), supersede [ADR-0014](../adr/0014-fin5-mvp-tax-fail-closed.md)). Dieses Ticket sammelt die offenen PWA-, Export- und Buchungspfade in **kleinen, einzeln verifizierten** Folge-PRs (siehe [`AGENTS.md`](../../AGENTS.md), [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md), [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) Abschnitt „Nächste Produktspur").

**Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) §8.10 / §8.16; [`adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md).

**Quer-Verweise:** [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md) Zeile 7 (#86); [`docs/CODEMAPS/overview.md`](../CODEMAPS/overview.md) FIN-5-Zeile.

## Stand (erledigt mit #86)

- **Backend:** Migration [`20260504143000_fin5_invoice_tax_regimes`](../../prisma/migrations/20260504143000_fin5_invoice_tax_regimes/migration.sql) (Tabellen `tenant_invoice_tax_profiles`, `project_invoice_tax_overrides`; Spalten `invoices.invoice_tax_regime`, `vat_rate_bps_effective`, `tax_reason_code` mit Default `STANDARD_VAT_19`).
- **Domäne:** vier Regime [`src/domain/invoice-tax-regime.ts`](../../src/domain/invoice-tax-regime.ts) (`STANDARD_VAT_19`, `REDUCED_VAT_7`, `REVERSE_CHARGE_DOMESTIC`, `EXPORT_NON_TAXABLE`); Pflicht-Hinweise [`src/domain/invoice-tax-mandatory-notices.ts`](../../src/domain/invoice-tax-mandatory-notices.ts); `src/domain/invoice-calculation.ts` `computeInvoiceTotalsForTaxRegime`.
- **Service:** [`invoice-tax-settings-service.ts`](../../src/services/invoice-tax-settings-service.ts) — Resolver **Override > Profile > Default**; Mutationen schreiben Audit-Events.
- **Persistenz:** [`invoice-tax-profile-persistence.ts`](../../src/persistence/invoice-tax-profile-persistence.ts) (Mandanten-Profil + Projekt-Override).
- **Routes:** [`finance-invoice-tax-routes.ts`](../../src/api/finance-invoice-tax-routes.ts) — `GET|PATCH /finance/invoice-tax-profile` und `GET|PUT|DELETE /finance/invoice-tax-profile/projects/{projectId}` mit lokaler Rate-Limit-Konfig (read 60/min, write 20/min).
- **OpenAPI:** [`api-contract.yaml`](../api-contract.yaml) `info.version: 1.29.1-fin5-manage-tax-settings-sot`; Schemas `InvoiceTaxRegime`, `TenantInvoiceTaxProfile…`; Rechnungs-Snapshot um `invoiceTaxRegime`, `vatRateBpsEffective`, `taxReasonCode` erweitert; FIN4-Mapping in [`FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md) ergänzt; [`finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md) aktualisiert.
- **Audit:** Mutationen am Profil/Override erzeugen Audit-Events (siehe ADR-0015 §Audit).
- **PWA:** `ApiClient`-Mock in [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts); minimaler Read-Path im Step-UI von [`FinancePrepStepInvoice.tsx`](../../apps/web/src/components/finance/preparation/FinancePrepStepInvoice.tsx). **Paket A (Schreib-UI Steuerprofil):** siehe Abschnitt Paket A unten — umgesetzt.
- **Tests:** [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts), [`test/invoice-calculation.test.ts`](../../test/invoice-calculation.test.ts), Persistence-Integration ohne `export_runs` (nicht im Branch-Schema). App-Shell-Smoke [`e2e/app-shell-smoke.spec.ts`](../../e2e/app-shell-smoke.spec.ts).
- **Doku:** ADR-0015; ADR-0014 superseded; FIN4-Integration und Mapping-Tabelle erweitert; Codemap [`overview.md`](../CODEMAPS/overview.md) FIN-5-Zeile aktualisiert.

## Folgepakete (priorisiert)

### Paket A — PWA Steuerprofil-UI (Mandant + Projekt)

**Status:** erledigt (Repo-Stand nach diesem Inkrement): Mandanten- und Projekt-Steuerprofil in der Finanz-Vorbereitung unter Tab „Grundeinstellungen Mahnlauf“ als zweites Panel; Schreibpfade über **`MANAGE_INVOICE_TAX_SETTINGS`** in `GET /documents/{invoiceId}/allowed-actions?entityType=INVOICE` (minimaler Backend-Spiegel zu `assertCanManageInvoiceTaxSettings`). OpenAPI **`1.29.1-fin5-manage-tax-settings-sot`**.

**Zweck:** Sichtbare und schreibbare UI für `/finance/invoice-tax-profile` (Mandanten-Default) und `/finance/invoice-tax-profile/projects/{projectId}` (Projekt-Override) in der Finanz-Vorbereitung.

**Lieferung:**

- Region [`FinanceInvoiceTaxSettingsPanel`](../../apps/web/src/components/finance/preparation/FinanceInvoiceTaxSettingsPanel.tsx) im Tab „Grundeinstellungen“ neben [`FinanceDunningGrundeinstellungenPanel`](../../apps/web/src/components/finance/FinanceDunningGrundeinstellungenPanel.tsx).
- **`ApiClient`**-HTTP weiterhin produktiv für FIN-5-Pfade (bereits vor Paket A).
- Schreibpfade über `allowedActions`-SoT (**`MANAGE_INVOICE_TAX_SETTINGS`**) analog FIN-3.
- Backend: [`authorization-service.ts`](../../src/services/authorization-service.ts) ergänzt um diese SoT-Aktion für berechtigte Rollen.
- Tests: [`FinancePreparation.test.tsx`](../../apps/web/src/components/FinancePreparation.test.tsx); Backend [`test/app.test.ts`](../../test/app.test.ts); E2E [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts).

**Akzeptanz:**

- PATCH Mandanten-Default mit Audit-Eintrag im Tab „Fortgeschritten" (`GET /audit-events`); Projekt-Override mit `reason ≥ 5` validiert.
- PWA-Web-Tests grün; `npm run verify:pre-merge` Exit 0.
- Strukturierte API-Fehler durchgängig nach Muster `FinanceStructuredApiError`.

**Aufwand:** mittel; **Backend:** minimal (nur SoT-Aktion in `allowed-actions`).


### Paket B — Pflicht-Hinweise im Rechnungsausweis (PWA Read-Only)

**Zweck:** Server liefert `mandatoryTaxNoticeLines` auf Entwurf und GET (ADR-0015 §8.10). PWA muss diese im Rechnungs-Snapshot anzeigen — Darstellung, **kein** Rechtshinweis.

**Lieferung:**

- [`apps/web/src/components/finance/preparation/FinancePrepStepInvoice.tsx`](../../apps/web/src/components/finance/preparation/FinancePrepStepInvoice.tsx) ergänzen: Liste `mandatoryTaxNoticeLines` rendern (lesbarer Block am Rechnungs-Footer; A11y wie restliche Step-UI).
- Tests + E2E-Smoke (1 Assertion: bei Test-Regime `EXPORT_NON_TAXABLE` mind. ein Pflicht-Hinweis sichtbar).

**Akzeptanz:** Bei Regime ≠ `STANDARD_VAT_19` werden die vom Server gelieferten Pflicht-Hinweise sichtbar; bei Standard keine Anzeige.

**Aufwand:** klein; **kein** Backend.

### Paket C — XRechnung-Mapping für nicht-Standard-Regime

**Zweck:** Aktuell fail-closed `EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED` bei `POST /exports XRECHNUNG` für nicht-Standard-Regime (ADR-0015 §Export). Mapping ergänzen.

**Lieferung:**

- Adapter in [`src/services/export-service.ts`](../../src/services/export-service.ts) oder dediziertes XRechnung-Modul: Steuerregime → XRechnung-Codes (CEF / EN16931); Pflicht-Hinweise im XML-Output.
- Persistenz-Test in [`test/persistence.integration.test.ts`](../../test/persistence.integration.test.ts) für jedes Regime; Snapshot-Test des XML-Ausgangs.
- OpenAPI-`info.version`-Bump (Patch) + FIN4-Mapping nachziehen.

**Akzeptanz:** Export aller vier Regime liefert valides XRechnung-XML; Fail-closed-Code entfällt für gemappte Regime; CEF-/EN16931-Konformität durch Snapshot/Schema-Check belegt.

**Aufwand:** mittel-groß; benötigt fachliche Klärung der CEF-Codes.

### Paket D — Buchungs-Recreate-Flow bei Regime-Drift

**Zweck:** Wenn beim Buchen `INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT` (HTTP 409) zurückkommt, soll PWA klar führen.

**Lieferung:**

- Strukturierter Fehler in [`apps/web/src/lib/api-error.ts`](../../apps/web/src/lib/api-error.ts) (Code-Erkennung + Aufbereitung).
- UI-Flow in [`FinancePrepStepInvoice.tsx`](../../apps/web/src/components/finance/preparation/FinancePrepStepInvoice.tsx): Warnung + Button „Neuen Entwurf laden" → `POST /invoices` mit gleichem `lvVersionId`/`offerVersionId`.
- Web-Test + E2E-Erweiterung (gemockter 409 → UI-Erholung).

**Akzeptanz:** Drift-Szenario manuell reproduzierbar; PWA verlässt sich nicht auf alte Draft-ID.

**Aufwand:** klein-mittel; **kein** Backend (nur PWA + ggf. ApiClient).

## Reihenfolge / Empfehlung

1. **B** zuerst (klein, Read-Only, schnell sichtbar).
2. **A** danach (Schreibpfade, größerer Surface).
3. **D** (kleiner Bug-Fix-Charakter, hängt nicht von A/B ab).
4. **C** zuletzt (größter Aufwand, fachliche XRechnung-Klärung nötig).

**Alternative Reihenfolge:** Wenn Mandanten- oder Projekt-Steuerprofil **ohne** externen API-Client gepflegt werden muss (Operativrisiko „nur Backend“), **Paket A vor B** ziehen — sonst bleibt die obige Empfehlung für schnelle Sichtbarkeit der Pflicht-Hinweise im UI.

Keine Pflicht-Reihenfolge — kleine, einzeln verifizierte PRs sind das Ziel.

## Risiken und Mitigation

| Risiko | Mitigation |
|--------|------------|
| **Keine PWA-Schreib-UI** nach #86: Profil/Override nur über HTTP-API änderbar | Vertrag und Integratoren: [`docs/api-contract.yaml`](../api-contract.yaml) (`/finance/invoice-tax-profile…`), [`FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md). Ohne Integrator: **Paket A** priorisieren (siehe **Alternative Reihenfolge** oben). |
| **XRechnung** bei nicht-Standard-Regime bleibt fail-closed bis **Paket C** | Operativ keinen XRechnung-Export für Sonderregime erwarten, bis Mapping und Tests vorliegen; Fehlercode `EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED` bleibt bis dahin kanonisch. |
| **HTTP 409** `INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT` ohne geführte UX bis **Paket D** | Nutzerhinweis: neuen Rechnungsentwurf mit gleicher LV-/Angebots-Version anlegen; Umsetzung in Paket D. |
| **CodeQL „Missing rate limiting“** bei neuen Routen | Locales `config.rateLimit` pro Route wie in [`finance-invoice-tax-routes.ts`](../../src/api/finance-invoice-tax-routes.ts) und [`user-account-routes.ts`](../../src/api/user-account-routes.ts) (read/write getrennt). |
| **Namenskollision „Option B“** | In [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) bezeichnet **Option B** eine **Wellen-Alternative** (8.4-Motor) — **nicht** das historische FIN-5-Gate [`FIN-5-GATE-816-FAIL-CLOSED.md`](./FIN-5-GATE-816-FAIL-CLOSED.md) (Fail-Closed §8.16; durch ADR-0015 superseded). |

## Non-Goals

- **Keine** zusätzlichen Steuerregime über die vier in ADR-0015 hinaus ohne neuen ADR.
- **Keine** Kombination mit FIN-6-Härtung (§8.14, GoBD-Querschnitt) in einem PR — eigene Spur **C** laut [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) Tabelle „Nächste Produktspur".
- **Keine** Code-Mischung mit B5 Mahn-PDF / Audit-Fail-Hard ([`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md), [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)).
- **Keine** Mandanten-Aktivierung der Regime im Repo-Prozess — produktive Schaltung in einem Mandanten ist **Repo-extern** (StB/DSB-Klärung; siehe [`AGENTS.md`](../../AGENTS.md) Punkt 6 und [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md)).

## Verweise

- ADR (aktuell): [`docs/adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md)
- ADR (superseded): [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md)
- Mapping: [`docs/contracts/finance-fin0-openapi-mapping.md`](../contracts/finance-fin0-openapi-mapping.md)
- Integratoren: [`docs/contracts/FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md)
- OpenAPI: [`docs/api-contract.yaml`](../api-contract.yaml) (`info.version: 1.29.1-fin5-manage-tax-settings-sot`)
- Übergeordnetes: [`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3 / FIN-5
- Historisches Gate (Option B): [`FIN-5-GATE-816-FAIL-CLOSED.md`](./FIN-5-GATE-816-FAIL-CLOSED.md)
- P1-3-Eintrag: [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md) Zeile 7
