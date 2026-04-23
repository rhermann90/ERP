import type { CSSProperties, ReactNode } from "react";

const panelStyle: CSSProperties = {
  marginTop: "1rem",
  padding: "0.75rem 0.85rem",
  borderRadius: "8px",
  border: "1px solid color-mix(in srgb, var(--border) 85%, transparent)",
  maxWidth: "min(42rem, 100%)",
};

export function FinancePrepPanel(props: {
  title: string;
  step?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section style={panelStyle} aria-labelledby={props.step != null ? `fin-step-${props.step}-h` : undefined}>
      <h3 id={props.step != null ? `fin-step-${props.step}-h` : undefined} style={{ fontSize: "1rem", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {props.step != null ? (
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.5rem",
              height: "1.5rem",
              borderRadius: "999px",
              fontSize: "0.82rem",
              fontWeight: 700,
              background: "var(--accent-muted)",
              color: "var(--text)",
            }}
          >
            {props.step}
          </span>
        ) : null}
        <span>{props.title}</span>
      </h3>
      {props.children}
      {props.footer ? <div style={{ marginTop: "0.65rem" }}>{props.footer}</div> : null}
    </section>
  );
}
