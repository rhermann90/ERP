# M4 — Batch-Mahn-E-Mail (Slice 5c): Spec und Compliance-Bezug

**Status:** Spec fuer Umsetzung abgestimmt mit Entwicklungsplan „Finanz Welle 3 Folge“. **Kein** Ersatz fuer StB/DSB/PL vor Produktiv-Versand.

## Ziel

Nach `POST /finance/dunning-reminder-run` (5b-1, Mahnereignisse) bzw. parallel: **expliziter** SMTP-Versand fuer **mehrere** Rechnungen derselben Mahnstufe ueber **wiederholte Nutzung** der 5a-Pipeline (`DunningReminderEmailService.sendEmail`) — **ohne** automatische Empfaengerableitung aus dem Kundenstamm; **je Rechnung** `toEmail` + **eigener** `Idempotency-Key` (wie 5a).

## HTTP

- **`POST /finance/dunning-reminder-run/send-emails`**
  - **`DRY_RUN`:** Rolle `assertCanReadInvoice`; prueft Kandidaten-Menge (gleiche Engine wie 5b-0/5b-1), Duplikate, Maximalgroesse; optional pro Position Footer/Vorschau-Readiness (kein SMTP).
  - **`EXECUTE`:** Rolle `assertCanRecordDunningReminder`; Body **`confirmBatchSend: true`** (Pflicht); pro Element `invoiceId`, `toEmail`, `idempotencyKey` (UUID); sequentieller Aufruf `sendEmail` pro Zeile.
- Bei Mandanten-Automation **`runMode: OFF`:** **409** `DUNNING_REMINDER_RUN_DISABLED` (gleiche Semantik wie 5b-1 / API-1b).

## fachliche Regeln

| Thema | Entscheidung |
|--------|----------------|
| Kandidaten | Nur `invoiceId`, die fuer `stageOrdinal` + `asOfDate` in `GET …/dunning-reminder-candidates` gelten wuerden. |
| Reihenfolge | Deterministisch: Reihenfolge des Request-Arrays; Abbruch einzelner SMTP-Schritte stoppt nicht die Rueckgabe — Antwort enthaelt **pro Zeile** Outcome (`SENT` \| `REPLAY` \| `FAILED`). |
| Idempotenz | Pro Nachricht wie 5a (`dunning_email_sends`); kein globaler Batch-Key. |
| Teilfehler | Kein transaktioneller Rollback bereits gesendeter Mails; Client wertet `results[]` aus. |
| Rate-Limit | Server: **max. 25** Empfaengerzeilen pro Request — technische Quelle und Pflegehinweis: **Implementationsanker** (Abschnitt unten); kein stiller Versand ueber Limit hinaus — **400** mit Domain-Code. |
| Bestaetigung | API: `confirmBatchSend: true` bei `EXECUTE`; PWA: zusaetzlicher Bestaetigungsdialog vor Aufruf. |

## Implementationsanker (Pflege bei Refactors)

**Batch-Rate-Limit:** Kanonische Konstante **`DUNNING_BATCH_EMAIL_MAX_ITEMS`** (derzeit **25**) in [`src/services/dunning-reminder-batch-email-service.ts`](../../src/services/dunning-reminder-batch-email-service.ts). Bei **Wertaenderung**, **Umbenennung** oder **Verschiebung** des Moduls: zuerst **diese Spec** (Tabelle **fachliche Regeln** / Zeile Rate-Limit und dieser Abschnitt) aktualisieren. Die Checkliste [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) verweist **ohne** eigenen Dateipfad auf diese Datei — Drift-Pflege nur hier und in Code/Kommentar am Symbol, nicht parallel in der Checkliste.

## Compliance / QA

- **PL-Session vor Mandanten-Go:** [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../runbooks/m4-slice-5c-pl-mandanten-go.md) (Agenda-Verweis + Checklistenanker).
- [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0 — kein stiller Massenversand.
- [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) vor Produktiv-Go mit StB/DSB/PL.
- ADR: Ergaenzung in [ADR-0010](../adr/0010-fin4-m4-dunning-email-and-templates.md) (Abschnitt 5c).

## PL

Formales Protokoll: siehe [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) / Folge-PL-Eintrag nach Massen-E-Mail-Freigabe.
