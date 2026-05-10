import { useEffect, useMemo, useState } from "react";
import type { ApiClient, InvoiceOverview, PaymentTermsVersionRow } from "../../lib/api-client.js";
import { repoDocHref } from "../../lib/repo-doc-links.js";
import { FinancePrepNotice } from "./FinancePrepNotice.js";
import type { FinNotice } from "./finance-prep-types.js";
import { finNoticeFromUnknown } from "./finance-prep-helpers.js";

/** Gebuchte Status — Referenz für `POST …/difference-bookings/from-payment-terms` (Slice 2b). */
export const BOOKED_INVOICE_STATUSES_PT_DIFF = new Set<string>([
  "GEBUCHT_VERSENDET",
  "TEILBEZAHLT",
  "BEZAHLT",
]);

function sortPaymentTermsVersions(v: PaymentTermsVersionRow[]): PaymentTermsVersionRow[] {
  return [...v].sort((a, b) => a.versionNumber - b.versionNumber);
}

export type PaymentTermsDifferenceTestNs = "finance" | "shell" | "hub";

const TEST_IDS: Record<
  PaymentTermsDifferenceTestNs,
  {
    panel: string;
    pred: string;
    sub: string;
    amount: string;
    reason: string;
    submit: string;
  }
> = {
  finance: {
    panel: "finance-payment-terms-diff-panel",
    pred: "finance-pt-diff-predecessor-select",
    sub: "finance-pt-diff-subsequent-select",
    amount: "finance-pt-diff-amount-cents",
    reason: "finance-pt-diff-reason",
    submit: "finance-pt-diff-submit",
  },
  shell: {
    panel: "shell-payment-terms-diff-panel",
    pred: "shell-pt-diff-predecessor-select",
    sub: "shell-pt-diff-subsequent-select",
    amount: "shell-pt-diff-amount-cents",
    reason: "shell-pt-diff-reason",
    submit: "shell-pt-diff-submit",
  },
  hub: {
    panel: "hub-payment-terms-diff-panel",
    pred: "hub-pt-diff-predecessor-select",
    sub: "hub-pt-diff-subsequent-select",
    amount: "hub-pt-diff-amount-cents",
    reason: "hub-pt-diff-reason",
    submit: "hub-pt-diff-submit",
  },
};

export type PaymentTermsDifferenceBookingPanelProps = {
  api: ApiClient;
  invoiceOverview: InvoiceOverview;
  parentBusy: boolean;
  onSuccess: () => void | Promise<void>;
  /** Standard `finance` — bestehende Tests/E2E in Finanz-Vorbereitung */
  testIdNs?: PaymentTermsDifferenceTestNs;
};

/** Slice 2b: Konditions-Differenz bei gebuchter Referenz-Rechnung (gleiche Logik wie Finanz-Vorbereitung Schritt 3). */
export function PaymentTermsDifferenceBookingPanel({
  api,
  invoiceOverview,
  parentBusy,
  onSuccess,
  testIdNs = "finance",
}: PaymentTermsDifferenceBookingPanelProps) {
  const tid = TEST_IDS[testIdNs];
  const booked = BOOKED_INVOICE_STATUSES_PT_DIFF.has(invoiceOverview.status);

  const [versions, setVersions] = useState<PaymentTermsVersionRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<FinNotice | null>(null);
  const [predId, setPredId] = useState("");
  const [subId, setSubId] = useState("");
  const [amountCents, setAmountCents] = useState("");
  const [reason, setReason] = useState("Konditions-Differenz nach gebuchter Rechnung");
  const [submitErr, setSubmitErr] = useState<FinNotice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPredId("");
    setSubId("");
    setAmountCents("");
    setSubmitErr(null);
  }, [invoiceOverview.invoiceId]);

  useEffect(() => {
    if (!booked) {
      setVersions(null);
      setLoadErr(null);
      return;
    }
    let cancelled = false;
    setLoadErr(null);
    (async () => {
      try {
        const res = await api.getPaymentTermsByProject(invoiceOverview.projectId.trim());
        if (cancelled) return;
        const raw = res?.versions;
        setVersions(sortPaymentTermsVersions(Array.isArray(raw) ? raw : []));
      } catch (e) {
        if (!cancelled) {
          setVersions(null);
          setLoadErr(finNoticeFromUnknown(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, booked, invoiceOverview.invoiceId, invoiceOverview.projectId]);

  useEffect(() => {
    if (!versions?.length) return;
    const invPt = invoiceOverview.paymentTermsVersionId?.trim();
    if (invPt && versions.some((x) => x.paymentTermsVersionId === invPt)) {
      setPredId(invPt);
    }
  }, [versions, invoiceOverview.paymentTermsVersionId]);

  const predMeta = useMemo(() => versions?.find((v) => v.paymentTermsVersionId === predId), [versions, predId]);

  const subsequentChoices = useMemo(() => {
    if (!versions?.length || !predMeta) return [];
    return versions.filter((v) => v.versionNumber > predMeta.versionNumber);
  }, [versions, predMeta]);

  useEffect(() => {
    if (!subsequentChoices.length) {
      setSubId("");
      return;
    }
    setSubId((prev) =>
      subsequentChoices.some((v) => v.paymentTermsVersionId === prev)
        ? prev
        : subsequentChoices[0].paymentTermsVersionId,
    );
  }, [subsequentChoices, predId]);

  const submit = async () => {
    setSubmitErr(null);
    const amount = Number.parseInt(amountCents.trim(), 10);
    if (!Number.isFinite(amount)) {
      setSubmitErr({ kind: "text", text: "Netto-Differenz (Cent): ganze Zahl erforderlich." });
      return;
    }
    const r = reason.trim();
    if (r.length < 5) {
      setSubmitErr({ kind: "text", text: "Grund: mindestens 5 Zeichen (Backend)." });
      return;
    }
    if (!predId.trim() || !subId.trim()) {
      setSubmitErr({ kind: "text", text: "Vorgänger- und Nachfolge-Konditionsversion wählen." });
      return;
    }
    setSubmitting(true);
    try {
      await api.createPaymentTermsDifferenceBooking(invoiceOverview.projectId.trim(), {
        measurementId: invoiceOverview.measurementId.trim(),
        referenceInvoiceId: invoiceOverview.invoiceId.trim(),
        predecessorPaymentTermsVersionId: predId.trim(),
        subsequentPaymentTermsVersionId: subId.trim(),
        amountNetCents: amount,
        reason: r,
      });
      await onSuccess();
    } catch (e) {
      setSubmitErr(finNoticeFromUnknown(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!booked) return null;

  const disabled = parentBusy || submitting;
  const missingInvoicePt = !invoiceOverview.paymentTermsVersionId?.trim();

  return (
    <div
      style={{
        marginTop: "0.75rem",
        paddingTop: "0.65rem",
        borderTop: "1px dashed color-mix(in srgb, var(--border) 80%, transparent)",
      }}
      data-testid={tid.panel}
    >
      <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.35rem" }}>Konditions-Differenzbuchung (Slice 2b)</h4>
      <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
        <code>POST /projects/&#123;projectId&#125;/difference-bookings/from-payment-terms</code> — nur bei{" "}
        <strong>gebuchter</strong> Referenz-Rechnung; Vorgänger-Kondition muss der gebundenen Version auf dem Beleg entsprechen.
        Siehe{" "}
        <a href={repoDocHref("docs/adr/0023-dom86-slice2b-payment-terms-schluss-mitigation.md")}>ADR-0023</a>.
      </p>
      {missingInvoicePt ? (
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0 0 0.35rem" }}>
          Hinweis: Im Rechnungs-Snapshot fehlt <code>paymentTermsVersionId</code> — Vorgänger-Version manuell wählen (muss mit
          Server-Bindung der Referenz-Rechnung übereinstimmen).
        </p>
      ) : null}
      <FinancePrepNotice notice={loadErr} structuredAnnouncementRole="status" />
      {versions === null && !loadErr ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0" }} role="status">
          Zahlungsbedingungen werden geladen …
        </p>
      ) : null}
      {versions && versions.length === 0 ? (
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "0.35rem 0" }}>
          Keine Konditionsversionen für dieses Projekt — zuerst FIN-1 (Schritt 1) anlegen.
        </p>
      ) : null}
      {versions && versions.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "28rem" }}>
          <label style={{ display: "block" }}>
            Vorgänger-Kondition
            <select
              data-testid={tid.pred}
              value={predId}
              onChange={(e) => setPredId(e.target.value)}
              disabled={disabled}
              style={{ width: "100%", marginTop: "0.25rem", fontSize: "0.85rem", padding: "0.35rem 0.5rem" }}
            >
              <option value="">— wählen —</option>
              {versions.map((v) => (
                <option key={v.paymentTermsVersionId} value={v.paymentTermsVersionId}>
                  v{v.versionNumber} · {v.termsLabel}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "block" }}>
            Nachfolge-Kondition (höhere Versionsnummer)
            <select
              data-testid={tid.sub}
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              disabled={disabled || subsequentChoices.length === 0}
              style={{ width: "100%", marginTop: "0.25rem", fontSize: "0.85rem", padding: "0.35rem 0.5rem" }}
            >
              {subsequentChoices.length === 0 ? (
                <option value="">— keine neuere Version —</option>
              ) : (
                subsequentChoices.map((v) => (
                  <option key={v.paymentTermsVersionId} value={v.paymentTermsVersionId}>
                    v{v.versionNumber} · {v.termsLabel}
                  </option>
                ))
              )}
            </select>
          </label>
          <label style={{ display: "block" }}>
            Netto-Differenz (Cent, API-first)
            <input
              type="text"
              inputMode="numeric"
              data-testid={tid.amount}
              value={amountCents}
              onChange={(e) => setAmountCents(e.target.value)}
              disabled={disabled}
              aria-label="Netto-Differenz in Cent"
              style={{ width: "100%", fontFamily: "monospace", fontSize: "0.85rem", marginTop: "0.25rem" }}
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
          <button
            type="button"
            data-testid={tid.submit}
            disabled={disabled || !predId || !subId || subsequentChoices.length === 0}
            onClick={() => void submit()}
          >
            Konditions-Differenzbuchung anlegen
          </button>
          <FinancePrepNotice notice={submitErr} structuredAnnouncementRole="status" />
        </div>
      ) : null}
    </div>
  );
}
