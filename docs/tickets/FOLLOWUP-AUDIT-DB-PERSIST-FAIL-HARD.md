# FOLLOWUP — Audit DB-Dual-Write: Fail-hard (Option B)

**Status:** Option **B** umgesetzt (2026-04-19). Historischer Ist-Zustand (Memory-first + `.catch`) unten dokumentiert; aktuelles Verhalten siehe Abschnitt **„Aktueller Stand“**.  
**Bezug:** [`FOLLOWUP-AUDIT-PERSISTENCE.md`](./FOLLOWUP-AUDIT-PERSISTENCE.md) (Dual-Write umgesetzt), Implementierung `src/services/audit-service.ts`.

## Aktueller Stand (Repo, ab 2026-04)

- `AuditService.append` ist **async**; bei `repositoryMode=postgres` wird **`audit_events.create` zuerst** ausgeführt, danach die Zeile in `repos.auditEvents`.
- DB-Fehler → **`DomainError` `AUDIT_PERSIST_FAILED` (HTTP 500)**; In-Memory enthält **keine** Audit-Zeile bei fehlgeschlagenem Insert.
- Persistenz-relevante Services rufen **`await audit.append`**; wo möglich erfolgt **Persistenz-Sync vor Audit**, damit bei Audit-Fehler die fachliche Abbildung in Postgres bereits geschrieben ist (Domäne kann dennoch teilweise nur im Arbeitsspeicher sein — bekanntes Option-B-Trade-off).
- Tests: `test/audit-service-fail-hard.test.ts`.

## Historischer Ist-Zustand (vor Option B)

`AuditService.append`:

1. schrieb **immer** zuerst in `repos.auditEvents` (In-Memory);
2. bei `repositoryMode=postgres` hing ein asynchroner DB-`create` an **`persistChain`**;
3. bei DB-Fehler: **nur** `console.error` in `.catch` — **kein** `throw`, **kein** Rollback der bereits durchgeführten Domänenmutation.

`listByTenant` wartete auf `persistChain`; bei dauerhaftem DB-Fehler blieb die **Diskrepanz** Memory vs. DB bestehen.

## Risiko

- **GoBD / Nachweisbarkeit:** Betrieb kann annehmen, „Audit liegt in Postgres“, während einzelne oder viele Events **nur** im Prozess existieren.
- **Kein stiller Fix:** Eine Änderung (fail-hard, Transaktion mit Domäne, Outbox) berührt **Fehlertoleranz**, **Latenz** und ggf. **API-Semantik** — nur mit **ADR-/PL-Abgleich**, nicht als Heimlich-Änderung.

## Mögliche Richtungen (Entscheidung PL + Architektur)

| Option | Kurzbeschreibung | Trade-off |
|--------|------------------|-----------|
| **A** | Audit-Insert in **dieselbe DB-Transaktion** wie die auslösende Domänenmutation (z. B. Offer/LV-Persistenzpfad) | Größerer Refaktor; klare atomare Semantik |
| **B** | `append` propagiert Fehler (**fail-hard**) nach außen / Rollback der Request-Transaktion | Harte 5xx bei DB-Ausfall; dafür kein „stilles“ Weiterarbeiten |
| **C** | **Outbox** + asynchroner Worker für `audit_events` | Mehr Infrastruktur; klare Retry-Semantik |
| **D** | Bewusst **best effort** + **Monitoring/Alerting** + README/Runbook „nicht GoBD-final“ | Geringer Aufwand; rechtlich/operativ explizit freigeben |

## Nicht-Ziel (dieses Ticket)

- Keine Änderung am Verhalten **ohne** ausdrückliche Priorisierung und QA-Gate.
- **FIN-2** / Rechnungsbuchung: unverändert [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md).

## Abhängigkeiten

- Nächster Persistenz-Slice nach **PL** (Supplement vs. FIN-1); dieses Ticket kann **parallel** priorisiert werden, wenn Compliance P0 ist.

## PL-Eintrag (verbindlich; **nur durch PL**; vor jedem Audit-**Verhaltens**-PR ausfüllen)

**Kommunizierter Rahmen „PL / System — zuerst“:** Sprint-Snapshot (aktueller Zyklus, Beispiel): [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md); Index und Kopierblock für Folgezyklen: [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md). Ersetzt die **vier Tabellenzellen** unten **nicht** — dort nur echte PL-Entscheidung.

**Kein** Öffnen oder Merge eines PRs, der **`AuditService`**, **Dual-Write** oder die **Transaktionsgrenze für Audit** (z. B. wann `append` / DB-Insert zur Domäne gehört) ändert, **bevor** die folgenden Felder **schriftlich** von der **Projektleitung** gesetzt sind (Commit im Ticket oder verlinktes PL-Protokoll mit Datum). **Entwicklung** trägt hier **keine** vorläufigen, fiktiven oder „provisorischen“ Werte ein und **ersetzt** die Platzhalter `—` nicht zur Freischaltung eines PRs (kein Umgehen der Merge-Sperre).

| Feld | Inhalt (**nur PL**; Zelle bleibt `—` bis zur echten Entscheidung) |
| --- | --- |
| **Datum / Referenz** | 2026-04-19 — Nutzerauftrag „Audit fail-hard“ / PL-Freigabe im Chat |
| **SLA-Datum / Milestone** | Review bei nächstem Produktions-Go; Option A (Transaktion mit Domäne) offen |
| **Gewählte Option** | **B** (fail-hard, kein stilles Weiterarbeiten bei Audit-Insert-Fehler) |
| **SLA (Kurzfassung)** | HTTP 500 `AUDIT_PERSIST_FAILED`; Monitoring/Runbook bei wiederkehrenden 5xx; keine 2xx bei bekanntem Audit-DB-Fehlerpfad. |

**Was PL in die Zellen schreibt (Orientierung, kein Ersatz für ausgefüllte Tabelle):**

- **Datum / Referenz:** Entscheidungsdatum oder Link auf Protokoll.
- **SLA-Datum / Milestone:** bis wann das SLA gilt / Review / Go-Live-Nachweis.
- **Gewählte Option:** genau eine Buchstaben-Option **A** / **B** / **C** / **D**.
- **SLA (Kurzfassung):** Messgrößen, Eskalation; bei **D** ggf. explizit akzeptierte **2xx** — vgl. Abschnitt **„SLA — Mindestinhalt“** unten.

**Merge-Sperre (präzise):** Solange in **mindestens einer** der **vier** Inhaltszellen der Tabelle noch **`—`** steht, ist **kein** PR zu **öffnen** oder zu **mergen**, der **`AuditService`**, **Dual-Write** oder die **Transaktionsgrenze für Audit** ändert. **Vollständiger PL-Eintrag** = alle **vier** Inhaltszellen ohne Platzhalter `—` (echte PL-Angaben; **nicht** durch Entwicklung ausfüllen).

### SLA — Mindestinhalt (PL-owned; im Ticket oder ADR ausformulieren)

- **A:** ggf. Rollback-/Wiederanlaufregeln bei Teilausfällen; wer entscheidet bei partiell committed Domäne.
- **B:** Reaktions-/Verfügbarkeitsannahmen bei harten DB-Fehlern; Erwartung **5xx** vs. Betrieb.
- **C:** akzeptable Verzögerung bis Audit in Postgres sichtbar; Retry-Policy; Was passiert bei dauerhaftem Worker-Ausfall.
- **D:** Eskalationspfad, Alert-Schwellen, Review-Zyklus „nicht GoBD-final“; **explizit**, ob und wann **2xx** trotz Diskrepanzrisiko zulässig ist.

## Nächste Schritte (nach schriftlichem PL-Go)

1. **PL** trägt die **verbindliche** Entscheidung im Abschnitt **„PL-Eintrag“** ein, bis **kein** `—` mehr in den **vier** Inhaltszellen steht. Danach ist die Entscheidung in der **Implementierungs-PR** zitierbar — **kein** Audit-Verhaltens-PR **vorher**.
2. **Genau ein** fokussierter **Implementierungs-PR** nach PL-Vollzug — **getrennt** von fachfremden PRs; kein „still“ geändertes Laufzeitverhalten nebenbei (`AuditService` / Dual-Write in anderen PRs **nicht** verschlechtern):
   - **Erste Zeile der PR-Beschreibung:** gewählte **Option** (z. B. `Option B: fail-hard …`) **+** Verweis auf **SLA** (dieser Ticket-Abschnitt **„PL-Eintrag“** oder ADR).
   - **Fehlersemantik (API):** Für **A–C** gilt: schlägt der für die Option **relevante** Audit-/DB-Schreibpfad fehl und die Anfrage endet **nicht** bewusst mit einem **DomainError (HTTP 4xx)** (wo mit PL/SLA vereinbart), darf die Antwort **kein HTTP 2xx** sein — **kein undiszipliniertes 2xx** bei simuliertem bzw. realem Fehlerpfad (typisch Rollback + **5xx** oder konsistente Pipeline-Fehlerantwort). **Kein** Erfolg nach außen bei persistiertem DB-Fehler „neben“ erfolgreicher Domänenantwort ohne explizites 4xx-Modell. Bei **Option D** dokumentiert die PL im **SLA** ausdrücklich, ob und wann **2xx** trotz bekanntem Diskrepanzrisiko zulässig ist (sonst wie A–C behandeln).
   - **Tests (Qualitätsgate):** Memory **↔** Postgres mit **`PERSISTENCE_DB_TEST_URL`** (Runbook). Für **A–C** sind **simulierte** DB-/Audit-Fehlerpfade mit der **vereinbarten** Fehlersemantik durch Tests abgedeckt (erwarteter Status **≠ 2xx** bzw. Transaktionsabbruch, **oder** bewusstes **DomainError 4xx** dort, wo im SLA so vereinbart); **ohne** diese Regressionstests ist der PR **unzureichend** (Risiko GoBD/Nachweisbarkeit bleibt sonst dokumentiert offen). Bei **Option D** gelten Tests, Nachweise und ggf. **Monitoring/Freigabe** **ausschließlich** wie im **ausgefüllten** SLA/Ticket beschrieben (nicht weiter abschwächen als PL dokumentiert hat).
   - **ADR/README:** nur im Umfang der gewählten Semantik.
3. **FIN-2** / **8.4** und produktive `/finance`/`/invoices`: **out of scope**, solange [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) **G1–G10** nicht alle **ja** sind.

## Lieferbild (Backend / Review)

- **Bis** PL-Eintrag vollständig (kein `—` in den **vier** Inhaltszellen): **Warten auf PL** — **nur** Doku-PRs ohne Audit-Laufzeitänderung; **keine** Tabellen-Inhaltszellen durch Entwicklung füllen.
- **Nach** vollständigem PL-Eintrag: **genau ein** fokussierter Audit-**Implementierungs-PR** (Zeile 1 = **Option A–D** + **SLA-Referenz**, Tests/CI wie oben) mit Nachweis **grüner Persistenz-CI** (`PERSISTENCE_DB_TEST_URL` laut Runbook).
