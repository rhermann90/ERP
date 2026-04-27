# FOLLOWUP — M4 Mahn-UX: Tab „Grundeinstellungen“ / Routing

**Status:** Backlog (kein Wave-3-Pflichtscope). **Teil erledigt (Code):** Deep-Link `#/finanz-grundeinstellungen` und Tab-Auflösung in [`apps/web/src/lib/hash-route.ts`](../../apps/web/src/lib/hash-route.ts); Schnellzugriff-Kachel „Mahn-Grundeinstellungen“ für ausgewählte Rollen in `apps/web/src/lib/role-quick-actions.ts` + `App.tsx`.  
**Stand 2026-04-27 (Acht-Schritte-Plan / Wave3-12):** weiteres UX (z. B. vollständiger dedizierter Tab-Ort ohne Duplikat-Logik laut **Zielbild** unten) nur nach **expliziter PL-Priorität** — kein zusätzlicher Implementierungs-PR durch Agenten ohne PL-Freigabe.  
**Stand 2026-04-27 (Wave3-13 / Agent A — Doku-Spur):** Umsetzungs-Backlog unten mit `main` abgeglichen (alles abgehakt); offenes **Zielbild** (Umzug ohne Duplikat-Logik) unverändert **nur nach PL**.  
**Herkunft:** [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) PL-Tabelle Zeile **10** (UI-Ort: bislang Finanz-Vorbereitung; Umzug Grundeinstellungen = späteres UX-Slice).

## Zielbild

- Mahn-Grundeinstellungen (Konfig, Batch, Batch-E-Mail UI) konsistent unter Hash/Route **`#/finanz-grundeinstellungen`** bzw. dediziertem Tab ohne Duplikat-Logik.
- Keine Änderung an SoT, OpenAPI oder Mandanten-Isolation ohne eigenes Ticket + `verify:ci`.

## Nicht-Ziel

- Kein Mix mit **B5** formalem PDF oder **Audit Option A** im selben PR.

## Verweise

- P1-Abschluss Wave 3: [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md)

## Umsetzungs-Backlog (Rest — nach PL-Priorität)

- [x] Tab-State und Hash: Kanon **`#/finanz-vorbereitung?tab=grundeinstellungen`**; Alias `#/finanz-grundeinstellungen` wird beim ersten Paint per `replaceState` normalisiert ([`normalizeFinancePrepHashToCanon`](../../apps/web/src/lib/hash-route.ts) + Aufruf in [`App.tsx`](../../apps/web/src/App.tsx)); Tab-Wechsel in der UI weiter über `applyFinancePrepTabToLocationHash`.
- [x] Schnellzugriff: Kachel **Mahn-Grundeinstellungen** auch für **VERTRIEB_BAULEITUNG** und **VIEWER** ([`role-quick-actions.ts`](../../apps/web/src/lib/role-quick-actions.ts)); PL kann das Navigationsmodell bei Bedarf schriftlich schärfen oder zurücknehmen.
- [x] Copy/IA: Seitentitel (`h2`) bei Tab **Grundeinstellungen** / Alias `#/finanz-grundeinstellungen`: „Finanz (Vorbereitung) — Mahn-Grundeinstellungen“ in [`FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx).
