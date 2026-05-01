# MVP Finanz (v1.3) — Phasen, Meilensteine und Arbeitsablauf

**Stand:** 2026-05-01 — Zusammenführung der vormals getrennten Dokumente *Entwicklungsphasen MVP* und *Phasenarbeitsplan MVP Finanz*; Kurz-Iststand und technischer Index mit [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Stand 2026-04-27) sowie [`README.md`](../README.md) (Persistenz) abgeglichen.

**Zielgruppe:** Produkt/Release-Verantwortliche, Entwicklung, Code Review, QA

**Verbindliche Domänenquelle:** [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md) (vgl. [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc))

**Kanonisches FIN-2-Start-Gate:** [`docs/tickets/FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) — binäre Kriterien **G1–G10** (historisch vor FIN-2-Implementierung; aktuelle Grenzen siehe Gate-Dokument und Teil 7).

**Ziel dieses Dokuments:** Phasen und **Meilensteine** für die **technische Umsetzung** des Finanz-Submodells (Abschnitt **8**) sowie **§12/§15**, plus **operativer Ablauf** (QA, Review, Master-Tabelle). Es ersetzt **nicht** die **Phase-2-Planung** zu LV/Aufmass ([`docs/tickets/PHASE-2-STARTAUFTRAG.md`](./tickets/PHASE-2-STARTAUFTRAG.md)) — beide Stränge müssen **konvergieren**, sobald Rechnungsbeträge aus **LV/Aufmass** gespeist werden.

**Legacy-Pfade:** minimale Weiterleitung unter `docs/` — [`docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md`](./ENTWICKLUNGSPHASEN-MVP-V1.3.md), [`docs/PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md`](./PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md); archivierter Kontext: [`docs/_archiv/mvp-finanz-legacy-stubs/README.md`](./_archiv/mvp-finanz-legacy-stubs/README.md)

---

## Teil 1 — Kurz-Iststand (Repository)

| Bereich | Stand (hochlevel) |
|--------|-------------------|
| **Persistenz** | Postgres + Prisma u. a. für **Offer** / **OfferVersion**, **AuditEvent** (ADR-0006), **invoices**, **payment_intakes**, **dunning_reminders**, **dunning_tenant_stage_config**, **dunning_tenant_stage_templates**, **dunning_tenant_email_footer**, **dunning_email_sends** (FIN-4 M4), **payment_terms_heads** / **payment_terms_versions** (FIN-1); Arbeits-Cache weiterhin **In-Memory** im Prozess mit Write-Through — siehe [`README.md`](../README.md) Abschnitt „Hinweis zur Persistenz“. |
| **Kerndomäne (Code)** | Angebot, Nachtrag/Supplement, LV-/Aufmass-/Export-/Traceability-Services; **Rechnung** (Entwurf, Buchung, SoT **BOOK_INVOICE**) und **Zahlungseingang** (Intake, Idempotenz, Status TEILBEZAHLT/BEZAHLT); **8.4:** Schritt 1 + USt/Brutto (7–8); **B2-1a:** optionaler Skonto-Anteil (`skontoBps`); Schritte 3–6 weiterhin in `netCentsAfterStep84_6Mvp` (ADR-0007) — **kein** vollständiger 8.4(2–6)-Motor; **FIN-4:** Mahn-Ereignisse, Mandanten-Stufen-Konfig (**GET|PUT|PATCH|DELETE**, Soft-Delete, Audit in Transaktion, ADR-0009), Vorlagen/Footer, Mahnlauf **5b-0/5b-1**, **`GET|PATCH /finance/dunning-reminder-automation`** (**OFF**/**SEMI**, ADR-0011; kein Cron), **`POST /finance/dunning-reminder-run`** fail-closed bei **OFF** (409 `DUNNING_REMINDER_RUN_DISABLED`). Verbleibend z. B. Massen-E-Mail / UX nach Team-Priorität — [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md). |
| **PWA** | `apps/web`: Shell, `allowedActions`-gekoppelte Schreibpfade (inkl. **BOOK_INVOICE**), Tenant-Session; Finanz-Vorbereitung (FIN-3 Intake, FIN-4 Mahn/Konfig/Vorlagen/Footer, Batch-Vorschau/Ausführung); Deep-Link `#/finanz-vorbereitung`, Alias `#/finanz-grundeinstellungen`; bei Mandant **OFF** blockiert die Shell **Dry-Run**/**EXECUTE**, nicht **GET** Kandidaten; strukturierte Server-Fehleranzeige (**OFF-1a**). |
| **Spezifikation** | Finanz-Submodell **§8** inkl. Mahnwesen **8.10**, EUR/Steuer **8.16**, Quality Gate **15** in der konsolidierten Systembeschreibung. |

**Konsequenz:** Das MVP nach v1.3 behält eine **eigene Phasenfolge** unterhalb von „Phase 2 (v1.2)“, mit klaren **Schnittstellen** zur LV-/Aufmass-Kette (Traceability **8.1** / **5.5**).

---

## Teil 2 — Leitprinzipien für alle Phasen

- **Mandantentrennung** strikt (jede Query / jedes Aggregat tenant-scoped).  
- **Versionierung** statt destruktiver Überschreibung (Zahlungsbedingungen **8.5**, gebuchte Rechnung **8.2** / **5.5**).  
- **Traceability** Rechnung → Aufmass → LV → Angebot → Projekt → Kunde (**8.1**, **15**).  
- **SoT:** schreibende API nur mit konsistentem `allowedActions`-Modell (bestehendes Muster fortführen).  
- **Quality Gate (15):** keine Phase „abgeschlossen“ ohne definierte P0-Tests + Contract-Update wo API betroffen.  
- **PWA (8.14 / README):** keine Offline-Schreibpfade für Zahlung/Mahnung; Rechenlogik **serverseitig** (**8.4** / **8.12**).

---

## Teil 3 — Phasenübersicht (MVP v1.3 — Finanzkern)

| Phase | Kurzname | Primär §8 | Ziel-Meilenstein (DoD-Kern) |
|-------|-----------|-----------|------------------------------|
| **FIN-0** | Architektur & Verträge | 8.1, 15 | ADR + OpenAPI-Skelett; keine fachliche Lücke zur v1.3 |
| **FIN-1** | Zahlungsbedingungen & Versionen | 8.3, 8.5 | Versionierte Konditionen am Projekt, gebunden an neue Rechnungen |
| **FIN-2** | Rechnung & Berechnungskette | 8.2, 8.4, 8.12, 8.16 (EUR) | Gebuchte Rechnung unveränderlich; Endbetrag aus definierter Kette |
| **FIN-3** | Zahlungseingang & Zuordnung & Status | 8.7–8.9 | Manuelle Zahlung + Zuordnung; Zahlungsstatus ableitbar |
| **FIN-4** | Mahnwesen vertikal | 8.10 | Stufen inkl. Standardfristen/-gebühren, Vorlagen/Platzhalter, E-Mail-Footer, Vorschau, Audit |
| **FIN-5** | Steuern & Sonderfälle (MVP-Subset) | 8.11, 8.16 | Standard-USt + ein ausgewählter Sonderfall **oder** explizit „deaktiviert“ mit Fail-Closed |
| **FIN-6** | Härtung & Abnahme MVP | 8.14, 12, 15, 14 (optional) | DSGVO-Minimierung Zahlungsdaten; Audit vollständig; Export-Schnitt **optional** DATEV-Skeleton |

**Hinweis:** **8.6** (Differenzbuchung) und **8.15** (Einbehalt-Auflösung) können in **FIN-2** (minimaler Ausgleichsposten) beginnen und in **FIN-6** vervollständigt werden, sofern Randfälle aus **8.6** explizit modelliert sind — **kein** stilles Verhalten.

---

## Teil 4 — Phasen im Detail

### FIN-0 — Architektur & Verträge (Meilenstein **M0**)

**Lieferobjekte**

- **ADR** (neu oder Fortführung von 0003/0006): Persistenzgrenzen für **Rechnung**, **Zahlungsbedingungs-Version**, **Zahlungseingang**, **Zuordnung**, **Mahnkonfiguration** / **Mahnereignis**; Transaktionsgrenzen und Idempotenz-Hooks für **8.7**.  
- **OpenAPI** (`docs/api-contract.yaml`): Ressourcen- und Fehlercodes für die folgenden Phasen skizziert (Stub-Endpunkte erlaubt, aber **keine** Phantom-Codes).  
- **Teststrategie:** P0-Matrix-Einträge für Tenant-Leak und SoT für Finanz-Endpunkte; FIN-0-Stub-Matrix [`docs/contracts/qa-fin-0-stub-test-matrix.md`](./contracts/qa-fin-0-stub-test-matrix.md) und Gate-/Merge-Evidence [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

**Meilenstein M0 (abgenommen, wenn …)**

- Review: Domänenmodell deckt **8.1**–**8.5** und die Schnittstelle zur bestehenden **Rechnung**-Traceability ab.  
- CI: `npm run typecheck` + bestehende Suites grün.

---

### FIN-1 — Zahlungsbedingungen & Versionen (Meilenstein **M1**)

**Spez:** **8.3**, **8.5** (Kopf/Version, nur zukünftige Rechnungen auf neue Version).

**Lieferobjekte**

- Prisma-Modelle + Migrationen: Konditionskopf, **append-only** Versionszeilen, Referenzierbarkeit aus Rechnungsentwurf.  
- API: Lesen/Schreiben neuer Versionen mit **Audit** (**12**), Mandant und Projekt konsistent.  
- Domain-Validierung: Keine Überschreibung historischer Versionen.

**Meilenstein M1**

- Zwei aufeinanderfolgende Versionen am selben Projekt; bestehende (mock-)Rechnung bleibt auf alter Version-ID gebunden.

---

### FIN-2 — Rechnung & Berechnungskette (Meilenstein **M2**)

**Spez:** **8.2**, **8.4**, **8.12**, **8.16** (EUR-Pflicht), Anbindung **5.5** / Traceability zu LV-Aufmass-Angebot.

**Lieferobjekte**

- Persistente **Rechnung** (Typen laut 8.2), Positionen/Summenmodelle passend zur Kette **8.4** (Schritte 1–9 inkl. Skonto als Zahlungsbezug, nicht im Endbetrag 1–8 vermischt).  
- **Buchung:** Übergang zu unveränderlichem Zustand; Korrektur nur über definierten Storno-/Gutschrift-Pfad (**8.2**).  
- Rundung **8.12** zentral; Währung **EUR** durchgängig.

**Meilenstein M2**

- Mindestens ein **End-to-End-Pfad**: LV-Summe (oder platzhaltergeführter Netto-Eingang aus bestehender Kette) → gebuchte Rechnung mit referenzierter **Zahlungsbedingungs-Version** und reproduzierbarer **8.4**-Summe in Tests.

---

### FIN-3 — Zahlungseingang, Zuordnung, Zahlungsstatus (Meilenstein **M3**)

**Spez:** **8.7**–**8.9** (Bankimport **Idempotenz** mindestens für manuellen/semi-manuellen Eingang vorsehen; vgl. 8.7 Text zu technischem Schlüssel).

**Lieferobjekte**

- Zahlungseingang als Ereignis; **Zuordnung** auf Rechnung(en) mit Teilsummen-Regeln; **8.9** Status aus Regeln ableiten.  
- **Kein** Produktiv-Bankfile-Import muss im MVP fertig sein — aber Datenmodell und API müssen **8.7** nicht widersprechen (Duplikat-Schlüssel vorbereitet).

**Meilenstein M3**

- Zahlung zuordnen → Statuswechsel **Offen → Teilbezahlt/Bezahlt** mit Audit; Überzahlung als **Domainfehler** oder dokumentierte Regel (kein Stillschweigen).

---

### FIN-4 — Mahnwesen (Meilenstein **M4**)

**Spez:** **8.10** (inkl. Vorlagen-Typen, Pflichtplatzhalter `{{MahngebuehrEUR}}`, Skonto auf Erinnerung/Avis, normierte Skonto-Auflösung, **Standard-Tagesfristen** und **Mahngebühren** editierbar, **E-Mail-Systemfooter**, Massenversand-**Vorschau**, Audit).

**Repo-Historie / ADR:** Kern nach [`docs/adr/0009-fin4-mahnwesen-slice.md`](./adr/0009-fin4-mahnwesen-slice.md), M4 E-Mail/Vorlagen nach [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](./adr/0010-fin4-m4-dunning-email-and-templates.md), Automation **OFF/SEMI** nach [`docs/adr/0011-fin4-semi-dunning-context.md`](./adr/0011-fin4-semi-dunning-context.md). Frühe Slice-Notizen (reines Konfig-Lesen ohne DB-Schreibpfad) sind durch die heutige Mandanten-Konfiguration und Persistenz abgelöst — siehe **Teil 1** und [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md).

**Lieferobjekte**

- Mandantenkonfiguration Mahnstufen inkl. **genau einem** Vorlagen-Typ pro Stufe; Produkt-Defaults, mandanteneditierbar, **12** auditierbar.  
- Template-Engine: Whitelist, Validierung, serverseitiges Rendering für PDF/E-Mail; **Pflichtfooter** E-Mail.  
- Mahnlauf-Protokoll (**8.10** Protokollierung).

**Meilenstein M4**

- Ein kompletter Mahnlauf (E-Mail oder PDF) aus Testdaten mit gültiger Vorlage und gültigem Footer-Stammdaten-Set; fehlende Impressum-Pflichtfelder → **Versand gesperrt**.

---

### FIN-5 — Steuern & Steuer-Sonderfälle MVP (Meilenstein **M5**)

**Spez:** **8.11**, **8.16** (Aktivierung nur mit Export-Regression laut 8.16).

**Lieferobjekte**

- Standard-USt-Pfad in **8.4** Schritt 7 integriert.  
- **Ein** Sonderfall aus **8.16** vollständig hinter Feature-Flag **oder** konsequent „nicht aktivierbar“ mit **Fail-Closed** bis Implementierung fertig (im ADR festhalten).

**Meilenstein M5**

- Rechnung + Export-Preflight (bestehendes `Exportlauf`-Muster) für den gewählten Umfang **grün**; keine stillen Fallbacks auf Standard-USt bei aktivem Sonderfall.

---

### FIN-6 — Härtung MVP & Abnahme (Meilenstein **M6**)

**Spez:** **8.14**, **12**, **15**, optional **14** (DATEV o. ä. nur Skeleton).

**Lieferobjekte**

- Feldklassifikation / Log-Redaction gemäß **8.14** für Zahlungsfelder.  
- PWA: Lesepfade und **keine** Offline-Schreibpfade für Finanz (**8.14** / README-Konsistenz).  
- Gesamt-**QA-Report** gegen **15** inkl. Finanz-Traceability.

**Meilenstein M6 — MVP-Abnahme v1.3 (technisch)**

- Abnahmecheckliste durch **15** + kritische P0 aus **8.10**/ **8.4**; verbleibende Lücken explizit in **16** dokumentiert.

---

## Teil 5 — MVP-Abgrenzung und Phase-2-Konvergenz

### MVP-Abgrenzung (bewusst später / eigene Releases)

- **8.7** vollautomatischer Bankimport produktiv, **8.7** Bank-/Importgebühren (bereits als verschoben markiert in v1.3).  
- Vollständige **14** Mapping-Matrix aller Exporte.  
- **Mehrwährung** (8.16: ausgeschlossen bis neues Konzept).  
- **Lokalisierung** Vorlagen ≠ DE (**8.10**).

---

### Abhängigkeit Phase 2 (v1.2) ↔ FIN-x

- **LV §9** und **Aufmass** liefern die fachlichen Eingaben für Schritt **8.4 (1)**; bis die Kette vollständig ist, darf **FIN-2** mit **kontrolliertem** Test-/Adapterpfad arbeiten — im **ADR** dokumentieren, um keine „Schein-Rechnungen“ ohne LV-Anbindung produktiv zu erlauben.  
- `docs/tickets/PHASE-2-STARTAUFTRAG.md` bleibt gültig für den **v1.2-Strang**; dieses Dokument **überlagert** die Priorisierung für **Finanz-MVP** aus **v1.3**.

---

## Teil 6 — Vorschlag Agenten-/Review-Reihenfolge (je Phase)

1. Domänenmodell + Prisma (Backend)  
2. API + OpenAPI + Contracts  
3. QA (P0-Matrix, Persistenz-Suite wo Postgres)  
4. PWA (nur wenn Phase explizit UI umfasst — **FIN-4** / **FIN-6**)  
5. Senior Review / Release-Note

---

---

## Teil 7 — Operativer Ablauf (QA, Review, Master-Tabelle)

### So arbeitest du diesen Plan ab

### Repository-Bezug (Anker für Tabelle D und Evidenz)

| Feld | Wert |
|------|------|
| **Remote (Origin)** | `git@github.com:rhermann90/ERP.git` |
| **Dokument konsolidiert ab** | **2026-05-01** — CI-Evidenz unten ist **historisch** bis zur nächsten Aktualisierung mit `gh run list --workflow=ci.yml --branch=main` ([`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md)). |
| **CI-Workflow-Übersicht (GitHub)** | [`.github/workflows/ci.yml` auf `main` — Actions](https://github.com/rhermann90/ERP/actions/workflows/ci.yml) |
| **Letzter hier dokumentierter grüner `backend`-Run auf `main` (Beispiel §5a)** | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353) — Job [**backend**](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) **success** (UTC **2026-04-22**) — Merge-Commit [`900ec2f3408be60ec788724130b1e7436b22bc87`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) (*nach jedem relevanten Merge neu verifizieren*) |

**Hinweis:** Lokale grüne Befehle **ersetzen** den grünen GitHub-Actions-Run auf `main` nicht ([`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md)).

---

1. **Vorbedingung** (Abschnitt B) prüfen — ohne dokumentierten Sprint-Kontext keine größeren Architektur-/Finanz-Merges laut [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).
2. **Master-Tabelle** (Abschnitt D) aktualisieren, wenn sich der Ist-Stand ändert.
3. Pro **Kapitel FIN-x** (Abschnitt F): nummerierte **Arbeitsschritte** ausführen → **QA** (Vorlage Abschnitt E1) → **Review** (Vorlage E2) → **Evidenz** eintragen → Checkboxen **DoD** setzen.
4. **Kein Mandanten-Go** aus dieser Datei ableiten — fachliche Abnahme: [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md).

---

### A — Metadaten und Definition of Done (kurz)

| Begriff | Bedeutung |
|--------|------------|
| **Arbeitspaket** | Ein abgrenzbares Inkrement (meist ein PR oder eine PR-Kette) innerhalb einer FIN-Phase. |
| **DoD** | Minimalbedingungen aus **Teil 4** (Meilenstein Mx), soweit für das Paket relevant. |
| **Evidenz** | Nachweisbarer QA-Run (idealerweise grüner GitHub Actions-`backend`-Job auf den Merge-SHA). |

---

### B — Globale Vorbedingung: Sprint-Kontext / System — zuerst

**Verbindlich** für Merge-Evidence und Architektur-PRs: [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) §0.

**Checkliste (vor größerer Finanz-Lieferung — mit Team / Review explizit abhaken):**

- [ ] Aktueller **Sprint-/Prioritäts-Snapshot** liegt vor (z. B. [`PL-SYSTEM-ZUERST-2026-04-14.md`](./tickets/PL-SYSTEM-ZUERST-2026-04-14.md) *(Pfad historisch)*; Vorlage: [`PL-SYSTEM-ZUERST-VORLAGE.md`](./tickets/PL-SYSTEM-ZUERST-VORLAGE.md)).
- [ ] **Nächstes technisches Inkrement** ist benannt (z. B. [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) oder Nachfolger).
- [ ] Multi-Agent-Regeln bekannt: [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc).

**Technischer Index-Sync (2026-05-01, kein Ersatz für manuelle Checklisten oben):** Abgleich mit **Teil 1** und [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md): **Pfad A / B2-1a** umgesetzt; **FIN-4** Konfig/Vorlagen/Footer/Mahnlauf **5b-0/5b-1**, Automation **OFF/SEMI** (ADR-0011), **`POST /finance/dunning-reminder-run`** bei **OFF** → 409; PWA **OFF-1a** / Deep-Link Grundeinstellungen umgesetzt. **Nächster Default:** M4-Rest nach Team-Priorität (u. a. Massen-E-Mail); keine Parallele zu **8.4(2–6)** oder **Pfad C** ohne Gate.

---

### C — Paralleler Strang: Phase 2 (v1.2) LV / Aufmass / Angebot

**Zweck:** Fachliche Eingaben für **8.4(1)** und Traceability (**8.1** / **5.5**) kommen aus dem v1.2-Strang.  
**Referenz:** [`docs/tickets/PHASE-2-STARTAUFTRAG.md`](./tickets/PHASE-2-STARTAUFTRAG.md), Priorisierungs-Inkremente unter `docs/tickets/PHASE-2-*.md`.

**Koordination:** Vor FIN-2-Erweiterungen prüfen, ob LV→Rechnung-Konvergenz laut **Teil 5** (Phase-2-Konvergenz) abgestimmt ist (keine produktiven „Schein-Rechnungen“ ohne dokumentierte Adapterpfade).

---

### D — Master-Tabelle: FIN-Phasen × Ist × Lücke × Nächster Schritt

*Ist-Stand an **Teil 1** angelehnt; FIN-1-M1-Zeile und DoD zuletzt **2026-04-25**; QA lokal `verify:ci` + `verify:ci:local-db` auf Commit [`b31c1b4`](https://github.com/rhermann90/ERP/commit/b31c1b4693724d1b8394183c7f00b19b9a969ea7). Nach größeren Releases diese Tabelle und den Anker-Commit oben aktualisieren.*

| Phase | Meilenstein | DoD-Kern (Kurz) | Ist (Repo, hochlevel) | Lücke / Risiko | Nächster sinnvoller Schritt |
|-------|-------------|-----------------|------------------------|----------------|----------------------------|
| **FIN-0** | M0 | ADR + OpenAPI + Test-/Gate-Strategie | Verträge, ADRs 0007–0009 (+ **0010** M4 E-Mail/Vorlagen, **0011** SEMI), Stub-Matrix, Gate-Readiness | Phantom-Codes, Drift OpenAPI ↔ Implementierung | Bei jedem API-Change: G8-Bündel + Matrix; §5a-Evidenz im PR |
| **FIN-1** | M1 | Versionierte Konditionen, append-only | `payment_terms_*` in Postgres, APIs; PWA-Demo angebunden; **M1-DoD:** Persistenz-`it` „FIN-1 M1: zwei Zahlungsbedingungs-Versionen …“ in [`test/persistence.integration.test.ts`](../test/persistence.integration.test.ts) (zwei Versionen, Rechnung auf **v1**, Buchung behält **v1**) | Rest optional: UX/Copy in Finanz-Vorbereitung zu PT; §8.5 | Nach Ticket-Priorität: nächster Strang laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Default **A**); kein Mix mit 8.4(2–6)/Pfad C ohne Gate |
| **FIN-2** | M2 | Gebuchte Rechnung, 8.4-Kette, E2E aus LV-Kette | Entwurf, Buchung `BOOK_INVOICE`, 8.4(1)+USt/Brutto, **B2-1a** `skontoBps` (Wave3 Pfad A laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md)); PWA Shell + Finanz-Vorbereitung (SoT, Skonto optional API-first) | **8.4(2–6)**-Motor; Pfad GEPRUEFT/FREIGEGEBEN (**Pfad C**, eigenes Gate); belastbarer **LV→Rechnung**-E2E | Nach Wave3 **nicht** parallel 8.4-Tiefe + Pfad C mischen; nächste Priorität **M4-Rest** *oder* bewusst 8.4(2–6) / Konvergenz — siehe Wave3-Non-Goals |
| **FIN-3** | M3 | Zahlung, Status, Idempotenz 8.7 | Intake POST, Liste GET, SoT, Status TEILBEZAHLT/BEZAHLT; PWA SoT-gekoppelt | **Bankfile** und vollständige **8.8–8.9** bewusst out of scope (ADR-0007); Intake: Überzahlung als Domainfehler **`PAYMENT_EXCEEDS_OPEN_AMOUNT`**, Audit + zentrale Domainfälle in Tests | Backlog 8.8–8.9 / PSP gesondert; optional Review Randfälle (z. B. Replay/Parallelität) |
| **FIN-4** | M4 | Mahnwesen 8.10 inkl. Konfig, Vorlagen, E-Mail | `dunning_reminders`, Konfig inkl. Soft-Delete, Vorlagen/Footer, Mahnlauf **5b**, Automation **OFF/SEMI**, Run-API — ADR-0009/0010/0011 | Rest **M4** (z. B. Massen-E-Mail) nach Ticket-Priorität | **Nächster Schritt:** laut [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) — Default **A**; kein Mix mit 8.4(2–6) oder Pfad C |
| **FIN-5** | M5 | Steuer-Sonderfall 8.16 oder Fail-Closed | In Teil 1 nicht als erledigt geführt | Entscheidung + ADR/Flag | Ein Sonderfall produktiv **oder** Fail-Closed dokumentieren |
| **FIN-6** | M6 | Härtung 8.14, 12, 15; PWA-Regeln | Audit fail-hard, README zu 8.14/PWA | Feldklassifikation §8.14; Gesamt-QA §15 | [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md); Compliance-Vorbereitung |

### D1 — Merge-Evidenz GitHub Actions

| Voraussetzung | Link / Wert |
|---------------|----------------|
| Übersicht Workflow `ci.yml` | [Actions — CI workflow](https://github.com/rhermann90/ERP/actions/workflows/ci.yml) |
| **Grüner Run (historisches Beispiel)** | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353) — Job [**backend**](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) **success** — Commit [`900ec2f3…`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) |

---

### E1 — QA-Vorlage (nach jedem Arbeitspaket ausfüllen)

**Reihenfolge:**

1. **Root:** `npm run typecheck`
2. **Tests:** `npm test` (ohne DB: Skips möglich — siehe [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) §3)
3. **Finanz-PR / breite Regression:** `npm run verify:ci` (siehe [`review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md))
4. **Postgres + Persistenz:** bei Migrationen/Services: [`docs/runbook/ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) bzw. `npm run verify:ci:local-db`
5. **Web:** bei `apps/web`-Änderungen: `npm run build -w apps/web && npm run test -w apps/web`
6. **HTTP-Stubs / Finanz-Codes:** Stichprobe [`qa-fin-0-stub-test-matrix.md`](./contracts/qa-fin-0-stub-test-matrix.md) + Mapping [`finance-fin0-openapi-mapping.md`](./contracts/finance-fin0-openapi-mapping.md)
7. **Merge auf `main`:** grüne **GitHub Actions**-Runs (Jobs **`backend`** und **`e2e-smoke`**), **SHA** muss zum Merge passen — **lokal grün ersetzt Remote nicht** (§5a/§5b in `qa-fin-0-gate-readiness.md`; Branch-Protection: [`docs/runbooks/github-branch-protection-backend.md`](./runbooks/github-branch-protection-backend.md)).

**Evidenz-Tabelle (Kopie pro Paket):**

| Datum (UTC) | Was (Befehl / Run) | Ergebnis | Link / SHA |
|---------------|-------------------|----------|-------------|
| 2026-04-22 | `npm run typecheck` (Repo-Root) | Exit 0 | [Commit `03ea2676…`](https://github.com/rhermann90/ERP/commit/03ea2676c149a02770d79fc4d6ba2ae3187dd305) |
| 2026-04-22 | `npm run build -w apps/web && npm run test -w apps/web` | 8 Testdateien, **27** Tests bestanden | [lokaler Commit `03ea2676…`](https://github.com/rhermann90/ERP/commit/03ea2676c149a02770d79fc4d6ba2ae3187dd305) |
| 2026-04-22 | GitHub Actions **workflow `ci.yml`**, Run auf `main` (Job `backend`) | **success** (`gh run list --workflow=ci.yml --branch=main`; Job per `gh run view 24792922353 --json jobs`) | [Run 24792922353](https://github.com/rhermann90/ERP/actions/runs/24792922353), Job [backend](https://github.com/rhermann90/ERP/actions/runs/24792922353/job/72555004789) — Merge-SHA [`900ec2f3…`](https://github.com/rhermann90/ERP/commit/900ec2f3408be60ec788724130b1e7436b22bc87) |
| 2026-04-25 | `npm run verify:ci` + `npm run verify:ci:local-db` (Repo-Root, Compose **15432**) | Exit 0; **257** Tests (Persistenzsuite inkl. FIN-1 M1-`it`) | Historisch: [`b31c1b4…`](https://github.com/rhermann90/ERP/commit/b31c1b4693724d1b8394183c7f00b19b9a969ea7) |
| 2026-04-25 | `npm run verify:ci` + `npm run verify:ci:local-db` + `npx playwright test e2e/login-finance-smoke.spec.ts` (FIN-4 SEMI / ADR-0011) | Exit 0; Root-Suite inkl. Persistenz grün; E2E **1** bestanden | **§5a (Remote, PR-Head):** [PR #40](https://github.com/rhermann90/ERP/pull/40), Tip [`e346fa9…`](https://github.com/rhermann90/ERP/commit/e346fa9ef10f0b9cdd6176ef7673743f4c587215) — GitHub Actions **backend** + **e2e-smoke** **success** ([CI workflow run](https://github.com/rhermann90/ERP/actions/runs/24919930108), UTC 2026-04-25). Feature-Bundle: [`32dfc73…`](https://github.com/rhermann90/ERP/commit/32dfc73ff79f49c214272aaf6bbe1d281d847439). [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) §5a. |

*Hinweis: Root-`npm test` inkl. Postgres-Persistenz (`PERSISTENCE_DB_TEST_URL`) vor Merge-PR zusätzlich laut [`ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) / `verify:ci` ausführen — nicht durch die beiden Zeilen oben ersetzt.*

---

### E2 — Review-Vorlage (nach jedem Arbeitspaket ausfüllen)

1. [`docs/contracts/review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md) — insb. SoT, `action-contracts.json`, PWA-Executor / API-Client.
2. [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) — 8-Punkte-Checkliste, **blocking**-Zeilen, Merge-Kommentar bei Approve.
3. Bei Rechnung / 8.4 / Buchung: relevante **G1–G10** aus [`FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) benennen und abhaken (G4/G6/G9/G10 haben manuellen Anteil).
4. Bei Eskalation: **Rückmeldung ans Team / Review** exakt nach Schema in [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

**Review-Evidenz:**

| PR | Reviewer | Entscheidung (Approve / Changes / Block) | Datum |
|----|----------|------------------------------------------|-------|
| — (Doku/QA-Session) | — | FIN-1 M1 Persistenznachweis + `verify:ci`/`verify:ci:local-db` laut E1; kein Produkt-PR | 2026-04-25 |
| | | | |

---

### F — Arbeitspakete je FIN-Phase

*Jede Phase: Schritte → QA (E1) → Review (E2) → DoD-Checkboxen.*

#### FIN-0 — Architektur und Verträge (M0)

**Ziel:** Vertrags- und Testlandschaft ohne fachliche Lücken zu §8 / §15 (siehe **Teil 4** FIN-0).

**Arbeitsschritte (iterativ):**

1. OpenAPI [`docs/api-contract.yaml`](./api-contract.yaml) und Fehlercodes [`docs/contracts/error-codes.json`](./contracts/error-codes.json) konsistent halten.
2. Mapping-Dokumente pflegen: [`finance-fin0-openapi-mapping.md`](./contracts/finance-fin0-openapi-mapping.md).
3. Stub-/Gate-Matrix: [`qa-fin-0-stub-test-matrix.md`](./contracts/qa-fin-0-stub-test-matrix.md), Gate-Readiness [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

**QA:** Abschnitt E1; bei reinem Doku-PR §5b beachten, wenn gemischt.

**Review:** E2; G8 / keine Phantom-Codes.

**DoD (Checkboxen):**

- [ ] CI/Typecheck/Teststrategie für das Repo nachvollziehbar beschrieben
- [ ] Keine widersprüchlichen HTTP-Codes zwischen Doku und Implementierung (Stichprobe)

---

#### FIN-1 — Zahlungsbedingungen (M1)

**Ziel:** Versionierte Konditionen am Projekt, append-only, Referenz aus Rechnung (§8.3, §8.5).

**Arbeitsschritte:**

1. Prisma-Modelle und Migrationen (`payment_terms_heads` / `payment_terms_versions`) — ADR [`0008-payment-terms-fin1.md`](./adr/0008-payment-terms-fin1.md).
2. API Lesen/Schreiben; Mandanten- und Projekt-Konsistenz; Audit wo vorgesehen.
3. Tests: zwei Versionen am selben Projekt; bestehende Rechnung bleibt auf alter `payment_terms_version_id`.

**QA:** E1 + Persistenz-Suite bei DB-Änderungen.

**Review:** E2 + §8.5 (keine destruktive Überschreibung).

**DoD:**

- [x] M1-Szenario aus **Teil 4** FIN-1 in Tests oder dokumentiertem manuellen Nachweis abgedeckt — Persistenz: `it("FIN-1 M1: zwei Zahlungsbedingungs-Versionen; Rechnung bleibt auf alter Version (Postgres); Buchung ändert PT-Referenz nicht", …)` in [`test/persistence.integration.test.ts`](../test/persistence.integration.test.ts)

---

#### FIN-2 — Rechnung und Berechnungskette (M2)

**Ziel:** Gebuchte Rechnung unveränderlich; Endbetrag aus definierter 8.4-Kette; E2E aus LV/Aufmass-Kette (langfristig).

**Arbeitsschritte (nach Team-Priorität):**

1. Domäne / Service / API für Entwurf, Lesen, Buchung — ADR [`0007-finance-persistence-and-invoice-boundaries.md`](./adr/0007-finance-persistence-and-invoice-boundaries.md).
2. SoT `BOOK_INVOICE` — [`action-contracts.json`](./contracts/action-contracts.json), Authorization-Service, PWA-Executor.
3. 8.4: aktuell Schritt 1 + USt/Brutto; **Erweiterungen 8.4(2–6)** nur in klar abgegrenzten Inkrementen (siehe [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) Non-Goals).
4. **Pfad C** (GEPRUEFT / FREIGEGEBEN): nicht mit anderen Wellen mischen — eigenes ADR/Architektur-Gate.
5. Konvergenz LV→Rechnung: **Teil 5** — Adapter/ADR dokumentieren.

**QA:** E1; FIN-2-Gate relevante Gx; Persistenz-Tests für Rechnung/Buchung.

**Review:** E2; FIN-2-Start-Gate; 8-Punkte-Review-Vorlage.

**DoD:**

- [x] Buchung nur mit erlaubter SoT und korrektem Status — **`BOOK_INVOICE`** nur bei Rechnungsstatus **ENTWURF**; `POST /invoices/{invoiceId}/book` **ENTWURF → GEBUCHT_VERSENDET** nach `TraceabilityService.assertInvoiceTraceability`; Rollen ADMIN / GESCHAEFTSFUEHRUNG / BUCHHALTUNG; Nachweise: ADR-0007 **Status**, [`action-contracts.json`](./contracts/action-contracts.json), [`finance-fin0-openapi-mapping.md`](./contracts/finance-fin0-openapi-mapping.md), Tests u. a. [`test/finance-fin0-stubs.test.ts`](../test/finance-fin0-stubs.test.ts) und Persistenz-Suite.
- [x] Offene 8.4-Lücken im Ticket/ADR sichtbar (kein stiller Partial-Go) — explizit in **ADR-0007** (**Non-Goals**, **Status** Kopf: B2-1a vs. vollständiger **8.4(2–6)**-Motor), **§8 Rechnungsstatus** (GEPRUEFT/FREIGEGEBEN „Variante B / später“), [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Optionen **B**/**C**, Non-Goals); **Lücke / Risiko** in **Abschnitt D**, Zeile **FIN-2**: belastbarer **LV→Rechnung**-E2E.

---

#### FIN-3 — Zahlungseingang (M3)

**Ziel:** Zuordnung, Idempotenz (§8.7), ableitbarer Zahlungsstatus (§8.8–8.9).

**Arbeitsschritte:**

1. `POST /finance/payments/intake` + Idempotency-Key; Persistenz `payment_intakes`.
2. `GET /invoices/{id}/payment-intakes`; Rollen/SoT `RECORD_PAYMENT_INTAKE`.
3. Tests: Happy Path, Replay mit gleichem Key, Mandanten-Isolation.

**QA:** E1; Stichprobe Idempotenz + Fehlercodes.

**Review:** E2; SoT und Mapping. **Parallelität / Idempotenz:** DB-Unique `(tenant_id, idempotency_key)` und Replay-Pfad nach Prisma-Unique-Kollision im Intake-Service sind implementiert und über Tests abgedeckt; weitergehende Last-/Parallelitäts-Suites = optionales Folge-Inkrement (nicht MVP-Pflichtrest).

**DoD:**

- [x] Statuswechsel und Überzahlungs-Policy dokumentiert oder als Domainfehler abgebildet — **Umsetzung:** Überzahlung = Domainfehler `PAYMENT_EXCEEDS_OPEN_AMOUNT` (`docs/contracts/error-codes.json`, Mapping `docs/contracts/finance-fin0-openapi-mapping.md`); Status **TEILBEZAHLT** / **BEZAHLT** nach Intake; Audit bei Zahlungsmutationen (`STATUS_CHANGED` mit Zahlungs- und Statusfeldern).

---

#### FIN-4 — Mahnwesen (M4)

**Ziel:** Vollständiges Mahnwesen laut §8.10 — Kern umgesetzt; Rest nach Ticket-Priorität/Wave3.

**Arbeitsschritte:**

1. Slices pflegen — [`0009-fin4-mahnwesen-slice.md`](./adr/0009-fin4-mahnwesen-slice.md); M4 E-Mail/Vorlagen/Footer/Mahnlauf — [`0010-fin4-m4-dunning-email-and-templates.md`](./adr/0010-fin4-m4-dunning-email-and-templates.md); SEMI/OFF — [`0011-fin4-semi-dunning-context.md`](./adr/0011-fin4-semi-dunning-context.md).
2. **M4-Rest:** nur nach [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) ohne Mix mit 8.4 B2-1 oder Pfad C.
3. PWA: nur wenn UI ausdrücklich Teil des Inkrements.

**QA:** E1; keine falschen 2xx bei Persistenzfehlern.

**Review:** E2; ADR-0009 (Kern) / ADR-0010 (M4 E-Mail) / ADR-0011 (SEMI); kein „M4 vorgetäuscht“.

**DoD:**

- [ ] Rest-Lücken (z. B. Massen-E-Mail, Footer-Rechtshinweis) in Doku/Tickets explizit — siehe Wave3 und Prioritäts-/Branch-Doku.

---

#### FIN-5 — Steuern und Sonderfälle (M5)

**Ziel:** §8.11 / §8.16 — ein Sonderfall produktiv **oder** Fail-Closed mit ADR.

**Arbeitsschritte:**

1. Entscheidung dokumentieren (Aktivierung vs. Flag).
2. Export-/Preflight-Muster prüfen, falls Export berührt.

**QA:** E1 + ggf. web build/test.

**Review:** E2; keine stillen Fallbacks.

**DoD:**

- [ ] Entscheidung und Testabdeckung für den gewählten Umfang nachweisbar

---

#### FIN-6 — Härtung und Abnahme (M6)

**Ziel:** §8.14, §12, §15; PWA ohne Offline-Schreibpfade Finanz; optionale Export-Skelette.

**Arbeitsschritte:**

1. Audit-/Persistenz-Querschnitt: [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).
2. Feldklassifikation / Log-Redaction für Zahlungsdaten (§8.14).
3. Gesamt-QA gegen Quality Gate §15 (mit Team/Reviewer definieren).

**QA:** E1 inkl. `verify:ci:local-db` vor Release-Kandidaten.

**Review:** E2; Compliance-Checkliste fachlich (nicht durch Code ersetzbar).

**DoD:**

- [ ] Abnahmecheckliste §15 mit Referenzen auf Tests/Evidenz
- [ ] Verbleibende Lücken in §16 / Tickets dokumentiert

---

#### Querschnitt: PWA / Finanz-UI (`apps/web`)

**Ziel:** Shell und Finanz-Vorbereitung spiegeln SoT und Contracts; kein paralleles „Schatten-SoT“.

**Arbeitsschritte:**

1. Haupt-Shell: `allowedActions`, `executeActionWithSotGuard` — siehe [`apps/web/README.md`](../apps/web/README.md).
2. Finanz-Vorbereitung (Hash-Route): `FinancePreparation`, `api-client`, Fehlerbehandlung.
3. UI-Inkremente nur zusammen mit Contract-/Test-Anpassungen, wo API berührt wird.

**QA:** E1 (inkl. Web-Build/Test).

**Review:** E2 (Finanz-PR-Checkliste).

**DoD:**

- [ ] Keine Schreibpfade ohne SoT; Offline-Schreibpfade ausgeschlossen (README 8.14)

---

### G — Release-, Compliance- und Mandanten-Go (außerhalb reiner Software-QA)

1. **Software:** grüne CI-Evidenz auf `main` (§5a), Review ohne blocking (E2).
2. **Fachlich / Mandant:** [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md) mit StB/DSB/Release-Verantwortliche — **zusätzlich** zu CI, kein Ersatz für separates Release-GO ([`README.md`](../README.md)).

**Abschluss-Checkbox:**

- [ ] Produktiv-Go bewusst **nicht** allein aus diesem Arbeitsplan abgeleitet

---

### Referenzindex (Links)

| Thema | Dokument |
|-------|-----------|
| Phasen & Meilensteine | **Dieses Dokument** — Teil 3 und Teil 4 |
| FIN-2-Gate G1–G10 | [`FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) |
| QA Merge-Evidence §5a/§5b | [`qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) |
| GitHub-Review Copy-Paste | [`GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md) |
| Finanz-PR technisch | [`review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md) |
| Nächstes Inkrement | [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) |
| CI / Persistenz lokal | [`ci-and-persistence-tests.md`](./runbook/ci-and-persistence-tests.md) |
| Multi-Agent | [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc) |
| Archiv: historische MVP-Finanz-Dateinamen | [`mvp-finanz-legacy-stubs/README.md`](./_archiv/mvp-finanz-legacy-stubs/README.md) · Weiterleitung `docs/ENTWICKLUNGSPHASEN-*` / `docs/PHASENARBEITSPLAN-*` |

---

## Teil 8 — Koordination und nächste Schritte

**Technisch:** Umsetzung und Priorisierung **Finanz Welle 3** — [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md); Vorherige Welle: [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE2.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE2.md); Gate-Stand: [`docs/tickets/FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md); PR-Review: [`docs/contracts/review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md); Audit-/GoBD-Abstimmung: [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).

**Fachlich vor Mandanten-Go:** [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md) mit StB/DSB/Release-Verantwortliche — **zusätzlich** zu Software- und CI-Abnahme ([`README.md`](../README.md)).

**Koordination / Gates:** [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) (Merge-Evidence §5a/§5b, **Rückmeldung ans Team / Review**), [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./tickets/PL-SYSTEM-ZUERST-VORLAGE.md) *(Dateiname historisch)*, [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md); **Rückmeldung für die nächste Arbeitsplanung** verbindlich nur vom **Code Reviewer** (wortgleiches **blocking** wie im GitHub-Review). Team-Clone mit kanonischem Remote `rhermann90/ERP`; Multi-Agent-Regeln [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc).

