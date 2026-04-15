# GitHub-Review-Vorlage — FIN-0 / FIN-2-Gate (Copy-Paste)

**Zweck:** Einheitliches Review für PRs mit Architektur-, Vertrags-, Tenant- oder auditrelevanten Änderungen. **Ohne** erfüllte Vorbedingung **„PL / System — zuerst“** (aktueller Sprint-Snapshot, z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md); Index/Vorlage [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md)) kein **Approve** für PRs mit System-/Architektur-/Audit-Verhaltens-Relevanz; stattdessen **Rückmeldung an PL** nach [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md).

---

## Vorbedingung — PL / System — zuerst

- [ ] Vom **Projektleiter** freigegebener Block **„PL / System — zuerst“** liegt vor (Datum/Link/Anhang). Kanonischer Volltext im Sprint-Snapshot (Beispiel): [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md); Vorlage neue Zyklen: [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md). **Ohne diesen Block:** kein **Approve** für PRs mit System-/Architektur-/Audit-Verhaltens-Relevanz; stattdessen **Rückmeldung an PL** (Schema in `qa-fin-0-gate-readiness.md`).

---

## FIN-0 / FIN-2-Gate — Review

**Preview:** Links anklicken.

- [FIN-2-START-GATE](FIN-2-START-GATE.md)
- [FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD](FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) → **„PL-Eintrag“** (vier Zellen)

### 8-Punkte-Checkliste

- [ ] **§8.1** — Traceability; kein Schatten-LV / keine widersprüchliche Nettobasis
- [ ] **§8.5** — Versionierung nur vorwärts; keine destruktive Überschreibung geschäftskritischer Zustände
- [ ] **§8.2** — Gebuchte Rechnung unveränderlich nicht unterlaufen
- [ ] **§12** — Audit nachvollziehbar; Least-Privilege / Lesepfad minimiert
- [ ] **Kein FIN-2 ohne Gate** — kein produktives 8.4-/Finanz-Volumen entgegen G1–G10
- [ ] **Tenant / Auth** — Token ↔ `x-tenant-id`; strikte Tenant-Isolation
- [ ] **Keine Phantom-Codes** — nur `error-codes.json` / dokumentiertes Mapping
- [ ] **Write-Through / fail-hard** — kein **2xx** bei DB-Fehler ohne klares **DomainError**-Envelope; keine **Memory-vs.-DB-Asymmetrie** bei Audit/Mutation

### Audit-PR *(falls PR Audit/Dual-Write/Transaktionsgrenze wie im FOLLOWUP berührt)*

| Prüfpunkt | ☐ |
| --- | --- |
| **PL-Eintrag:** vier Felder **ohne** `—` | ☐ |
| **Option + SLA:** Ticket = **PR Zeile 1** = Code | ☐ |
| **A–C:** Tests zur vereinbarten Fehlersemantik (simulierter DB-/Audit-Fehler; **DomainError 4xx** wo vereinbart; **kein undiszipliniertes 2xx**) | ☐ |
| **D:** nur wie im ausgefüllten SLA/Ticket | ☐ |

#### Gemischter PR (Audit + Unrelated)

**Unrelated (Pfade/Topics):**

- …
- …

**Entscheidung:** ☐ unkritisch · ☐ **changes requested** + Aufteilung · ☐ **blocking** — Kurzgrund: …

---

### blocking *(explizite Zeilen; sonst genau: „kein blocking“)*

- …

### follow-up

- …

---

### PR-Entscheidung

- [ ] **Approve** — nur bei **kein blocking** und erfüllter Vorbedingung **PL / System — zuerst** (soweit zutreffend)
- [ ] **Changes requested** / **blocking**

**Merge-Kommentar (bei Approve, Pflicht):**  
FIN-2-Implementierung (Domäne, produktive API, 8.4) erst nach Schließen von G1–G10 in [docs/tickets/FIN-2-START-GATE.md](FIN-2-START-GATE.md).

### blocking-Schnellliste (in PR-Review übernehmen)

- PL-Eintrag-Tabelle noch `—` → **blocking**
- Option/SLA: Ticket ↔ PR Zeile 1 ↔ Code widersprüchlich → **blocking**
- A–C ohne Tests zur vereinbarten Fehlersemantik → **blocking**
- Gemischter PR: Unrelated nicht konkret benannt oder Scope untragbar → **blocking** oder changes requested + Aufteilung
- Phantom-Codes / OpenAPI-Drift ohne Contract → **blocking**
- Write-Through-Verstoß → **blocking**
- FIN-2 ohne Gate → **blocking**

---

## Rückmeldung an Projektleitung (Review → PL, kopieren)

Schema und Pflichtzeilen: [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) — Abschnitt **„Rückmeldung an Projektleitung (Format)“**.

**Hinweis:** Im Abschnitt **blocking** der PL-Rückmeldung dieselben **konkreten** Zeilen wie im GitHub-Review verwenden (kein Verweis „siehe PR“ ohne Inhalt), damit die PL ohne Kontext entscheiden kann.
