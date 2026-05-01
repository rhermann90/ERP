# M4 — Mini-Slice 4: E-Mail-Vorschau + Versand-Stub (ohne SMTP)

> **Hinweis (Entwicklungsphase):** „PL“/„PL-Gate“ hier **historisch**; Steuerung: Team/Maintainer, ADRs, CI — kanonisch [AGENTS.md](../../AGENTS.md) Punkt 6.

**Status:** Umgesetzt (Repo)  
**Architektur-Gate:** Default **Option A** laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md) (Abschnitt „Gewählter Strang“, „Non-Goals“) — kein Mix mit 8.4(2–6) oder Pfad C.

## Ziel

Serverseitige **Plain-Text-Vorschau** (Vorlage EMAIL + System-Footer) und **Versand-Stub** (kein SMTP) mit Audit `DUNNING_EMAIL_SEND_STUB`.

## In-Scope

- `POST /invoices/{invoiceId}/dunning-reminders/email-preview` — `{ stageOrdinal, reason }`.
- `POST /invoices/{invoiceId}/dunning-reminders/send-email-stub` — gleicher Body; 400 wenn `readyForEmailFooter` false; 200 mit `outcome: NOT_SENT_NO_SMTP`.
- Auth: Preview = Lesen Rechnung; Stub = `RECORD_DUNNING_REMINDER`-Rolle.
- Platzhalter Mahngebühr aus Stufen-`feeCents`; Skonto/Frist provisorisch aus Rechnung.

## Out-of-Scope

SMTP, HTML, Massenversand, fest codierter Rechtshinweis.

**Nächster Team-Schritt (nicht dieses Ticket):** produktiver Versand (SMTP oder gebündelter Provider), Idempotenz/Retry am echten Versand, ggf. Massenversand und Rechtshinweis-Block — jeweils mit eigenem Scope, ADR-Schnitt und Gate; dieser Slice bleibt bewusst auf Vorschau + Audit-Stub ohne Mail-Transport.

## Referenz

- ADR: [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md) — Abschnitte M4 Slice 4 (und Slice 5a für produktiven Versand).

## Verifikation

`npm run verify:ci` und `npm run verify:ci:local-db`.
