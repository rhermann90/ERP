import type { DifferenceBookingReadRow } from "../../lib/api-client.js";

type Props = {
  rows: DifferenceBookingReadRow[];
  formatEur: (cents: number) => string;
  wrapTestId?: string;
  tableTestId?: string;
  /** Spalten Zuordnung/Verbucht — für eingebettete Zeilen in GET /invoices. */
  showAllocationTimestamps?: boolean;
};

function formatIsoShort(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return iso;
  return new Date(ms).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

/** Read-only Darstellung persistierter Differenzbuchungen (Server-Beträge, ADR-0020). */
export function DifferenceBookingReadTable({
  rows,
  formatEur,
  wrapTestId,
  tableTestId,
  showAllocationTimestamps = false,
}: Props) {
  if (rows.length === 0) return null;
  return (
    <div style={{ overflowX: "auto" }} data-testid={wrapTestId}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}
        data-testid={tableTestId}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
              Art
            </th>
            <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
              Status
            </th>
            <th style={{ textAlign: "right", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
              LV-Netto
            </th>
            <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
              Referenz-Rechnung
            </th>
            {showAllocationTimestamps ? (
              <>
                <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                  Zuordnung
                </th>
                <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
                  Ausgleich verbucht
                </th>
              </>
            ) : null}
            <th style={{ textAlign: "left", padding: "0.35rem", borderBottom: "1px solid var(--border-subtle)" }}>
              Aufmassversionen
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={{ padding: "0.35rem", verticalAlign: "top" }}>
                <code>{row.kind}</code>
              </td>
              <td style={{ padding: "0.35rem", verticalAlign: "top" }}>
                <code>{row.status}</code>
              </td>
              <td style={{ padding: "0.35rem", verticalAlign: "top", textAlign: "right" }}>{formatEur(row.amountNetCents)}</td>
              <td style={{ padding: "0.35rem", verticalAlign: "top", wordBreak: "break-all" }}>
                {row.referenceInvoiceId ? <code>{row.referenceInvoiceId}</code> : <span>—</span>}
              </td>
              {showAllocationTimestamps ? (
                <>
                  <td style={{ padding: "0.35rem", verticalAlign: "top", fontSize: "0.8rem" }}>
                    {formatIsoShort(row.allocatedAt)}
                  </td>
                  <td style={{ padding: "0.35rem", verticalAlign: "top", fontSize: "0.8rem" }}>
                    {formatIsoShort(row.settledAt)}
                  </td>
                </>
              ) : null}
              <td style={{ padding: "0.35rem", verticalAlign: "top", wordBreak: "break-all" }}>
                <span className="shell-sub" style={{ display: "block", marginBottom: "0.15rem" }}>
                  Vorgänger
                </span>
                <code>{row.predecessorMeasurementVersionId}</code>
                <span className="shell-sub" style={{ display: "block", margin: "0.35rem 0 0.15rem" }}>
                  Nachfolger
                </span>
                <code>{row.subsequentMeasurementVersionId}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
