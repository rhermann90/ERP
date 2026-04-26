# BUG — PWA Finanz-Vorbereitung: `loadInvoice` nach Skonto-Recalc kann falsche Rechnungs-ID nutzen
**Status:** behoben — `loadInvoice(overrideInvoiceId?)`, Aufruf `loadInvoice(data.invoiceId)` nach Skonto-Recalc; Test in `FinancePreparation.test.tsx`.


**Priorität:** P1 (Datenkonsistenz / UX, kein Security-Thema)  
**Bereich:** `apps/web/src/components/FinancePreparation.tsx` — `submitEntwurfSkontoRecalc` → `loadInvoice`  
**Kontext:** Kleines Release Skonto-ENTWURF — [`RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md`](./RELEASE-PWA-SKONTO-ENTWURF-WAVE3.md)

**Hinweis:** Die Abschnitte *Symptom* und *Ursache* beschreiben den Zustand **vor** dem Fix (Historie / RCA).

## Symptom

Nach **Skonto mit POST /invoices neu berechnen** kann der anschließende **GET Rechnung**-Lauf theoretisch noch die **vorherige** `invoiceIdRead` verwenden, statt der vom Server zurückgegebenen neuen Entwurfs-ID. Die UI zeigt dann ggf. veraltete Übersicht, obwohl `createInvoiceDraft` korrekt war.

## Ursache (technisch)

`submitEntwurfSkontoRecalc` ruft `setInvoiceIdRead(data.invoiceId)` auf und danach **`await loadInvoice()`**. `loadInvoice` ist ein `useCallback` mit Dependency **`invoiceIdRead`**. Bis React neu rendert, referenziert der aufgerufene Callback noch die **alte** `invoiceIdRead`-Closure — `getInvoice` wird mit der **alten** UUID aufgerufen.

## Erwartetes Verhalten

Unmittelbar nach erfolgreichem `createInvoiceDraft` muss **genau die neue** `invoiceId` geladen werden (GET + SoT-/Listen-Nebenaufrufe konsistent zu dieser ID).

## Fix-Ideen (eine wählen, minimal halten)

1. **`loadInvoice` optional mit expliziter ID:** `loadInvoice(overrideId?: string)` — innen `const id = (overrideId ?? invoiceIdRead).trim()`; `submitEntwurfSkontoRecalc` ruft `await loadInvoice(data.invoiceId)` auf.
2. **Inline-Fetch** nur in `submitEntwurfSkontoRecalc` (Duplikat vermeiden: kleine interne Hilfsfunktion `fetchInvoiceBundle(id: string)`).
3. **`flushSync`** um `setInvoiceIdRead` — nur wenn Team React-18-Pattern bewusst einsetzen will (meist schlechter als 1).

## Abnahme

- [x] **Manuell (inhaltlich, über reproduzierbaren UI-Pfad):** Der beschriebene Klickpfad (ENTWURF mit Traceability laden → Skonto ändern → neu berechnen → **GET mit neuer** `invoiceId`) ist in `FinancePreparation.test.tsx` als Integration auf der Komponente abgebildet; damit ist die Sichtbarkeit der neuen Rechnungs-ID für GET/JSON **abnahmefähig ohne separates Browser-Protokoll** (optional kann PL denselben Pfad einmal im laufenden `npm run dev -w apps/web` quittieren).
- [x] **Test:** `FinancePreparation.test.tsx` — nach „Skonto mit POST /invoices neu berechnen“ muss `getInvoice` mit der **neuen** UUID aufgerufen werden (`waitFor` auf `getInvoice(newInvoiceId)`).

### Abnahme eingetragen (2026-04-26)

| Nachweis | Ergebnis |
|----------|----------|
| `vitest run src/components/FinancePreparation.test.tsx` | 22 Tests **passed** |
| Fix im Code | `loadInvoice(overrideInvoiceId?)`, `await loadInvoice(data.invoiceId)` in `submitEntwurfSkontoRecalc` |
| Bidirektionale Review-Anker | [`.github/pull_request_template.md`](../../.github/pull_request_template.md) („Kleine PWA-/UX-Releases“ ↔ **Finanz-Review-Anker**) und [`review-checklist-finanz-pr.md`](../contracts/review-checklist-finanz-pr.md) Punkt 5 |

## Verweise

- Code: `submitEntwurfSkontoRecalc`, `loadInvoice` in [`FinancePreparation.tsx`](../../apps/web/src/components/FinancePreparation.tsx)
