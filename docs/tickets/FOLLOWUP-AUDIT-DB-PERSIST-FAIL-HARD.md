# FOLLOWUP — Audit DB-Dual-Write: Fail-hard (Option B)

**Status:** Option **B** umgesetzt (2026-04-19). Historischer Ist-Zustand (Memory-first + `.catch`) unten dokumentiert; aktuelles Verhalten siehe Abschnitt **„Aktueller Stand“**.  
**Bezug:** [`FOLLOWUP-AUDIT-PERSISTENCE.md`](./FOLLOWUP-AUDIT-PERSISTENCE.md) (Dual-Write umgesetzt), Implementierung `src/services/audit-service.ts`.

> **Entwicklungsphase:** Audit-Gate-Eintrag und „Merge-Sperre“-Formulierungen unten sind **Empfehlung** vor PRs, die `AuditService` / Dual-Write / Transaktionsgrenze **bewusst** ändern. **Kein** automatischer Merge-Stopper durch leere Zellen; technische Blocker: rote CI, OpenAPI-Drift, Tenant-Bruch, fehlende §5a-Evidence ([AGENTS.md](../../AGENTS.md) Punkt 6).

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
- **Kein stiller Fix:** Eine Änderung (fail-hard, Transaktion mit Domäne, Outbox) berührt **Fehlertoleranz**, **Latenz** und ggf. **API-Semantik** — nur mit **ADR-/Team-Abgleich**, nicht als Heimlich-Änderung.

## Mögliche Richtungen (Entscheidung Architektur / Maintainer)

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

- Nächster Persistenz-Slice nach **Team-Priorität** (Supplement vs. FIN-1); dieses Ticket kann **parallel** priorisiert werden, wenn Compliance P0 ist.
- Formelle Mahnung **B5** ([`B5-FORMAL-DUNNING-PDF.md`](./B5-FORMAL-DUNNING-PDF.md)): eigenes Lieferobjekt; **kein** Audit-Transaktions-Refaktor im selben PR wie B5-PDF/UI (Wave3-Plan).

## Audit-Gate-Eintrag (**empfohlen**; **Maintainer:in** / designierte Review-Person; vor Audit-**Verhaltens**-PR ausfüllen)

**Sprint-Kontext („System zuerst“):** Snapshot (Beispiel): [`PL-SYSTEM-ZUERST-2026-04-14.md`](./PL-SYSTEM-ZUERST-2026-04-14.md); Index: [`PL-SYSTEM-ZUERST-VORLAGE.md`](./PL-SYSTEM-ZUERST-VORLAGE.md) *(Pfade historisch mit `PL-` im Namen)*. Ersetzt die **vier Tabellenzellen** unten **nicht** — dort nur echte, dokumentierte Entscheidung.

**Empfehlung:** Vor Merge eines PRs, der **`AuditService`**, **Dual-Write** oder die **Transaktionsgrenze für Audit** ändert, die folgenden Felder **schriftlich** im Repo setzen (Commit im Ticket oder verlinktes Protokoll mit Datum). **KI/Agent** trägt hier **keine** fiktiven Werte ein. In der **Entwicklungsphase** ist ein leerer Eintrag **kein** automatischer Merge-Stopper ([AGENTS.md](../../AGENTS.md) Punkt 6); weiterhin **kein** undiszipliniertes Umgehen von Fail-Semantik ohne Review.

| Feld | Inhalt (**Maintainer**; Zelle bleibt `—` bis zur echten Entscheidung) |
| --- | --- |
| **Datum / Referenz** | 2026-04-19 — Nutzerauftrag „Audit fail-hard“ / dokumentierte Freigabe |
| **SLA-Datum / Milestone** | Review bei nächstem Produktions-Go; Option A (Transaktion mit Domäne) offen |
| **Gewählte Option** | **B** (fail-hard, kein stilles Weiterarbeiten bei Audit-Insert-Fehler) |
| **SLA (Kurzfassung)** | HTTP 500 `AUDIT_PERSIST_FAILED`; Monitoring/Runbook bei wiederkehrenden 5xx; keine 2xx bei bekanntem Audit-DB-Fehlerpfad. |

**Was die Maintainer:in in die Zellen schreibt (Orientierung, kein Ersatz für ausgefüllte Tabelle):**

- **Datum / Referenz:** Entscheidungsdatum oder Link auf Protokoll.
- **SLA-Datum / Milestone:** bis wann das SLA gilt / Review / Go-Live-Nachweis.
- **Gewählte Option:** genau eine Buchstaben-Option **A** / **B** / **C** / **D**.
- **SLA (Kurzfassung):** Messgrößen, Eskalation; bei **D** ggf. explizit akzeptierte **2xx** — vgl. Abschnitt **„SLA — Mindestinhalt“** unten.

**Hinweis (Merge / Review):** Für PRs, die Audit-Laufzeitsemantik **bewusst** ändern, gilt die ausgefüllte Tabelle als **fokussierte Review-Grundlage**. In der **Entwicklungsphase** ersetzt sie **nicht** den grünen `backend`-Run und §5a-Evidence. **Vollständiger Audit-Gate-Eintrag** = alle **vier** Inhaltszellen ohne Platzhalter `—` (echte Angaben; **nicht** durch Agenten ausfüllen).

### SLA — Mindestinhalt (Maintainer-owned; im Ticket oder ADR ausformulieren)

- **A:** ggf. Rollback-/Wiederanlaufregeln bei Teilausfällen; wer entscheidet bei partiell committed Domäne.
- **B:** Reaktions-/Verfügbarkeitsannahmen bei harten DB-Fehlern; Erwartung **5xx** vs. Betrieb.
- **C:** akzeptable Verzögerung bis Audit in Postgres sichtbar; Retry-Policy; Was passiert bei dauerhaftem Worker-Ausfall.
- **D:** Eskalationspfad, Alert-Schwellen, Review-Zyklus „nicht GoBD-final“; **explizit**, ob und wann **2xx** trotz Diskrepanzrisiko zulässig ist.

## Nächste Schritte (nach dokumentiertem Audit-/Architektur-Go)

1. **Maintainer:in** trägt die Entscheidung im Abschnitt **„Audit-Gate-Eintrag“** ein, bis **kein** `—` mehr in den **vier** Inhaltszellen steht. Danach ist die Entscheidung in der **Implementierungs-PR** zitierbar. **Entwicklungsphase:** fehlender Eintrag blockiert Merge **nicht** automatisch — siehe [AGENTS.md](../../AGENTS.md) Punkt 6.
2. **Genau ein** fokussierter **Implementierungs-PR** nach dokumentiertem Go — **getrennt** von fachfremden PRs; kein „still“ geändertes Laufzeitverhalten nebenbei (`AuditService` / Dual-Write in anderen PRs **nicht** verschlechtern):
   - **Erste Zeile der PR-Beschreibung:** gewählte **Option** (z. B. `Option B: fail-hard …`) **+** Verweis auf **SLA** (dieser Ticket-Abschnitt **„Audit-Gate-Eintrag“** oder ADR).
   - **Fehlersemantik (API):** Für **A–C** gilt: schlägt der für die Option **relevante** Audit-/DB-Schreibpfad fehl und die Anfrage endet **nicht** bewusst mit einem **DomainError (HTTP 4xx)** (wo mit Maintainer/SLA vereinbart), darf die Antwort **kein HTTP 2xx** sein — **kein undiszipliniertes 2xx** bei simuliertem bzw. realem Fehlerpfad (typisch Rollback + **5xx** oder konsistente Pipeline-Fehlerantwort). **Kein** Erfolg nach außen bei persistiertem DB-Fehler „neben“ erfolgreicher Domänenantwort ohne explizites 4xx-Modell. Bei **Option D** dokumentiert die **Maintainer:in** im **SLA** ausdrücklich, ob und wann **2xx** trotz bekanntem Diskrepanzrisiko zulässig ist (sonst wie A–C behandeln).
   - **Tests (Qualitätsgate):** Memory **↔** Postgres mit **`PERSISTENCE_DB_TEST_URL`** (Runbook). Für **A–C** sind **simulierte** DB-/Audit-Fehlerpfade mit der **vereinbarten** Fehlersemantik durch Tests abgedeckt (erwarteter Status **≠ 2xx** bzw. Transaktionsabbruch, **oder** bewusstes **DomainError 4xx** dort, wo im SLA so vereinbart); **ohne** diese Regressionstests ist der PR **unzureichend** (Risiko GoBD/Nachweisbarkeit bleibt sonst dokumentiert offen). Bei **Option D** gelten Tests, Nachweise und ggf. **Monitoring/Freigabe** **ausschließlich** wie im **ausgefüllten** SLA/Ticket beschrieben (nicht weiter abschwächen als im SLA dokumentiert).
   - **ADR/README:** nur im Umfang der gewählten Semantik.
3. **FIN-2** / **8.4** und produktive `/finance`/`/invoices`: zusätzliche FIN-2-Arbeit nur im Einklang mit [`FIN-2-START-GATE.md`](./FIN-2-START-GATE.md) (G1–G10 / Nachweise); dieser Abschnitt ist **kein** harter „out of scope“-Automatismus gegenüber dem aktuellen Gate-Stand — bei Drift Ticket/ADR mit FIN-2-START-GATE abgleichen.

## Lieferbild (Backend / Review)

- **Empfehlung:** Audit-Gate-Eintrag vor PRs mit Audit-Laufzeitänderung vollständig halten (kein `—` in den **vier** Inhaltszellen). Doku-PRs ohne Laufzeitänderung bleiben unabhängig; **keine** Tabellen-Inhaltszellen durch Agenten füllen.
- **Nach** vollständigem Audit-Gate-Eintrag: **genau ein** fokussierter Audit-**Implementierungs-PR** (Zeile 1 = **Option A–D** + **SLA-Referenz**, Tests/CI wie oben) mit Nachweis **grüner Persistenz-CI** (`PERSISTENCE_DB_TEST_URL` laut Runbook).

---

## Querschnitt Finanz Welle 3 (Review)

Für die laufende **Finanz-Welle-3**-Planung ([`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md)): dieses Ticket im Kontext **GoBD / Nachweisbarkeit** vs. aktuellem **fail-hard**-Stand (`AuditService.append`) prüfen — ob weitere Transaktions-/Outbox-Schritte vor Mandanten-Go nötig sind, und ob **Option B** für alle neuen Finanz-Schreibpfade (z. B. Mahn-Ereignis, Skonto-Entwurf) ausreichend dokumentiert ist.

### Protokoll (P1-Wave-3 Abschluss, projektintern 2026-04-26)

**Kein Ersatz** für ein echtes externes Sitzungsprotokoll oder für die ausgefüllte **Audit-Gate-Eintrag**-Tabelle oben.

| Thema | Feststellung / nächste Aktion |
|-------|------------------------------|
| M4 Slice **5c** vs. Audit | Unverändert: 5c nutzt **5a-Pipeline** und **Audit pro Versandzeile**; **keine** neue gemeinsame DB-Transaktion Domäne↔Audit (siehe Abschnitt **Wave 3 — Meilenstein 4** unten). |
| Option **A** (Audit+Domäne eine Tx) | **Empfehlung:** erst nach dokumentierten vier Zellen der Tabelle „Audit-Gate-Eintrag“ umsetzen — keine Agenten-Vorausfüllung; kein automatischer Merge-Stopper in der Entwicklungsphase. |
| Mandanten-Go | Produktiver Rechnungs-/Mahn-Go nur mit StB/DSB/Release-Verantwortlichen und [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md). |
| **Follow-up** | Team **bestätigt oder korrigiert** das Doku-Protokoll 2026-04-26 in [`M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md`](./M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md) (Protokollzeile + Zeile 12). Optional: echtes Sitzungsprotokoll (Datum + Link) unten nachtragen. |

### Review-Protokoll (optional; echte URLs nur von Menschen)

**Hinweis:** Die Koordinations-Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) *(Dateiname historisch)* ist **keine** zentrale Pflicht-Eintragsstelle für Agenten. **Agent:** CI/§5a-Disziplin beachten, **keine** erfundenen URLs; **Review-Protokoll**-Zellen hier **nicht** mit Fiktion befüllen.

| Sitzungsdatum | Verlinktes Protokoll (URL) | Inhalt mindestens |
|---------------|----------------------------|-------------------|
| — | — | Bestätigung/Korrektur M4-5b **Protokoll 2026-04-26** + **Zeile 12** (5c); Abgleich P1-4 / Audit / Mandanten-Go |

**Hinweis:** Zelle **„Verlinktes Protokoll“** mit echtem Link ersetzen (Wiki, Confluence, internes Docs-Repo o. ä.); kein Ersatz für die **Audit-Gate-Eintrag**-Vier-Zellen-Tabelle weiter oben in diesem Ticket. **Agent:** füllt **diese** Tabelle nicht mit erfundenen URLs; PR-/Meilenstein-Pflege für Finanz-Merges liegt in [`P1-3-DOCS-MILESTONE-WAVE3.md`](./P1-3-DOCS-MILESTONE-WAVE3.md) (siehe [`AGENTS.md`](../../AGENTS.md)).

**Wave3-10-Tool-Todos (Agent, 2026-04-27):** **Empfehlung** für PRs mit `AuditService` / Dual-Write / Transaktionsgrenze: Audit-Gate-Tabelle pflegen; in der Entwicklungsphase **kein** automatischer Merge-Stopper durch `—`. Tabellenzeile **Sitzungsdatum / Verlinktes Protokoll** weiter `—` bis echte Werte gesetzt sind — **ohne** Kopplung an die Koordinations-Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md).

**Wave3-11-Tool-Todos (Agent, 2026-04-27):** konsistent mit **Wave3-11** in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) (*Agent-Abnahme*); **keine Agent-URLs** in der *Review-Protokoll*-Tabelle; Entwicklungsphase: kein Merge-Zwang durch leere Audit-Zellen ([AGENTS.md](../../AGENTS.md) Punkt 6).

**Wave3-12-Tool-Todos (Agent, 2026-04-27):** konsistent mit **Wave3-12** in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](./PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) (*Agent-Abnahme*); manuelle Koordinations-Zellen nicht vom Agenten erfinden.

## Verknuepfung CI / Merge

- **Empfehlung:** PRs, die **AuditService**-Transaktionsgrenzen ändern, mit Audit-Gate-Eintrag und Runbook [`docs/runbook/ci-and-persistence-tests.md`](docs/runbook/ci-and-persistence-tests.md) (PR-Checkliste Audit) abgleichen — Entwicklungsphase: kein automatischer Merge-Stopper durch leere Zellen ([AGENTS.md](../../AGENTS.md) Punkt 6).


## Wave 3 — Meilenstein 4 (Plan-Abgleich, kein Option-A-Code)

**Stand Entwicklung (ohne Änderung an der verbindlichen Tabelle oben):** M4 Slice **5c** (`POST /finance/dunning-reminder-run/send-emails`) nutzt weiterhin die **bestehende** 5a-Pipeline inkl. **Audit pro Versandzeile**; es wird **keine** neue Transaktionsgrenze zwischen Domäne und `AuditService.append` eingeführt.

**Option A** (Audit + Domäne in **einer** DB-Transaktion): **empfohlen** erst nach dokumentierten **vier** Inhaltszellen der Tabelle „Audit-Gate-Eintrag“ **ohne** Platzhalter `—` (kein automatischer Merge-Stopper in der Entwicklungsphase; [AGENTS.md](../../AGENTS.md) Punkt 6). Dieser Abschnitt dokumentiert den **Plan-Abgleich** — **kein** Ersatz für ausgefüllte Gate-Zellen.

