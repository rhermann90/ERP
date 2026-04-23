export function FinanceCollapsibleJson(props: { summary: string; json: string; defaultOpen?: boolean }) {
  if (!props.json.trim()) return null;
  return (
    <details style={{ marginTop: "0.5rem" }} open={props.defaultOpen === true}>
      <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{props.summary}</summary>
      <pre style={{ fontSize: "0.72rem", overflow: "auto", maxHeight: "12rem", marginTop: "0.35rem" }}>{props.json}</pre>
    </details>
  );
}
