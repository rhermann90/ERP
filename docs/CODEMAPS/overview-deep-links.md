# Codemap — Deep Links (Compliance, FIN, Tickets, Tooling)

**Pflege (Drift minimieren):** Tabellenzeilen zu Cursor, Compliance/UAT, FIN-/Roadmap-/Produkt-UI-Programm und ähnliche Querverweise **nur hier** pflegen — nicht erneut in [`overview.md`](./overview.md) duplizieren. `overview.md` bleibt API-/PWA-Orientierung plus Verweis auf Spine und diese Datei. Umbenannte oder neue Tickets/ADRs: zuerst diese Tabelle anpassen, dann ggf. [`domain-strands.md`](./domain-strands.md) oder die Spine.

Diese Sammlung ergänzt die schlanke [**Spine**](./overview-spine.md). Zurück zur vollen API-/PWA-Tabelle: [`overview.md`](./overview.md).

---

## Cursor, Reviews, Compliance, UAT, Staging

| Bereich | Pfad | Rolle |
|--------|------|--------|
| **Cursor — Projektregeln** | [`.cursor/rules/cursor-stack.mdc`](../../.cursor/rules/cursor-stack.mdc), [`.cursor/skills/`](../../.cursor/skills/) (`plan-ceo`, `ship`, …); `npm run validate:cursor-project-rules`; Refresh `npm run sync:cursor-stack-skills` **oder** manuell offline (Abschnitt „Geschlossene / offline Umgebungen“ in `cursor-stack.mdc`) | Eine aktive Regel (`alwaysApply`); `erp-*.mdc` nur Redirect-Stubs; Slash-Befehle ggf. Cursor-build-abhängig |
| **Reviews / Skill-Audits** | [`docs/reviews/projekt-skill-pruefung-2026-05-04.md`](../reviews/projekt-skill-pruefung-2026-05-04.md) | cursor-stack-Skill-Raster (Researcher → CEO/Eng → Review → QA → Ship → Retro); nicht CI-automatisiert |
| **Compliance (Stub + Archiv)** | [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), [`docs/contracts/compliance-spec-traceability.md`](../contracts/compliance-spec-traceability.md) (Spez ↔ Tests/Gates), [`docs/_archiv/checklisten-compliance-human-workflow/README.md`](../docs/_archiv/checklisten-compliance-human-workflow/README.md) | Begleitblatt + Matrix — **Empfehlungen** und Merge ohne Pflichtfreigabe: [`README.md`](../../README.md); Finanz-Scope **Mandant→Endkunde** ([`docs/adr/0012-finance-scope-tenant-customer-invoices-only.md`](../adr/0012-finance-scope-tenant-customer-invoices-only.md)) |
| **Compliance Ledger (technisch)** | [`Checklisten/compliance-rechnung-finanz.ledger.md`](../../Checklisten/compliance-rechnung-finanz.ledger.md), [`Checklisten/compliance-rechnung-finanz-filled.md`](../../Checklisten/compliance-rechnung-finanz-filled.md) (Anlage), [`Checklisten/compliance-signoffs.schema.md`](../../Checklisten/compliance-signoffs.schema.md), [`Checklisten/compliance-freigabe-runbook.md`](../../Checklisten/compliance-freigabe-runbook.md) (Stub), `scripts/validate-compliance-signoffs.mjs`, `scripts/apply-compliance-signoffs.mjs` | **54** `chk-*` Marker; Validator/Apply für optionale JSON-Synchronisation |
| **M4 Slice 5c — Agenda** | [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) | Massen-E-Mail: Agenda-Anker; operative Freigaben **außerhalb** des Repo-Prozesses |
| **Staging / Produktion — Env + Smoke** | [`docs/runbooks/phase-a-staging-prod-env-checklist.md`](../runbooks/phase-a-staging-prod-env-checklist.md) | Variablen, `migrate deploy`, `/health`, `/ready`; Verweis Gate §15 |
| **UAT — Nutzerabnahme (Handoff, Skript, Evidenz)** | [`docs/runbooks/uat-staging-handoff.md`](../runbooks/uat-staging-handoff.md), [`uat-one-pager-template.md`](../runbooks/uat-one-pager-template.md), [`uat-manual-test-script.md`](../runbooks/uat-manual-test-script.md), [`uat-evidence-protocol.md`](../runbooks/uat-evidence-protocol.md) | Staging-Übergabe an Tester, Zugangs-/UUID-Vorlage, manuelle PWA-Pfade, Abweichungsprotokoll |

---

## FIN, Roadmap, Produkt-UI-Programm

| Bereich | Pfad | Rolle |
|--------|------|--------|
| **FIN-2 nächste Teilprojekte (Gate)** | [`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md), [`FIN-2-BACKLOG-REST.md`](../tickets/FIN-2-BACKLOG-REST.md) | Reihenfolge 8.4-Motor / Pfad C / LV-Lesepfad ohne Parallel-Mix |
| **Pilot Go + LV→Rechnung** | [`docs/tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md), [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md) | Kontrollierter Mandanten-Go; Adapter-Doku; kein Mix 8.4(2–6)/Pfad C ohne separates Gate |
| **FIN-3 / FIN-4 Rest** | [`FIN-3-BACKLOG-88-89.md`](../tickets/FIN-3-BACKLOG-88-89.md), [`FIN-4-BACKLOG-POST-WAVE3.md`](../tickets/FIN-4-BACKLOG-POST-WAVE3.md) | §8.8–8.9 bzw. M4-Follow-ups; kein PR-Mix mit 8.4/Pfad C |
| **FIN-6 §8.14 / §15** | [`docs/contracts/fin6-logging-privacy-814.md`](../contracts/fin6-logging-privacy-814.md), [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md), [`docs/contracts/qa-fin6-section15-acceptance.md`](../contracts/qa-fin6-section15-acceptance.md) | Logging/Redaction + Gate-15-Skeleton + Team-Checkboxen |
| **FIN-5 — §8.16 Steuerregime** | [`docs/adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md), Routes [`src/api/finance-invoice-tax-routes.ts`](../../src/api/finance-invoice-tax-routes.ts) (`GET\|PATCH /finance/invoice-tax-profile`, `GET\|PUT\|DELETE /finance/invoice-tax-profile/projects/{projectId}` mit lokaler Rate-Limit-Konfig), Service [`src/services/invoice-tax-settings-service.ts`](../../src/services/invoice-tax-settings-service.ts), Persistenz [`src/persistence/invoice-tax-profile-persistence.ts`](../../src/persistence/invoice-tax-profile-persistence.ts), Domäne [`src/domain/invoice-tax-regime.ts`](../../src/domain/invoice-tax-regime.ts) + [`src/domain/invoice-tax-mandatory-notices.ts`](../../src/domain/invoice-tax-mandatory-notices.ts) + `src/domain/invoice-calculation.ts` (`computeInvoiceTotalsForTaxRegime`), Migration [`prisma/migrations/20260504143000_fin5_invoice_tax_regimes/`](../../prisma/migrations/20260504143000_fin5_invoice_tax_regimes/migration.sql) | Mandanten-Default + optional Projekt-Override (Resolver Override > Profile > Default, Audit auf Mutationen); Rechnungs-Snapshot mit `invoice_tax_regime` / `vat_rate_bps_effective` / `tax_reason_code`; Pflicht-Hinweiszeilen am Server; XRechnung [`POST /exports`](../api-contract.yaml): optional `xrechnungXml` (UBL) fuer die vier FIN-5-Regime; Mapping-Referenz [`docs/contracts/xrechnung-tax-regime-mapping.md`](../contracts/xrechnung-tax-regime-mapping.md); Stammdaten XRechnung [`src/persistence/e-invoice-party-persistence.ts`](../../src/persistence/e-invoice-party-persistence.ts) / Tabellen `tenant_e_invoice_parties` & `customer_e_invoice_parties` (Migration `20260505140000_e_invoice_party_profiles`); Profil-Dokument [`xrechnung-profile-scope-and-gaps.md`](../contracts/xrechnung-profile-scope-and-gaps.md); historisches Gate: [`FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md); Folge-Inkremente (Pakete **A–D** erledigt — PWA-Steuerprofil, Pflicht-Hinweise, XRechnung-Mapping, Drift-Recreate; siehe [`FIN-5-FOLLOWUP-INCREMENTS.md`](../tickets/FIN-5-FOLLOWUP-INCREMENTS.md)) |
| **Roadmap — Weg zur fertigen App** | [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md) | Phasen A–E: CI/Lieferung, Option A, 5c-Go, FIN-5/6, Phase 2 LV separat |
| **Produkt-UI — Backend-Vollabdeckung (Programm)** | [`pwa-backend-coverage-matrix.md`](../plans/pwa-backend-coverage-matrix.md), [`pwa-information-architecture.md`](../plans/pwa-information-architecture.md), [`pwa-ux-patterns-end-user.md`](../plans/pwa-ux-patterns-end-user.md), [`pwa-domain-increment-roadmap.md`](../plans/pwa-domain-increment-roadmap.md), [`pwa-qa-quality-bar.md`](../plans/pwa-qa-quality-bar.md) | OpenAPI/`api-client`/PWA-Matrix; IA und Nav; UX-Muster; priorisierte Domänen-Inkremente; E2E/A11y/Verify-Leiste |
| **FIN-4 / M4 Vorlagen + Footer** | `GET`/`PATCH` `/finance/dunning-reminder-templates`…, `GET`/`PATCH` `/finance/dunning-email-footer`, `src/services/dunning-reminder-template-service.ts`, `dunning-email-footer-service.ts`, `dunning-template-persistence.ts`, `dunning-email-footer-persistence.ts` | ADR-0010 (M4) |

---

## API-/App-Zeilen (ehemals mitten in der Einstiegstabelle)

| Bereich | Pfad | Rolle |
|--------|------|--------|
| HTTP-Server-Start | `src/index.ts` | Prozessstart, App bauen |
| App-Zusammenbau | `src/api/app.ts` | Fastify-Plugins, Routen-Mount, Repository-Modus |
| Konfiguration Listen/Repo | `src/config/http-listen.ts`, `src/config/repository-mode.ts` | Port, Postgres vs. Memory |

*(Diese drei Zeilen sind identisch zur [Spine](./overview-spine.md); hier zur Vollständigkeit der historischen Codemap-Tabelle.)*
