import { useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import { LvEntityTextSotPanel } from "./LvEntityTextSotPanel.js";
import { LvVersionSotPanel } from "./LvVersionSotPanel.js";
import { LvWorkbench } from "./LvWorkbench.js";

/** LV Abschnitt 9 Produkt-Ansicht: Lesepfad + optional Sprung zu Dokument und Details für erlaubte LV_*-Aktionen (SoT). */
export function LvBearbeitenPage(props: {
  api: ApiClient;
  onOpenShellForLvActions: (lvVersionId: string) => void | Promise<void>;
  showIntegrationHints?: boolean;
}) {
  const { showIntegrationHints = false } = props;
  const [lvVersionId, setLvVersionId] = useState<string>(SEED.lvVersionId);
  const [workbenchTick, setWorkbenchTick] = useState(0);
  return (
    <div data-testid="lv-bearbeiten-page">
      <section className="panel lv-pilot-intro-panel">
        <h2>LV lesen (Pilot)</h2>
        {showIntegrationHints ? (
          <p className="hint">
            Hierarchie und Positionen unten lesen. Schreibaktionen nur im Dokument-Arbeitsbereich nach{" "}
            <code>GET /documents/…/allowed-actions</code> (entityType LV_VERSION); keine parallele Berechtigungslogik in der PWA.
          </p>
        ) : (
          <p className="shell-sub">
            Leistungsverzeichnis (Abschnitt 9) lesen; Änderungen erfolgen über{" "}
            <strong>Dokument und Details</strong>, gestützt auf die erlaubten Aktionen vom Server.
          </p>
        )}
        <label className="field">
          <span>LV-Version-ID</span>
          <input
            type="text"
            value={lvVersionId}
            onChange={(e) => setLvVersionId(e.target.value)}
            data-testid="lv-bearbeiten-version-input"
          />
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void props.onOpenShellForLvActions(lvVersionId.trim())}
          data-testid="lv-bearbeiten-open-document-workspace"
        >
          Zu Dokument und Details
        </button>
      </section>
      <LvVersionSotPanel
        api={props.api}
        lvVersionId={lvVersionId}
        allowExecution={showIntegrationHints}
        onAfterMutation={() => setWorkbenchTick((t) => t + 1)}
      />
      <LvEntityTextSotPanel api={props.api} showIntegrationHints={showIntegrationHints} />
      <LvWorkbench
        key={workbenchTick}
        api={props.api}
        lvVersionId={lvVersionId}
        showIntegrationHints={showIntegrationHints}
      />
    </div>
  );
}
