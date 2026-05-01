# FOLLOWUP — M4 Mahn-UX: Tab „Grundeinstellungen“ / Routing

**Status:** Zielbild-Routing **erledigt** (2026-04-28). **Code:** [`hash-route.ts`](../../apps/web/src/lib/hash-route.ts), [`App.tsx`](../../apps/web/src/App.tsx), Schnellzugriff [`role-quick-actions.ts`](../../apps/web/src/lib/role-quick-actions.ts).  
**Stand 2026-04-28:** Zielbild (ein kanonischer Hash für Grundeinstellungen, kein paralleles `?tab=`) umgesetzt; PL-Sperre für diesen Slice durch Nutzeranweisung „Sperre aufheben und ausführen“ aufgehoben.  
**Historisch 2026-04-27:** Kein Agent-PR ohne Ticket-Priorität (Wave3-12/14); Backlog unten vollständig.

**Herkunft:** [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) PL-Tabelle Zeile **10** (UI-Ort: bislang Finanz-Vorbereitung; Umzug Grundeinstellungen = späteres UX-Slice).

## Zielbild

- Mahn-Grundeinstellungen (Konfig, Batch, Batch-E-Mail UI) konsistent unter Hash/Route **`#/finanz-grundeinstellungen`** bzw. dediziertem Tab ohne Duplikat-Logik.
- Keine Änderung an SoT, OpenAPI oder Mandanten-Isolation ohne eigenes Ticket + `verify:ci`.

## Nicht-Ziel

- Kein Mix mit **B5** formalem PDF oder **Audit Option A** im selben PR.

## Verweise

- P1-Abschluss Wave 3: [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md)

## Umsetzungs-Backlog (Rest — nach Ticket-Priorität)

- [x] Tab-State und Hash: Kanon **`#/finanz-grundeinstellungen`** für Tab Grundeinstellungen; `#/finanz-vorbereitung?tab=grundeinstellungen` wird beim ersten Paint per `replaceState` vereinheitlicht ([`financePrepHashWithTab`](../../apps/web/src/lib/hash-route.ts), [`normalizeFinancePrepHashToCanon`](../../apps/web/src/lib/hash-route.ts) + Aufruf in [`App.tsx`](../../apps/web/src/App.tsx)); Tab-Wechsel über `applyFinancePrepTabToLocationHash`.
- [x] Schnellzugriff: Kachel **Mahn-Grundeinstellungen** auch für **VERTRIEB_BAULEITUNG** und **VIEWER** ([`role-quick-actions.ts`](../../apps/web/src/lib/role-quick-actions.ts)); PL kann das Navigationsmodell bei Bedarf schriftlich schärfen oder zurücknehmen.
- [x] Copy/IA: Seitentitel (`h2`) bei Tab **Grundeinstellungen** / Deep-Link `#/finanz-grundeinstellungen`: „Finanz (Vorbereitung) — Mahn-Grundeinstellungen“ in [`FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx).
