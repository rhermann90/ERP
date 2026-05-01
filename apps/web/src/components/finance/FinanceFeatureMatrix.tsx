/**
 * Kurzübersicht: welche Finanz-Funktionen diese Vorbereitungsseite gegen das Backend ausführt.
 * Einordnung konsistent mit docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md Teil 1 (Kurz-Iststand) und
 * docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md (Non-Goals: kein vollständiger 8.4(2–6), kein M4-Mix).
 */
export function FinanceFeatureMatrix() {
  const rows: { area: string; inUi: string; einordnung: string; hinweis: string }[] = [
    {
      area: "FIN-1 Zahlungsbedingungen",
      inUi: "Lesen + neue Version",
      einordnung: "Demo",
      hinweis: "M1-Zielbild (Versionierung, Editor) nicht ersetzt; nur Vorbereitung.",
    },
    {
      area: "FIN-2 Rechnung",
      inUi: "Entwurf POST, Lesen GET, Buchung POST …/book (SoT)",
      einordnung: "nur Vorbereitung",
      hinweis: "Teil M2; Buchung nur mit BOOK_INVOICE; kein Pfad C (Zwischenstatus) in dieser Welle.",
    },
    {
      area: "8.4 B2-1a Skonto",
      inUi: "Schritt 2: Basispunkte beim neuen Entwurf; nach GET Rechnung Sync; bei ENTWURF: neu berechnen (POST /invoices mit gleicher LV/Angebots-Version)",
      einordnung: "Demo",
      hinweis: "Wave3 API-first; Rechenweg serverseitig (8.4(1)+USt/Brutto); kein 8.4(2–6)-Motor.",
    },
    {
      area: "FIN-3 Zahlungseingang",
      inUi: "Intake POST + Liste GET",
      einordnung: "nur Vorbereitung",
      hinweis: "M3-Teilstück; SoT RECORD_PAYMENT_INTAKE nach Rechnung laden; kein Bankfile-Produkt.",
    },
    {
      area: "FIN-4 Mahnung",
      inUi: "Tab Mahnwesen: Liste GET + Ereignis POST; Konfig/Vorlagen/Footer/E-Mail",
      einordnung: "nicht Zielprodukt (M4)",
      hinweis: "Slice 1–2 laut ADR-0009; vollständiger M4-Produktivpfad weiterhin PL/Compliance.",
    },
    {
      area: "FIN-4 Mahn-Kandidaten / Automation (SEMI)",
      inUi: "Tab Grundeinstellungen: GET/PATCH automation, GET candidates, Dry-Run/EXECUTE; Deep-Link kanonisch `#/finanz-grundeinstellungen`, sonst `#/finanz-vorbereitung?tab=…`",
      einordnung: "nicht Zielprodukt (M4)",
      hinweis: "ADR-0011 B3 (stageDeadlineIso, eligibilityContext); kein Cron/AUTO; bei Server-OFF sind Mahnlauf-Dry-Run/EXECUTE und Batch-E-Mail (5c) in der PWA deaktiviert (Variante 1a); keine Offline-Schreibsimulation.",
    },
    {
      area: "M4 Massen-E-Mail (Slice 5c)",
      inUi: "Tab Grundeinstellungen: POST …/dunning-reminder-run/send-emails (DRY_RUN/EXECUTE, max. 25 Zeilen; EXECUTE mit Bestätigung)",
      einordnung: "nicht Zielprodukt (M4)",
      hinweis: "Spec M4-BATCH-DUNNING-EMAIL-SPEC; 5a-Pipeline pro Zeile; Mandanten-Go nur mit Compliance/Runbook; bei OFF wie Mahnlauf (409 / UI deaktiviert).",
    },
    {
      area: "SoT / andere Entitäten",
      inUi: "allowed-actions für gewählte entityType",
      einordnung: "Demo",
      hinweis: "Wie Haupt-Shell; technischer Spielplatz ohne eigenes MVP-Meilenstein-Ziel.",
    },
    {
      area: "Audit",
      inUi: "GET /audit-events (letzte 15)",
      einordnung: "Demo",
      hinweis: "Lesepfad; vollständige Audit-DB/Härtung siehe FIN-6 / Follow-up-Tickets.",
    },
  ];

  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.65rem 0.75rem",
        borderRadius: "8px",
        border: "1px solid color-mix(in srgb, var(--border) 80%, transparent)",
        background: "color-mix(in srgb, var(--panel-2) 60%, transparent)",
      }}
    >
      <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.5rem" }}>Was ist hier angebunden? (Ist-Stand)</h3>
      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0 0 0.5rem" }}>
        Diese Seite ist <strong>Finanz-Vorbereitung</strong> (PWA-Hash) — laut MVP-Doku kein Mahnlauf-/E-Mail-Produktivpfad; Schreibpfade nur mit SoT. Spalte{" "}
        <strong>Einordnung</strong>: grob <em>Demo</em> (Spielwiese), <em>nur Vorbereitung</em> (Teil-Meilenstein), <em>nicht Zielprodukt</em> (M4 o. ä.).
      </p>
      <div style={{ overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
          <caption className="visually-hidden">Finanz-Features und UI-Abdeckung</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.25rem 0.35rem" }}>
                Bereich
              </th>
              <th scope="col" style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.25rem 0.35rem" }}>
                In dieser UI
              </th>
              <th scope="col" style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.25rem 0.35rem" }}>
                Einordnung MVP
              </th>
              <th scope="col" style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "0.25rem 0.35rem" }}>
                Hinweis
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.area}>
                <td style={{ padding: "0.25rem 0.35rem", verticalAlign: "top", fontWeight: 600 }}>{r.area}</td>
                <td style={{ padding: "0.25rem 0.35rem", verticalAlign: "top" }}>{r.inUi}</td>
                <td style={{ padding: "0.25rem 0.35rem", verticalAlign: "top", whiteSpace: "nowrap" }}>{r.einordnung}</td>
                <td style={{ padding: "0.25rem 0.35rem", verticalAlign: "top", color: "var(--text-secondary)" }}>{r.hinweis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
