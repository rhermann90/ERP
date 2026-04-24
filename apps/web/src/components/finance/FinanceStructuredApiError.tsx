import type { ApiErrorEnvelope } from "../../lib/api-error.js";

export function FinanceStructuredApiError({ envelope, status }: { envelope: ApiErrorEnvelope; status: number }) {
  return (
    <div
      role="alert"
      style={{
        marginTop: "0.75rem",
        padding: "0.65rem 0.75rem",
        borderRadius: "6px",
        border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
        background: "color-mix(in srgb, var(--danger) 8%, transparent)",
        fontSize: "0.85rem",
      }}
    >
      <strong>
        {status} · {envelope.code}
      </strong>
      <p style={{ margin: "0.35rem 0 0.5rem" }}>{envelope.message}</p>
      <dl
        style={{
          margin: 0,
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.2rem 0.75rem",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}
      >
        <dt>correlationId</dt>
        <dd style={{ margin: 0 }}>
          <code>{envelope.correlationId}</code>
        </dd>
        <dt>retryable</dt>
        <dd style={{ margin: 0 }}>{String(envelope.retryable)}</dd>
        <dt>blocking</dt>
        <dd style={{ margin: 0 }}>{String(envelope.blocking)}</dd>
      </dl>
    </div>
  );
}
