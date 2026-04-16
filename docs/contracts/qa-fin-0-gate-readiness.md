# QA — FIN-0 Gate-Readiness & FIN-2-Start-Gate (Testbarkeit)

**Rolle:** QA Engineer (Repository).  
**Kontext:** FIN-0 = primär Dokumentation/Verträge; Regression = **gesamte** CI / lokaler `npm test` grün. **Merge auf `main`/`master`:** kanonische Evidence = **grüner GitHub Actions-Run** (Job wie [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)); lokale CI-Parität (96/0) **ersetzt** den Remote-Run **nicht**. FIN-2 = später; P0-Matrix nur **Stub** (siehe `qa-fin-2-start-gate-stub-matrix.md`).  
**MVP-Abnahme später:** `ERP Systembeschreibung v1.3.md` **§15** *Validierung und Quality Gate* — dort u. a. Finanzlogik (Abschnitt 8) konsistent mit Lebenszyklen und Traceability, AuditEvent-Modell, Rollen inkl. Zahlungs-/Mahnaktionen.

---

## 0) Vorbedingung — **PL / System — zuerst**

QA-Arbeit an Merge-Evidence, Gate-Stichproben und Contract-Abgleich setzt den **vom Projektleitung / System** kommunizierten Rahmen voraus. **Verbindlich für diesen Koordinationszyklus** (Stand **2026-04-14**): Sprint-Snapshot [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../tickets/PL-SYSTEM-ZUERST-2026-04-14.md) (Volltext **nur** dort — keine Dublette in der Vorlage). **Index + Kopierblock** für Folgezyklen: [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](../tickets/PL-SYSTEM-ZUERST-VORLAGE.md). **Domäne:** [`ERP Systembeschreibung v1.3.md`](../../ERP%20Systembeschreibung%20v1.3.md). **Multi-Agent-Kernregeln:** [`.cursor/rules/erp-multi-agent.mdc`](../../.cursor/rules/erp-multi-agent.mdc). **Orchestrierung & Zukunft (Agenten-Runden):** [`prompts/README.md`](../../prompts/README.md) (**nur Team-Clone**) · [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](../../prompts/AGENTEN-PROMPT-LEITFADEN.md) (Lieferkette, Pflichtzeilen, Review A/B/C; **nächste Prompts** nur aus **Code-Review-Rückmeldung**). Liegt der Rahmen nicht ausreichend vor oder widerspricht ein PR dem aktuellen Snapshot, dokumentiert QA die Lücke in der **Rückmeldung an Projektleitung** (Format unten) und trifft **keine** PL-Prozessentscheidungen eigenmächtig (z. B. FIN-2-Spalte **erfüllt**, Audit-**PL-Eintrag**). *(Hinweis: Für die **PL-Prompt-Planung** ist allein die Code-Review-Rückmeldung maßgeblich; QA nutzt dieses Format bei eigener Eskalation/Merge-Evidence.)*

---

## Rückmeldung an Projektleitung (Format)

Bei Eskalation, nach relevantem **Merge-PR-Review**, oder auf **PL-Anforderung**: Rückmeldung in **genau diesem Aufbau** — **immer** die beiden Pflichtangaben **Actions-Link** und **Merge blockiert** (siehe Abschnitt **Offene Punkte / PL-Entscheidung**).

### Ergebnis

*(kurz: was ist fertig / was nicht)*

### Begründung

*(1–3 Sätze)*

### Risiken

*(max. 3 Bullets)*

### Offene Punkte / PL-Entscheidung nötig

*(Bullets; inkl. was auf PL-Antwort wartet)*

**Pflicht (immer ausfüllen):**

- **Grüner GitHub-Actions-Link für Merge auf `main` vorhanden (PR-Evidence):** ja / nein — falls nein: `fehlt` | `rot` | `SHA unklar` *(kurz)*  
- **Merge auf `main` aus QA-Sicht blockiert:** ja / nein — falls ja: *(Grund: §5b-Grund, fehlende Evidence, G8, Gate-Widerspruch, …)*

**Sonderfall — noch kein PR / kein Merge-Gegenstand:** Wenn in der Rückmeldung **kein** konkreter Merge auf `main` bewertet wird (z. B. nur Koordination, lokaler Workspace ohne Remote-PR), ist **„Merge blockiert“** mit **nein** zu beantworten *(Begründung: kein anstehender Merge — §5a/§5b erst bei existierendem PR)*. Fehlendes **Git/Remote** oder fehlende **Tracker-URL** gehören unter **Offene Punkte / PL-Entscheidung**, **nicht** als „Merge blockiert: ja“. **„Ja“** nur, wenn ein **benannter** PR/Merge **tatsächlich** ohne vollständige §5a, mit **rotem** Run, **SHA-Unklarheit** oder anderem §5b-Grund **für diesen Merge** vorliegt. *(Abgestimmt mit [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](../../prompts/AGENTEN-PROMPT-LEITFADEN.md): §3 Pflichtzeilen, §5 Sonderfall C „kein PR“.)*

### blocking *(Code Review / Eskalation — explizite Zeilen; bei „kein blocking“ exakt so schreiben)*

- …  
*oder:* **kein blocking**

*(Hinweis: dieselben Zeilen wie im GitHub-Review-Kommentar verwenden, damit PL ohne PR-Kontext entscheiden kann. Vorlage:* [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](../tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md)*)*

### Evidence (falls zutreffend)

- **QA:** Link zum grünen Actions-Run + SHA + Team-Regelzeile (§5a) — oder `fehlt` / `rot` + Verweis auf §5b-Kommentar im PR  
- **Backend:** PR-Link / Branch — oder `kein PR`  
- **Frontend:** Tracker-URL zum Backend-Issue — oder `noch nicht angelegt`

---

## 1) Review FIN-2-Start-Gate — sind alle Kriterien **testbar**?

| Gate | Testbar? | Begründung |
| --- | --- | --- |
| **G1** | **Ja** (I) | Persistenz + Tenant-Isolation über Prisma/Integrationstests (Muster: bestehende Persistenz-Suites). |
| **G2** | **Ja** (I) | Analog G1 für Aufmass-Slice + Negativfall fremder Mandant. |
| **G3** | **Ja** (I + E) | Referenz-Test „Traceability fail-closed“ ist fachlich spezifizierbar (heutige Muster: `TRACEABILITY_*` in API-Tests). |
| **G4** | **Teilweise** | **Binär** „ADR merged“: automatisierbar nur als trivialer Datei-Check; **inhaltliche** Vollständigkeit (a)–(c) = **Review/M** + ggf. Checkliste. *Hinweis Repo:* `docs/adr/0007-finance-persistence-and-invoice-boundaries.md` existiert — Spalte „erfüllt“ in `FIN-2-START-GATE.md` ist durch **Projektleitung** gegen Nachweis-Link zu aktualisieren, nicht durch QA allein. |
| **G5** | **Ja** (C + I) | OpenAPI/JSON-Schema + Implementierungstest: `lvVersionId` Pflicht, keine Abweichung ohne ADR-Änderung. |
| **G6** | **Nein (nicht rein automatisch)** | „Schriftliche Erklärung“ = **M** (Ticket/QA-Report); unterstützbar durch Verweis auf grüne P0-Matrizen Phase-2. |
| **G7** | **Ja** (I) | CI + `npm test`; Persistenz ohne SKIP bei gesetztem `PERSISTENCE_DB_TEST_URL` (siehe `.github/workflows/ci.yml`). |
| **G8** | **Ja** (C + I) | Abgleich OpenAPI ↔ `error-codes.json` / Mapping-Dokument; Stub-Routen später gegen gleiche Codes. |
| **G9** | **Teilweise** | ADR-Text = **M**; Konsistenz „kein Produktions-Go ohne Persistenz/Audit“ = **M** + später **I** auf Deploy-Pipeline. |
| **G10** | **Nein (Prozess)** | Explizite Freigabezeile = **M**; Voraussetzung G1–G9 = binär nachziehen. |

**Fazit:** Kein Gate ist „untestbar“ im Sinne von „unklar messbar“ — **G4, G6, G9, G10** haben jedoch einen **obligatorischen manuellen/Review-Anteil**, der **nicht** durch Unit-Tests allein ersetzt werden darf. Bei **Rot** in CI oder Widerspruch OpenAPI ↔ Contracts: **Merge blockieren** (reproduzierbarer Log-Auszug im PR).

---

## 2) Stub-Matrix (FIN-1 × FIN-2)

Siehe: [`qa-fin-2-start-gate-stub-matrix.md`](./qa-fin-2-start-gate-stub-matrix.md).

**FIN-0 HTTP-Stubs (Happy / Edge / Negative):** [`qa-fin-0-stub-test-matrix.md`](./qa-fin-0-stub-test-matrix.md) — Aufrufe und erwartete Codes laut [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md); Tests verlinkt nach [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) (keine Duplikation der Assertions).

---

## 3) Regression — Evidenz (lokal)

| Befehl | Ergebnis | Datum |
| --- | --- | --- |
| `npm test` (ohne `PERSISTENCE_DB_TEST_URL`) | **84** bestanden, **12** übersprungen (**96** gesamt); Skips = gesamte Datei `test/persistence.integration.test.ts` | 2026-04-14 |
| CI-Kette lokal (Postgres 16, `DATABASE_URL` + `PERSISTENCE_DB_TEST_URL` wie Workflow) | `npx prisma migrate deploy` → `npm run prisma:validate` → `npm run typecheck` → `npm test`: **96/96**, **0 skipped**, **7/7** Test-Dateien | 2026-04-14 |

**CI-Zielzustand (kanonisch):** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — in **GitHub Actions** (`npm ci`, `npx prisma migrate deploy`, `npm run prisma:validate`, `npm run typecheck`, `npm test` mit Postgres + `PERSISTENCE_DB_TEST_URL` → **96/96**, **0 skipped**).

**Merge-Evidence — Pflicht für jeden Merge auf `main`/`master`:** Im **selben PR** (oder unmittelbar nach Merge in einer nachverfolgbaren Notiz am PR/Merge) **HTTPS-Link zum grünen GitHub Actions-Run** einfordern — Workflow wie [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`**, und der ausgelöste **Commit-SHA** des Runs muss sich gegen den **Merge auf `main`** belegen lassen (siehe **3a** zu Squash vs. Merge: **nicht raten**). **Lokale 96/0** = **Zusatz**, **kein** Ersatz für den Remote-Run. **Ohne** einen im PR nachweisbaren **grünen** GitHub-Actions-Link, der den Merge auf **`main`** / **`master`** belegt → **vor Merge** Vorlage **§5b** (keine Merge-Empfehlung). Zusätzlich: Pipeline **rot** oder **SHA-Bezug** (Squash vs. Merge) **unklar** → **nicht interpretieren** → **Merge blockieren** und **§5b** (Run + Step + **ausschließlich wörtliches** Log aus Actions — **keine** Paraphrase, **keine** Zusammenfassung).

*Kein „grün genug“:* Jeder rote Test oder fehlgeschlagene CI-Job = **Blocker** bis Log im PR dokumentiert und behoben.

### 3a) Merge-PR auf `main`/`master` — QA-Checkliste (**jeder** Merge-PR)

1. **Evidence-Zeile** im PR suchen: **HTTPS Run-URL** + **SHA** (Vorlage **§5a**). **Fehlt der Link vor Merge** → **immer §5b** (Blocker), kein leerer QA-Kommentar.
2. Run öffnen: Workflow entspricht [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`** = **grün** (alle Steps grün).
3. **SHA** des Runs mit dem Merge auf `main`/`master` abgleichen. **Squash vs. Merge-Commit:** QA **ratet nicht** und **interpretiert** den Bezug **nicht** — bei Unklarheit → **§5b** mit festem Grundtext **(A)** aus **§5b** (identischer Wortlaut). Optional kann das Team die Regelzeile nachziehen; bis **§5a** vollständig (inkl. Team-Regel) → Merge-Evidence nicht erfüllt.
4. Fehlt eine gültige Zeile, ist der Run **rot**, oder Schritte 2–3 schlagen fehl → **Merge blockieren** und **§5b** (Run-URL + Step-Name + **wörtliches** Log-Snippet aus **genau diesem** Actions-Run — keine Paraphrase) — kein Merge-Empfehlungstext ohne gültige Evidence.

### 3b) PR „reine Doku: Rollenprompts / Koordination“ vs. Sprint-Rahmen

Für den geplanten **Doku-PR** (Ziel: nur [`prompts/`](../../prompts/) `*` inkl. [`prompts/AGENTEN-PROMPT-LEITFADEN.md`](../../prompts/AGENTEN-PROMPT-LEITFADEN.md), optional ausdrücklich benannte Begleit-Docs wie [`docs/contracts/qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) §3b, optional [`prompts/FIN-0-rollenprompts.md`](../../prompts/FIN-0-rollenprompts.md)): Inhalt gegen [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../tickets/PL-SYSTEM-ZUERST-2026-04-14.md) und [`docs/tickets/FIN-2-START-GATE.md`](../tickets/FIN-2-START-GATE.md) stichprobenartig prüfen (kein produktives FIN-2 vor Gate G1–G10; keine Audit-Laufzeit-Freigabe ohne vollständigen **PL-Eintrag** in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)). **Dieselben Commits** enthalten zusätzlich **`src/`**, **`apps/`**, **`prisma/`**, oder **OpenAPI** / **`error-codes.json`** / **Contracts** ohne separates Gate → **Misch-PR** → **§5b** / Merge aus QA-Sicht blockieren / in **blocking** und Rückmeldung an PL eskalieren („Misch-PR: nicht reine Doku“) — gültig bleibt nur eine **im PR ausdrücklich** benannte reine Doku-Ausnahme laut Sprint/PL.

---

## 4) OpenAPI (FIN-0) ↔ `error-codes.json` / Contracts

**Geprüft:** `docs/api-contract.yaml` (Pfade `/finance/payment-terms/versions`, `/invoices`, `/invoices/{invoiceId}`, `/finance/payments/intake`) dokumentieren in `responses` ausschließlich bestehende Domain-Codes bzw. Auth:  
`TRACEABILITY_LINK_MISSING`, `TRACEABILITY_FIELD_MISMATCH`, `EXPORT_PREFLIGHT_FAILED`, `DOCUMENT_NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHORIZED`, `AUTH_ROLE_FORBIDDEN`, `TENANT_SCOPE_VIOLATION`.

**Abgleich:** `docs/contracts/error-codes.json` listet diese Codes in `domainErrorCodesEmitted` bzw. `nonDomainErrorCodesEmitted`; `qaP0MappingHints` enthält Eintrag **`finance-fin0-stub`** mit Verweis auf `docs/contracts/finance-fin0-openapi-mapping.md`.

**Ergebnis (Stichprobe):** **Keine Widersprüche** festgestellt; **keine neuen Phantom-Codes** in den beschriebenen FIN-0-Response-Zeilen (FIN-0-Scope laut Mapping-Dokument).

**G8 — Pflicht je Contract-PR:** Bei **jedem** PR, der `docs/api-contract.yaml` und/oder `docs/contracts/error-codes.json` und/oder `docs/contracts/finance-fin0-openapi-mapping.md` ändert, den Abgleich **erneut** stichprobenartig ausführen; neue `code`-Werte ohne Eintrag in `error-codes.json` + Mapping → **Merge blockieren**.

---

## 5) QA-Kommentar (Copy-Paste)

### §5a — Felder (pre-merge und post-merge; nur echte Werte; nicht ausdenken)

Im **§5a**-Kernkommentar sind Platzhalter **ausschließlich** durch echte Werte aus der **GitHub Actions-UI** (und bei Post-Merge zusätzlich aus dem Merge auf `main`) zu ersetzen — **keine** erfundenen URLs oder SHAs. **Post-Merge:** Vorlage **5a)** und Tabelle unten (Run belegt Merge auf `main`). **Pre-Merge** (PR noch nicht auf `main`): Vorlage **5a-pre)** — siehe nächster Absatz.

**Vor Merge auf `main` (Szenario A — Review verlangt Evidence vor Approve):** Es darf **keine** falsche Behauptung `Commit <SHA> = Merge auf main` stehen, solange noch **kein** Merge auf `main` erfolgt ist. Stattdessen **§5a (PR-Evidence)** unten (**Vorlage 5a-pre**) verwenden: Run-URL und SHA aus dem **grünen** `backend`-Lauf auf dem **PR-Head** (Run-Detail in GitHub), plus **eine** vom **Projektleitung / Team** bestätigte Zeile **Team-Regel Evidence-SHA**, die klarstellt, dass der SHA den **vom Run geprüften PR-Commit** bezeichnet und ein Merge auf `main` **erst nach** Approve erfolgt. Nach erfolgreichem Merge kann dieselbe §5a-Zelle **editiert** werden auf die **Post-Merge**-Form (**Vorlage 5a)** mit Merge-Commit und passendem Run auf `main` — **nur** wenn das Team das so vereinbart; sonst neuer klar benannter Nachweis-Kommentar ohne Widerspruch zum Kern.

| Feld | Herkunft | Platzhalter bis zur Nachreichung |
| --- | --- | --- |
| Run-URL | GitHub → Actions → grüner Workflow-Run für den Merge-Commit | `https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID>` |
| SHA | Commit des Runs = Merge auf `main` (laut **Team-Regel Evidence-SHA**) | `<SHA>` |
| Team-Regel Evidence-SHA | Eine bestätigte Zeile vom Team (Squash vs. Merge) | `<Team-Regelzeile>` |

*Tabelle primär für **Post-Merge**. **Vor** Merge auf `main`: Run-URL = grüner Lauf zum **PR-Head**; SHA = Commit aus **Run-Detail** (nicht „Merge-Commit“ behaupten) — Vorlage **5a-pre)**.*

Erst **nach** grünem `backend`-Job und belegbarem SHA die Zeile **„Actions (grün): …“** im PR posten — siehe Vorlage **5a-pre)** (vor Merge) bzw. **5a)** (nach Merge).

**§5a — drei Bausteine im PR-Kommentar:**  
- **Nach Merge auf `main`:** siehe drei Bausteine wie in Vorlage **5a)** (Merge-Commit / Run auf `main`).  
- **Vor Merge (Szenario A):** Vorlage **5a-pre)** — gleiche Bausteine, aber **ohne** die Behauptung „= Merge auf main“ in der Actions-Zeile; **Team-Regel Evidence-SHA** muss den PR-Kontext eindeutig machen.

1. **Zeile Actions:** `Actions (grün):` + HTTPS Run-URL mit **echter** `RUN_ID` + **echtes** `SHA` + `Job backend` (Werte nur aus GitHub kopieren).  
2. **Zeile Team-Regel:** `Team-Regel Evidence-SHA:` + **eine** vom Team bestätigte Zeile (Squash vs. Merge — QA ratet nicht).  
3. **Optional:** Verweis auf diese Datei / [`qa-fin-0-stub-test-matrix.md`](./qa-fin-0-stub-test-matrix.md) und PR-Scope („reine Doku“ laut **§3b**, falls zutreffend).

**Regel:** Pro Merge-PR **exakt ein** QA-Kommentar (ein GitHub-Kommentar / ein Block), dessen Kern **immer** entweder **§5a** oder **§5b** ist — **kein** leerer QA-Kommentar, **kein** **zweiter** QA-**Kern**-Kommentar (5a/5b) zum **selben** Merge, der dem ersten **widerspricht**. Bei Korrektur: **bestehenden** Kommentar **editieren** und auf **Team-Klarheit** (Evidence, SHA-Regel) drängen — nicht einen neuen Kern-Kommentar parallel posten. **§5c** nur **im selben** Kommentar **unterhalb** von §5a oder §5b (FIN-2 / G8 / Kontext). **§5a** = grün + Run-URL + SHA + **Pflicht:** eine bestätigte Zeile **Team-Regel Evidence-SHA**. **§5b** = Blocker (Grund); Log nur **Copy-Paste** aus Actions (**keine** Paraphrase). **Fehlender Link** / **rot** / **SHA unklar** → **§5b**; QA **ratet** Squash/Merge-Zuordnung **nicht**. Eskalation oder formale **Rückmeldung an Projektleitung:** Format **„Rückmeldung an Projektleitung“** weiter oben in dieser Datei — **immer** mit Pflichtzeilen **Actions-Link vorhanden** (ja/nein), **Merge blockiert** (ja/nein) und bei Review-Eskalation dem Abschnitt **blocking** (siehe dort).

### 5a-pre) Grün — PR-Evidence **vor** Merge auf `main` (Szenario A)

*Verwenden, solange der PR noch **nicht** auf `main` gemergt ist und der Reviewer §5a vor Approve verlangt. Keine erfundenen Werte.*

```text
## QA — Merge-Evidence (PR — pre-merge)

Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> — geprüfter PR-Head, Job `backend`

Team-Regel Evidence-SHA (Pflicht: genau eine Zeile, vom PL/Team bestätigt; QA ratet nicht): <z. B. „SHA = Commit aus Run-Detail (PR-Head); Merge auf main erst nach Approve unter dieser Evidence.“>

Kontext FIN-0 / Gate: `docs/contracts/qa-fin-0-gate-readiness.md` | FIN-2-Start-Gate: `docs/tickets/FIN-2-START-GATE.md`
```

#### PL-Bestätigung — Standardzeile **Team-Regel Evidence-SHA** (Pre-Merge)

Sofern die **Projektleitung** keine **abweichende** Zeile schriftlich vorgibt (Ticket/PR-Kommentar mit Datum), gilt für **FIN-0**-PRs in diesem Koordinationszyklus die folgende **eine** Zeile als **bestätigt** — **QA** darf sie in **Team-Regel Evidence-SHA** **wortgleich** einfügen (kein Raten):

`SHA = Commit aus Run-Detail (PR-Head); Merge auf main erst nach Approve unter dieser Evidence.`

**Abweichung:** Nur mit expliziter, schriftlicher anderer **eine** Zeile durch die Projektleitung; QA verwendet ausschließlich diese.

### 5a) Grün — Merge-Evidence (Pflichtzeile)

*Nach erfolgreichem Merge auf `main` — oder wenn der Run ausdrücklich den Merge-Commit auf `main` belegt.*

```text
## QA — Merge-Evidence (main)

Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> = Merge auf main — Job `backend`

Team-Regel Evidence-SHA (Pflicht: genau eine Zeile, vom Team bestätigt; QA ratet nicht): <z. B. „SHA = Squash-Merge-Commit auf main“ ODER „SHA = Merge-Commit (no squash)“>

Kontext FIN-0 / Gate: `docs/contracts/qa-fin-0-gate-readiness.md` | FIN-2-Start-Gate: `docs/tickets/FIN-2-START-GATE.md`
```

### 5b) Rot / fehlend — Merge blockiert

```text
## QA — Merge blockiert (CI-Evidence)

**Grund (genau eine Zeile / ein Absatz — nicht kombinieren):** Entweder **(A)** bei SHA-Unklarheit **ausschließlich** dieser feste Text — Copy-Paste, **keine** Ergänzung durch QA:
SHA-Bezug unklar (Squash vs. Merge): eine bestätigte Zeile „Team-Regel Evidence-SHA“ fehlt oder ist nicht belegbar; QA ordnet nicht zu und interpretiert den Merge nicht.
Oder **(B)** anderer Blocker in **einer** kurzen Zeile, z. B. `fehlender grüner Actions-Link vor Merge` | `Job backend rot` | `SHA passt nicht zur vom Team gesetzten Team-Regel Evidence-SHA`.

**Run:** <HTTPS Run-URL des fehlgeschlagenen/fraglichen Laufs, oder bei fehlendem Link vor Merge: „nicht verlinkt — Evidence fehlt“; falls Team einen Run nachreicht: dessen URL>

**Fehlgeschlagener Step:** <exakter Step-Name aus der Actions-UI; bei nur fehlendem Link ohne zugeordneten Run: `n/a (Evidence §5a fehlt)`>

**Log-Snippet** — **ausschließlich wörtlich** aus dem GitHub-Actions-Log des genannten Steps (Copy-Paste): **keine** Paraphrase, **keine** Zusammenfassung. Bei fehlendem Link ohne Run: eine Zeile wörtlich: `Evidence: kein grüner Actions-Link / keine §5a-Zeile vor Merge`
<10–40 Zeilen stderr/stdout hier einfügen, sofern Run vorhanden>

**Vorgeschriebene Evidence nach Fix (vollständiges §5a vom Team einfügen):** PR noch **nicht** auf `main` → **Vorlage 5a-pre)** (kein „= Merge auf main“). Bereits gemergt → **Vorlage 5a)**, z. B.:
Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> = Merge auf main — Job `backend`
Team-Regel Evidence-SHA (eine Zeile, vom Team bestätigt): <…>

Bitte Fix; danach **dieselbe** QA-Kommentar-Zelle **editieren** auf **§5a** (vollständig inkl. Team-Regel) **oder** §5b aktualisieren — **kein** zweiter widersprüchlicher QA-Kern-Kommentar zum selben Merge.
```

### 5c) Kontextblock (optional — **nur** im **selben** Kommentar **unter** §5a oder §5b; SHA-Unklarheit löst **nicht** 5c aus, sondern **§5b**)

```text
**FIN-2-Start-Gate:** `docs/tickets/FIN-2-START-GATE.md` — Spalte **erfüllt** / **Nachweis** pflegt **Projektleitung** (Prozess); QA setzt sie **nicht** eigenständig. Nach PL-Pflege **G1–G3** (ggf. **G7**): Nachweise in der Gate-Tabelle stichprobenartig gegen benannten PR **und** grünen Actions-Run auf `main`; Widerspruch → Eskalation PL.

**G8 (Contract-PR, vgl. §4):** `docs/api-contract.yaml` ↔ `docs/contracts/error-codes.json` ↔ `docs/contracts/finance-fin0-openapi-mapping.md` — bei Abweichung Merge blockieren. SHA-Unklarheit: **§5b** oben, nicht interpretieren.

**Lokal (ohne DB):** `npm test` z. B. **84 passed, 12 skipped (96)** — Skips = `test/persistence.integration.test.ts`; ersetzt keinen grünen Remote-Run.

**MVP später:** `ERP Systembeschreibung v1.3.md` §15.

**Stub-Matrix:** `docs/contracts/qa-fin-2-start-gate-stub-matrix.md`
```

---

## Offene Punkte (QA)

- **Rückmeldung an PL:** bei Eskalation oder auf PL-Wunsch das Format **„Rückmeldung an Projektleitung“** (Abschnitt oben) verwenden — inkl. **Pflichtzeilen** Actions-Link ja/nein und Merge blockiert ja/nein.
- `FIN-2-START-GATE.md`: Spalte „erfüllt“ für **G4** manuell mit Repo-ADR abgleichen (Drift-Risiko, wenn Tabelle nicht gepflegt wird).
- **Nach PL-Pflege** von **G1–G3** (ggf. **G7**): Nachweise in der Gate-Tabelle stichprobenartig gegen benannten PR/Commit und gegen Tests **sowie** grünen **Actions**-Run auf `main` prüfen; bei Widerspruch **an PL eskalieren** — **kein** stillschweigendes OK; QA setzt **erfüllt** / **Nachweis** **nicht** allein.
- FIN-2 P0-Matrix: erst nach Gate-Freigabe voll ausschöpfen (laut Rollenprompt).
- **Erinnerung an Projektleitung (optional, Branch-Schutz):** Status-Check **`backend`** (`.github/workflows/ci.yml`) auf **`main`** als **Required** aktivieren — technische Absicherung der Evidence-Pflicht und roter CI. Prozess/Org-Entscheid; QA hält die Empfehlung hier fest.
