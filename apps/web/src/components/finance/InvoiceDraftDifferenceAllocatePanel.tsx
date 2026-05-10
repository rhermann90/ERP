import { useEffect, useState } from "react";
import type { ApiClient } from "../../lib/api-client.js";
import { FinancePrepNotice } from "./FinancePrepNotice.js";
import type { FinNotice } from "./finance-prep-types.js";
import { finNoticeFromUnknown } from "./finance-prep-helpers.js";

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function parseDifferenceBookingIds(raw: string): string[] | null {
  const parts = raw
    .split(/[\s,;]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
  const ids = [...new Set(parts)];
  if (ids.length === 0) return null;
  for (const id of ids) {
    if (!UUID_RX.test(id)) return null;
  }
  return ids;
}

export type InvoiceDraftDifferenceAllocateTestNs = "shell" | "hub" | "finance";

const TID: Record<
  InvoiceDraftDifferenceAllocateTestNs,
  { wrap: string; ids: string; reason: string; alloc: string; dealloc: string }
> = {
  shell: {
    wrap: "shell-invoice-draft-diff-allocate-panel",
    ids: "shell-invoice-draft-diff-allocate-ids",
    reason: "shell-invoice-draft-diff-allocate-reason",
    alloc: "shell-invoice-draft-diff-allocate-submit",
    dealloc: "shell-invoice-draft-diff-deallocate-submit",
  },
  hub: {
    wrap: "hub-invoice-draft-diff-allocate-panel",
    ids: "hub-invoice-draft-diff-allocate-ids",
    reason: "hub-invoice-draft-diff-allocate-reason",
    alloc: "hub-invoice-draft-diff-allocate-submit",
    dealloc: "hub-invoice-draft-diff-deallocate-submit",
  },
  finance: {
    wrap: "finance-prep-invoice-draft-diff-allocate-panel",
    ids: "finance-prep-invoice-draft-diff-allocate-ids",
    reason: "finance-prep-invoice-draft-diff-allocate-reason",
    alloc: "finance-prep-invoice-draft-diff-allocate-submit",
    dealloc: "finance-prep-invoice-draft-diff-deallocate-submit",
  },
};

export type InvoiceDraftDifferenceAllocatePanelProps = {
  api: ApiClient;
  invoiceId: string;
  parentBusy: boolean;
  onSuccess: () => void | Promise<void>;
  testIdNs: InvoiceDraftDifferenceAllocateTestNs;
  /** Erhöhen, um `injectIdsText` in das ID-Feld zu übernehmen (z. B. offene Projektzeilen). */
  injectIdsRevision?: number;
  injectIdsText?: string;
};

/**
 * Zuordnung / Entzug von Differenzzeilen zu einem Rechnungsentwurf — gleiche API wie Shell-Lesepfad (ADR-0022).
 * Nur bei Status ENTWURF sinnvoll; Aufrufer blendet bei anderen Status aus.
 */
export function InvoiceDraftDifferenceAllocatePanel({
  api,
  invoiceId,
  parentBusy,
  onSuccess,
  testIdNs,
  injectIdsRevision = 0,
  injectIdsText = "",
}: InvoiceDraftDifferenceAllocatePanelProps) {
  const tid = TID[testIdNs];
  const [idsText, setIdsText] = useState("");
  const [reason, setReason] = useState("Zuordnung Differenzbuchungen zum Rechnungsentwurf (expliziter API-Pfad)");
  const [notice, setNotice] = useState<FinNotice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (injectIdsRevision > 0 && injectIdsText.trim().length > 0) {
      setIdsText(injectIdsText);
    }
  }, [injectIdsRevision, injectIdsText]);

  const run = async (mode: "allocate" | "deallocate") => {
    setNotice(null);
    const ids = parseDifferenceBookingIds(idsText);
    if (!ids) {
      setNotice({
        kind: "text",
        text: "Mindestens eine gültige Differenzbuchungs-UUID (Komma-, Leerzeichen- oder Semikolon-getrennt).",
      });
      return;
    }
    const r = reason.trim();
    if (r.length < 5) {
      setNotice({ kind: "text", text: "Grund: mindestens 5 Zeichen (Backend)." });
      return;
    }
    const id = invoiceId.trim();
    if (!id) {
      setNotice({ kind: "text", text: "Rechnungs-ID fehlt." });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "allocate") {
        await api.allocateDifferenceBookingsToInvoiceDraft(id, { differenceBookingIds: ids, reason: r });
      } else {
        await api.deallocateDifferenceBookingsFromInvoiceDraft(id, { differenceBookingIds: ids, reason: r });
      }
      await onSuccess();
    } catch (e) {
      setNotice(finNoticeFromUnknown(e));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = parentBusy || submitting;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        paddingTop: "0.65rem",
        borderTop: "1px dashed color-mix(in srgb, var(--border) 80%, transparent)",
      }}
      data-testid={tid.wrap}
    >
      <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Differenzzeilen zum Entwurf zuordnen / entfernen</h4>
      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
        Nur bei <strong>ENTWURF</strong>.{" "}
        <code>POST /invoices/&#123;invoiceId&#125;/difference-bookings/allocate</code> bzw.{" "}
        <code>…/deallocate</code> — IDs aus Projekt-Lesepfad oder Bezugsrechnung übernehmen (keine Client-Berechnung).
        Bei mehreren Entwürfen zum selben Aufmass gibt es keine automatische Priorität (§8.6(b), ADR-0022).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "32rem" }}>
        <label style={{ display: "block" }}>
          Differenzbuchungs-IDs (eine oder mehrere UUIDs)
          <textarea
            data-testid={tid.ids}
            value={idsText}
            onChange={(e) => setIdsText(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="uuid1, uuid2"
            style={{ width: "100%", fontFamily: "monospace", fontSize: "0.82rem", marginTop: "0.25rem" }}
          />
        </label>
        <label style={{ display: "block" }}>
          Grund (reason, min. 5 Zeichen)
          <textarea
            data-testid={tid.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={disabled}
            rows={2}
            style={{ width: "100%", fontSize: "0.85rem", marginTop: "0.25rem" }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button type="button" data-testid={tid.alloc} disabled={disabled} onClick={() => void run("allocate")}>
            Zuordnen (allocate)
          </button>
          <button type="button" data-testid={tid.dealloc} disabled={disabled} onClick={() => void run("deallocate")}>
            Zuordnung aufheben (deallocate)
          </button>
        </div>
        <FinancePrepNotice notice={notice} structuredAnnouncementRole="status" />
      </div>
    </div>
  );
}
