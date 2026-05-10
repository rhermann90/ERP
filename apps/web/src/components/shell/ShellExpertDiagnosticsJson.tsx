import type { ReactNode } from "react";

/** Haupt-Shell-Roh-JSON: in Produktion ohne Expertenmodus hinter Summary (E2E nutzt Vite-Dev → immer aufgeklappt). */
export function ShellExpertDiagnosticsJson(props: { showOpen: boolean; testId?: string; children: ReactNode }) {
  const pre = (
    <pre
      className="system-block"
      style={{ margin: 0 }}
      {...(props.testId ? ({ "data-testid": props.testId } as const) : {})}
    >
      {props.children}
    </pre>
  );
  if (props.showOpen) return pre;
  return (
    <details style={{ marginTop: "0.25rem" }}>
      <summary style={{ cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        Rohdaten anzeigen (Expertenmodus aus — Mandanten-Schalter unter „Sitzung &amp; API“,{" "}
        <code>VITE_PWA_EXPERT_UI=1</code> oder Vite-Dev)
      </summary>
      {pre}
    </details>
  );
}
