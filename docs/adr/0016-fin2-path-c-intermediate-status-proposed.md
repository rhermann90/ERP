# ADR 0016 — FIN-2 Pfad C: Zwischenstatus GEPRUEFT / FREIGEGEBEN (Proposed)

## Status

**Proposed** — keine Produktiv-Umsetzung ohne Team-Gate und eigenen Implementierungs-PR (nicht gemischt mit 8.4-Motor-PR).

## Kontext

[`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](./0007-finance-persistence-and-invoice-boundaries.md) §8: MVP **Variante A** = **ENTWURF → GEBUCHT_VERSENDET**. **Variante B** = Zwischenstatus vor Buchung.

[`docs/tickets/FIN-2-NEXT-SUBPROJECT-GATE.md`](../tickets/FIN-2-NEXT-SUBPROJECT-GATE.md): Priorität 3 nach 8.4(2–6)-Motor.

## Entscheidung (Zielbild, noch nicht implementiert)

1. Zustandsautomat erweitern: mindestens **GEPRUEFT**, **FREIGEGEBEN** vor **GEBUCHT_VERSENDET** (exakte Namen an Enum `Invoice.status` angleichen).
2. **`BOOK_INVOICE`** nur aus zulässigem Vorstatus (z. B. nur **FREIGEGEBEN**); neue Transitionen mit Audit und Idempotenz-Regeln dokumentieren.
3. **`allowedInvoiceActionsByStatus`** / OpenAPI / PWA-SoT synchron; kein Shell-Schatten-SoT.
4. Persistenz: Migration auf `invoices.status` + ggf. Timestamps pro Übergang.

## Konsequenzen

- Breaking Change für Integratoren mit fest verdrahtetem Zwei-Status-Modell — Contract-Bump und [`FIN4-external-client-integration.md`](../contracts/FIN4-external-client-integration.md) prüfen.

## Verweise

- [`FIN-2-START-GATE.md`](../tickets/FIN-2-START-GATE.md)
- [`NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) Option **C**
