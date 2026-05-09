# FIN-6 — Logging und Datenschutz (§8.14, technischer Anker)

**Zweck:** Minimalfeldklassifikation für **protokollisierte** Ausgaben (Server-Logs, Support-Dumps). Kein Ersatz für organisatorische Produktiv-Klärung vor Mandanten-Go (Empfehlungen [`README.md`](../../README.md), [`AGENTS.md`](../../AGENTS.md) Punkt 6).

## Sensibilität

| Kategorie | Beispiele | Empfehlung Logs / Traces |
|-----------|-----------|---------------------------|
| **Zahlungsinhalt** | `externalReference` (Verwendungszweck), freie Zahlertexte | Kurzform / Redaction — Hilfsfunktion `redactExternalReferenceForLog` in [`src/domain/privacy-log-redaction.ts`](../../src/domain/privacy-log-redaction.ts) |
| **Authentifizierung** | Bearer-Token, Idempotency-Key | **Nie** vollständig loggen; siehe [`src/http/pwa-http-layer.ts`](../../src/http/pwa-http-layer.ts) (Header-Redaction) |
| **Personenbezug** | Namen in Audit-Payloads | Nur bei berechtigtem Debug; Standard: Correlation-ID |

## Umsetzung im Repo

- Zahlungsreferenz-Redaction: [`src/domain/privacy-log-redaction.ts`](../../src/domain/privacy-log-redaction.ts), Tests [`test/privacy-log-redaction.test.ts`](../../test/privacy-log-redaction.test.ts).
- **Call-Sites (Server-Logs):** [`src/api/finance-payment-intake-routes.ts`](../../src/api/finance-payment-intake-routes.ts) protokolliert bei Bedarf **`externalReferenceRedacted`** (nie den Roh-Verwendungszweck): strukturiertes **`request.log.info`** mit `msg: "finance_payment_intake_recorded"` nur wenn **`ERP_LOG_PAYMENT_INTAKE_SUMMARY=1`** gesetzt ist; bei **unerwarteten Fehlern** oder **DomainError mit HTTP ≥ 500** zusätzlich **`request.log.warn`** mit `msg: "finance_payment_intake_failure"` und gleicher Redaction aus dem Request-Body (sofern `externalReference` als String vorliegt). Hilfsfunktion: [`src/api/finance-payment-intake-log-helpers.ts`](../../src/api/finance-payment-intake-log-helpers.ts) (`redactedExternalReferenceFromPaymentIntakeBody`).
- **Audit-Datenbank ≠ stdout-Logs:** `PaymentIntakeService` schreibt `externalReference` weiterhin **vollständig** in Audit-`afterState` (Nachvollziehbarkeit); FIN-6-Redaction gilt für **protokollisierte Laufzeit-Ausgaben**, nicht für die bewusst persistierte Audit-Spur.
- PWA: keine Offline-Schreibpfade für Finanz — [`apps/web/README.md`](../../apps/web/README.md).

## Offene Vertiefung

Vollständige Feldmatrix aller Domänen-Events und Export-Spuren: iterativ mit Produkt/Release; Abnahme §15 siehe [`qa-fin-mvp-gate-15-abnahme.md`](./qa-fin-mvp-gate-15-abnahme.md).
