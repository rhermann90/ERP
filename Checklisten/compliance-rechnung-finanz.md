# Checkliste: Rechnung & Finanz — Rechts- und Digitalrahmen (Ergänzung zur Software)

**Entwicklungsphase:** Ausfüllung und „echte“ Fachfreigaben sind **nicht** Voraussetzung für Feature- oder Merge-Arbeit; Inhalte können **nach bestem Wissen und Recherche** vorbereitet werden. **Verbindliche** Abnahme mit benannten StB/DSB/Release erfolgt **im Nachgang vor Produktiv-Go**.

**Zielbild:** Mandanten mit **SaaS- und digitalen Leistungsmodellen** (Abos, nutzungsbasierte Anteile, EU-/Drittlandsbezug). **Zweck:** Strukturierte Vorbereitung auf **Produktiv-Go**; **keine** Rechts- oder Steuerberatung. **Bei formaler Abnahme vor Go-Live:** Abhaken nur nach **fachlicher** Klärung (intern/extern, idealerweise **StB / DSB / Release-Owner**; Kürzel **„PL“** im Hybrid-Ledger = interne Release-/Freigabe-Owner, **nicht** „Projektleitung“ als Entwicklungssteuerung).

**Abhaken-Konvention (Repo, Pflege durch Maintainer/Team):** Organisatorische, release- und repointerne Punkte, die **Maintainer:innen** allein tragen: ` — **YYYY-MM-DD · PL**`. **FIN-4 / Massen-E-Mail 5c** (Abschnitt 2): erst `[x]` **vor produktivem Mandanten-Go / Live-Versand**, wenn **StB**, **DSB** und **Release-Owner** (Ledger-Kürzel „PL“) fachlich grün sind — **ein** gemeinsames Abschlussdatum in **einer** Zeile: ` — **YYYY-MM-DD · StB+DSB+PL**` (Abschlusssitzung). **Keine** fachlichen StB-/DSB-Freigaben oder Kürzel im Namen dieser Rollen durch Dritte erfinden oder ausfüllen. **Leser-Hinweis:** Einzelne `[x]` in dieser Datei **ersetzen** keine implizite „alles erledigt“-Lesart für Mandanten-Go; Kontext in **derselben Zeile** und in den **DSB-/StB-Notizen** am Ende mitlesen. **Änderungsschutz:** Ein von **StB** gesetztes `[x]` mit `· StB` darf **nicht** durch DSB- oder Release-Owner-Bearbeitung entfernt werden, solange die steuerliche Klärung im **Mandanten-Protokoll** nicht widerrufen ist — Korrektur nur mit **StB** oder nach dokumentiertem Protokoll-Beschluss.

**Kontextannahmen (Team — mit StB/DSB verifizieren):** Ausgangsunternehmen **GmbH in Deutschland**; Zielmärkte **Deutschland, Österreich, Schweiz**; **gemischtes** B2B/B2C **je Kunde unterschiedlich**; Kernprodukt **SaaS**; **Mischmodell** (Abo + nutzungsbezogene Anteile) für die **Nutzung der Software durch den ERP-Mandanten**; **leistungsbezogene Rechnungen**, die der Mandant **an seine Kunden** aus **LV/Aufmass/Angebot** erstellt, sind **eigenständige** Belegkette im ERP (nicht identisch mit der Plattform-Abrechnung). **Zahlungsabwicklung:** **Merchant-of-Record** (MoR) — fachliche Abgrenzung **Aussteller von Rechnungen / Zahlungsfluss / Buchungsnachweise** gegenüber ERP-Rechnungen mit **Release-Owner/StB** klären. **Technik:** **eigenes ERP**; Hosting **voraussichtlich EU**; **kein** produktiver Zugriff von **Support/Finance aus Drittländern** auf Rechnungs- und Zahlungsdaten ohne **DSB-/Release-Owner**-Freigabe.

**Bezug Repo:** Integrationsstand und explizites Nicht-Ziel „GoBD-/Compliance-Abschluss ohne separates Release-GO“ siehe [`README.md`](../README.md); Produktions-Gate siehe u. a. [`docs/contracts/qa-report-persistence-increment-2.md`](../docs/contracts/qa-report-persistence-increment-2.md); Finanzgrenzen [`docs/adr/0007-finance-persistence-and-invoice-boundaries.md`](../docs/adr/0007-finance-persistence-and-invoice-boundaries.md).

**CI ≠ Mandanten-Go / ≠ fachliche Freigabe:** Grüne GitHub-Actions-Jobs (**`backend`**, **`e2e-smoke`** am PR-Head) belegen nur **technische** Integrität ([`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) §5a). Sie **ersetzen keine** Abhakungen in dieser Checkliste und **keine** PL-/StB-/DSB-Freigaben — siehe [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../docs/runbooks/m4-slice-5c-pl-mandanten-go.md) (Abschnitt „Grenzen“).

---

## 0) Scope & Rollen

- [ ] **Zielklarheit:** Nur B2B, B2G, B2C oder Mischform — jeweils andere Pflichten (z. B. E-Rechnung, Informationspflichten). **DACH:** DE/AT innerhalb EU-Mehrwertsteuerlogik vs. **CH (Drittland)** — **keine** Vermischung mit EU-OSS-Annahmen ohne **StB**-Einordnung je Mandanten-Stammdaten und Leistungsart. *(Steuerliche Mandanten-/Zielmarkt-Einordnung: `[x]` + ` — **YYYY-MM-DD · StB**`. **DSB-relevant** (Informationspflichten, Transparenz, B2C-Hinweise in Privacy-/Produktkommunikation, untrennbar mit Zielbild): `[x]` + ` — **YYYY-MM-DD · PL+DSB**` — **kein** `· DSB` allein auf dieser Zeile.)*
- [x] **Zwei Belegpfade — Steuer/Belegwirtschaft:** (1) **Plattform-/MoR-Rechnung** an den Software-Nutzer (Mischmodell) vs. (2) **Mandanten-Rechnung** an Endkunden aus **LV → Aufmass → Angebot → Rechnung** — je Pfad getrennt: **Pflichtangaben**, **Steuerlogik**, **Belegreihenfolge**, **steuerliche Archiv-/Nachweislogik**. Traceability bleibt mandantenintern für Pfad 2. *(Nach Abschluss durch **StB**: `[x]` + ` — **YYYY-MM-DD · StB`**.)* — **2026-04-29 · StB**
- [ ] **Zwei Belegpfade — DSGVO:** **Verarbeitungszweck**, **Zweckbindung**, **Datenminimierung** je Pfad sowie **Andockpunkte im VVT** (Nachweis **intern**, kein VVT-Volltext ins Repo) — **nur** mit **`StB+DSB`** abhakbar, nicht allein StB oder DSB. **DSB-Federführung:** VVT-/Prozessbeschreibung zu **Zweck** und **Trennung** der beiden Datenströme (Plattform/MoR vs. Mandanten-Endkunden) vorbereiten; steuerliche **Pflichtangaben**/Beleglogik je Pfad bleiben **StB**. *(Nach gemeinsamer fachlicher Abnahme: `[x]` + ` — **YYYY-MM-DD · StB+DSB`** — **kein** `· DSB` ohne StB.)*
- [ ] **MoR vs. ERP:** Welche Belege, Zahlungsavis und Steuernachweise stammen **rechtsverbindlich** vom **Zahlungsdienstleister (MoR)** und welche **ausschließlich** aus dem ERP? Abgleich Buchhaltung/Export (z. B. DATEV) mit **StB**, damit keine **Doppelbuchung** oder **Lücke** bei Umsätzen entsteht. **DSB-Schnittmenge:** Rolle **Auftragsverarbeiter vs. eigenverantwortlich** für Payment-/MoR-Daten, **Subprozessor-Transparenz** und Abgleich mit steuerlicher Belegrealität — **schriftlich** im **VVT** und **Vertragswerk** zu spiegeln; fachliche Abnahme **nur** gemeinsam mit **StB**. *(Steuerlicher Soll-Ist-Abgleich mit Mandant/PL: `[x]` + ` — **YYYY-MM-DD · StB**`. **DSGVO-/Subprozessor-/Zweckbindungs**-Teil (Schnittmenge zu Ziffer „Zwei Belegpfade — DSGVO“): `[x]` + ` — **YYYY-MM-DD · StB+DSB`** — **kein** `· DSB` allein.)*
- [x] **Verantwortlichkeiten:** Wer trägt fachliche Freigabe (PL), wer Steuer (StB), wer Datenschutz (DSB), wer IT-Sicherheit? Rollenbezeichnungen und Freigabeprozess sind im Repo in **AGENTS.md** / Multi-Agent-Regeln als **PL / StB / DSB** geführt; **personenbezogene Namen und IT-Sicherheit-Ansprechpartner** nur im **internen** Protokoll/Wiki. — **2026-04-29 · PL**
- [ ] **Release-GO:** Schriftliches Dokument „Produktiv-Go Finanz/Rechnung“ mit Datum, Version, Geltungsmandanten — getrennt vom reinen Software-Merge. *(**Nicht** allein StB — Abhaken durch **PL** mit ` — **YYYY-MM-DD · PL**`, nach Mitwirkung StB/DSB laut internem Protokoll. **DSB:** wie bei Verantwortlichkeiten — kein separates `[x]` + `· DSB`; Nachweis der DSB-Mitwirkung nur **intern**.)*

**Kurznotiz (StB → §1, intern — Randfälle bis Einzelfall):** AT (Leistungsort, UID, Kleinunternehmer-Ausland, B2C-Schwellen); CH als Drittland (Registrierung, Rechnungsinhalt, Schnittstelle zu MoR-Zahlungsnachweisen); OSS nur bei **tatsächlicher** Melde-/Anwendungsentscheidung; Mischabrechnung SaaS — **Leistungszeitpunkt** vs. Perioden- vs. nutzungsabhängige Anteile; B2G / Behörden-Leistungen falls im Zielmix.
- [ ] **PL:** Abstimmung der **Kontextannahmen** (Absatz unter dem Titel) mit **StB** und **DSB** terminiert und durchgeführt; Ergebnis im **internen** Protokoll/Wiki dokumentiert (keine Platzhalter-URLs im Repo). *(**DS-Vorbereitung:** Nachweis der **DSB**-Teilnahme/Abstimmung **intern**; kein `· DSB` in dieser Checklistenzeile — Zuständigkeit bleibt **PL** für das Kästchen.)*
- [ ] **PL:** **Rollenmatrix** mit benannten Verantwortlichen und Erreichbarkeit für **PL**, **StB**, **DSB**, **IT-Sicherheit**; Eskalationspfad bei Blockern vor Mandanten-Go. *(**DS-Vorbereitung:** **DSB** muss **benannt** sein; Freigabe der Matrix bleibt **PL** — kein `· DSB` am Kästchen.)*
- [ ] **PL:** Vorlage/Dokument **„Produktiv-Go Finanz/Rechnung“** (Datum, Version, Geltungsmandanten, Owner) bereitgestellt und mit StB/DSB für den ersten Pilot abgestimmt. *(**DS-Vorbereitung:** DSB-Einbindung im Pilot-Dokument **intern** nachweisbar; Abnahme-Kästchen **PL**.)*
- [x] **PL:** **Review-Zyklus** für §0-Querschnitt (zwei Belegpfade, MoR vs. ERP) mit StB+DSB bis zur fachlichen Freigabe oder dokumentierten Risikoannahme geplant und nachverfolgt. *(**DS-Vorbereitung:** Termine/Protokolle **StB+DSB** **intern**; kein `· DSB` allein am Kästchen.)* — **2026-04-29 · PL** *(Orchestrierung: **Prompt E**, **Prompt F** und Tabelle „Orchestrierung“ Schritt **4b** in [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md); konkrete Sitzungstermine **intern** festhalten.)*

**Kurznotiz (DSB → §5, intern):** Für das **VVT** vor §5-Abnahme klären: (1) **MoR/Payment-Provider** — Verantwortlichkeit (AV vs. eigenverantwortlich), Weisungsrecht, **Subprozessor**-Kette; (2) **zwei Datenströme** (Plattform-/MoR-Abrechnung vs. Mandanten-Endkundenrechnung) jeweils mit **Zweckbindung**, Speicherdauer-Andockpunkt und Trennung von Marketing/Analyse; (3) **AV-Verträge** und aktuelle **Subprozessor**-Liste inkl. Hosting, SMTP/Massmail (Querverweis §2 5c / §5); (4) **Drittland** (z. B. CH-Kontext, ggf. US-Tooling) — **TIA/SCC** oder gleichwertiger Nachweis je Empfänger, nicht nur Checkbox.

**§0 — Agenten-Abgleich (Repo-Snapshot PL, 2026-04-29):** Kein Ersatz für Unterschrift StB/DSB. Aus den letzten **StB-** und **DSB-Sessions** (Chat/Protokoll) hier der **Bearbeitungsstand** je Kernzeile — Checkboxen nur setzen, wenn die Rolle im Repo abnickt.

| §0-Kernzeile | StB (Session) | DSB (Session) | Checkbox im Repo |
|--------------|----------------|---------------|------------------|
| Zielklarheit | Offen — steuerlicher Teil erst mit Mandanten-/Pilot-Protokoll; Zwei-Logik mit **PL+DSB** | Offen — **PL+DSB** nach Team-Regel (siehe Prompt F) | `[ ]` |
| Zwei Belegpfade — Steuer/Belegwirtschaft | **Erledigt** Konzeptebene — `· StB` **2026-04-29** (**Änderungsschutz**) | n/a (steuerliche Zeile) | `[x]` … `· StB` |
| Zwei Belegpfade — DSGVO | Offen — nur **`StB+DSB`** gemeinsam | Offen — VVT/Subprozessoren intern | `[ ]` |
| MoR vs. ERP | Offen — steuerlicher Soll-Ist nach Matrix-Workshop | Offen — DS-Teil nur mit **StB+DSB** | `[ ]` |
| Verantwortlichkeiten | Mitwirkung, kein alleiniges StB-`[x]` | Mitwirkung; DSB-Rolle intern | `[x]` … `· PL` **2026-04-29** (Listenzeile oben) |
| Release-GO | Mitwirkung laut Pilot-Dokument | Mitwirkung intern nachweisbar | `[ ]` bis Pilot-Dokument + Protokoll |
| Review-Zyklus (PL, §0) | Orchestrierung **Prompt E**; fachliche Termine mit StB | DSB-Sitzungen **intern** (Prompt F) | `[x]` … `· PL` **2026-04-29** (Listenzeile oben) |

---

## 1) UStG (Rechnungsinhalt & Steuerlogik)

- [ ] **Pflichtangaben auf der Rechnung** (§ 14 UStG i. d. R.): vollständige Liste gegen Mustertext / StB geprüft; USt-IdNr., Ausstellungsdatum, fortlaufende Rechnungsnummer, Leistungszeitpunkt o. a. nach Vorgabe.
- [ ] **Steuersätze / -arten:** Standard-USt reicht nicht für alle Mandanten — **§19 UStG**, **§13b**, **Reverse Charge**, **Bauleistungen** u. a. gemäß Spez **8.16** / Roadmap **FIN-5** modelliert und getestet (kein stiller Fallback auf 19 %).
- [ ] **Brutto/Netto/Rundung:** Serverseitige **8.12**-Reihenfolge dokumentiert; Regressionstests für Randbeträge (Cent-Grenzen).
- [ ] **Währung (EUR-Pflicht im Produkt):** Soweit die Software Rechnungen **nur in EUR** führt (Spez **8.16**, [`ADR-0007`](../docs/adr/0007-finance-persistence-and-invoice-boundaries.md)): Fremdwährungs-Angebote, Wechselkurslogik oder parallele **Auslands-Rechnungsprofile** nicht ohne **StB**-Freigabe und ohne Produkt-/Export-Konzept produktiv nehmen. *(Nur `· StB`, wenn StB die **mandantenbezogene** Produkt-/Export-Freigabe ausdrücklich erteilt hat — strategische EUR-Produktentscheidung allein reicht nicht; siehe **StB-Notiz** am Dateiende.)*
- [ ] **Korrekturbelege:** Storno/Gutschrift/Differenzbuchung (Spez **8.2** / **8.6**) fachlich und im UI/API nachvollziehbar; keine „stille“ Löschung gebuchter Daten.
- [ ] **Leistungsbeschreibung:** Pflicht zur ausreichenden Bestimmtheit der Leistung — kommt aus LV/Positionen/Angebot konsistent?
- [ ] **Grenzüberschreitend / SaaS-USt (mit StB konkretisieren):** B2B vs. B2C, **Leistungsort** (u. a. elektronische Dienstleistungen), **Reverse Charge** / **Steuerschuldnerschaft des Leistungsempfängers** wo einschlägig, **OSS** vs. Einzelregistrierung — fachlich entschieden und im System (Stammdaten, Steuerzeilen, Textbausteine laut Spez **8.16** / Roadmap **FIN-5**) abbildbar **oder** bewusst **außerhalb Mandanten-Scope** mit dokumentierter Risikoakzeptanz der **PL**.
- [ ] **DACH-Zielmärkte:** **AT:** Leistungsort / UID / ggf. **Kleinunternehmer-Ausland** und B2C-Grenzen mit **StB** je Szenario; **CH:** **Drittland** — USt-/Mehrwertsteuerliche **Registrierung**, **Rechnungsinhalte** und **Schnittstelle MoR** (falls CH-Umsätze über MoR) **explizit** geklärt; keine stillschweigende Behandlung wie „EU-B2B Standard“.
- [ ] **Mischabrechnung SaaS (Plattform an Mandanten):** Abgrenzung **Leistungszeitpunkt** / Perioden vs. nutzungsabhängige Anteile; Darstellung auf **einer** oder **mehreren** Rechnungen; Textbausteine so, dass **Prüfer und Mandant** die Steuerbasis nachvollziehen können.
- [ ] **Mandanten-Rechnungen (LV-basiert, leistungsbezogen):** Steuersätze und Befreiungen aus **Position/LV** konsistent mit **8.16**; bei grenzüberschreitenden Bau- oder Werkleistungen des Mandanten **nicht** die gleichen Default-Regeln wie für reine **elektronische SaaS-Leistung** der Plattform verwenden — **StB**-Matrix je Leistungsart.
- [ ] **UID / Unternehmereigenschaft:** Wo die **steuerliche B2B-Einstufung** oder Sonderregeln (z. B. Reverse Charge) an die **USt-IdNr.** und Nachweise anknüpfen: Validierungs- und Dokumentationspflicht (intern + StB) geklärt; kein stiller Fallback auf „Standard-USt“ bei ungeklärter Auslands-B2B-Situation.

---

## 2) HGB / AO (Belege, Buchführung, Aufzeichnungen)

- [ ] **Belegkette:** LV → Aufmass → Angebot → Rechnung → Zahlung → ggf. Mahnung; **Traceability** fail-closed wie in Gate/Tests vorgesehen.
- [ ] **FIN-4 / Mahn-E-Mail — Impressum-Stammdaten (`GET /finance/dunning-email-footer`):** Abgleich mit **Rechtsform** des Mandanten (z. B. GmbH, UG, Einzelunternehmen, Freiberufler): welche Angaben sind **geschäftsbriefrechtlich** nötig (Vertretung, Register, USt-Id …)? **Nicht** allein auf `readyForEmailFooter` oder `impressumComplianceTier: EXTENDED` im Produkt verlassen — das sind **heuristische** Hilfen.
- [ ] **FIN-4 / Handelsregister & USt:** Wo Registerangaben oder USt-Id **fachlich** Pflicht sind: Stammdaten im System vollständig und mit StB/PL abgestimmt; dokumentierte Freigabe vor produktivem Mahn-E-Mail-Versand.
- [ ] **FIN-4 / Mahntexte & Footer:** Mahn-Vorlagen (§8.10 Platzhalter) und **System-Footer**-Stammdaten inhaltlich freigegeben (getrennte Prüfung möglich); kein Go-Live ohne dokumentierte **fachliche** Freigabe der relevanten Texte.
- [ ] **FIN-4 / Massen-E-Mail Mahnwesen (M4 Slice 5c):** technische Spezifikation und Betrieb mit **StB / DSB / Release-Owner** (Ledger-Kürzel „PL“) **vor produktivem Mandanten-Versand / Go-Live** **punktweise** abgleichen (nicht nur „Endpoint existiert“) — Repo-Spezifikation [`docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`](../docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md); **Team-Session-Anker** [`docs/runbooks/m4-slice-5c-pl-mandanten-go.md`](../docs/runbooks/m4-slice-5c-pl-mandanten-go.md): u. a. `POST /finance/dunning-reminder-run/send-emails` (**`DRY_RUN`** vs **`EXECUTE`**), bei **`EXECUTE`** verpflichtendes **`confirmBatchSend: true`**, **PWA-Bestätigungsdialog** vor Aufruf, **Idempotenz** je Nachricht (wie 5a), **SMTP** und Mandanten-Isolation, **Rate-Limit** und maximale Batch-Größe gemäß Spec-Abschnitt **Implementationsanker** in derselben Datei (kanonischer Wert und Code-Ort; **kein** Modulpfad in dieser Checkliste — Pflege bei Refactors nur in Spec + Code), **Teilfehler**/`results[]` ohne transaktionalen Rollback bereits gesendeter Mails, Verhalten bei **`runMode: OFF`** (**409**). Querschnitt: [`docs/contracts/qa-fin-0-gate-readiness.md`](../docs/contracts/qa-fin-0-gate-readiness.md) §0 — kein stiller Massenversand. Kein Ersatz für diese Checkliste. *(**Gemeinsame** fachliche Abnahme **vor Live**: erst `[x]` mit ` — **YYYY-MM-DD · StB+DSB+PL**` nach Abschlusssitzung; nicht vorzeitig durch Team oder CI „grün“ setzen; Entwicklungsphase: [AGENTS.md](../AGENTS.md) Punkt 6.)*
- [ ] **Unveränderbarkeit gebuchter Rechnungen:** Technisch und fachlich durchgesetzt (kein Edit nach „gebucht“ außer definierten Folgevorgängen).
- [ ] **Vollständigkeit:** Keine Lücken in fortlaufenden Nummernkreisen ohne dokumentierte Ursache/Storno.
- [ ] **Aufbewahrung & Auffindbarkeit:** Wo liegen Rechnungs-PDF/XML, wie lange, welches Format, welche Indexierung (Suche nach Nummer, Datum, Mandant)? **Getrennt** für **MoR-/Zahlungsbelege** (externer Anbieter) und **ERP-Mandantenbelege** (einschließlich LV-Kette), falls beide Produktiv genutzt werden.
- [ ] **AO-, HGB- und GoBD-Zusammenhang:** Für **buchführungspflichtige** Mandanten verlangen **HGB** und **AO** u. a. **vollständige, richtige, zeitgerechte und nachvollziehbare** Aufzeichnungen; die **GoBD** präzisiert die **digitalen** Anforderungen (u. a. Unveränderbarkeit, Nachvollziehbarkeit, Zugriffssicherheit, maschinelle Auswertbarkeit — siehe **Abschnitt 3**). **Aufbewahrungsfristen** (steuerlich häufig **zehn Jahre**; Einzelfälle mit **StB**) und **Belegabruf** für die **Betriebsprüfung** sind organisatorisch und technisch sichergestellt.

---

## 3) GoBD (Grundsätze zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen)

- [ ] **Unveränderbarkeit / Nachvollziehbarkeit:** Audit-Events zu relevanten Mutationen; keine unbemerkten Änderungen an Buchungsgrundlagen.
- [ ] **Eingangs-/Bearbeitungsprotokolle:** Wer hat wann gebucht/freigegeben (nicht nur technisch, auch organisatorisch nachweisbar)?
- [ ] **Zeitbezug:** Einheitliche Zeitzone, Nachvollziehbarkeit von „wann wurde was gebucht“.
- [ ] **Zugriffskontrolle:** Rollenmodell (Least Privilege) zur Spez passend; regelmäßige Zugriffsreviews.
- [ ] **Verfahrensdokumentation:** Kurzbeschreibung „wie entsteht eine Rechnung in diesem System“ inkl. Ausnahmen und Fehlercodes.
- [ ] **GoBD-Konformitätsbewertung (kein Behörden-Siegel):** Eine **amtliche „GoBD-Zertifizierung“** der Software gibt es nicht. Üblich ist eine **interne oder extern begleitete Konformitätsprüfung** (Prozesse + IT) mit dokumentiertem Ergebnis; Umfang und Nachweis mit **StB** abstimmen. *(Erst `[x]` + `· StB`, wenn StB Umfang/Nachweis **fachlich** freigegeben hat — nicht durch PL/Agent.)*

---

## 4) E-Rechnung (XRechnung / EN 16931 / Übergabe)

- [ ] **Rechtlicher Anwendungsfall:** B2B ab 2025-01-01 (Übergangsfristen beachten), B2G nach Behördenanforderung — **welche Profile** (XRechnung-Version, Extension)?
- [ ] **DACH:** **AT/CH** können von **DE-XRechnung** abweichende **Pflichten, Formate oder Zeitpläne** haben — **kein** implizites „ein Profil für DACH“; mit **StB** und Produkt-Scope (nur DE-Mandanten vs. grenzüberschreitend) abstimmen.
- [ ] **Pflichtfelder-Matrix:** Abgleich Stammdaten (Käufer/Verkäufer, USt-Id, Bank, Leitweg-ID o. ä.) mit eurem Datenmodell.
- [ ] **Steuersemantik in XML:** Übereinstimmung mit **UStG**-Ausweis (Kategorien, Befreiungen, Steuerschuldnerschaft) — keine Diskrepanz zu PDF/HTML.
- [ ] **Signatur / Übermittlung:** Falls vorgeschrieben oder gewünscht — Verfahren, Schlüssel, Archivierung der eingereichten Datei + Quittung.
- [ ] **Regression:** Golden-File-Tests oder Validator-Pipeline (offizielle Tools / Drittanbieter) in CI oder Release-Pipeline.

---

## 5) DSGVO

- [ ] **Verzeichnis von Verarbeitungstätigkeiten:** Rechnungs- und Zahlungsdaten, Audit-Logs, Exporte, E-Mail-Versand — bei **M4 Slice 5c (Massen-Mahn-E-Mail)** explizit: Versand mit **vom Anwender gesetzter** Empfänger-Adresse je Zeile (`toEmail`, keine stille Kundenstamm-Ableitung), Batch-Ausführung, SMTP-/Provider-Protokolle; Abgleich mit **Abschnitt 2** (Punkt Massen-E-Mail 5c) und [`M4-BATCH-DUNNING-EMAIL-SPEC.md`](../docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md). **Erweitern um:** (a) **MoR-/Payment-Provider** als **Auftragsverarbeiter** oder **eigenverantwortliche** Stelle — Rolle und **Weisungsbefugnis** **schriftlich** im **VVT** und **Vertragswerk** (fachlich mit **DSB** abstimmen; kein Volltext/keine Platzhalter-URLs ins Repo); (b) **zwei Datenströme** (Plattformabrechnung vs. Mandanten-Endkundenrechnungen) jeweils mit Zweck und Speicherdauer.
- [ ] **Zweckbindung & Minimierung:** Welche Felder in welchem UI/API-Layer (vgl. minimierte Audit-Lesepfade im Repo).
- [ ] **Hosting & Zugriffsregion:** Produktiv-Workload **EU** — in **TOM**/Vertrag festhalten; **kein** routinemäßiger **Fernzugriff** aus **Nicht-EU** auf produktive Rechnungs-/Zahlungsdaten (Teamannahme); jede spätere Ausnahme nur mit **DSB**-Risikoabwägung und ggf. **Zusatzmaßnahmen** (Organisation, Technik, Vertrag). **Abhaken erst nach** Abgleich der **technischen/organisatorischen Realität** mit **IT/Release-Owner** (Region, Admin/Support-Zugriffe, Subprozessor-Standorte) und Eintrag im internen Nachweis — nicht allein aus Repo-Annahmen.
- [ ] **Aufbewahrung vs. Löschung:** Konfliktfälle (Handels-/Steuerrecht vs. Löschrechte) mit StB/DSB dokumentiert.
- [ ] **Auskunft / Datenportabilität:** Welche Daten werden herausgegeben, in welchem Format, welche Fristen?
- [ ] **Unterauftragsverarbeiter:** Hosting, E-Mail, Archiv, ggf. E-Rechnung-Dienstleister — AV-Verträge vorhanden; für **produktiven** Mahn-**Massen**-Versand (5c) den genutzten **SMTP-/E-Mail-Provider** und etwaige Weiterleitungen gesondert benennen und mit DSB/PL freigeben (siehe **Abschnitt 2**, 5c).
- [ ] **TOM:** Verschlüsselung, Backups, Zugriff Produktion, Incident-Response für Finanzdaten.

### Spannungsfelder StB ↔ DSB (Kurzanker)

- [ ] **MoR-Beleg vs. ERP-GoBD-Kette:** **Problem:** Zahlungs- und Steuernachweise liegen teils **außerhalb** des ERP. **Risiko:** Betriebsprüfung findet **Lücken** in der Kette. **Lösung:** **StB**-festgelegtes **Soll-Abbild** (welcher Beleg ist maßgeblich, welche **Imports**/Kontoauszüge); **DSB**-Abgleich, welche **Payment-Daten** im ERP überhaupt gespeichert werden dürfen (Minimierung).
- [ ] **CH (Drittland) vs. EU-Hosting:** **Problem:** Mandanten- oder Plattformdaten können **personenbezogene** Verbindungen zu CH-Kunden haben; **Drittland**-Transfers unterscheiden sich von **EU-intern**. **Risiko:** Falsche **Schutzniveau-Annahme**. **Lösung:** **VVT**/AV-Verträge und ggf. **TIA** für **jeden** relevanten Subprozessor (inkl. MoR) mit **DSB**; steuerliche **Nachweise** mit **StB** für CH-Umsätze.
- [ ] **Aufbewahrung vs. Löschung (wie §5, vertieft):** **Lösung:** **getrennte** Speicherdauer-Regeln pro Datenstrom (Plattform vs. Mandanten-Endkunde); nach Ablauf der **gesetzlichen** Frist **geprüftes** Löschen/Anonymisierung wo **StB** zustimmt.

---

## 6) Software- und Release-Bezug (Repo-intern)

- [x] **README-Position** verstanden: Integrationsbasis ≠ GoBD-Abschluss ohne separates GO. — **2026-04-29 · PL**
- [x] **QA-Gate „Produktions-ERP“:** Bewusst **NO_GO** bis Roadmap/Artefakte erfüllt — kein implizites Go durch einzelne Features. — **2026-04-29 · PL** *(Beleg: [`README.md`](../README.md) Einleitung; [`docs/contracts/qa-report-persistence-increment-2.md`](../docs/contracts/qa-report-persistence-increment-2.md) Gate Produktions-ERP.)*
- [ ] **FIN-Phasen:** FIN-2 (Kern Rechnung/8.4), FIN-3 (Zahlung), FIN-4 (Mahnung), FIN-5 (Steuer-Sonderfälle), FIN-6 (Härtung **8.14**/Abnahme) — Abnahme **§15** aus Systembeschreibung mit Referenztests.
- [ ] **Offene Follow-ups:** Audit/Transaktionen (`docs/tickets/FOLLOWUP-*`), LV-Löschen mit abhängigen Angeboten — vor Go prüfen. **Mahn-UX / Finanz-Vorbereitung (PWA):** Ticket [`docs/tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md`](../docs/tickets/FOLLOWUP-M4-DUNNING-UX-GRUNDEINSTELLUNGEN-TAB.md) — Hash/Routing-Zielbild laut Ticket **erledigt**; verbleibende organisatorische Schärfungen (z. B. Rollenmatrix, Navigation) nur nach **Team-Priorität** und bei Bedarf vor Mandanten-Go erneut bestätigen.

---

## 7) Abschluss vor Produktiv-Start (Sammelkriterium)

**Team/Release-Owner (Orchestrierung):** Diese Sektion setzt voraus, dass die Punkte in **0–6** inhaltlich erledigt und mit gültigen Kürzeln belegt sind. **StB**- und **DSB**-Zeilen erst abhaken, wenn die jeweilige Rolle Datum und Kürzel **selbst** gesetzt hat (keine Erfindung durch Release-Owner oder Agenten). **Pilotmandant** (letzte Ziffer): Umfang und Monitoring mit StB/DSB abstimmen; PL koordiniert bis die fachlichen Kürzel in den vorherigen Zeilen stehen.

- [ ] Alle Punkte in **0–6** mit **Verweis** (Ticket, ADR, Testname, Prozessdokument) belegt oder explizit als „nicht im Scope“ mit Risikoakzeptanz des **Teams/Release-Owner**.
- [ ] **Steuerberater-Freigabe** für Rechnungslayout inkl. Sonderfälle, **DACH**/Mischmodelle, **MoR**-Abgrenzung und E-Rechnung-Sample(s).
- [ ] **DSB-Stellungnahme** zu Zahlungs- und Rechnungsdaten inkl. **MoR-/Payment-Provider** und **DACH**-Datenflüsse (mindestens Kurzcheck).
- [ ] **Pilotmandant** mit begrenztem Umfang und Monitoring-Plan.

---

## Team-Dokumentation (nach fachlicher Bearbeitung)

**Agenten-Orchestrierung (Repo):** kopierbare Prompts, Session-Prefixe und Dispatch-Reihenfolge für **Team/Release-Owner** — [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md).

**Vorbedingung (DSB-Session / Lesart Dateiende):** Zuerst den **Prefix — DSB** aus **„Kopierbausteine — Risiko-Hinweise“** weiter unten in **dieser** Datei (oder den gleichlautenden Block in [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md)) in die Session **kopieren**. **Rubriken-`[x]`** und die folgende **DSB-Notiz** ersetzen **keine** VVT-/AV-/TOM-/Transfer-**Freigabe** — Kurz-Lesart: *Ein `[x]` bei „Rubrikenprüfung“ ist keine VVT-/TOM-/AV-/Transfer-Freigabe; operative Nachweise (EU-Hosting, kein routinemäßiger Nicht-EU-Zugriff) erst mit IT/Release-Owner, dann fachliche Checkboxen.* **Drift vermeiden:** Volltext steht im **Prefix — DSB**; bei Textänderungen **Prefix** und diese **Kurz-Lesart** gemeinsam mit [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md) pflegen (Maintainer mit DSB).

**Vorbedingung (StB-Session / Lesart Dateiende):** Zuerst den **Prefix — StB** aus **„Kopierbausteine — Risiko-Hinweise“** unten (oder in [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md)) kopieren. **StB-Notiz** und **Prefix — StB** sind inhaltlich **ein**; die Notiz präzisiert die Lesart **ohne** behauptete Protokollinhalte — **Pilotmandanten und Termine** ausschließlich im internen Protokoll/Wiki, nicht in dieser Repo-Notiz.

- [x] **DSB (Rubrikenprüfung dieser Checkliste):** Entspricht der Lesart des **Prefix — DSB** (s. **Kopierbausteine** unten): DSGVO-/VVT-/TOM-/Transfer-Bezüge in §0 (Belegpfade DSGVO, MoR-Schnittmenge), §2 (Massen-E-Mail 5c — Querschnitt zu §5), §5 inkl. Spannungsfelder sowie §7 (Kriterium DSB-Stellungnahme) sind **textlich** nachvollziehbar und **ohne** Platzhalter-URLs für interne Nachweise geführt. — **2026-04-29 · DSB**  
  **Grenze:** Dieses `[x]` ist **keine** VVT-/TOM-/AV-/Transfer-**Freigabe** (siehe Prefix) und kein Ersatz für **operative** Nachweise (z. B. EU-Hosting, kein routinemäßiger Nicht-EU-Zugriff — erst mit **IT/Release-Owner** verifizieren, dann die zugehörigen **fachlichen** Checkboxen belegen). **Datenkonsistenz:** keine Auswirkung auf ERP-Datenbestände. **Wartbarkeit:** Maintainer pflegen Kürzel und Warnhinweise bei Folgeänderungen **konsistent**.

Nach Durcharbeitung mit **StB / DSB / Release-Owner** (**vor Mandanten-Produktiv-Go**; Entwicklungsphase: [AGENTS.md](../AGENTS.md) Punkt 6): Kurz **Datum**, **Ergebnis** (z. B. Freigabe mit Einschränkung / offene Punkte) und **Verweis** auf das interne Protokoll oder Wiki festhalten — **nicht** durch automatisierte Agenten-Sessions; **keine** Platzhalter-URLs im Repo als Ersatz für echte Nachweise.

**DSB-Notiz (ein Absatz, Stand 2026-04-29; Lesart = Prefix — DSB oben):** VVT/Vertragswerk: MoR (AV vs. eigenverantwortlich), beide Datenströme inkl. Speicherdauer je Strom. Subprozessoren: Hosting (EU-Nachweis), SMTP/Massmail 5c, Archiv, E-Rechnung, Payment — internes Register, keine Platzhalter-URLs im Repo. Transfers: CH (Drittland), ggf. US — TIA/SCC je Empfänger. Operativ: EU-Hosting und kein routinemäßiger Nicht-EU-Zugriff mit IT/Release-Owner verifizieren, danach die zugehörigen Checkboxen. Gemeinsam: 5c, Spannungsfelder, Aufbewahrung vs. Löschung — StB+DSB(+PL) bzw. wo passend StB+DSB; §7 DSB-Stellungnahme nur nach internem Schriftstück.

### Kopierbausteine — Risiko-Hinweise (Session-Prefix für Agenten)

Kanons (synchron zu [`prompts-agents-compliance-abarbeitung.md`](./prompts-agents-compliance-abarbeitung.md)): **Prefix — DSB** und **Prefix — StB** vor rollenbezogener Arbeit **kopieren**.

#### Prefix — DSB

```text
[WARNUNG — Lesart Checkliste]
Ein `[x]` bei „Rubrikenprüfung“ oder andere DSB-Kästchen ist **keine** VVT-/AV-/TOM-/Transfer-Freigabe. VVT, Vertragswerk, Subprozessor-Register (Hosting EU, SMTP/Massmail 5c, Archiv, E-Rechnung, Payment) und TIA/SCC je Empfänger (CH, ggf. US) bleiben **intern** belegt — keine Platzhalter-URLs ins Repo.
Operativ: EU-Hosting und kein routinemäßiger Nicht-EU-Zugriff erst mit IT/Release-Owner verifizieren, **dann** die zugehörigen fachlichen Checkboxen begründen.
Massen-E-Mail 5c, Spannungsfelder, Aufbewahrung vs. Löschung: gemeinsam StB+DSB(+Release-Owner). §7 DSB-Stellungnahme erst nach internem Schriftstück.
Datenkonsistenz: diese Prüfung ändert keine ERP-Daten.
```

#### Prefix — StB

```text
[WARNUNG — Lesart Checkliste]
Einzelne `[x]` bedeuten **nicht** „Mandanten-Produktiv-Go vollständig“. Die EUR-Zeile (§1) = nur strategische Währungsentscheidung — nicht Mustertexte, Exporte oder MoR-Abgleiche; ohne mandantenbezogene Abstimmung bleiben Betriebsprüfungs- und Doppelbuchungsrisiken.
Mit **Release-Owner** und wo nötig DSB klären: Kontextannahmen; §0 Zielklarheit inkl. PL+DSB-Teil; MoR↔ERP/Export; §1 inkl. DACH/Sonderfälle; E-Rechnung; §2 live; 5c nur nach StB+DSB+Release-Owner (Ledger „PL“). Nächste steuerliche Sitzungen sinnvoll als: (1) Kontextannahmen ↔ Ist, (2) Soll-Abbild Belege/Buchung MoR vs. ERP inkl. Export-Tests, (3) §14-UStG-Mustertext je Pilot, (4) E-Rechnung-Scope DE vs. AT/CH, (5) FIN-4 Staging vor produktivem Mahnthema.
```

**StB-Notiz (ein Absatz, Stand 2026-04-29; Lesart = Prefix — StB oben):** Einzelne `[x]` in der Checkliste bedeuten nicht „Mandanten-Produktiv-Go vollständig“; die EUR-Zeile betrifft nur die strategische Währungsentscheidung, nicht Mustertexte, Exporte oder MoR-Abgleiche — ohne mandantenbezogene Abstimmung bleiben Betriebsprüfungs- und Doppelbuchungsrisiken. Nach dem **Mandanten-Protokoll** und **internen Wiki/Tickets** (maßgeblich; diese Repo-Notiz **ersetzt** sie nicht und **widerspricht** ihnen nicht) sind mit **Release-Owner** und wo nötig **DSB** u. a. zu klären: Kontextannahmen; §0 Zielklarheit inkl. PL+DSB-Teil; MoR↔ERP/Export; §1 inkl. DACH/Sonderfälle; E-Rechnung; §2 live; **5c** nur nach **StB+DSB+Release-Owner** (Ledger „PL“). Als sinnvolle Reihenfolge für die nächsten steuerlichen Sitzungen: (1) Kontextannahmen ↔ Ist, (2) Soll-Abbild Belege/Buchung MoR vs. ERP inkl. Export-Tests, (3) §14-UStG-Mustertext je Pilot, (4) E-Rechnung-Scope DE vs. AT/CH, (5) FIN-4 Staging vor produktivem Mahnthema. **Offen:** Pilotmandanten und Termine **nur** im internen Protokoll — diese Notiz trifft dazu **keine** Annahmen.

---

*Checkliste als Ergänzung zur Software-Roadmap, nicht als Ersatz für externe Prüfung.*
