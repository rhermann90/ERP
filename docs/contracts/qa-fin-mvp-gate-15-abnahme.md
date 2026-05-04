# QA — Finanz-MVP und Quality Gate 15 (Abnahme-Checkliste)

**Zweck:** Sammelreferenz für die **FIN-6**-Abnahme gegen die konsolidierte Systembeschreibung **Quality Gate 15**, ergänzend zu [`qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) und [`review-checklist-finanz-pr.md`](./review-checklist-finanz-pr.md).

## Pflichtnachweise (Repo)

| Nr | Thema | Nachweis / Befehl |
|----|--------|-------------------|
| 1 | CI-Minimal-Kette | `npm run verify:ci` |
| 2 | Merge-Vorprüfung inkl. Finanz-E2E | `npm run verify:pre-merge` |
| 3 | Persistenz bei Schema-/Finanz-Touch | `npm run verify:ci:local-db` |
| 4 | Contract-Sync | `npm run validate:api-contract-yaml`; bei Änderung `info.version`: [`../../src/domain/openapi-contract-version.ts`](../../src/domain/openapi-contract-version.ts) |
| 5 | Finanz-HTTP-Stubs / Codes | Stichprobe [`qa-fin-0-stub-test-matrix.md`](./qa-fin-0-stub-test-matrix.md), [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) |

## Finanz-spezifisch (Auszug)

- **Traceability 8.1 / 5.5:** Rechnung → Aufmass → LV → Angebot → Projekt → Kunde — Buchungs- und Export-Pfade fail-closed bei Lücken.
- **Tenant-Isolation:** keine mandantenübergreifenden Queries auf Finanz-Aggregaten.
- **SoT:** schreibende UI nur mit `allowedActions` / kanonischen Aktionen ([`action-contracts.json`](./action-contracts.json)).
- **FIN-5:** bis Gate-Ausfüllung Fail-Closed laut [`../adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md).
- **8.14:** Logging-Hinweise [`fin6-logging-privacy-814.md`](./fin6-logging-privacy-814.md).

## Ergebnis dokumentieren

Nach Abnahme: Zeile in [`../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 7 Abschnitt **E1** (Evidenz-Tabelle) und Master-Tabelle **D** (FIN-6 Ist/Lücke).
