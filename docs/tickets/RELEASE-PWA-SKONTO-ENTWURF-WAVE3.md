# Release — PWA Skonto am Rechnungsentwurf (Wave 3, klein)

**Status:** Lieferobjekt für optionales **skontoBps**-UI ohne neue Backend-Endpunkte. **API:** weiterhin `POST /invoices` (Entwurf) und `GET /invoices/{id}` — siehe [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) (B2-1a).

## Nutzen

- Nach **GET Rechnung** wird das Skonto-Feld (Schritt 2) mit dem Serverwert `skontoBps` synchronisiert.
- Bei Status **ENTWURF** und vorhandener **Traceability** (`lvVersionId`, `offerVersionId`): Button **Skonto mit POST /invoices neu berechnen** — erzeugt einen neuen Entwurf mit geändertem `skontoBps` und lädt die neue Rechnungs-ID.

## Nicht enthalten

- Keine Bearbeitung gebuchter Rechnungen (nur ENTWURF).
- Kein eigener PATCH-Endpunkt; kein Pfad C / 8.4(2–6).

## QA / Merge

- `npm run test -w apps/web`, `npm run verify:ci`.
- Kein Prisma-Änderungspfad — `verify:ci:local-db` nur nach Bedarf (Runbook); für reine PWA-PRs genügt `verify:ci`, sofern keine Migration dabei ist.

## Verweise

- UI: `apps/web/src/components/FinancePreparation.tsx`
- Tests: `apps/web/src/components/FinancePreparation.test.tsx`
- Bugfix (war P1, jetzt geschlossen): [`BUG-PWA-FINANCE-LOAD-INVOICE-STALE-AFTER-SKONTO-RECALC.md`](./BUG-PWA-FINANCE-LOAD-INVOICE-STALE-AFTER-SKONTO-RECALC.md)
- P1-Gesamtplan: [`P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md`](./P1-FINANCE-WAVE3-POST-RELEASE-PLAN.md)
- P1-3 Meilenstein (Doku/PRs): [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md)
