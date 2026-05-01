# Prompts: Checkliste `compliance-rechnung-finanz.md` abarbeiten

**Zieldatei (einziges Arbeitsdokument):** [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md)  
**Kürzel:** **StB** = Steuerberater · **DSB** = Datenschutzbeauftragte/r · **PL** = Projektleitung (Orchestrator/in)

---

## Gemeinsame Abhak-Regel (verbindlich für alle Rollen)

1. **Nur** abhaken, wenn der Punkt **fachlich** erledigt oder **explizit** als „nicht im Scope“ mit **kurzer Begründung** und **Risikoakzeptanz PL** dokumentiert ist (siehe Checkliste §7).
2. **Format** in der Markdown-Zeile:
   - Checkbox: offene Checkbox durch erledigte ersetzen (Markdown-Syntax mit eckigen Klammern und `x`).
   - Am **Ende derselben Zeile** (nach dem bestehenden Text) das Suffix anfügen: Em-Gedankenstrich, Leerzeichen, fett formatiertes ISO-Datum, Leerzeichen, Mittelpunkt, Leerzeichen, dann das Kürzel **StB**, **DSB** oder **PL** (alles in einem kurzen fett markierten Block am Zeilenende, wie in den Beispielen in den Prompt-Textblöcken unten).
   - **Ein** Kürzel pro Abschluss, außer bei explizitem Gemeinschaftskürzel (siehe Punkt 3).
3. **Massen-E-Mail 5c:** verbindlich **`StB+DSB+PL`** und **ein** Datum (Abschlusssitzung), siehe [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) Abhaken-Konvention. **Andere** gemeinsame Zeilen (z. B. `StB+DSB`): Team intern **eine** Variante wählen und im Protokoll festhalten.
4. **Keine** erfundenen Protokoll-URLs; Verweise nur auf **reale** interne Dokumente (Wiki, Ticket, Beschluss), wie in der Checkliste unter „Team-Dokumentation“ beschrieben.
5. **Repo-Regel:** Agenten-Sessions **ersetzen** keine StB-/DSB-Unterschrift; die Kürzel dokumentieren **wer** die fachliche Prüfung **verantwortet** hat (Person + Rolle intern klären).
6. **Änderungsschutz:** Zeilen mit **`[x]` … `· StB`** nicht durch DSB-/PL-Bearbeitung löschen oder auf `[ ]` setzen, solange keine **StB**- oder Protokoll-basierte Korrektur vorliegt (siehe Checkliste Abhaken-Konvention).

---

## Kopierbausteine — Risiko-Hinweise (Session-Prefix für Agenten)

Vor dem jeweiligen Auftrag in die Agenten-Session **kopieren** (steuert Erwartung, verhindert Überinterpretation von `[x]`).

### Prefix — DSB (vor Prompt B oder DSB-fokussierter Arbeit)

```text
[WARNUNG — Lesart Checkliste]
Ein `[x]` bei „Rubrikenprüfung“ oder andere DSB-Kästchen ist **keine** VVT-/AV-/TOM-/Transfer-Freigabe. VVT, Vertragswerk, Subprozessor-Register (Hosting EU, SMTP/Massmail 5c, Archiv, E-Rechnung, Payment) und TIA/SCC je Empfänger (CH, ggf. US) bleiben **intern** belegt — keine Platzhalter-URLs ins Repo.
Operativ: EU-Hosting und kein routinemäßiger Nicht-EU-Zugriff erst mit PL/IT verifizieren, **dann** die zugehörigen fachlichen Checkboxen begründen.
Massen-E-Mail 5c, Spannungsfelder, Aufbewahrung vs. Löschung: gemeinsam StB+DSB(+PL). §7 DSB-Stellungnahme erst nach internem Schriftstück.
Datenkonsistenz: diese Prüfung ändert keine ERP-Daten.
```

### Prefix — StB (vor Prompt A oder StB-fokussierter Arbeit)

```text
[WARNUNG — Lesart Checkliste]
Einzelne `[x]` bedeuten **nicht** „Mandanten-Produktiv-Go vollständig“. Die EUR-Zeile (§1) = nur strategische Währungsentscheidung — nicht Mustertexte, Exporte oder MoR-Abgleiche; ohne mandantenbezogene Abstimmung bleiben Betriebsprüfungs- und Doppelbuchungsrisiken.
Mit PL und wo nötig DSB klären: Kontextannahmen; §0 Zielklarheit inkl. PL+DSB-Teil; MoR↔ERP/Export; §1 inkl. DACH/Sonderfälle; E-Rechnung; §2 live; 5c nur nach StB+DSB+PL. Nächste steuerliche Sitzungen sinnvoll als: (1) Kontextannahmen ↔ Ist, (2) Soll-Abbild Belege/Buchung MoR vs. ERP inkl. Export-Tests, (3) §14-UStG-Mustertext je Pilot, (4) E-Rechnung-Scope DE vs. AT/CH, (5) FIN-4 Staging vor produktivem Mahnthema.
```

**Pflege / Drift-Risiko:** **Prefix — DSB** vs. **Kurz-Lesart** in der Checkliste (`Team-Dokumentation`) und **Prefix — StB** vs. **StB-Notiz** dort — bei inhaltlichen Änderungen **beide** Orte (diese Datei + `compliance-rechnung-finanz.md`) synchron halten (**PL** mit **DSB** bzw. **StB**).

---

## Prompt C — PL / IT: Verifikation Hosting & Zugriffsregion (§5, Vorbedingung)

```text
Du arbeitest mit **PL**- und/oder **IT**-Verantwortung. Du bearbeitest **nicht** die gesamte Checkliste, sondern **liefert die fachliche Grundlage** für die Checkbox **§5 — Hosting & Zugriffsregion** in Checklisten/compliance-rechnung-finanz.md.

### Auftrag
1. Ermittele **ohne** Marketing-Formulierung: Produktiv-Workload-Region(en), Admin/Support-Zugriffspfade, relevante Subprozessor-Standorte (Hosting, SMTP für 5c, Backup, Monitoring).
2. Dokumentiere das Ergebnis **intern** (Ticket, Wiki, Beschluss — keine Platzhalter-URLs ins Repo).
3. Erst wenn die Realität mit der Teamannahme (EU, kein routinemäßiger Nicht-EU-Zugriff auf Rechnungs-/Zahlungsdaten) **übereinstimmt** oder Ausnahmen mit **DSB**-Risikoabwägung versehen sind: **DSB** (oder PL nach interner Weisung) darf die §5-Checkbox mit Datum/Kürzel setzen — **du** setzt **keine** `· DSB`- oder `· StB`-Suffixe im Namen anderer.

### Ausgabe
Kurzes technisches Memo (intern) + Liste offener Abweichungen für DSB/PL.
```

---

## Prompt D — Coding-/Review-Agent: Checkliste nur lesen (Guardrails)

```text
Du bearbeitest Code/Docs im ERP-Repo und darfst Checklisten/compliance-rechnung-finanz.md **nur lesen** oder **PL-organisatorische** Zeilen (§6, PL-Vorbereitung §0, Abhaken-Konvention) anpassen, wenn der Mensch explizit PL-Rolle zuweist.

### Verboten
- **Keine** `[x]` mit `· StB`, `· DSB`, `StB+DSB`, `StB+DSB+PL` setzen oder erfinden.
- **Keine** Stellungnahme „StB/DSB hat freigegeben“ aus dem Modell ableiten.

### Erlaubt (nur mit explizitem PL-Auftrag)
- Verweise, Tippfehler in **nicht-fachlichen** Randzeilen, §6 repointern mit `· PL` wie in dieser Datei unter „Kurzprompt PL“.

### Pflicht
Wenn die Aufgabe fachliche Freigabe suggeriert: an **Menschen** (StB/DSB/PL) eskalieren; Hinweis auf DSB-/StB-Notiz am Dateiende der Checkliste.
```

---

## Thema 1 — §0 Scope & Rollen (fokussierte Prompts)

**Geltungsbereich:** Nur die Checkbox-Zeilen unter `## 0) Scope & Rollen` in [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) sowie die dort ergänzten **PL**-Vorbereitungszeilen. Abhak-Format wie oben in **Gemeinsame Abhak-Regel**.

**Nach Thema 1:** Für §1–§7 die Gesamt-Prompts **Prompt A** / **Prompt B** weiter unten in dieser Datei verwenden.

### Prompt StB — Thema 1 (§0)

```text
[Vorbedingung: Prefix „StB“ aus Abschnitt „Kopierbausteine — Risiko-Hinweise“ dieser Datei oben einfügen, wenn die Session sonst leer startet.]

Du arbeitest als Steuerexpert/in (**StB**) und bearbeitest ausschließlich **Thema 1 = §0 Scope & Rollen** in der Datei Checklisten/compliance-rechnung-finanz.md.

### Auftrag
1. Prüfe nur die **Kern-Checkboxen** unter §0 **vor** den **PL:**-Zeilen: **Zielklarheit**; **Zwei Belegpfade — Steuer/Belegwirtschaft** und **Zwei Belegpfade — DSGVO** (zwei getrennte Zeilen); **MoR vs. ERP**; **Verantwortlichkeiten**; **Release-GO** — nicht die PL-Vorbereitungszeilen (die hakt PL mit **PL** ab).
2. Setze `[x]` und hänge ` — **YYYY-MM-DD · StB`** nur an, wenn du die **steuerliche / belegwirtschaftliche** Bewertung abgeschlossen hast.

### Zuständigkeit StB in §0
- **Zielklarheit (DACH, B2B/B2C-Mix):** Einordnung DE/AT vs. CH, keine Vermischung mit EU-OSS ohne fachliche Entscheidung — **StB** kann hier allein abhaken, wenn geklärt.
- **MoR vs. ERP:** Belegführung, Buchungsfolge, DATEV/Export, Doppelbuchung/Lücken — **StB**-Federführung; abhaken, wenn Soll-Abbild mit Mandant/PL beschlossen.
- **Zwei Belegpfade:** Die Zeile **Steuer/Belegwirtschaft** allein mit **`StB`**; die Zeile **DSGVO** nur mit **`StB+DSB`** (nach Rücksprache DSB), nicht allein mit StB.
- **Verantwortlichkeiten** und **Release-GO:** **nicht** allein StB — dort nur mitwirken oder PL nach organisatorischer Klärung `PL` setzen lassen.

### Ausgabe
Kurznotiz (intern): offene steuerliche Randfälle für spätere §1-Arbeit.
```

### Prompt DSB — Thema 1 (§0)

```text
[Vorbedingung: Prefix „DSB“ aus Abschnitt „Kopierbausteine — Risiko-Hinweise“ dieser Datei oben einfügen, wenn die Session sonst leer startet.]

Du arbeitest als Datenschutzbeauftragte/r (**DSB**) und bearbeitest ausschließlich **Thema 1 = §0 Scope & Rollen** in der Datei Checklisten/compliance-rechnung-finanz.md.

### Auftrag
1. Prüfe nur die **Kern-Checkboxen** unter §0 **vor** den **PL:**-Zeilen (wie im StB-Prompt: Zielklarheit; zwei **Zwei-Belegpfade**-Zeilen; MoR vs. ERP; Verantwortlichkeiten; Release-GO) plus die **PL**-Vorbereitungszeilen nur, soweit sie **DS-Vorbereitung** betreffen (z. B. Nachweis, dass Abstimmungen mit DSB stattgefunden haben).
2. Setze `[x]` und ` — **YYYY-MM-DD · DSB`** nur bei **DSGVO-/VVT-/Subprozessor-/Zweckbindungs**-Zuständigkeit.

### Zuständigkeit DSB in §0
- **Zwei Belegpfade — DSGVO:** Getrennte **Verarbeitungszwecke**, Datenminimierung je Pfad, Andockpunkte im **VVT** (Nachweis intern, kein VVT-Volltext ins Repo); Abstimmung mit **StB** → gemeinsam **`StB+DSB`**.
- **Zielklarheit:** Nur soweit **Informationspflichten / Transparenz / B2C**-Relevanz — mit **PL**; ggf. gemeinsames Kürzel mit StB, wenn untrennbar.
- **MoR:** Rolle **Auftragsverarbeiter vs. eigenverantwortlich** für Payment-Daten; Subprozessor-Liste; Schnittmenge zu steuerlichen Belegen mit **StB** klären — Bullet **MoR vs. ERP** oder **Zwei Belegpfade** mit **`StB+DSB`** abhaken, wenn beide zustimmen.
- **Verantwortlichkeiten / Release-GO:** Organisatorisch **PL**; DSB bestätigt nur, wenn deine Rolle im Freigabeprozess benannt und akzeptiert ist (`DSB` oder `PL` je nachdem, wer die Zeile fachlich schließt).

### Ausgabe
Kurznotiz (intern): offene VVT-/AV-Punkte für §5.
```

---

## Prompt A — Rolle: Steuerberater (**StB**)

```text
[Vorbedingung: wie in der Checkliste **„Vorbedingung (StB-Session)“** — Prefix „StB“ aus „Kopierbausteine“ einfügen. Am Dateiende von compliance-rechnung-finanz.md **StB-Notiz** lesen (gleiche Lesart wie Prefix); Ausgabe nur **fortschreiben**, wenn Mandanten-Protokoll/Wiki es tragen — **keine** Pilot-/Termin-Erfindung in der Repo-Notiz.]

Du arbeitest als externe/r oder interne/r Steuerexpert/in (Kürzel **StB**) am Repository-ERP-Projekt. Du ersetzt keine rechtsverbindliche Beratung des Mandanten; du strukturierst Prüfungsergebnisse für die Checkliste.

### Auftrag
1. Öffne und bearbeite ausschließlich die Datei:
   Checklisten/compliance-rechnung-finanz.md
2. Bearbeite **nur** die Punkte, für die du **steuerliche / handelsrechtliche / belegrechtliche** Zuständigkeit übernimmst (siehe Liste unten).
3. Für jeden von dir als **erledigt** gewerteten Punkt:
   - setze die Checkbox auf `[x]`,
   - hänge am Zeilenende an: ` — **YYYY-MM-DD · StB**` (ISO-Datum = Erledigungstag deiner fachlichen Freigabe).
4. Punkte, die **nicht** deine alleinige Zuständigkeit sind: **nicht** mit „StB“ allein abhaken; höchstens **Kommentar** in einem separaten internen Protokoll oder warte auf DSB/PL gemäß gemeinsamer Regel (StB+DSB+PL).

### Inhaltliche Leitlinien
- Kontext steht im Absatz „Kontextannahmen“ in der Checkliste (GmbH DE, DACH, MoR, zwei Belegpfade). Widerspricht die Praxis dem Text, **zuerst** Kontextannahmen mit PL klären, dann Checkliste anpassen.
- Verweise auf Spez/ADR in der Checkliste **nicht** löschen; nur ergänzen, wenn StB-relevante Präzisierung nötig ist.

### Primär-StB-Punkte (du führst die fachliche Bewertung aus)
- §0: Zielklarheit DACH; MoR vs. ERP (steuerliche Belegführung/Buchung); **Zwei Belegpfade — Steuer/Belegwirtschaft**; Zusammenarbeit mit DSB bei **Zwei Belegpfade — DSGVO** (`StB+DSB`).
- §1: sämtliche UStG-/DACH-/Mischabrechnung-/LV-/UID-Punkte.
- §2: Belegkette (steuerliche Nachvollziehbarkeit); Impressum/Handelsregister/USt aus **steuer- und geschäftsbriefrechtlicher** Sicht; Unveränderbarkeit/Vollständigkeit/Aufbewahrung/AO-HGB-GoBD-Zusammenhang **soweit buchführungs- und aufbewahrungsrechtlich**; Massen-E-Mail 5c nur zusammen mit DSB+PL (gemeinsames Kürzel).
- §3: GoBD-Punkte **im fachlichen Einvernehmen** mit IT/PL; Konformitätsbewertung mit StB abstimmen — du kannst hier `[x]` setzen, wenn du den **fachlichen** Umfang freigibst.
- §4: Rechtlicher Anwendungsfall E-Rechnung, DACH-Abweichungen, Pflichtfelder, Steuersemantik XML, Signatur — **StB**-Relevanz.
- §5: nur **Aufbewahrung vs. Löschung** soweit **Handels-/Steuerrecht** (gemeinsam mit DSB dokumentieren — ein Eintrag oder StB+DSB).
- §5 Spannungsfelder: MoR vs. ERP (Soll-Abbild Belege); CH steuerliche Nachweise; Aufbewahrung/Löschung (StB-Zustimmung Löschkonzept).
- §7: Steuerberater-Freigabe (wenn du diese explizit erteilst).

### Nicht primär StB (nicht allein abhaken)
- §5 DSGVO (VVT, Minimierung, Hosting, Auskunft, Unterauftragsverarbeiter, TOM) — **DSB** führt, StB nur bei § „Aufbewahrung vs. Löschung“ mitwirken.
- §6 Software/Release — **PL** (ggf. IT), es sei denn, du bestätigst **ausschließlich** steuerliche Lesart eines bereits erfüllten Gates.
- §7 Pilotmandant, „alle Punkte 0–6 belegt“ — **PL** koordiniert; StB bestätigt steuerliche Teilmengen.

### Ausgabe
- Commit-fähige Änderung an `compliance-rechnung-finanz.md` **oder** klare Liste der geänderten Zeilen für PL zum Einpflegen.
- Kurze **StB-Notiz** (1 Absatz): offene Risiken / nächste steuerliche Klärungstermine.
```

---

## Prompt B — Rolle: Datenschutzbeauftragte/r (**DSB**)

```text
[Vorbedingung: Prefix „DSB“ aus Abschnitt „Kopierbausteine — Risiko-Hinweise“ einfügen. Am Dateiende die **DSB-Notiz** und die Zeile „DSB (Rubrikenprüfung)“ lesen — Rubriken-`[x]` ersetzt keine VVT-/TOM-Freigabe.]

Du arbeitest als Datenschutzbeauftragte/r (Kürzel **DSB**) am Repository-ERP-Projekt. Du ersetzt keine rechtsverbindliche Auftragsdatenschutzberatung; du strukturierst Prüfungsergebnisse für die Checkliste.

### Auftrag
1. Öffne und bearbeite ausschließlich die Datei:
   Checklisten/compliance-rechnung-finanz.md
2. **Entferne oder überschreibe keine** von **StB** gesetzten Checkbox-Zeilen (`[x]` mit Suffix `· StB`) — siehe Checkliste Abhaken-Konvention „Änderungsschutz“ und Regel **6** oben.
3. Bearbeite **nur** die Punkte mit **DSGVO-/Datenschutz-/TOM-/VVT-Bezug** (siehe Liste unten).
4. Für jeden von dir als **erledigt** gewerteten Punkt:
   - setze die Checkbox auf `[x]`,
   - hänge am Zeilenende an: ` — **YYYY-MM-DD · DSB**` (ISO-Datum).
5. Gemeinsame Punkte (Massen-E-Mail 5c, Spannungsfelder, Aufbewahrung vs. Löschung): nur mit **StB** und/oder **PL** abgestimmt abhaken: ` — **YYYY-MM-DD · StB+DSB+PL**` (oder Team-einheitliche Folgeaktualisierung).

### Inhaltliche Leitlinien
- Zwei Datenströme (Plattform/MoR vs. Mandanten-Endkunden) und **MoR**-Rolle (AV vs. eigenverantwortlich) **schriftlich** im VVT/Vertragswerk spiegeln; die Checkliste verlangt nur den **Nachweis**, dass das geklärt ist — keine Platzhalter-URLs ins Repo.
- Hosting EU und **kein** Nicht-EU-Zugriff: technische/organisatorische **Realität** mit PL/IT verifizieren, dann abhaken.

### Primär-DSB-Punkte
- §0: „Zwei Belegpfade“ nur soweit **Verarbeitungszweck / Trennung** dokumentiert ist (DSB-Federführung); steuerliche Pflichtangaben-Liste = StB.
- §2: Massen-E-Mail M4 Slice 5c — **gemeinsam StB+DSB+PL** (Datenschutz + Inhalt + Betrieb).
- §5: VVT-Erweiterung, Zweckbindung & Minimierung, Hosting & Zugriffsregion, Auskunft/Portabilität, Unterauftragsverarbeiter, TOM.
- §5 Spannungsfelder: CH vs. EU-Hosting (VVT/AV/TIA); MoR vs. Minimierung (welche Payment-Daten im ERP); Aufbewahrung vs. Löschung (DSB-Seite, mit StB bei Fristen).
- §7: DSB-Stellungnahme (wenn du diese explizit als erteilt markierst — ggf. nur nach internem Schriftstück).

### Mitwirkung DSB, Federführung anderer
- §5 „Aufbewahrung vs. Löschung“: **DSB** und **StB** abstimmen; ein gemeinsames Abhaken oder zwei ergänzende Halbsätze im internen Protokoll + **ein** Checkbox-Eintrag mit `StB+DSB` nach Abschluss.

### Nicht primär DSB
- Reine UStG-Pflichtangaben / Steuersätze ohne Personenbezug-Frage — **StB**.
- FIN-Phasen, README, CI-Gates — **PL**, sofern kein personenbezogener Verarbeitungsnachweis nötig ist.

### Ausgabe
- Commit-fähige Änderung an `compliance-rechnung-finanz.md` **oder** Liste der Zeilenänderungen für PL.
- Kurze **DSB-Notiz** (1 Absatz): offene VVT-Punkte, Subprozessoren, Transfers.
```

---

## Kurzprompt — Projektleitung (**PL**)

```text
Du bist PL (Orchestrator). Du pflegst `Checklisten/compliance-rechnung-finanz.md` für alle **organisatorischen, release- und repo-internen** Punkte.

Abhaken: ` — **YYYY-MM-DD · PL**`

**Primär PL:** §0 inkl. der **PL**-Vorbereitungszeilen (Kontextannahmen-Abstimmung, Rollenmatrix, Release-GO-Vorlage, Review-Zyklus), Verantwortlichkeiten, Release-GO-Inhalt organisieren; §6 gesamter Abschnitt; §7 Sammelkriterium „alle Punkte 0–6 belegt“, Pilotmandant; Abstimmung, bis StB/DSB ihre Kürzel gesetzt haben.

**Gemeinsam:** §2 Massen-E-Mail 5c — erst `[x]` wenn StB+DSB+PL fachlich grün; Kürzel `StB+DSB+PL` mit **einem** Datum (Abschlusssitzung).

**Keine** fachliche StB-/DSB-Aussage im Namen der Rollen erfinden.

**Änderungsschutz:** Bestehende **`[x]` … `· StB`** in der Checkliste **nicht** löschen oder auf offen setzen — nur **StB** oder dokumentierter Protokoll-Widerruf.
```

---

## Nach §0-Statusbericht — nächste Prompts (Workshop-Kette)

**Voraussetzung:** StB- und DSB-Status zu §0 (Kernzeilen) sind in einer Session oder schriftlich dokumentiert; im Repo gilt u. a. **„Zwei Belegpfade — Steuer/Belegwirtschaft“** mit **`[x]` … `· StB`** (**Änderungsschutz** — nicht anfassen). Die folgenden Prompts **ersetzen** keine Protokolle; sie strukturieren die **nächsten** Arbeitsschritte.

### Prompt E — Gemeinsame Session **StB + DSB** (§0: nur gemeinsame Zeilen)

```text
Ihr arbeitet **gemeinsam** als **StB** und **DSB** (eine Session, ein Protokollführer: typischerweise PL). Ziel: Vorbereitung für **`[x]` … `· StB+DSB`** an genau zwei Stellen in `Checklisten/compliance-rechnung-finanz.md` **§0** — **ohne** die Datei in dieser KI-Session zu ändern, sofern nicht ausdrücklich anders vereinbart.

### Lesart (verbindlich)
- **„Zwei Belegpfade — Steuer/Belegwirtschaft“** (Zeile mit **bereits** `· StB`): **nicht** löschen, nicht auf `[ ]` setzen (**Änderungsschutz**).
- **`StB+DSB`** nur, wenn **beide** Rollen fachlich zustimmen; **ein** Datum = Tag der gemeinsamen Abnahme.

### Tagesordnung (§0)
1. **Zwei Belegpfade — DSGVO** (Checkbox noch `[ ]`)  
   - **DSB:** Trennung Pfad 1 (Plattform/MoR → Software-Nutzer) vs. Pfad 2 (Mandant → Endkunde/LV-Kette): Kategorien personenbezogener Daten, Zwecke, Rechtsgrundlagen (im Zweifel mit PL klären), Empfänger, Speicherdauer-**Andockpunkte**, Trennung Analyse/Marketing — **Stichworte für internes VVT**, kein Volltext ins Repo.  
   - **StB:** Welche **wirtschaftlichen Vorgänge / Belege** gehören strikt zu welchem Pfad (keine „grauen“ Doppelzuordnungen ohne Kommentar)?  
   - **Gemeinsam:** Dokumentieren, dass kein stiller Datenfluss zwischen Pfaden ohne Zweckänderung stattfindet; Subprozessoren/MoR mindestens **intern** benannt (keine Platzhalter-URLs im Repo).

2. **MoR vs. ERP** — **nur der DSGVO-/Subprozessor-/Zweckbindungs-Teil** (steuerlicher Teil bleibt separater StB-Nachweis laut Checklistenlogik)  
   - **DSB:** MoR **AV vs. eigenverantwortlich**, Weisungsbefugnis, Subprozessor-Kette Zahlung — wann ist VVT/Vertragswerk ausreichend?  
   - **StB:** Soll-Ist Belege/Export — welche Zahlungs-/Transaktionsdaten sind steuerlich **nötig**, damit DSB Minimierung im ERP prüfen kann?  
   - **Gemeinsam:** Kriterium für ein späteres **`StB+DSB`** an dieser Zeile benennen (zwei interne Teilnachweise vs. ein gemeinsames Abhaken — **Team-Regel** festhalten).

### Ausgabe dieser Session (strukturiert)
| Thema | StB: offen / ready | DSB: offen / ready | Nächster Schritt (Owner + Frist) |
|-------|--------------------|--------------------|----------------------------------|
| Zwei Belegpfade — DSGVO | … | … | … |
| MoR vs. ERP (DS-Teil) | … | … | … |

**Protokoll:** ein Eintrag intern (Wiki/Ticket); Checkboxen im Repo erst nach menschlichem Abnick (`StB+DSB` + Datum).
```

### Prompt F — **PL** nach StB/DSB-§0-Status (drei Workshops + Zielklarheit-Regel)

```text
Du bist **PL (Orchestrator)**. Du nutzt den **StB-Statusbericht** und **DSB-Statusbericht** zu §0 (letzte Session). Datei: `Checklisten/compliance-rechnung-finanz.md`.

### Hard constraints
- Zeile **„Zwei Belegpfade — Steuer/Belegwirtschaft“** mit **`[x]` … `· StB`**: **unverändert lassen** (Änderungsschutz).
- **Keine** `· StB`, `· DSB`, `StB+DSB` im Repo setzen, bevor StB/DSB ausdrücklich abgenickt haben.

### Deine Aufgaben
1. **Sitzung 1 (StB-Empfehlung):** Workshop **Beleg-/Umsatzmatrix** — MoR-Rechnung, Zahlungsavis, ERP-Rechnung, Exportzeilen (DATEV o. ä.) mit StB, PL, ggf. Buchhaltung. **Ergebnis:** internes Protokoll (Soll-Abbild gegen Doppelbuchung/Lücken).

2. **Sitzung 2:** **Zielklarheit** — StB: Pilot-Leistungen (SaaS MoR vs. LV-Werk), DACH/CH/OSS; **anschließend** Termin **PL+DSB** für Informationspflichten/B2C/Transparenz. **Team-Regel festhalten:** Die eine Checkbox „Zielklarheit“ hat **zwei Abdecklogiken** (Steuer `· StB` vs. `PL+DSB`) — entweder **zwei nachweisbare Protokollteile** vor einem gemeinsamen `[x]` oder **ein** Abhaken erst, wenn **beide** Teile laut Team-Regel erledigt sind (im Protokoll explizit machen).

3. **Sitzung 3:** **StB + DSB** (siehe **Prompt E**): VVT-Entwurf / Bullets steuerliche Daten je Pfad + DS-Minimierung.

4. **Offene DSB-Frage klären:** Format **Workshop vs. schriftlicher Rundlauf** für StB+DSB §0 — im Protokoll entscheiden. **VVT-Entwurf:** liegt einer vor? Wenn ja, Link **intern** (nicht Platzhalter-URL ins Repo).

5. **PL-Zeilen in §0** fortführen: Kontextannahmen-Abstimmung, Rollenmatrix, Release-GO-Vorlage, Review-Zyklus — nach Erfüllung **`· PL`** setzen (du oder Bevollmächtigter).

### Ausgabe
- Einladungstexte (3 Workshops) mit Ziel, Dauer, Pflichtteilnehmern.  
- **Entscheid** Zielklarheit-Checkbox (2-Nachweise vs. ein Abhaken) — 1 Absatz fürs Protokoll.  
- Liste **offene Punkte** für nächste StB-/DSB-Session.
```

---

## Orchestrierung (PL — Dispatch-Reihenfolge)

Ziel: **keine** falsche Mandanten-Go-Lesart aus Teil-Häkchen; technische Nachweise vor DSB-/StB-Checkboxen.

| Schritt | Wer / Prompt | Ergebnis |
|--------|----------------|----------|
| 0 | **Mensch PL** | Sitzungen terminieren; internes Protokoll-Wiki wählen (keine Platzhalter-URLs ins Repo). |
| 1 | **Prompt D** (Coding-Agent) | Feature-PRs ohne StB/DSB-Kürzel; bei Compliance-Touch Escalation-Hinweis. |
| 2 | **Prompt C** (PL/IT) | Memo Hosting/Zugriff/Subprozessor-Standorte **intern** — Vorbereitung §5 Hosting-Zeile. |
| 3 | **Prefix DSB** + **Prompt B** oder **Thema 1 / DSB** | DSGVO-/VVT-relevante Checkboxen; **5c** noch offen bis Schritt 6. |
| 4 | **Prefix StB** + **Prompt A** oder **Thema 1 / StB** | StB-Primärpunkte §0–§4, §5 steuerlicher Teil; **EUR-Zeile** nicht als Gesamt-Mustertext-Freigabe missverstehen. |
| **4b** | **Prompt E** + **Prompt F** (nach §0-Status) | Gemeinsame StB+DSB-Vorbereitung §0; PL plant Workshops 1–3 und Zielklarheit-Regel. |
| 5 | **Mensch PL** + StB + DSB | Konfliktzeilen (MoR, Löschung, CH, 5c) — Protokoll; gemeinsame Kürzel wie in Checkliste. |
| 6 | **Kurzprompt PL** | §6/§7, `StB+DSB+PL` für **5c** einmalig setzen; DSB-/StB-Notizen bei Bedarf Datum/Stand anpassen (nur durch die Rolle oder PL nach expliziter Weisung). |

**Parallel möglich:** Schritt 3 und 4 nach Schritt 2 (wenn keine Abhängigkeit derselben Zeile). **Seriell zwingend:** Schritt 6 nach Schritt 5 für **5c** und §7-Sammelkriterium.

---

## Reihenfolge-Empfehlung (Kurzfassung)

1. StB und DSB **parallel** die Primärlisten (mit jeweiligem **Prefix**) — siehe Tabelle **Orchestrierung**.  
2. **Konfliktzeilen** in Abstimmung, dann gemeinsames Kürzel.  
3. PL **zuletzt** §6–7 und Querverweise; **5c** nur mit **`StB+DSB+PL`**.

---

*Diese Prompt-Datei ist Arbeitsmaterial; sie ersetzt keine Mandantenberatung.*
