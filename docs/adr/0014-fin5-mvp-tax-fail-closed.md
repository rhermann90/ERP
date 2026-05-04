# ADR 0014 — FIN-5 Steuer-Sonderfälle (8.16): MVP Fail-Closed (Gate Option B, 2026-05-04)

## Status

Accepted (technische Repo-Haltung). **Team-Gate:** Option **B — Fail-Closed** geschlossen am **2026-05-04** — [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md). Option **A** erfordert neues Gate und Implementierungs-PRs.

## Kontext

[`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Meilenstein **M5 (FIN-5)** verlangt entweder **ein** aktivierbares Steuer-Sonderfall-Subset aus **8.16** oder eine dokumentierte **Fail-Closed**-Haltung.  
Das Team-Gate [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md) ist mit Option **B** geschlossen (**2026-05-04**).

Für das MVP gilt weiterhin im Repository:

- Produktiver Rechnungsweg nutzt ausschließlich den **Standard-USt-Pfad** (DE 19 %, Basispunkte) wie in `src/domain/invoice-calculation.ts` (`GERMAN_VAT_STANDARD_BPS`, `computeGrossFromLvNetEurMvp`).  
- **Keine** zusätzlichen Steuerregime-Enums oder Feature-Flags für 8.16-Sonderfälle sind ohne Gate-Freigabe und ohne FIN-5-Implementierungs-PR einzuführen.

## Entscheidung

**Fail-Closed (Option B)** ist die **verbindliche MVP-Entscheidung** nach [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md) (Geschlossen **2026-05-04**). Es gibt keinen aktivierten 8.16-Sonderfall-Pfad im MVP; Erweiterung nur nach neuem Gate und ADR-/OpenAPI-/Test-Anpassung (Option **A**).

## Konsequenzen

- Neue APIs oder Request-Felder für Sondersteuersätze nur nach Gate **und** synchron zu OpenAPI / `error-codes.json` / Mapping.  
- [`ADR-0007`](./0007-finance-persistence-and-invoice-boundaries.md) bleibt maßgeblich für EUR und den unvollständigen 8.4(2–6)-Motor; FIN-5 ergänzt **nicht** stillschweigend neue Steuerpfade.

## Verweise

- [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md)  
- [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (8.11, 8.16)
