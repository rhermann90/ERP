# FIN-5 — Team-Gate (historisch): Abschnitt 8.16 vs. Fail-Closed

**Status:** **historisch / überholt** für die **produktive** FIN-5-Umsetzung — **2026-05-04** war das Gate mit Option **B — Fail-Closed** dokumentiert; die **aktuelle** Implementierung folgt **Option A** (voller definierter §8.16-Umfang) in [`docs/adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md).

**Zweck (Archiv):** FIN-5 ([`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Teil 3, Meilenstein **M5**) — ursprüngliche Entscheidung **8.16-Sonderfall (Option A)** vs. **Fail-Closed (Option B)** war hier und in [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md) festgehalten.

**Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) — Steuerlogik und EUR-Pfad (**8.16**).

## Historische Repo-Haltung (Option B, 2026-05-04)

Das Team hatte Option **B** gewählt: kein produktiver 8.16-Sonderfall bis zu einer späteren expliziten Freigabe — siehe die **Superseded**-Markierung in ADR-0014 und die untenstehende Original-Tabelle.

## Aktuelle Referenz (Option A)

- ADR: [`docs/adr/0015-fin5-invoice-tax-regimes-816.md`](../adr/0015-fin5-invoice-tax-regimes-816.md)
- HTTP: `GET|PATCH /finance/invoice-tax-profile`, `GET|PUT|DELETE /finance/invoice-tax-profile/projects/{projectId}`
- OpenAPI: `docs/api-contract.yaml` (`InvoiceTaxRegime`, erweiterte Rechnungs-Schemas)

---

## Original — Entscheidungstabelle (ungeändert zum Archiv)

| Option | Bedeutung | Folge im Repo |
|--------|-----------|----------------|
| **A — Sonderfall aktiv (MVP-Subset)** | Genau **ein** ausgewählter Steuer-Sonderfall aus **8.16** soll produktiv werden | Feature-Flag + Domäne/OpenAPI/Tests laut MVP Teil 3; Export-Preflight ohne stillen Fallback auf Standard-USt |
| **B — Fail-Closed** | Kein produktiver Sonderfall bis zur nächsten expliziten Freigabe | Relevante Pfade bleiben **nicht aktivierbar** oder liefern dokumentiert **fail-closed**; Entscheidung im **ADR** festhalten |

**Gewählte Option (Team, historisch 2026-05-04):** **B — Fail-Closed**

**Referenz ADR (historisch):** [`docs/adr/0014-fin5-mvp-tax-fail-closed.md`](../adr/0014-fin5-mvp-tax-fail-closed.md); ergänzend dieses Ticket/Gate-Dokument.

## Verwandte Artefakte

- Strategischer Kontext: [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md)
- Nach FIN-5 technischer Kern: **FIN-6** und Querschnitte — [`docs/plans/roadmap-fertige-app.md`](../plans/roadmap-fertige-app.md)
