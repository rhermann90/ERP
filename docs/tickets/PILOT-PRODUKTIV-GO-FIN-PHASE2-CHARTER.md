# Pilot-Produktiv-Go — Finanz + Phase‑2‑Konvergenz (Charter)

**Status:** Arbeitsgrundlage (Repo). **Verbindliche Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md).
**Technischer Konvergenz-Anker:** [`docs/adr/0018-pilot-lv-aufmass-invoice-convergence.md`](../adr/0018-pilot-lv-aufmass-invoice-convergence.md).

## Zielbild (festgehalten)

- **Ein** Pilotmandant mit **kontrolliertem Produktiv-Go** (begrenzter Live-Betrieb).
- **Phase‑2‑Konvergenz** und **LV→Rechnung** über dokumentierte Schnittstellen und Tests — ohne Vermischen von **8.4(2–6)** / **Pfad C** mit Phase‑2‑PRs ohne separates Gate ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md), [`FIN-2-NEXT-SUBPROJECT-GATE.md`](./FIN-2-NEXT-SUBPROJECT-GATE.md)).

## Pilotmandant (von Team zu benennen)

| Feld | Vorgabe |
|------|---------|
| **Mandanten-ID / Bezeichnung** | *(Team: konkreter Tenant / Name)* |
| **Projekt(e)** | *(Team)* |
| **Steuer / FIN‑5** | Nur **explizit erlaubte** Regime und Profile ([`adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md)); **kein** „Mapping aller Regime“ als Pilot-Pflicht |
| **Währung** | **EUR** (Spez 8.16) |

**Stamm-Daten Projekt/Kunde (Phase-2 MVP-Pilot):** Es gibt **kein** Projekt-/Kunden-CRUD in der PWA und keine dedizierten Stammdaten-Endpunkte nur für UUID-Verwaltung. `projectId` und `customerId` werden **außerhalb** dieser Oberfläche vergeben bzw. aus dem [**Dev-/Demo-Pilot**](#devdemo-pilot-repo--phase-2-produktprogramm) übernommen; für einen organisatorischen Produktiv-Pilot trägt das Team die konkreten IDs in die Tabelle „Pilotmandant“ ein.

### Dev-/Demo-Pilot (Repo — Phase-2-Produktprogramm)

Für lokale Verifikation, CI und E2E ohne PII: feste Demo-IDs aus [`src/composition/seed.ts`](../../src/composition/seed.ts).

| Feld | UUID |
|------|------|
| **Mandanten-ID** | `11111111-1111-4111-8111-111111111111` (`SEED_IDS.tenantId`) |
| **Projekt** | `10101010-1010-4010-8010-101010101010` (`SEED_IDS.projectId`) |
| **Kunde** | `20202020-2020-4020-8020-202020202020` (`SEED_IDS.customerId`) |

Ein organisatorisch benannter Produktiv-Pilot **ersetzt** diese Zuordnung vor Mandanten-Go; die Demo-IDs bleiben Referenz für Seeds und automatisierte Tests.

## FIN‑4 / Mahnwesen (Pilot)

| Pfad | Pilot |
|------|--------|
| Einzel-Mahn / Konfig / Vorlagen | Nach Bedarf gemäß Rollen und SoT |
| **Massen-E-Mail 5c** | **Ja / Nein** *(Team ankreuzen)* — bei **Ja:** [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) und [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) |

## Explizite Nicht-Ziele (Pilot-Minimalpaket)

| Thema | Begründung |
|-------|------------|
| **Bankfile / §8.8–8.9** voll produktiv | Out of scope laut [`adr/0007-finance-persistence-and-invoice-boundaries.md`](../adr/0007-finance-persistence-and-invoice-boundaries.md) |
| **8.4(2–6)-Motor** | Nur wenn fachlich zwingend; sonst eigenes Teilprojekt / Gate ([`FIN-2-NEXT-SUBPROJECT-GATE.md`](./FIN-2-NEXT-SUBPROJECT-GATE.md)) |
| **Pfad C** (GEPRÜFT/FREIGEGEBEN) | Nur nach ADR/Gate ([`adr/0016-fin2-path-c-intermediate-status-proposed.md`](../adr/0016-fin2-path-c-intermediate-status-proposed.md)) |
| **Vollständiges XRechnung/DATEV-Mapping aller Regime** | Rest Backlog ([`MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) FIN‑5) |

## Compliance / Mandanten-Go

- Organisatorische Klärung und Checkliste: [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md), [`README.md`](../../README.md), [`AGENTS.md`](../../AGENTS.md) Punkt 6.
- **Kein** Produktiv-Go allein aus diesem Charter — CI ersetzt keine organisatorischen Nachweise.

## Pilot-Härtung (FIN‑6‑Subset)

Vor Go für den Pilot abarbeiten (relevante Zeilen nur):

1. [`docs/contracts/qa-fin-mvp-gate-15-abnahme.md`](../contracts/qa-fin-mvp-gate-15-abnahme.md) und [`docs/contracts/qa-fin6-section15-acceptance.md`](../contracts/qa-fin6-section15-acceptance.md) — für Pilot-Umfang einschränken (keine Pflicht, „alle Regime“ / alle Felder).
2. Logging / §8.14: [`docs/contracts/fin6-logging-privacy-814.md`](../contracts/fin6-logging-privacy-814.md), Tests [`test/privacy-log-redaction.test.ts`](../../test/privacy-log-redaction.test.ts).
3. Audit **Option A** (Domain + Audit in einer DB-Transaktion): [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) — **Pilot:** ja/nein *(Team)*; bei **nein** Kurzbegründung hier: _______________

## Qualität bei Merge

- `npm run verify:ci`; vor Merge auf `main` bei Finanz-/E2E-Touch: `npm run verify:pre-merge` ([`AGENTS.md`](../../AGENTS.md)).

## Phase‑2‑Referenz

- Increment 1: [`PHASE-2-PRIORISIERUNG-INCREMENT-1.md`](./PHASE-2-PRIORISIERUNG-INCREMENT-1.md), [`adr/0004-measurement-lifecycle-phase2-inc1.md`](../adr/0004-measurement-lifecycle-phase2-inc1.md).
- Increment 2: [`PHASE-2-PRIORISIERUNG-INCREMENT-2.md`](./PHASE-2-PRIORISIERUNG-INCREMENT-2.md), [`adr/0005-lv-hierarchy-phase2-inc2.md`](../adr/0005-lv-hierarchy-phase2-inc2.md), [`adr/0013-lv-section9-hierarchy-and-text-separation.md`](../adr/0013-lv-section9-hierarchy-and-text-separation.md).
- Status: [`PHASE-2-BACKEND-KICKOFF-STATUS.md`](./PHASE-2-BACKEND-KICKOFF-STATUS.md).

## Phase-2 Produkt-PWA (Pilot-Checks)

| Check | Status |
|-------|--------|
| Hash `#/geschaeftsprozess` — Wizard LV → Angebot → Rechnungsentwurf | CI: `e2e/login-finance-smoke.spec.ts` („Phase-2 Geschäftsprozess“) |
| Hash `#/lv-bearbeiten` — LV §9 Lesepfad + Shell-Sprung für SoT | CI: gleiche Spec („LV §9: Lesepfad-Seite“) |
| `POST /offers` + `GET …/allowed-actions?entityType=PROJECT` | Backend: `npm test` (`test/app.test.ts`) |

*(Organisatorisches Go ersetzt keine grünen Checks.)*


