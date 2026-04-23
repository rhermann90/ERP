/**
 * Kurzübersicht: welche Finanz-Funktionen diese Vorbereitungsseite gegen das Backend ausführt.
 * Einordnung konsistent mit docs/ENTWICKLUNGSPHASEN-MVP-V1.3.md (Kurz-Iststand) und
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
      inUi: "Optional beim Entwurf (Basispunkte)",
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
      inUi: "Liste GET + Ereignis POST",
      einordnung: "nicht Zielprodukt (M4)",
      hinweis: "Slice 1–2 laut ADR-0009; Konfig/Vorlagen/E-Mail/M4 explizit Non-Goal in Wave3.",
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
