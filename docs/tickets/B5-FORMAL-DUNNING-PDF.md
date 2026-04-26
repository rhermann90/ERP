# B5 — Formelle Mahnung (BGB): PDF, Archiv, Nachweis

**Status:** Geplant. **ADR:** [0011](../adr/0011-fin4-semi-dunning-context.md). **Compliance:** [compliance-rechnung-finanz.md](../../Checklisten/compliance-rechnung-finanz.md) — vor Mandanten-Go Mahn-/PDF-Themen mit **StB / DSB / PL** abarbeiten; der Code ersetzt **keine** rechtliche Freigabe.

Ziel: immutable PDF, Archiv (Hash/Version), Audit, E-Mail-/Drucknachweis — **formulierter Inhalt** nur mit StB/Anwalt; technische Anker-IDs (kein Mustertext) in [`src/domain/dunning-formal-notice-spec.ts`](../../src/domain/dunning-formal-notice-spec.ts) (siehe ADR-0011, Umsetzungs-Tracking B5).

**Risiko-Abgrenzung (nach SEMI/B3):** `eligibilityContext` / `stageDeadlineIso` aus dem Mahn-Lesepfad dienen der **Nachvollziehbarkeit der Frist**; sie begründen **keine** formelle Mahnung und ersetzen keine Prüfung formeller Mahnvoraussetzungen durch die Steuerberatung.

**Reihenfolge mit Querschnitt (eigener PR):** Nach technischem PDF-/Archiv-Slice den Audit-/Persistenz-Strang separat umsetzen — [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) **nicht** im selben PR wie B5-UI mixen (Wave3-Non-Goal).

**Wave-3 Liefergrenze (Spec-only):** [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](./B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) — inkl. **P1-Wave-3-Querschnitt** (projektinternes Protokoll 2026-04-26, kein StB-Ersatz).
