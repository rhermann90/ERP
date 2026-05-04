# QA — FIN-0 Gate-Readiness & FIN-2-Start-Gate (Testbarkeit)

**Rolle:** QA Engineer (Repository).  
**Kontext:** FIN-0 = primär Dokumentation/Verträge; Regression = **gesamte** CI / lokaler `npm test` grün. **Merge auf `main`/`master`:** kanonische Evidence = **grüner GitHub Actions-Run** (Job wie [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)); lokaler Erfolg (auch **99/99**, **0 skipped** lokal) **ersetzt** den Remote-Run **nicht**. FIN-2 = später; P0-Matrix nur **Stub** (siehe `qa-fin-2-start-gate-stub-matrix.md`).  
**MVP-Abnahme später:** `docs/ERP-Systembeschreibung.md` **§15** *Validierung und Quality Gate* — dort u. a. Finanzlogik (Abschnitt 8) konsistent mit Lebenszyklen und Traceability, AuditEvent-Modell, Rollen inkl. Zahlungs-/Mahnaktionen.

**Operativ / rechtlich außerhalb des Repo-Prozesses:** Mandanten-Go unter Steuer-, Handels- und Datenschutzrecht wird **nicht** durch dieses Repository verpflichtend abgebildet. Optionaler Hintergrund: [`docs/_archiv/checklisten-compliance-human-workflow/README.md`](../../docs/_archiv/checklisten-compliance-human-workflow/README.md); Stub [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md). Kanonisch [`README.md`](../../README.md), [`AGENTS.md`](../../AGENTS.md) Punkt 6.

**Finanz-PR (Code + Contracts):** technische Abnahme je Merge mit [`review-checklist-finanz-pr.md`](./review-checklist-finanz-pr.md) (SoT, G8-Bündel, §5b bei Misch-PRs, GoBD-Querschnitt-Verweis).

---

## 0) Vorbedingung — **Sprint-Kontext („System zuerst“)**

QA-Arbeit an Merge-Evidence, Gate-Stichproben und Contract-Abgleich orientiert sich am dokumentierten Team-Rahmen. **Referenz-Snapshot** (Stand **2026-04-14**): [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../tickets/PL-SYSTEM-ZUERST-2026-04-14.md) *(Pfad historisch)* — Volltext **nur** dort. **Index + Kopierblock** für Folgezyklen: [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](../tickets/PL-SYSTEM-ZUERST-VORLAGE.md). **Domäne:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md). **Projektregeln (cursor-stack):** [`.cursor/rules/cursor-stack.mdc`](../../.cursor/rules/cursor-stack.mdc). **Lieferkette (Git → PR → §5a → Tracker):** nur im **Team-Clone** mit kanonischem Remote arbeiten; **nächste planbare Arbeit** leitet das Team aus Review-Rückmeldung und Tickets ab (dieselbe Aussage **blocking** wie im GitHub-Review; Format **Rückmeldung ans Team** unten). Liegt der Rahmen nicht ausreichend vor oder widerspricht ein PR dem Snapshot, dokumentiert QA die Lücke im gleichen Format und trifft **keine** Gate-Prozessentscheidungen eigenmächtig (z. B. FIN-2-Spalte **erfüllt**, Audit-**Gate-Eintrag**). *(QA nutzt dieses Format bei Eskalation/Merge-Evidence.)*

---

## Rückmeldung ans Team / Review (Format)

Bei Eskalation, nach relevantem **Merge-PR-Review**, oder auf **Maintainer-Anforderung**: Rückmeldung in **genau diesem Aufbau** — **immer** die beiden Pflichtangaben **Actions-Link** und **Merge blockiert** (siehe Abschnitt **Offene Punkte / Entscheidung**).

### Ergebnis

*(kurz: was ist fertig / was nicht)*

### Begründung

*(1–3 Sätze)*

### Risiken

*(max. 3 Bullets)*

### Offene Punkte / Entscheidung nötig

*(Bullets; inkl. was auf Team-/Maintainer-Antwort wartet)*

**Pflicht (immer ausfüllen):**

- **Grüner GitHub-Actions-Link für Merge auf `main` vorhanden (PR-Evidence):** ja / nein — falls nein: `fehlt` | `rot` | `SHA unklar` *(kurz)*  
- **Merge auf `main` aus QA-Sicht blockiert:** ja / nein — falls ja: *(Grund: §5b-Grund, fehlende Evidence, G8, Gate-Widerspruch, …)*

**Sonderfall — noch kein PR / kein Merge-Gegenstand:** Wenn in der Rückmeldung **kein** konkreter Merge auf `main` bewertet wird (z. B. nur Koordination, lokaler Workspace ohne Remote-PR), ist **„Merge blockiert“** mit **nein** zu beantworten *(Begründung: kein anstehender Merge — §5a/§5b erst bei existierendem PR)*. Fehlendes **Git/Remote** oder fehlende **Tracker-URL** gehören unter **Offene Punkte / Entscheidung**, **nicht** als „Merge blockiert: ja“. **„Ja“** nur, wenn ein **benannter** PR/Merge **tatsächlich** ohne vollständige §5a, mit **rotem** Run, **SHA-Unklarheit** oder anderem §5b-Grund **für diesen Merge** vorliegt.

### blocking *(Code Review / Eskalation — explizite Zeilen; bei „kein blocking“ exakt so schreiben)*

- …  
*oder:* **kein blocking**

*(Hinweis: dieselben Zeilen wie im GitHub-Review-Kommentar verwenden, damit das Team ohne PR-Kontext entscheiden kann. Vorlage:* [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](../tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md)*)*

### Evidence (falls zutreffend)

- **QA:** Link zum grünen Actions-Run + SHA aus Run-Details (§5a) — oder `fehlt` / `rot` + Verweis auf §5b-Kommentar im PR  
- **Backend:** PR-Link / Branch — oder `kein PR`  
- **Frontend:** Tracker-URL zum Backend-Issue — oder `noch nicht angelegt`

---

## 1) Review FIN-2-Start-Gate — sind alle Kriterien **testbar**?

| Gate | Testbar? | Begründung |
| --- | --- | --- |
| **G1** | **Ja** (I) | Persistenz + Tenant-Isolation über Prisma/Integrationstests (Muster: bestehende Persistenz-Suites). |
| **G2** | **Ja** (I) | Analog G1 für Aufmass-Slice + Negativfall fremder Mandant. |
| **G3** | **Ja** (I + E) | Referenz-Test „Traceability fail-closed“ ist fachlich spezifizierbar (heutige Muster: `TRACEABILITY_*` in API-Tests). |
| **G4** | **Teilweise** | **Binär** „ADR merged“: automatisierbar nur als trivialer Datei-Check; **inhaltliche** Vollständigkeit (a)–(c) = **Review/M** + ggf. Checkliste. *Hinweis Repo:* `docs/adr/0007-finance-persistence-and-invoice-boundaries.md` existiert — Spalte „erfüllt“ in `FIN-2-START-GATE.md` ist durch **Maintainer / Team-Prozess** gegen Nachweis-Link zu aktualisieren, nicht durch QA allein. |
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

**FIN-0 HTTP-Stubs (Happy / Edge / Negative):** [`qa-fin-0-stub-test-matrix.md`](./qa-fin-0-stub-test-matrix.md) — Aufrufe und erwartete Codes laut [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md); Tests verlinkt nach [`test/finance-fin0-stubs.test.ts`](../../test/finance-fin0-stubs.test.ts) (keine Duplikation der Assertions). *Hinweis in der Matrix:* dieselbe Testdatei deckt auch **produktive FIN-2/FIN-3**-Routen ab (historischer Dokumentname „Stub“).

---

## 3) Regression — Evidenz (lokal)

| Befehl | Ergebnis | Datum |
| --- | --- | --- |
| `npm test` (ohne `PERSISTENCE_DB_TEST_URL`) | **108** bestanden, **17** übersprungen (**125** Vitest-Tests gesamt); Skips = gesamte Datei `test/persistence.integration.test.ts` | 2026-04-19 |
| CI-Kette lokal (Postgres 16, `DATABASE_URL` + `PERSISTENCE_DB_TEST_URL` wie Workflow) | `npx prisma migrate deploy` → `npm run prisma:validate` → `npm run typecheck` → `npm test`: alle Tests **ohne SKIP**, Persistenz-Suite aktiv | 2026-04-19 |

**CI-Zielzustand (kanonisch):** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — in **GitHub Actions** (`npm ci`, `npx prisma migrate deploy`, `npm run prisma:validate`, `npm run typecheck`, `npm test` mit Postgres + `PERSISTENCE_DB_TEST_URL` → **99/99**, **0 skipped**). *Bei abweichender Testanzahl im Branch den **grünen** `backend`-Run in GitHub als Maßstab verwenden und diese Tabelle nachziehen.*

**Merge-Evidence — Pflicht für jeden Merge auf `main`/`master`:** Im **selben PR** (oder unmittelbar nach Merge in einer nachverfolgbaren Notiz am PR/Merge) einen **HTTPS-Link zum grünen GitHub Actions-Run** posten — Workflow wie [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`**, plus der **Commit-SHA** aus den **Run-Details** der Actions-UI (**vor** Merge: SHA des geprüften **PR-Heads**; **nach** Merge: SHA muss sich nachvollziehbar auf den Merge auf `main` beziehen — bei Zweifel ohne eindeutige Zuordnung **§5b**, QA **interpretiert** Squash/Merge nicht frei). **Lokale 99/0** = **Zusatz**, **kein** Ersatz für den Remote-Run. **Ohne** nachweisbaren **grünen** Actions-Link → **§5b**. Pipeline **rot** oder **SHA ohne eindeutige Zuordnung** → **§5b** (Run + Step + **wörtliches** Log — **keine** Paraphrase). **Keine** zusätzliche menschliche „Freigabezeile“ ist im Repo vorgeschrieben.

*Kein „grün genug“:* Jeder rote Test oder fehlgeschlagene CI-Job = **Blocker** bis Log im PR dokumentiert und behoben.

### 3a) Merge-PR auf `main`/`master` — QA-Checkliste (**jeder** Merge-PR)

1. **Evidence-Zeile** im PR suchen: **HTTPS Run-URL** + **SHA** (Vorlage **§5a**). **Fehlt der Link vor Merge** → **immer §5b** (Blocker), kein leerer QA-Kommentar.
2. Run öffnen: Workflow entspricht [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), Job **`backend`** = **grün** (alle Steps grün).
3. **SHA** des Runs mit dem Merge auf `main`/`master` abgleichen. **Squash vs. Merge-Commit:** QA **ratet nicht** — bei Unklarheit ohne belastbare Zuordnung → **§5b** mit festem Grundtext **(A)** aus **§5b** (identischer Wortlaut).
4. Fehlen Run-URL oder SHA, ist der Run **rot**, oder Schritt 3 schlägt fehl → **Merge blockieren** und **§5b** (Run-URL + Step-Name + **wörtliches** Log-Snippet — keine Paraphrase).

### 3b) PR „reine Doku: Tickets / Koordination“ vs. Sprint-Rahmen

Für einen geplanten **reinen Doku-PR** (Ziel: nur Dateien unter [`docs/tickets/`](../tickets/) bzw. [`docs/contracts/`](./) wie in der PR-Beschreibung **explizit** benannt, optional [`docs/contracts/qa-fin-0-gate-readiness.md`](./qa-fin-0-gate-readiness.md) §3b): Inhalt gegen [`docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md`](../tickets/PL-SYSTEM-ZUERST-2026-04-14.md) und [`docs/tickets/FIN-2-START-GATE.md`](../tickets/FIN-2-START-GATE.md) stichprobenartig prüfen (kein produktives FIN-2 vor Gate G1–G10; bei PRs, die Audit-Laufzeitsemantik **bewusst** ändern: **Audit-Gate-Eintrag** in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) **empfohlen** vollständig — in der Entwicklungsphase **kein** automatischer Merge-Stopper durch leere Zellen; kanonisch [AGENTS.md](../../AGENTS.md) Punkt 6). **Dieselben Commits** enthalten zusätzlich **`src/`**, **`apps/`**, **`prisma/`**, oder **OpenAPI** / **`error-codes.json`** / **Contracts** ohne separates Gate → **Misch-PR** → **§5b** / Merge aus QA-Sicht blockieren / in **blocking** und Rückmeldung ans Team eskalieren („Misch-PR: nicht reine Doku“) — gültig bleibt nur eine **im PR ausdrücklich** benannte reine Doku-Ausnahme laut Sprint/Team.

---

## 4) OpenAPI (FIN-0) ↔ `error-codes.json` / Contracts

**Geprüft:** `docs/api-contract.yaml` (Pfade `/finance/payment-terms/versions`, `/invoices`, `/invoices/{invoiceId}`, `/finance/payments/intake`, **`GET /invoices/{invoiceId}/payment-intakes`**) — Stichprobe `responses` gegen bestehende Domain-Codes bzw. Auth; für die genannten Pfade u. a.:  
`TRACEABILITY_LINK_MISSING`, `TRACEABILITY_FIELD_MISMATCH`, `EXPORT_PREFLIGHT_FAILED`, `DOCUMENT_NOT_FOUND`, `VALIDATION_FAILED`, `UNAUTHORIZED`, `AUTH_ROLE_FORBIDDEN`, `TENANT_SCOPE_VIOLATION`.  
**FIN-3 (Intake + Lesepfad):** zusätzlich die in OpenAPI/Mapping genannten Zahlungs-Domain-Codes (z. B. `PAYMENT_EXCEEDS_OPEN_AMOUNT`, `PAYMENT_INTAKE_IDEMPOTENCY_MISMATCH`, `PAYMENT_INVOICE_NOT_PAYABLE`) — vollständiger Abgleich über [`finance-fin0-openapi-mapping.md`](./finance-fin0-openapi-mapping.md) und [`error-codes.json`](./error-codes.json).

**Abgleich:** `docs/contracts/error-codes.json` listet diese Codes in `domainErrorCodesEmitted` bzw. `nonDomainErrorCodesEmitted`; `qaP0MappingHints` enthält Eintrag **`finance-fin0-stub`** mit Verweis auf `docs/contracts/finance-fin0-openapi-mapping.md`.

**Ergebnis (Stichprobe):** **Keine Widersprüche** festgestellt; **keine neuen Phantom-Codes** in den beschriebenen Response-Zeilen (Scope laut Mapping-Dokument).

**G8 — Pflicht je Contract-PR:** Bei **jedem** PR, der `docs/api-contract.yaml` und/oder `docs/contracts/error-codes.json` und/oder `docs/contracts/finance-fin0-openapi-mapping.md` ändert, den Abgleich **erneut** stichprobenartig ausführen; neue `code`-Werte ohne Eintrag in `error-codes.json` + Mapping → **Merge blockieren**.

---

## 5) QA-Kommentar (Copy-Paste)

### §5a — Felder (pre-merge und post-merge; nur echte Werte; nicht ausdenken)

Im **§5a**-Kernkommentar sind Platzhalter **ausschließlich** durch echte Werte aus der **GitHub Actions-UI** zu ersetzen — **keine** erfundenen URLs oder SHAs. **Post-Merge:** Vorlage **5a)** (Run bezieht sich nachvollziehbar auf den Merge auf `main`). **Pre-Merge:** Vorlage **5a-pre)** — Run auf dem **PR-Head**, **ohne** die Behauptung „Commit = Merge auf main“.

**Vor Merge auf `main`:** Es darf **keine** falsche Behauptung `Commit <SHA> = Merge auf main` stehen. Run-URL und SHA aus dem **grünen** `backend`-Lauf auf dem **PR-Head** (Run-Detail in GitHub). **Keine** vom Repo geforderte zusätzliche menschliche Bestätigungszeile.

| Feld | Herkunft | Platzhalter bis zur Nachreichung |
| --- | --- | --- |
| Run-URL | GitHub → Actions → grüner Workflow-Run | `https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID>` |
| SHA | Commit aus Run-Details (vor Merge: PR-Head; nach Merge: Merge-Commit, eindeutig zuordenbar) | `<SHA>` |

*Vor Merge auf `main`: SHA = Commit aus **Run-Detail** zum PR-Head — Vorlage **5a-pre)**.*

Erst **nach** grünem `backend`-Job und kopiertem SHA die Zeile **„Actions (grün): …“** posten — Vorlage **5a-pre)** bzw. **5a)**.

**§5a — Pflicht-Bausteine im PR-Kommentar:**  
1. **Zeile Actions:** `Actions (grün):` + HTTPS Run-URL + **SHA** aus Run-Details + `Job backend` (nur aus GitHub kopieren).  
2. **Optional:** Zeile **`QA-Kern (Permalink):`** + HTTPS-URL des GitHub-Kommentars mit diesem §5a-Block.  
3. **Optional:** Verweis auf diese Datei / [`qa-fin-0-stub-test-matrix.md`](./qa-fin-0-stub-test-matrix.md) und PR-Scope („reine Doku“ laut **§3b**).

**Regel:** Pro Merge-PR **exakt ein** QA-Kern-Kommentar (**§5a** oder **§5b**). **§5a** = grün + Run-URL + SHA. **§5b** = Blocker; Log **Copy-Paste** aus Actions. **Fehlender Link** / **rot** / **SHA ohne eindeutige Zuordnung** → **§5b**. Eskalation: Format **„Rückmeldung ans Team / Review“** oben.

### 5a-pre) Grün — PR-Evidence **vor** Merge auf `main` (Szenario A)

*Verwenden, solange der PR noch **nicht** auf `main` gemergt ist und der Reviewer §5a vor Approve verlangt. Keine erfundenen Werte.*

```text
## QA — Merge-Evidence (PR — pre-merge)

Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> — geprüfter PR-Head, Job `backend`

QA-Kern (Permalink) — optional: <HTTPS-URL des GitHub-Kommentars>

Kontext FIN-0 / Gate: `docs/contracts/qa-fin-0-gate-readiness.md` | FIN-2-Start-Gate: `docs/tickets/FIN-2-START-GATE.md`
```

### 5a) Grün — Merge-Evidence (Pflichtzeile)

*Nach erfolgreichem Merge auf `main` — oder wenn der Run ausdrücklich den Merge-Commit auf `main` belegt.*

```text
## QA — Merge-Evidence (main)

Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> = Merge auf main — Job `backend`

Kontext FIN-0 / Gate: `docs/contracts/qa-fin-0-gate-readiness.md` | FIN-2-Start-Gate: `docs/tickets/FIN-2-START-GATE.md`
```

### 5b) Rot / fehlend — Merge blockiert

```text
## QA — Merge blockiert (CI-Evidence)

**Grund (genau eine Zeile / ein Absatz — nicht kombinieren):** Entweder **(A)** bei SHA-Unklarheit **ausschließlich** dieser feste Text — Copy-Paste, **keine** Ergänzung durch QA:
SHA-Bezug unklar (Squash vs. Merge): Run-Commit lässt sich dem Merge auf main nicht eindeutig zuordnen; QA ordnet nicht zu und interpretiert den Merge nicht.
Oder **(B)** anderer Blocker in **einer** kurzen Zeile, z. B. `fehlender grüner Actions-Link vor Merge` | `Job backend rot` | `SHA passt nicht zum Merge-Commit`.

**Run:** <HTTPS Run-URL des fehlgeschlagenen/fraglichen Laufs, oder bei fehlendem Link vor Merge: „nicht verlinkt — Evidence fehlt“; falls Team einen Run nachreicht: dessen URL>

**Fehlgeschlagener Step:** <exakter Step-Name aus der Actions-UI; bei nur fehlendem Link ohne zugeordneten Run: `n/a (Evidence §5a fehlt)`>

**Log-Snippet** — **ausschließlich wörtlich** aus dem GitHub-Actions-Log des genannten Steps (Copy-Paste): **keine** Paraphrase, **keine** Zusammenfassung. Bei fehlendem Link ohne Run: eine Zeile wörtlich: `Evidence: kein grüner Actions-Link / keine §5a-Zeile vor Merge`
<10–40 Zeilen stderr/stdout hier einfügen, sofern Run vorhanden>

**Vorgeschriebene Evidence nach Fix:** PR noch **nicht** auf `main` → **Vorlage 5a-pre)**. Bereits gemergt → **Vorlage 5a)**, z. B.:
Actions (grün): https://github.com/<ORG>/<REPO>/actions/runs/<RUN_ID> — Commit <SHA> = Merge auf main — Job `backend`

Bitte Fix; danach **dieselbe** QA-Kommentar-Zelle **editieren** auf **§5a** oder §5b aktualisieren — **kein** zweiter widersprüchlicher QA-Kern-Kommentar zum selben Merge.
```

### 5c) Kontextblock (optional — **nur** im **selben** Kommentar **unter** §5a oder §5b; SHA-Unklarheit löst **nicht** 5c aus, sondern **§5b**)

```text
**FIN-2-Start-Gate:** `docs/tickets/FIN-2-START-GATE.md` — Spalte **erfüllt** / **Nachweis** pflegt das **Team / Maintainer:in** (Prozess); QA setzt sie **nicht** eigenständig. Nach Team-Pflege **G1–G3** (ggf. **G7**): Nachweise in der Gate-Tabelle stichprobenartig gegen benannten PR **und** grünen Actions-Run auf `main`; Widerspruch → Eskalation ans Team.

**G8 (Contract-PR, vgl. §4):** `docs/api-contract.yaml` ↔ `docs/contracts/error-codes.json` ↔ `docs/contracts/finance-fin0-openapi-mapping.md` — bei Abweichung Merge blockieren. SHA-Unklarheit: **§5b** oben, nicht interpretieren.

**Lokal (ohne DB):** `npm test` z. B. **87 passed, 12 skipped (99)** — Skips = `test/persistence.integration.test.ts`; ersetzt keinen grünen Remote-Run.

**Manuelle Stichproben (optional im PR, kein Ersatz für Actions):** z. B. lokal `npm test` / CI-parallele Befehle wie §3; bei Contract-Änderungen G8-Stichprobe OpenAPI ↔ `error-codes.json` ↔ `finance-fin0-openapi-mapping.md`; Web nur wenn der PR `apps/web` berührt. **Lokales Grün ersetzt keinen grünen GitHub-`backend`-Run.**

**MVP später:** `docs/ERP-Systembeschreibung.md` §15.

**Stub-Matrix FIN-0:** `docs/contracts/qa-fin-0-stub-test-matrix.md` | **FIN-2 P0 (später):** `docs/contracts/qa-fin-2-start-gate-stub-matrix.md`
```

### §5a / §5b — Abschluss (Definition **fertig**)

**Vollständig geregelt** in diesem Abschnitt **„## 5) QA-Kommentar“**: Pflichtbausteine **§5a** (grün + HTTPS-Run + SHA aus Run-Details), Varianten **5a-pre)** und **5a)**, Blocker **§5b**, optionaler Kontext **§5c**, sowie die **Regel** „ein Kern-Kommentar pro Merge, editieren statt widersprüchlich duplizieren“. **Keine** weiteren §5a-Textbausteine außerhalb dieses Dokuments als verbindlich ansehen. **Änderungen** an diesen Regeln in **derselben** Datei und ggf. parallel in [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](../tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md).

### Referenzbeispiel — erfülltes Post-Merge-§5a (**Archiv**, Squash PR #1 → `main`)

*Nur zur Orientierung, wie ein **vollständiges** §5a nach Merge aussehen kann. Jeder **neue** Merge braucht **eigene** Run-URL und SHA aus GitHub — nicht wiederverwenden.*

```text
## QA — Merge-Evidence (main) — Referenz PR #1

Actions (grün): https://github.com/rhermann90/ERP/actions/runs/24538762870 — Commit ffa8151745465249535b8e29c112026a21bdc7fb = Merge auf main — Job `backend`

Kontext FIN-0 / Gate: docs/contracts/qa-fin-0-gate-readiness.md | FIN-2-Start-Gate: docs/tickets/FIN-2-START-GATE.md
```

---

## Offene Punkte (QA)

- **§5a / §5b:** Spezifikation **abgeschlossen** (siehe Abschnitt **„§5a / §5b — Abschluss“** oben); offen bleiben nur noch **operative** Nachweise je PR/Merge in GitHub.
- **Rückmeldung ans Team:** bei Eskalation oder auf Wunsch das Format **„Rückmeldung ans Team / Review“** (Abschnitt oben) verwenden — inkl. **Pflichtzeilen** Actions-Link ja/nein und Merge blockiert ja/nein.
- `FIN-2-START-GATE.md`: Spalte „erfüllt“ für **G4** manuell mit Repo-ADR abgleichen (Drift-Risiko, wenn Tabelle nicht gepflegt wird).
- **Nach Team-Pflege** von **G1–G3** (ggf. **G7**): Nachweise in der Gate-Tabelle stichprobenartig gegen benannten PR/Commit und gegen Tests **sowie** grünen **Actions**-Run auf `main` prüfen; bei Widerspruch **eskaliieren** — **kein** stillschweigendes OK; QA setzt **erfüllt** / **Nachweis** **nicht** allein.
- **FIN-2 P0-Matrix:** erst nach Gate-Freigabe (G1–G10) voll nutzen — siehe [`qa-fin-2-start-gate-stub-matrix.md`](./qa-fin-2-start-gate-stub-matrix.md) und [`FIN-2-START-GATE.md`](../tickets/FIN-2-START-GATE.md).
- **Erinnerung ans Team (optional, Branch-Schutz):** Status-Check **`backend`** (`.github/workflows/ci.yml`) auf **`main`** als **Required** aktivieren — technische Absicherung der Evidence-Pflicht und roter CI. Prozess/Org-Entscheid; QA hält die Empfehlung hier fest.
