# ADR 0012 — Finanz-Scope: nur Mandantenrechnungen an Endkunden

## Status

Accepted (2026-05-01).

## Kontext

Das ERP-Finanzmodell und die Compliance-Artefakte hatten zuvor teils eine **zweite gedankliche Ebene** (Plattform-/Betreiberabrechnung, MoR-Bezug) suggeriert. Der **Implementierungsstand** im Repository deckt jedoch **ausschließlich** ab: wie ein **Mandant** Rechnungen, Zahlungseingänge und Mahnungen gegenüber **seinen Endkunden** aus der LV-/Aufmaß-/Angebotskette führt — konsistent mit [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) **Abschnitt 8** und [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](./0007-finance-persistence-and-invoice-boundaries.md).

## Entscheidung

1. **In Scope** für dieses Repository: Finanz-Persistenz, APIs und Prüfpfade für **Mandant → Endkunde** (Traceability über LV, Aufmaß, Angebot, Rechnung, Zahlung, Mahnung).
2. **Ausdrücklich außerhalb des Produkt- und Projektumfangs:** Modellierung oder Checklisten-Pflicht für **Abrechnung der Software-/Plattformleistung gegenüber dem Mandanten** (Lizenz, Nutzungsentgelt des Betreibers). Derartige Prozesse werden **unternehmensintern** außerhalb dieser Codebasis geführt; sie sind **kein** zweiter „Belegpfad“ in [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md).

## Konsequenzen

- Begleitblatt, technisches Ledger, Agenten-Prompts und Validator (`LINE_ALLOWED_SUFFIXES`) sind auf **einen** finanzrelevanten Datenstrom im ERP auszurichten; Punkt **B.9** dokumentiert die Scope-Trennung organisatorisch (**PL**).
- **`docs/ERP-Systembeschreibung.md`** **8.1** enthält einen verweisenden Scope-Satz auf dieses ADR.
- Keine zusätzliche Backend-/API-Arbeit allein aus diesem Scope-Beschluss — bestehende Implementierung entspricht bereits der Entscheidung.

## Links

- [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md)
- [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](./0007-finance-persistence-and-invoice-boundaries.md)
