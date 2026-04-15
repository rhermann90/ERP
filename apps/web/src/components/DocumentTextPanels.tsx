type Props = {
  status?: string;
  measurementId: string;
  systemText?: string;
  editingText?: string;
};

/**
 * Stellt Systemtext und Bearbeitungstext strikt getrennt dar.
 * Kein HTML-Injection-Pfad (nur React-escaped Plain Text).
 */
export function DocumentTextPanels({ status, measurementId, systemText, editingText }: Props) {
  return (
    <section className="panel">
      <h2>Aufmass · Systemtext vs. Bearbeitungstext</h2>
      <p style={{ fontSize: "0.85rem", marginTop: 0 }}>
        Status: <code>{status}</code> · measurementId: <code>{measurementId}</code>
      </p>
      <div className="field-grid two">
        <div className="system-block" data-testid="system-text-block">
          <div className="label">Systemtext (nicht editierbar)</div>
          {systemText ?? "—"}
        </div>
        <div className="editing-block" data-testid="editing-text-block">
          <div className="label">Bearbeitungstext (Anzeige)</div>
          {editingText ?? "—"}
        </div>
      </div>
    </section>
  );
}
