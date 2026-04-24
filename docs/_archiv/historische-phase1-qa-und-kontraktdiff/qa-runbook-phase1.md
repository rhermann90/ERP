# QA Runbook Phase 1 (TICKET-002 Fokus)

## Reihenfolge P0-Ausführung
1. `P0-N-01` Tenant-Isolation
2. `P0-N-02..N-05` Lifecycle-Übergänge
3. `P0-N-06` Wirkung vor `BEAUFTRAGT` blockiert
4. `P0-N-07` Wirkung ab `BEAUFTRAGT` erlaubt
5. `P0-N-08` Basisreferenz-Immutable
6. `P0-N-09` Export/Traceability fail-closed (Bruchfall + Grünpfad)
7. `P0-N-10` SoT vs ausführbare Aktionen

## Seed/Setup
- App-Setup: `buildApp({ seedDemoData: true })`
- Standard-IDs: `SEED_IDS` aus `src/composition/seed.ts`
- Rollenheader via signiertem Token (`createSignedToken`)

## Kommandos
- Voller Lauf: `npm test && npm run typecheck`
- Fokus auf TICKET-002-Testnamen: `npm test -- --testNamePattern "P0-N-0"`

## Abbruchkriterien
- Ein fehlender P0-Case oder fehlende Negativ-Evidenz => NO-GO.
- Scope-Unklarheit (fehlender Endpoint/Code im P0-Soll) => Eskalation an Ticket/ADR, kein „grün drücken“.
