# Prompts: Compliance-Begleitblatt `compliance-rechnung-finanz.md` abarbeiten

## Entwicklungsphase — Repo-Policy

**Keine** verpflichtenden echten StB-/DSB-/Release-Unterschriften für laufende Arbeit. Agenten und Entwickler:innen bearbeiten Compliance-Themen **nach bestem Wissen und Recherche** (öffentliche Quellen, ADRs, Systembeschreibung); **keine** fingierten Datums-/Kürzel-Suffixe und **keine** Behauptung erfüllter Fachfreigabe. Hybrid-Ledger (`compliance-signoffs.json`) **nur**, wenn das Team ausdrücklich echte Freigaben spiegeln will — **sonst** leer lassen. Vor **Produktiv-Go** die untenstehenden strengeren Regeln wieder mit **Menschen** in den relevanten Rollen abstimmen.

## Kanon — Artefakte (Pflege-Druck minimieren)

| Zweck | Ort |
|-------|-----|
| Paket-Übersicht / Dual-Kanon | [`README.md`](./README.md) (Ordner **Checklisten**) |
| Druck, Freigaben von Hand | [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) — Teile **A–G**; **kein** StB/DSB-Ersatz |
| Ledger + Anlage (Hybrid / CI) | [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md), [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md); `npm run validate:compliance-signoffs` / `apply:compliance-signoffs:apply` ändern **beide**, **nicht** das Druck-Begleitblatt |
| Ablauf Hybrid | [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md), [`compliance-signoffs.schema.md`](./compliance-signoffs.schema.md) |

**Kürzel:** **StB** = Steuerberater · **DSB** = Datenschutzbeauftragte/r · **PL** = im **Ledger** / `compliance-signoffs` das **feste Kürzel** für **interne Release-Verantwortliche** (fachliche Freigabe-Owner; **kein** Synonym für „Code-Priorität nur nach PL“ — Entwicklungssteuerung: Team/Maintainer).

## Legende: frühere §-Gliederung → Teile A–G

| Früher (ungefähr) | Begleitblatt | Ledger (`chk-*`) |
|-------------------|--------------|------------------|
| §0 Scope & Rollen | **Teil A** | `chk-a01`–`chk-a09` |
| §1 UStG | **Teil B** | `chk-b01`–`chk-b11` |
| §2 Belege / Mahn / FIN-4 | **Teil C**, **Teil F** | `chk-c01`–`chk-c09`, `chk-f01`–`chk-f03` |
| §3 GoBD vertieft | vor allem **Teil C** (z. B. C.9) | u. a. `chk-c01`, `chk-c09` |
| §4 E-Rechnung | **Teil D** | `chk-d01`–`chk-d06` |
| §5 DSGVO | **Teil E** | `chk-e01`–`chk-e10` |
| §6 / §7 Software & Abschluss | **Teil G** | `chk-g01`–`chk-g06` |

## Begleitblatt vs. Ledger (Drift und falsche Lesart vermeiden)

- **Ausdruck / Mandantenmappe:** Rollen füllen die **Freigabetabellen** im Druck-Begleitblatt (siehe **Kanon** oben) **von Hand** (keine Markdown-Checkbox-Listen mehr im Fließtext).
- **Repository / CI:** Dieselben Entscheidungen werden spiegelbar in [`compliance-signoffs.json`](./compliance-signoffs.json) erfasst; nach `npm run apply:compliance-signoffs:apply` erscheinen **`[x]`** und ` — **YYYY-MM-DD · Rolle**` in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) **und** in der Anlage [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md).
- **Agenten:** keine StB-/DSB-Kürzel erfinden; keine Checkbox-Suffixe ins Begleitblatt schreiben. Ausgabe der Prompts ist **Memo + Vorschlag für Ledger-Einträge** (`lineId`, `suffix`, `isoDate`, `evidenceRef`), Eintragung durch **Menschen** / **Release-Owner** mit Auftrag.

---

## Gemeinsame Abhak-Regel (verbindlich für alle Rollen)

1. **Nur** abhaken, wenn der Punkt **fachlich** erledigt oder **explizit** als „nicht im Scope“ mit **kurzer Begründung** und **Risikoakzeptanz (Release/Team)** dokumentiert ist (siehe Begleitblatt **Teil G**).
2. **Format für die Ledger-Datei** (nach `apply`; nicht im Begleitblatt erzwingen):
   - Checkbox-Zeile in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) und spiegelbildlich in [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md): `[ ]` → `[x]`.
   - Am **Ende derselben Zeile** das Suffix anfügen: ` — **YYYY-MM-DD · StB`** (bzw. **DSB**, **PL**, oder Kombinationen aus der Allowlist), wie von `apply-compliance-signoffs` geschrieben.
   - **Ein** Kürzel pro Abschluss, außer bei explizitem Gemeinschaftskürzel (siehe Punkt 3).
3. **Massen-E-Mail 5c:** **vor produktivem Mandanten-Versand / Go-Live** verbindlich **`StB+DSB+PL`** (Ledger-Kürzel „PL“ = Release-Owner) und **ein** Datum (Abschlusssitzung); im Ledger die Zeile **`chk-c05`**. In der **Entwicklungsphase** kein Merge-Zwang — [AGENTS.md](../../AGENTS.md) Punkt 6. **Andere** gemeinsame Zeilen (z. B. `StB+DSB`): Team intern **eine** Variante wählen und im Protokoll festhalten.
4. **Keine** erfundenen Protokoll-URLs; Verweise nur auf **reale** interne Dokumente (Wiki, Ticket, Beschluss).
5. **Repo-Regel:** Agenten-Sessions **ersetzen** keine StB-/DSB-Unterschrift; die Kürzel dokumentieren **wer** die fachliche Prüfung **verantwortet** hat (Person + Rolle intern klären).
6. **Änderungsschutz:** Im **Ledger** und in der **Ausgefüllt-Anlage** gesetzte **`[x]` … `· StB`** nicht durch DSB-/PL-Bearbeitung löschen oder auf `[ ]` setzen, solange keine **StB**- oder Protokoll-basierte Korrektur vorliegt (gleiches Prinzip für andere Rollen-Suffixe); Korrekturen über `compliance-signoffs.json` und Apply.

---

## Hybrid-Freigabe (Ledger)

**Ziel:** Varianten-konformes Abhaken (`[x]`, ISO-Datum, Kürzel am Zeilenende) **ohne** dass ein Sprachmodell StB/DSB „simuliert“. Menschliche Rollen und das genehmigte Freigabe-Tool bleiben die Quelle der Wahrheit; das Repository bekommt eine **maschinell auswertbare** Brücke.

### Ablauf

1. **StB / DSB / interne Freigabe (Ledger-Suffix `PL`)** tragen Freigaben im **genehmigten System** (Ticket, Workflow-Tool o. ä.) nach internem Prozess aus — **keine** erfundenen URLs oder Kürzel durch Agenten.
2. **Release-Verantwortliche** (oder eine technische Rolle mit Zugriff auf das Freigabe-Tool und ausdrücklichem Auftrag) pflegen daraus Einträge in [`compliance-signoffs.json`](./compliance-signoffs.json) gemäß Schema und Allowlist ([`compliance-signoffs.schema.md`](./compliance-signoffs.schema.md)).
3. Validierung: `npm run validate:compliance-signoffs`.
4. Übernahme in **Ledger und Ausgefüllt-Anlage**: `npm run apply:compliance-signoffs` (Dry-Run) und bei Bedarf `npm run apply:compliance-signoffs:apply` — Zeilen mit passendem HTML-Kommentar `<!-- compliance-line: … -->` in Ledger **und** Ausgefüllt-Anlage werden geändert (das **Druck-Begleitblatt** wird davon **nicht** angefasst — siehe **Kanon**).

### Verbindliche Regeln für Agenten

- **Verboten:** `· StB`, `· DSB`, `· PL`, Kombinationen wie `StB+DSB` usw. **ohne** passenden Ledger-Eintrag (`lineId`, `suffix`, `isoDate`, `evidenceRef`) setzen oder erfinden.
- **Orchestrierungs-Agent:** liest **nur** das validierte Ledger und führt das Anwendungs-Skript aus (oder wendet dieselbe Logik an); **keine** weiteren Listenzeilen „mitziehen“.
- **StB-/DSB-Sessions:** liefern **Inhalt** (Textvorschläge, offene Fragen, interne Memos); sie **ersetzen** keine Ledger-Zeile und schreiben **keine** Repo-Kürzel ohne menschlichen Eintrag ins Ledger.

### Stabile Zeilen-IDs

Die IDs stehen als HTML-Kommentare unmittelbar **vor** der jeweiligen Checkbox-Zeile in [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) und **identisch** in der Anlage [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) (**`chk-a01` … `chk-g06`**, derzeit **54** Zeilen). Neue markerpflichtige Zeilen: Kommentar im Ledger **und** in der Ausgefüllt-Anlage ergänzen, Begleitblatt spiegeln und `LINE_ALLOWED_SUFFIXES` im Skript [`../scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs) erweitern. Operativer Ablauf: [`compliance-freigabe-runbook.md`](./compliance-freigabe-runbook.md).

---

## Kopierbausteine — Risiko-Hinweise (Session-Prefix für Agenten)

Vor dem jeweiligen Auftrag in die Agenten-Session **kopieren** (steuert Erwartung, verhindert Überinterpretation von `[x]`).

### Prefix — DSB (vor Prompt B oder DSB-fokussierter Arbeit)

```text
[WARNUNG — Lesart Begleitblatt und Ledger]
Ein `[x]` bei „Rubrikenprüfung“ oder andere DSB-Kästchen ist **keine** VVT-/AV-/TOM-/Transfer-Freigabe. VVT, Vertragswerk, Subprozessor-Register (Hosting EU, SMTP/Massmail 5c, Archiv, E-Rechnung, Payment) und TIA/SCC je Empfänger (CH, ggf. US) bleiben **intern** belegt — keine Platzhalter-URLs ins Repo.
Operativ: EU-Hosting und kein routinemäßiger Nicht-EU-Zugriff erst mit **IT / Release-Owner** verifizieren, **dann** die zugehörigen fachlichen Checkboxen begründen.
Massen-E-Mail 5c, Spannungsfelder, Aufbewahrung vs. Löschung: gemeinsam StB+DSB(+Release-Owner; Ledger „PL“). **Teil G** Punkt **G.3** (DSB-Kurzprüfung) erst nach internem Schriftstück.
Datenkonsistenz: diese Prüfung ändert keine ERP-Daten.
```

### Prefix — StB (vor Prompt A oder StB-fokussierter Arbeit)

```text
[WARNUNG — Lesart Begleitblatt und Ledger]
Einzelne `[x]` im **Ledger** bedeuten **nicht** „Mandanten-Produktiv-Go vollständig“. **Teil B** Punkt **B.4** (Währung EUR) = nur strategische Währungsentscheidung — nicht Mustertexte, Exporte oder Abgleich externer Zahlungsnachweise ohne mandantenbezogene Abstimmung; ohne mandantenbezogene Abstimmung bleiben Betriebsprüfungs- und Doppelbuchungsrisiken.
Mit Release-Verantwortlichen und wo nötig DSB klären: **Teil A** (Kontext, Zielbild; Produktumfang nur **Mandanten-Endkundenrechnungen** laut **ADR 0012**); externe Nachweise vs. ERP-Kette; **Teil B** inkl. DACH/Sonderfälle; E-Rechnung (**Teil D**); Belege/Mahnen (**Teil C/F**) vor Produktivnutzung; **5c** nur nach StB+DSB+PL (`chk-c05`). Nächste steuerliche Sitzungen sinnvoll als: (1) Kontextannahmen ↔ Ist, (2) Soll-Abbild Belege/Buchung für **Endkundenumsätze** im ERP inkl. Export-Tests, (3) Mustertext zu **Paragraph 14 Umsatzsteuergesetz** je Pilot, (4) E-Rechnung-Scope DE vs. AT/CH, (5) FIN-4 Staging vor produktivem Mahnthema.
```

**Pflege / Drift-Risiko:** Bei inhaltlichen Änderungen **drei** Stellen abstimmen: dieses Prompt-Dokument, das **Druck-Begleitblatt** (Kanon), und das **Ledger** inkl. [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs) (**Maintainer** mit **DSB** bzw. **StB**).

---

## Prompt C — Release / IT: Verifikation Hosting & Zugriffsregion (**Teil E**, Vorbedingung)

```text
Du arbeitest mit **Release-** und/oder **IT**-Verantwortung. Du bearbeitest **nicht** das gesamte Begleitblatt, sondern **liefert die technische Grundlage** für **Teil E — E.3 Hosting und Zugriff aus dem Ausland** (Datenschutz).

### Auftrag
1. Ermittele **ohne** Marketing-Formulierung: Produktiv-Workload-Region(en), Admin/Support-Zugriffspfade, relevante Subprozessor-Standorte (Hosting, SMTP für 5c, Backup, Monitoring).
2. Dokumentiere das Ergebnis **intern** (Ticket, Wiki, Beschluss — keine Platzhalter-URLs ins Repo).
3. Erst wenn die Realität mit der Teamannahme (EU, kein routinemäßiger Nicht-EU-Zugriff auf Rechnungs-/Zahlungsdaten) **übereinstimmt** oder Ausnahmen mit **DSB**-Risikoabwägung versehen sind: **DSB** (oder PL nach interner Weisung) kann die Freigabe dokumentieren — **Hybrid:** Ledger-Zeile **`chk-e03`** mit passendem `suffix` (`DSB`, `PL`, oder `PL+DSB` je nach Teamregel) **nur** nach Eintrag in `compliance-signoffs.json` durch autorisierte Person; **du** setzt **keine** Repo-Kürzel im Namen anderer.

### Ausgabe
Kurzes technisches Memo (intern) + Liste offener Abweichungen für DSB/PL.
```

---

## Prompt D — Coding-/Review-Agent: Begleitblatt nur lesen; Ledger nur über Apply (Guardrails)

```text
Du bearbeitest Code/Docs im ERP-Repo.

### Begleitblatt
Checklisten/compliance-rechnung-finanz.md **nur lesen** (druckbare Freigabetabellen werden **von Menschen** ausgefüllt). Optional mit explizitem PL-Auftrag: Tippfehler in **nicht-fachlichen** Randbereichen oder Verweis-Korrekturen — **keine** fingierten StB/DSB-Daten.

### Ledger (Hybrid)
Checklisten/compliance-rechnung-finanz.ledger.md / compliance-rechnung-finanz-filled.md (Anlage): **Keine** `[x]` mit `· StB`, `· DSB`, `StB+DSB`, `StB+DSB+PL` setzen oder erfinden — **Ausnahme:** ausschließlich über validiertes Ledger [`compliance-signoffs.json`](./compliance-signoffs.json) und `npm run apply:compliance-signoffs:apply` (siehe **Hybrid-Freigabe (Ledger)** oben), ohne zusätzliche Zeilen zu ändern.

### Verboten
- **Keine** Stellungnahme „StB/DSB hat freigegeben“ aus dem Modell ableiten.

### Erlaubt (nur mit explizitem PL-Auftrag)
- Repo-interne organisatorische Ergänzungen wie in dieser Datei unter „Kurzprompt Release-Owner“, soweit keine Fachfreigabe vorgetäuscht wird.

### Pflicht
Wenn die Aufgabe fachliche Freigabe suggeriert: an **Menschen** (StB/DSB/PL) eskalieren; technische Vertiefung: Fußnoten/Links im Begleitblatt und ADRs/Systembeschreibung.
```

---

## Thema 1 — Teil A Scope & Rollen (fokussierte Prompts)

**Geltungsbereich:** **Teil A** im Begleitblatt und Ledger-Zeilen `chk-a01`–`chk-a09`. Freigaben **von Hand** im Begleitblatt (Tabellen); **Repo:** nur über Hybrid (`compliance-signoffs.json` + Apply auf [`compliance-rechnung-finanz.ledger.md`](./compliance-rechnung-finanz.ledger.md) und [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md)).

**Nach Thema 1:** Für **B–G** die Gesamt-Prompts **Prompt A** / **Prompt B** weiter unten verwenden.

### Prompt StB — Thema 1 (Teil A)

```text
[Vorbedingung: Prefix „StB“ aus Abschnitt „Kopierbausteine — Risiko-Hinweise“ dieser Datei oben einfügen, wenn die Session sonst leer startet.]

Du arbeitest als Steuerexpert/in (**StB**) zu **Teil A** des Begleitblatts [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md).

### Auftrag
1. Prüfe die steuerlich/belegwirtschaftlichen Prüfpunkte **A.1–A.9** (Zielbild, Produktumfang nur Mandanten→Endkunden, externe Nachweise vs. ERP, Stammdaten, Produktiv-Go, Rollen usw.) — orientiert an den Abschnittsfragen und „Ausfüllen“-Hinweisen.
2. **Repo:** Du schreibst **keine** Checkbox-Suffixe ins Begleitblatt. Nach fachlicher Freigabe: **Vorschlag** an PL für `compliance-signoffs.json` mit passenden `lineId`s (z. B. **`chk-a02`**, **`chk-a04`** mit `suffix: StB`, wo zulässig; gemeinsame Punkte mit DSB → `StB+DSB` auf **`chk-a03`** / **`chk-a04`** nur wenn erlaubt und dokumentiert).

### Zuständigkeit StB in Teil A
- **A.1 / A.7:** DACH, B2B/B2C, Stammdaten — StB-Einordnung; Hybrid-Suffixe nach Map.
- **A.2 / A.4:** Mandanten-Endkundenpfad, externe Zahlungs-/Belegnachweise vs. ERP — **StB**-Federführung für steuerlichen Soll-Ist-Abgleich (`chk-a02`, `chk-a04`).
- **A.3:** VVT/DSGVO zu im ERP verarbeiteten Daten — nur gemeinsam mit DSB (`StB+DSB` auf `chk-a03` wenn Team so beschließt).
- **A.5 / A.6 / A.8 / A.9:** überwiegend **PL**; StB wirkt nach organisatorischer Einbindung mit.

### Ausgabe
Kurznotiz (intern): offene steuerliche Randfälle für **Teil B**.
```

### Prompt DSB — Thema 1 (Teil A)

```text
[Vorbedingung: Prefix „DSB“ aus Abschnitt „Kopierbausteine — Risiko-Hinweise“ dieser Datei oben einfügen, wenn die Session sonst leer startet.]

Du arbeitest als Datenschutzbeauftragte/r (**DSB**) zu **Teil A** des Begleitblatts [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md).

### Auftrag
1. Prüfe **A.3**, Schnittmengen bei **A.1**, **A.4**, und organisatorische Punkte mit DS-Bezug (**A.5**–**A.9** nach Rolle).
2. **Repo:** keine fingierten Kürzel — Vorschlag an PL für Ledger-Einträge (`chk-a03`, ggf. `chk-a01`/`chk-a04` mit `DSB` oder `StB+DSB` gemäß [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs)).

### Zuständigkeit DSB in Teil A
- **A.3:** Verarbeitungszwecke, Datenminimierung, VVT-Andockpunkte für **ERP-Rechnungs-/Zahlungs-/Mahndaten** (Endkundenbezug) — Nachweis intern.
- **Zahlungsdienste des Mandanten** (für dessen Kunden): AV vs. eigenverantwortlich, Subprozessoren — mit **StB** abstimmen; Hybrid oft **`StB+DSB`** auf **`chk-a03`** oder **`chk-a04`**.
- **Release-GO / Rollen:** organisatorisch PL; DSB nur nach interner Regel.

### Ausgabe
Kurznotiz (intern): offene VVT-/AV-Punkte für **Teil E**.
```

### Workshops mit Mehrfachauswahl — Hinweis

Das Begleitblatt hat **keine** eingebettete „Agenten-Abgleich“-Markdown-Tabelle. Die Tabellen unten strukturieren **interne** Workshops. Repo-Spiegel: **`compliance-signoffs.json`** + Apply → Ledger + [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md) (`chk-*`). Automatisierte Agenten setzen **keine** Freigaben.

### Mehrfachauswahl — Teil A.3 VVT/DSGVO zu ERP-Daten Endkunden des Mandanten (`chk-a03`)

**Begleitblatt:** **A.3**. **Ledger:** **`chk-a03`** — oft `StB+DSB` nach gemeinsamer Sitzung (erlaubte Suffixe: Shared-Skript).

**Ablauf (Release-Owner / Agent mit Auftrag):** Empfehlung, dann Antwort; Stand **intern** (Wiki/Ticket) festhalten.

| ID | Frage | Optionen | Empfehlung (Ausgangspunkt) |
|----|--------|----------|----------------------------|
| **G1** | Sind **VVT-Andockpunkte** für **im ERP verarbeitete** Rechnungs-/Zahlungs-/Mahndaten (Bezug **Mandant → Endkunden**) **intern** benannt (Zweck, Umfang), noch **ohne** Volltext im Repo? | A) Ja, Entwurf intern · B) Teilweise · C) Noch nicht | A vor Ledger-Eintrag |
| **G2** | **Datenminimierung:** Ist dokumentiert, **welche** Zahlungs-/Belegmetadaten **im ERP** landen dürfen vs. nur bei Bank/PSP **des Mandanten** (für dessen Kunden)? | A) Ja, mit StB+DSB Abgleich · B) Nur technische Annahme · C) Offen | A; bei B/C nicht freigeben |
| **G3** | Passt die **README/ADR-Mandantenisolation** als technischer Anker für „getrennte Verarbeitung“ zur internen VVT-Beschreibung? | A) Ja, konsistent · B) Lücken, Eskalation · C) Noch nicht geprüft | A oder B→PL→StB+DSB |
| **G4** | **Ledger:** Wann `chk-a03` auf `[x]`? | A) Nur nach echtem Datum und erlaubtem Suffix durch Menschen · B) Nur Workshop-Tabelle bis dahin · C) Agent setzt `[x]` | **A** bzw. **B**; **C** verboten |

Nach Auswertung: Begleitblatt **A.3** von Hand ausfüllen; **`chk-a03`** erst nach JSON + Apply durch autorisierte Rolle.

### Mehrfachauswahl — Teil A.2 / A.4 Mandanten-Endkunden: externe Nachweise vs. ERP (`chk-a02`, `chk-a04`)

**Ledger:** **`chk-a02`** (Produktumfang/Kette geklärt), **`chk-a04`** (externe Zahlungsnachweise vs. ERP-Belege) — Suffixe nach Map (`StB`, `PL`, `DSB`, `StB+DSB` …).

| ID | Frage | Optionen | Empfehlung |
|----|--------|----------|------------|
| **M1** | **Soll-Abbild:** Welche Belege/Zahlungsnachweise sind **außerhalb** des ERP maßgeblich vs. **im ERP** — mit **StB** und Mandant/PL beschlossen? | A) Ja, intern dokumentiert · B) Teilweise · C) Offen | A vor `chk-a02`/`chk-a04` |
| **M2** | **Buchung/Export:** Doppelbuchung oder Lücke ausgeschlossen — **StB** abgenommen? | A) Ja · B) Workaround dokumentiert · C) Offen | A |
| **M3** | **DS-Anteil:** AV vs. eigenverantwortlich, Subprozessoren — **StB+DSB** schriftlich mit VVT/Vertrag? | A) Ja · B) Entwurf · C) Offen | A vor gemeinsamem Suffix falls vorgesehen |
| **M4** | **Ledger:** Einträge nur durch Menschen? | A) Ja · B) Nur Workshop bis Freigabe · C) Agent setzt `[x]` | **A**/**B**; **C** verboten |

### Mehrfachauswahl — Teil A.6 Produktiv-Go Pilot (`chk-a06`)

**Begleitblatt:** **A.6**. **Ledger:** **`chk-a06`** mit ` — **YYYY-MM-DD · PL**` nach internem Protokoll.

| Kurzzeichen | Frage | Optionen | Empfehlung |
|-------------|--------|----------|------------|
| **R1** | Liegt ein **schriftliches** Dokument „Produktiv-Go Finanz/Rechnung“ mit **Datum**, **Version** und **Geltungsmandanten** vor (**intern**)? | A) Ja · B) Entwurf · C) Nein | A vor Abhaken |
| **R2** | Ist die **Mitwirkung** von StB und DSB **intern** nachweisbar? | A) Ja · B) Teilweise · C) Nein | A |
| **R3** | Ist das Produktiv-Go **explizit** vom reinen Software-Merge **getrennt** beschrieben? | A) Ja · B) Unklar · C) Nein | A |
| **R4** | **Ledger `chk-a06`:** nur PL mit echtem Datum? | A) Ja · B) Nur Vorbereitung · C) Agent setzt `[x]` | **A**/**B**; **C** verboten |

### Mehrfachauswahl — Teil A.7 Stammdaten-Kontext (`chk-a07`)

**Zieldatei:** Begleitblatt **A.7**; Ledger **`chk-a07`**.

| Kurzzeichen | Frage | Optionen | Empfehlung |
|-------------|--------|----------|------------|
| **KA1** | Termine mit **StB** und **DSB** zur Kontextabstimmung **durchgeführt**? | A) Ja · B) Nur terminiert · C) Offen | A |
| **KA2** | Ergebnis **intern** dokumentiert? | A) Ja · B) Teilweise · C) Nein | A |
| **KA3** | **`chk-a07`:** nur nach menschlicher Freigabe (JSON + Apply)? | A) Ja · B) Nur Text · C) Agent setzt `[x]` | **A**; **C** verboten |

### Mehrfachauswahl — Teil A.8 Rollenmatrix (`chk-a08`)

**Zieldatei:** Begleitblatt **A.8**; Ledger **`chk-a08`**.

| Kurzzeichen | Frage | Optionen | Empfehlung |
|-------------|--------|----------|------------|
| **RM1** | PL, StB, DSB, IT-Security benannt und erreichbar (**intern**)? | A) Ja · B) Teilweise · C) Nein | A |
| **RM2** | **Eskalationspfad** vor Produktivstart beschrieben? | A) Ja · B) Nein | A |
| **RM3** | **`chk-a08`:** nur PL nach Freigabe? | A) Ja · B) Bearbeitungsstand · C) Agent | **A**; **C** verboten |

### Mehrfachauswahl — Teil A.9 Vorlage Produktiv-Go (`chk-a09`)

**Zieldatei:** Begleitblatt **A.9**; Ledger **`chk-a09`**.

| Kurzzeichen | Frage | Optionen | Empfehlung |
|-------------|--------|----------|------------|
| **PD1** | Vorlage **intern** bereit? | A) Ja · B) Entwurf · C) Nein | A |
| **PD2** | Mit StB und DSB für Pilot abgestimmt? | A) Ja · B) Teilweise · C) Nein | A |
| **PD3** | **`chk-a09`:** nur PL nach Freigabe? | A) Ja · B) Stand · C) Agent | **A**; **C** verboten |

**Hinweis:** A.6–A.9 und R1–R4 sind inhaltlich verzahnt — oft eine Sitzungskette; dies ersetzt keine internen Nachweise.

### Antwortprotokoll Mehrfachauswahl (intern — von Menschen ausfüllen)

Nach jedem Termin **Option A/B/C** oder Kurzsatz eintragen.

**Release-GO (R1–R4)**

| R1 | R2 | R3 | R4 |
|----|----|----|-----|
| | | | |

**Kontext / A.7 (KA1–KA3)**

| KA1 | KA2 | KA3 |
|-----|-----|-----|
| | | |

**Rollenmatrix (RM1–RM3)**

| RM1 | RM2 | RM3 |
|-----|-----|-----|
| | | |

**Vorlage Produktiv-Go (PD1–PD3)**

| PD1 | PD2 | PD3 |
|-----|-----|-----|
| | | |

**Teil B.1 — Pflichtangaben (U1–U4)**

| U1 | U2 | U3 | U4 |
|----|----|----|-----|
| | | | |

### Mehrfachauswahl — Teil B.1 Pflichtangaben Mandantenrechnung (`chk-b01`)

**Zieldatei:** Begleitblatt **B.1**; Ledger **`chk-b01`** mit `· StB` nach steuerlicher Freigabe.

| Kurzzeichen | Frage | Optionen | Empfehlung |
|-------------|--------|----------|------------|
| **U1** | Liegt eine von der **Steuerberatung** gebilligte **Pflichtangaben-Liste** oder ein **Mustertext** zum **Paragraph 14 Umsatzsteuergesetz** vor? | A) Ja · B) Entwurf · C) Nein | A vor Abhaken |
| **U2** | Pflichtangaben gegen **Stammdaten** und **Rechnungsdarstellung** im Produkt abgeglichen? | A) Ja · B) Teilweise · C) Nein | A |
| **U3** | **USt-Id**, Ausstellungsdatum, fortlaufende Rechnungsnummer, Leistungszeitpunkt je Pilot geklärt? | A) Ja · B) Teilweise · C) Nein | A |
| **U4** | **`chk-b01`:** nur StB mit Datum (JSON + Apply)? | A) Ja · B) Nur Bearbeitungsstand · C) Agent | **A**; **C** verboten |

Nach Auswertung: **U1–U4** im Antwortprotokoll festhalten; Ledger-Eintrag **`chk-b01`** durch autorisierte Rolle.

---

## Prompt A — Rolle: Steuerberater (**StB**)

```text
[Vorbedingung: Prefix „StB“ aus „Kopierbausteine — Risiko-Hinweise“ einfügen.]

Du arbeitest als Steuerexpert/in (**StB**). Du ersetzt keine rechtsverbindliche Mandantenberatung; du strukturierst Prüfungsergebnisse zum Begleitblatt [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md).

### Auftrag
1. **Lies** das Begleitblatt (Teile **A–D**, **G**, Schnittmenge **E** wo Steuer). Dokumentiere Ergebnisse **intern** (Protokoll/Wiki).
2. **Repo:** Schreibe **keine** Checkbox-/Suffix-Zeilen ins Begleitblatt (Druckformat mit Tabellen). Für maschinelle Spiegelung liefert PL nach deiner Freigabe Einträge in `compliance-signoffs.json` und `npm run apply:compliance-signoffs:apply` (Ledger + [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md)).
3. Gib PL eine **konkrete Liste empfohlener Ledger-Zeilen** (`lineId`, `suffix`, `isoDate`, `evidenceRef`) — nur erlaubte Kombinationen aus [`scripts/compliance-signoffs-shared.mjs`](../scripts/compliance-signoffs-shared.mjs). Keine Einzel-Suffixe dort, wo `StB+DSB` oder `StB+DSB+PL` vorgesehen ist.

### Inhaltliche Leitlinien
- Kontext: Einleitung und **Teil A** des Begleitblatts (GmbH DE, DACH; **nur** Mandanten-Endkundenrechnungen im ERP — **ADR 0012**). Abweichungen der Praxis **zuerst** mit Release-Owner klären.
- Technische Vertiefung: Links am Ende des Begleitblatts und ADRs — nicht löschen.

### Primär-StB-Punkte (fachliche Bewertung)
- **Teil A:** Zielbild, Produktumfang Mandanten→Endkunden, externe Nachweise vs. ERP — Ledger z. B. `chk-a01`–`chk-a04`, `chk-a07`.
- **Teil B:** UStG-/DACH-/LV-/UID-/Währung — `chk-b01`–`chk-b11`.
- **Teil C:** Belegkette, Impressum/Stammdaten, Mahntexte, Unveränderbarkeit, Nummernkreis, Aufbewahrung, GoBD-Idee — `chk-c01`–`chk-c09`; **C.5** nur mit **`StB+DSB+PL`** (`chk-c05`).
- **Teil D:** E-Rechnung — `chk-d01`–`chk-d06`.
- **Teil E:** nur **E.4**, **E.8**–**E.10** soweit Handels-/Steuerrecht und Schnittmenge mit DSB (`StB+DSB` wo Map erlaubt).
- **Teil G:** **G.2**, **G.4** (steuerlicher Teil), **G.6** wenn steuerliche Roadmap betroffen.

### Nicht primär StB
- **Teil E** rein DSGVO (VVT, Hosting EU, TOM, …) — **DSB**; du wirkt bei Schnittmengen mit.
- Organisatorisches in **Teil A** / **Teil G** ohne Steuerinhalt — **PL**.

### Ausgabe
- **StB-Memo** (intern) + **Tabelle „empfohlene signoffs[]“** für PL (keine erfundenen Daten).
```

---

## Prompt B — Rolle: Datenschutzbeauftragte/r (**DSB**)

```text
[Vorbedingung: Prefix „DSB“ aus „Kopierbausteine — Risiko-Hinweise“ einfügen.]

Du arbeitest als Datenschutzbeauftragte/r (**DSB**). Du ersetzt keine rechtsverbindliche Auftragsberatung; du strukturierst Prüfungsergebnisse zum Begleitblatt [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md).

### Auftrag
1. **Lies** die Teile **A**, **C** (Schnittmenge), **E**, **F**, **G** (DS-Anteil). Dokumentiere **intern** (VVT-Anker, keine Volltexte ins Repo).
2. **Ledger:** Überschreibe **keine** bestehenden **`[x]` … `· StB`**-Zeilen (Änderungsschutz). Neue Freigaben nur über **`compliance-signoffs.json`** + Apply — empfohlene Einträge an PL übergeben.
3. Gemeinsame Punkte (**C.5**, Spannungsfelder **E.8**–**E.10**, **F.2**–**F.3**): nur mit dokumentierter Abstimmung; Suffixe **`StB+DSB`**, **`StB+DSB+PL`** wie Map.

### Inhaltliche Leitlinien
- **VVT**/Vertragswerk für **ERP-Rechnungs-, Zahlungs- und Mahndaten** (Endkundenbezug); Hosting/Zugriff mit IT/Release-Owner verifizieren (**Prompt C**).

### Primär-DSB-Punkte (Ledger-Beispiele)
- **Teil A:** **A.3** — `chk-a03`; Schnittmenge **A.1**, **A.4**.
- **Teil C:** **C.5** — `chk-c05` nur **`StB+DSB+PL`**.
- **Teil E:** **E.1**–**E.7**, Spannungen **E.8**–**E.10** — `chk-e01`–`chk-e10`.
- **Teil F:** **F.1**–**F.3** — `chk-f01`–`chk-f03`.
- **Teil G:** **G.3**, **G.4** (DS-Anteil).

### Mitwirkung
- **E.4** Aufbewahrung vs. Löschung: mit **StB** — oft `StB+DSB` auf `chk-e04`.

### Nicht primär DSB
- Reine UStG-Inhalte **Teil B** — **StB**.

### Ausgabe
- **DSB-Memo** (intern) + **empfohlene `signoffs[]`** für PL.
```

---

## Kurzprompt — Release-Verantwortliche (Ledger-Kürzel **PL**)

```text
Du bist PL (Orchestrator).

### Begleitblatt
Organisiere Abstimmung und **Ausfüllen der Freigabetabellen** in [`compliance-rechnung-finanz.md`](./compliance-rechnung-finanz.md) (**Teil A**, **G**; Querschnitt zu StB/DSB).

### Ledger / Hybrid
Nach dokumentierten Freigaben: `compliance-signoffs.json` pflegen und `npm run validate:compliance-signoffs` / `apply:compliance-signoffs:apply` — Ziel Ledger + [`compliance-rechnung-finanz-filled.md`](./compliance-rechnung-finanz-filled.md). Suffix ` — **YYYY-MM-DD · PL**` auf **`chk-a05`–`chk-a09`**, **`chk-g01`**, **`chk-g04`**, **`chk-g05`**, **`chk-g06`** usw. nur wie Map erlaubt.

**Gemeinsam:** **C.5** / **`chk-c05`** — erst nach StB+DSB+PL mit **einem** Datum.

**Keine** fachliche StB-/DSB-Aussage erfinden.

**Änderungsschutz:** Im **Ledger** und in der **Ausgefüllt-Anlage** gesetzte **`[x]` … `· StB`** nicht ohne StB/Protokoll anfassen.
```

---

## Nach Teil-A-Statusbericht — nächste Prompts (Workshop-Kette)

**Voraussetzung:** StB- und DSB-Status zu **Teil A** sind dokumentiert. Im **Ledger** kann **`chk-a02`** (Produktumfang/Kette) bereits **`· StB`** tragen — **Änderungsschutz**: nicht zurücksetzen ohne StB/Protokoll.

### Prompt E — Gemeinsame Session **StB + DSB** (Teil A: Schnittmengen)

```text
Ihr arbeitet **gemeinsam** als **StB** und **DSB** (Protokollführer: typischerweise PL). Ziel: Nachweise für **`chk-a03`** (und ggf. **`chk-a04`**) mit erlaubtem Suffix **`StB+DSB`** — **Repo-Änderungen** nur über PL und `compliance-signoffs.json` + Apply, nicht durch KI allein.

### Lesart
- **`chk-a02`** kann bereits **`· StB`** tragen — nicht löschen (Änderungsschutz).
- **`StB+DSB`** nur bei fachlicher Zustimmung **beider** Rollen.

### Tagesordnung (Bezug Begleitblatt **A.2–A.4**)
1. **A.3 VVT/DSGVO ERP-Daten Endkunden** → Ledger **`chk-a03`**  
   - **DSB:** Zwecke, Datenminimierung, VVT-Stichworte (intern).  
   - **StB:** steuerliche Schnittmenge (Belege, Aufbewahrung).  
   - **Gemeinsam:** Subprozessoren (Hosting, Mail, Archiv, ggf. Zahlungsdienst **des Mandanten**) intern benannt.

2. **Externe Nachweise vs. ERP (DS-Anteil)** → **`chk-a04`**  
   - **DSB:** AV, Subprozessor-Kette soweit personenbezogene Zahlungsdaten.  
   - **StB:** welche Nachweise steuerlich maßgeblich sind.  
   - **Gemeinsam:** Team-Regel für ein oder zwei Ledger-Einträge.

### Ausgabe
| Thema | StB | DSB | Nächster Schritt |
|-------|-----|-----|------------------|
| A.3 / chk-a03 | … | … | … |
| A.4 / chk-a04 | … | … | … |

**Protokoll:** intern; dann PL pflegt JSON und Apply.
```

### Prompt F — **PL** nach StB/DSB-Teil-A-Status (Workshops)

```text
Du bist **PL**. Du nutzt StB-/DSB-Status zu **Teil A**. Referenz: Begleitblatt + Ledger (`chk-a01`–`chk-a09`).

### Hard constraints
- Bereits gesetzte Ledger-Suffixe (**Änderungsschutz**) nicht anfassen.
- Keine neuen Repo-Kürzel ohne dokumentierte Rolle.

### Aufgaben
1. Workshop **Beleg-/Umsatzmatrix** (Endkundenpfad im ERP, externe Nachweise, Export) mit StB — Protokoll intern.  
2. **A.1 Zielbild:** StB-Einordnung, dann ggf. PL+DSB zu Transparenz/B2C — Team-Regel, wann **`chk-a01`** mit welchen Suffixen (`PL`, `StB`, `DSB`, …) vollständig ist.  
3. **Prompt E** durchführen oder einplanen.  
4. Workshops vs. schriftlicher Rundlauf festlegen; VVT-Link nur **intern**.  
5. **A.7–A.9** im Begleitblatt voranbringen; Ledger **`chk-a07`–`chk-a09`** nach Freigaben durch PL per JSON.

### Ausgabe
Einladungen, Protokollauszug, Liste offener **`chk-*`** für nächste Iteration.
```

---

## Orchestrierung (PL — Dispatch-Reihenfolge)

Ziel: **keine** falsche Mandanten-Go-Lesart aus Teil-Häkchen; technische Nachweise vor DSB-/StB-Checkboxen.

| Schritt | Wer / Prompt | Ergebnis |
|--------|----------------|----------|
| 0 | **Mensch PL** | Sitzungen terminieren; internes Protokoll-Wiki wählen (keine Platzhalter-URLs ins Repo). |
| 1 | **Prompt D** (Coding-Agent) | Feature-PRs ohne StB/DSB-Kürzel; bei Compliance-Touch Escalation-Hinweis. |
| 2 | **Prompt C** (Release-Owner / IT) | Memo Hosting/Zugriff — Vorbereitung **Teil E.3** / Ledger **`chk-e03`**. |
| 3 | **Prefix DSB** + **Prompt B** oder **Thema 1 / DSB** | **Teil E/F** und Schnittmenge **A**; **`chk-c05`** offen bis Schritt 6. |
| 4 | **Prefix StB** + **Prompt A** oder **Thema 1 / StB** | **Teil A–D**, **G**; **B.4 (EUR)** nicht als Gesamt-Mustertext-Freigabe lesen. |
| **4b** | **Prompt E** + **Prompt F** (nach Teil-A-Status) | StB+DSB zu **A.3/A.4**; PL plant Workshops. |
| 5 | **Mensch PL** + StB + DSB | Konflikte (externe Nachweise, Löschung, CH, 5c) — Protokoll; Ledger-Suffixe laut Map. |
| 6 | **Kurzprompt Release-Owner** | **Teil G**, **`chk-c05`** mit `StB+DSB+PL` (Ledger-Kürzel) einmalig nach Sitzung **vor Live**. |

**Parallel möglich:** Schritt 3 und 4 nach Schritt 2. **Seriell zwingend:** Schritt 6 nach Schritt 5 für **`chk-c05`** und **Teil G** (z. B. **`chk-g01`**).

---

## Reihenfolge-Empfehlung (Kurzfassung)

1. StB und DSB **parallel** die Primärlisten (mit jeweiligem **Prefix**) — siehe Tabelle **Orchestrierung**.  
2. **Konfliktzeilen** in Abstimmung, dann gemeinsames Kürzel.  
3. PL **zuletzt** **Teil G** und Querverweise; **C.5 / `chk-c05`** nur mit **`StB+DSB+PL`**.

---

*Diese Prompt-Datei ist Arbeitsmaterial; sie ersetzt keine Mandantenberatung.*
