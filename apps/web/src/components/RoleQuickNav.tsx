import { quickPresetsForRole, type QuickPreset } from "../lib/role-quick-actions.js";
import type { ApiUserRole } from "../lib/token-payload.js";
import { repoDocHref } from "../lib/repo-doc-links.js";
import { v13DomainRolesForApiRole } from "../lib/v13-domain-role-mapping.js";

type Props = {
  effectiveRole: ApiUserRole;
  hasSession: boolean;
  busy: boolean;
  onSelect: (preset: QuickPreset) => void | Promise<void>;
};

const ROLE_LABEL: Record<ApiUserRole, string> = {
  ADMIN: "Admin",
  BUCHHALTUNG: "Buchhaltung",
  GESCHAEFTSFUEHRUNG: "Geschäftsführung",
  VERTRIEB_BAULEITUNG: "Vertrieb / Bauleitung",
  VIEWER: "Viewer (nur Lesen)",
};

export function RoleQuickNav({ effectiveRole, hasSession, busy, onSelect }: Props) {
  const presets = quickPresetsForRole(effectiveRole);
  const v13Hint = v13DomainRolesForApiRole(effectiveRole).join(" · ");
  const mappingHref = repoDocHref("docs/contracts/ui-role-mapping-v1-3.md");
  return (
    <section className="panel quick-role-panel" aria-labelledby="quick-role-heading">
      <h2 id="quick-role-heading">Schnellzugriff (≤3 Klicks bis Aktionen)</h2>
      <p className="shell-sub" style={{ marginTop: 0 }}>
        API-Rolle <strong>{ROLE_LABEL[effectiveRole]}</strong> — v1.3-Bezug (§11.1): <span>{v13Hint}</span>.{" "}
        {mappingHref ? (
          <a href={mappingHref} target="_blank" rel="noopener noreferrer">
            Tabelle im Repo
          </a>
        ) : (
          <span>
            Mapping: <code>docs/contracts/ui-role-mapping-v1-3.md</code>
          </span>
        )}
        . {!hasSession ? "Ohne Token: Demo-Priorität wie Viewer — nach Anmeldung passt sich die Reihenfolge an." : null}
      </p>
      <div className="quick-role-grid">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className="quick-role-tile"
            disabled={busy}
            onClick={() => void onSelect(p)}
          >
            <span className="quick-role-tile-title">{p.label}</span>
            <span className="quick-role-tile-sub">{p.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
