# Entwicklungsphasen MVP — Abgleich mit kanonischer Systembeschreibung (MVP-Finanz)

**Stand der Bewertung:** 2026-04-14 (Kurz-Iststand Tabelle: ergänzt 2026-04-23 — wie 2026-04-22, zuzüglich FIN-4 Konfig **PATCH/DELETE**, Soft-Delete, **Audit+Konfig in einer DB-Transaktion**; M4 **Vorlagen-Read** `GET /finance/dunning-reminder-templates`)  
**Verbindliche Domänenquelle:** `docs/ERP-Systembeschreibung.md` (vgl. `.cursor/rules/erp-multi-agent.mdc`)  
**Kanonisches FIN-2-Start-Gate:** [`docs/tickets/FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md) — **binäre** Kriterien **G1–G10** vor Beginn der FIN-2-Implementierung.  
**Ziel dieses Dokuments:** Phasen und **Meilensteine** für die **technische Umsetzung** des Finanz-Submodells und angrenzender MVP-Pflichten aus **Abschnitt 8** sowie **§12/§15**; es ersetzt **nicht** die bestehende **Phase-2-Planung (v1.2)** zu LV/Aufmass — beide Stränge müssen **konvergieren**, sobald Rechnungsbeträge aus **LV/Aufmass** gespeist werden.

---

## 1. Kurz-Iststand (Repository)

| Bereich | Stand (hochlevel) |
|--------|-------------------|
| **Persistenz** | Postgres + Prisma u. a. für **Offer** / **OfferVersion**, **AuditEvent** (ADR-0006), **invoices**, **payment_intakes**, **dunning_reminders**, **dunning_tenant_stage_config**, **dunning_tenant_stage_templates** (M4 Read-Slice), **payment_terms_heads** / **payment_terms_versions** (FIN-2/FIN-3/FIN-4/FIN-1); Arbeits-Cache weiterhin **In-Memory** im Prozess mit Write-Through (README). |
| **Kerndomäne (Code)** | Angebot, Nachtrag/Supplement, LV-/Aufmass-/Export-/Traceability-Services; **Rechnung** (Entwurf, Buchung, SoT **BOOK_INVOICE**) und **Zahlungseingang** (Intake, Idempotenz, Status TEILBEZAHLT/BEZAHLT); **8.4:** Schritt 1 + USt/Brutto (7–8) produktiv; **B2-1a:** optionaler Skonto-Anteil (`skontoBps`) auf Netto nach Schritt 1; Schritte 3–6 weiterhin Identität in `netCentsAfterStep84_6Mvp` (ADR-0007) — **kein** vollständiger 8.4(2–6)-Motor, 8.8–8.9-Zuordnung; **FIN-4:** Mahn-Ereignisse + **GET|PUT|PATCH|DELETE** Mandanten-Stufen-Konfig (`/finance/dunning-reminder-config`, ADR-0009 Slices 3–8) + **M4** Vorlagen/Footer/E-Mail + **Mahnlauf** `GET` Kandidaten / `POST` `DRY_RUN`/`EXECUTE` (ADR-0010 **5b-0/5b-1**) + Mandanten-Modus **`GET|PATCH /finance/dunning-reminder-automation`** + optionaler **Cron** `POST /internal/cron/dunning-automation` bei gesetztem Geheimnis (**5b-2**, kein Batch-E-Mail). |
| **PWA** | `apps/web`: Shell, `allowedActions`-gekoppelte Schreibpfade (inkl. Buchung **BOOK_INVOICE**), Tenant-Session; Finanz-Vorbereitung mit Zahlungseingang (FIN-3), Mahn-Ereignis (FIN-4), Konfig/Vorlagen/Footer-JSON, **Mandanten-Automation** und **Mahnlauf-Batch** (Vorschau/Ausführung mit Idempotency-Key); optional **Schreib-UI** Mahnstufen (PUT/PATCH/DELETE). |
| **Spezifikation** | Finanz-Submodell **§8** inkl. Mahnwesen **8.10**, EUR/Steuer **8.16**, Quality Gate **15** in v1.3 ausdifferenziert; **Revision** siehe Fußzeile v1.3-Dokument. |

**Konsequenz:** Das MVP nach v1.3 braucht eine **eigene Phasenfolge** unterhalb von „Phase 2 (v1.2)“, mit klaren **Schnittstellen** zur LV-/Aufmass-Kette (Traceability **8.1** / **5.5**).

---

## 2. Leitprinzipien für alle Phasen

- **Mandantentrennung** strikt (jede Query / jedes Aggregat tenant-scoped).  
- **Versionierung** statt destruktiver Überschreibung (Zahlungsbedingungen **8.5**, gebuchte Rechnung **8.2** / **5.5**).  
- **Traceability** Rechnung → Aufmass → LV → Angebot → Projekt → Kunde (**8.1**, **15**).  
- **SoT:** schreibende API nur mit konsistentem `allowedActions`-Modell (bestehendes Muster fortführen).  
- **Quality Gate (15):** keine Phase „abgeschlossen“ ohne definierte P0-Tests + Contract-Update wo API betroffen.  
- **PWA (8.14 / README):** keine Offline-Schreibpfade für Zahlung/Mahnung; Rechenlogik **serverseitig** (**8.4** / **8.12**).

---

## 3. Phasenübersicht (MVP v1.3 — Finanzkern)

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

## 4. Phasen im Detail

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

**Slice 1–2 (2026-04-22):** Tabelle **`dunning_reminders`**, Lesepfad **`GET /invoices/{invoiceId}/dunning-reminders`**, Schreibpfad **`POST /invoices/{invoiceId}/dunning-reminders`** mit SoT **`RECORD_DUNNING_REMINDER`**, Hydrate in In-Memory-Cache, PWA — **`docs/adr/0009-fin4-mahnwesen-slice.md`**. **Slice 3 (2026-04-22):** **`GET /finance/dunning-reminder-config`** — MVP-Default-Stufenmetadaten (statisch, kein DB-Konfigurationsschreibpfad). Dient als Persistenz-Anker und API-Kontrakt; **M4**-Lieferobjekte (Vorlagen, Footer, E-Mail) — **`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`** — und Meilenstein unten bleiben das vollständige Zielbild (Konfiguration, Vorlagen, E-Mail, **kein** Mix mit 8.4-/Status-Inkrementen derselben Welle).

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

## 5. MVP-Abgrenzung (bewusst später / eigene Releases)

- **8.7** vollautomatischer Bankimport produktiv, **8.7** Bank-/Importgebühren (bereits als verschoben markiert in v1.3).  
- Vollständige **14** Mapping-Matrix aller Exporte.  
- **Mehrwährung** (8.16: ausgeschlossen bis neues Konzept).  
- **Lokalisierung** Vorlagen ≠ DE (**8.10**).

---

## 6. Abhängigkeit Phase 2 (v1.2) ↔ FIN-x

- **LV §9** und **Aufmass** liefern die fachlichen Eingaben für Schritt **8.4 (1)**; bis die Kette vollständig ist, darf **FIN-2** mit **kontrolliertem** Test-/Adapterpfad arbeiten — im **ADR** dokumentieren, um keine „Schein-Rechnungen“ ohne LV-Anbindung produktiv zu erlauben.  
- `docs/tickets/PHASE-2-STARTAUFTRAG.md` bleibt gültig für den **v1.2-Strang**; dieses Dokument **überlagert** die Priorisierung für **Finanz-MVP** aus **v1.3**.

---

## 7. Vorschlag Agenten-/Review-Reihenfolge (je Phase)

1. Domänenmodell + Prisma (Backend)  
2. API + OpenAPI + Contracts  
3. QA (P0-Matrix, Persistenz-Suite wo Postgres)  
4. PWA (nur wenn Phase explizit UI umfasst — **FIN-4** / **FIN-6**)  
5. Senior Review / Release-Note

---

## Operativer Arbeitsplan (Schritt-für-Schritt)

Für die **sequenzielle** Bearbeitung inklusive QA- und Review-Blöcke je Arbeitspaket: [`docs/PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md`](./PHASENARBEITSPLAN-MVP-V1.3-FINANZ.md). Das Dokument **ergänzt** diese Phasenbeschreibung; Zielbild und Meilensteine **M0–M6** bleiben hier maßgeblich.

**Nächster Schritt (technisch):** Umsetzung und Priorisierung **Finanz Welle 3** — siehe [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Pfad A **B2-1a** gewählt, Pfad C zurückgestellt, M4 nur planen). Vorherige Welle: [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE2.md`](./tickets/NEXT-INCREMENT-FINANCE-WAVE2.md). Gate-Stand: [`docs/tickets/FIN-2-START-GATE.md`](./tickets/FIN-2-START-GATE.md). PR-Review: [`docs/contracts/review-checklist-finanz-pr.md`](./contracts/review-checklist-finanz-pr.md). Audit-/GoBD-Abstimmung: [`docs/tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](./tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md).

**Nächster Schritt (fachlich vor Mandanten-Go):** Checkliste [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md) mit StB/DSB/PL — **zusätzlich** zu Software- und CI-Abnahme (siehe [`README.md`](../README.md)).

**Koordination / Gates:** [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md) (Merge-Evidence §5a/§5b, **Rückmeldung an Projektleitung**), [`docs/tickets/PL-SYSTEM-ZUERST-VORLAGE.md`](./tickets/PL-SYSTEM-ZUERST-VORLAGE.md), [`docs/tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md`](./tickets/GITHUB-REVIEW-FIN0-FIN2-GATE-VORLAGE.md); **Rückmeldung für die nächste Arbeitsplanung** verbindlich nur vom **Code Reviewer** (wortgleiches **blocking** wie im GitHub-Review). Team-Clone mit kanonischem Remote `rhermann90/ERP`; Multi-Agent-Regeln [`.cursor/rules/erp-multi-agent.mdc`](../.cursor/rules/erp-multi-agent.mdc).
