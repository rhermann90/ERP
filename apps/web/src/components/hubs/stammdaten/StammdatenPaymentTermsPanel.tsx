import type { PaymentTermsListResponse } from "../../../lib/api-client.js";
import { formatDateTime } from "./format-datetime.js";

type Props = {
  paymentTerms: PaymentTermsListResponse;
  showIntegrationHints: boolean;
  selectCustomer: (customerId: string) => void;
  customerJumpLabel: string;
};

export function StammdatenPaymentTermsPanel({
  paymentTerms,
  showIntegrationHints,
  selectCustomer,
  customerJumpLabel,
}: Props) {
  return (
    <div data-testid="stamm-payment-terms-structured" style={{ marginTop: "0.75rem" }}>
      <p className="shell-sub">
        <strong>Konditionskopf</strong> · Projekt <code>{paymentTerms.projectId}</code> · zugeordneter Kunde (FIN-1):{" "}
        <button
          type="button"
          className="btn secondary"
          style={{ padding: "0.35rem 0.65rem", fontSize: "0.85rem" }}
          onClick={() => selectCustomer(paymentTerms.customerId)}
          title={paymentTerms.customerId}
          aria-label={`${customerJumpLabel}; vollständige Kunden-ID ${paymentTerms.customerId}`}
          data-testid="stamm-payment-terms-customer-jump"
        >
          {customerJumpLabel}
        </button>
      </p>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(10rem, 13rem) 1fr",
          gap: "0.25rem 1rem",
          fontSize: "0.88rem",
          margin: "0.5rem 0",
        }}
      >
        <dt style={{ margin: 0, color: "var(--text-secondary, #666)" }}>Konditionskopf-ID</dt>
        <dd style={{ margin: 0 }} title="paymentTermsHeadId (API)">
          <code>{paymentTerms.paymentTermsHeadId}</code>
        </dd>
        <dt style={{ margin: 0, color: "var(--text-secondary, #666)" }}>Angelegt am</dt>
        <dd style={{ margin: 0 }}>{formatDateTime(paymentTerms.createdAt)}</dd>
        <dt style={{ margin: 0, color: "var(--text-secondary, #666)" }}>Angelegt von</dt>
        <dd style={{ margin: 0 }} title="createdBy (User-ID)">
          <code>{paymentTerms.createdBy}</code>
        </dd>
      </dl>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}
          data-testid="stamm-payment-terms-versions-table"
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                Versionsnr.
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                Bezeichnung
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                Konditionsversions-ID
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid var(--border-color, #44444444)", padding: "0.35rem" }}>
                Stand
              </th>
            </tr>
          </thead>
          <tbody>
            {paymentTerms.versions.map((v) => (
              <tr key={v.paymentTermsVersionId}>
                <td style={{ padding: "0.35rem" }}>{v.versionNumber}</td>
                <td style={{ padding: "0.35rem" }}>{v.termsLabel}</td>
                <td style={{ padding: "0.35rem" }} title="paymentTermsVersionId">
                  <code>{v.paymentTermsVersionId}</code>
                </td>
                <td style={{ padding: "0.35rem" }}>{formatDateTime(v.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showIntegrationHints ? (
        <details style={{ marginTop: "0.75rem" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.85rem" }}>
            Technische Feldnamen / Rohdaten (Expertenmodus)
          </summary>
          <p className="shell-sub" style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
            OpenAPI: <code>paymentTermsHeadId</code>, <code>paymentTermsVersionId</code>, <code>createdBy</code>
          </p>
          <pre
            className="system-block"
            style={{ marginTop: "0.5rem", maxHeight: "14rem", overflow: "auto" }}
            data-testid="stamm-payment-terms-json"
          >
            {JSON.stringify(paymentTerms, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
