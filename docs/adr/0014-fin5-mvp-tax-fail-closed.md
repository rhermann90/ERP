# ADR 0014 — FIN-5 Steuer-Sonderfälle (8.16): MVP Fail-Closed bis Team-Gate

## Status

Accepted (technische Repo-Haltung).

## Kontext

[`docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md`](../MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md) Meilenstein **M5 (FIN-5)** verlangt entweder **ein** aktivierbares Steuer-Sonderfall-Subset aus **8.16** oder eine dokumentierte **Fail-Closed**-Haltung.  
Das Team-Gate [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md) ist durch Produkt/Steuer/Release auszufüllen — der Agent ersetzt das nicht.

Bis zur Ausfüllung gilt im Repository:

- Produktiver Rechnungsweg nutzt ausschließlich den **Standard-USt-Pfad** (DE 19 %, Basispunkte) wie in `src/domain/invoice-calculation.ts` (`GERMAN_VAT_STANDARD_BPS`, `computeGrossFromLvNetEurMvp`).  
- **Keine** zusätzlichen Steuerregime-Enums oder Feature-Flags für 8.16-Sonderfälle sind ohne Gate-Freigabe und ohne FIN-5-Implementierungs-PR einzuführen.

## Entscheidung

**Fail-Closed (Option B aus dem Gate-Dokument)** als **technische Standardhaltung** bis die Tabelle in `FIN-5-GATE-816-FAIL-CLOSED.md` ausgefüllt ist und Spur **B** in [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) gesetzt wird.

## Konsequenzen

- Neue APIs oder Request-Felder für Sondersteuersätze nur nach Gate **und** synchron zu OpenAPI / `error-codes.json` / Mapping.  
- [`ADR-0007`](./0007-finance-persistence-and-invoice-boundaries.md) bleibt maßgeblich für EUR und den unvollständigen 8.4(2–6)-Motor; FIN-5 ergänzt **nicht** stillschweigend neue Steuerpfade.

## Verweise

- [`docs/tickets/FIN-5-GATE-816-FAIL-CLOSED.md`](../tickets/FIN-5-GATE-816-FAIL-CLOSED.md)  
- [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (8.11, 8.16)
