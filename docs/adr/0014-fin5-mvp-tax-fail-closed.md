# ADR 0014 — FIN-5 Steuer-Sonderfälle (8.16): MVP Fail-Closed (Gate Option B, 2026-05-04)

## Status

**Superseded** für produktive §8.16-Aktivierung — siehe [`0015-fin5-invoice-tax-regimes-816.md`](./0015-fin5-invoice-tax-regimes-816.md) (Option A, voller definierter Regime-Umfang). Dieses ADR bleibt als **historische** Dokumentation der MVP-Fail-Closed-Entscheidung **Option B** ([`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md), Stand **2026-05-04**) lesbar.

~~Accepted (technische Repo-Haltung).~~ **Team-Gate:** Option **B — Fail-Closed** geschlossen am **2026-05-04** — [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md). Option **A** erfordert neues Gate und Implementierungs-PRs.

## Kontext *(historisch, vor ADR-0015)*

[`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Meilenstein **M5 (FIN-5)** sah eine dokumentierte Entscheidung zu **8.16** vor. Das Team-Gate [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md) war mit Option **B** geschlossen (**2026-05-04**).

**Ist:** Implementierter Pfad Option A — [`0015-fin5-invoice-tax-regimes-816.md`](./0015-fin5-invoice-tax-regimes-816.md).

## Entscheidung *(historisch)*

**Fail-Closed (Option B)** war die dokumentierte MVP-Entscheidung bis zur FIN-5-Implementierung (Option **A**).

## Konsequenzen *(historisch — vor ADR-0015)*

- Neue APIs oder Request-Felder für Sondersteuersätze nur nach Gate **und** synchron zu OpenAPI / `error-codes.json` / Mapping.  
- [`ADR-0007`](./0007-finance-persistence-and-invoice-boundaries.md) bleibt maßgeblich für EUR und den unvollständigen 8.4(2–6)-Motor; FIN-5 ergänzt **nicht** stillschweigend neue Steuerpfade.

## Verweise

- [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md)  
- [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (8.11, 8.16)
