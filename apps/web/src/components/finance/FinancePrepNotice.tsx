import { FinanceStructuredApiError } from "./FinanceStructuredApiError.js";
import type { FinNotice } from "./finance-prep-types.js";

export type FinancePrepNoticeProps = {
  notice: FinNotice | null;
  /** Im übergeordneten `aria-live`-Container `status` verwenden, um doppelte assertive Ansagen zu vermeiden. */
  structuredAnnouncementRole?: "alert" | "status";
};

export function FinancePrepNotice({ notice, structuredAnnouncementRole = "alert" }: FinancePrepNoticeProps) {
  if (!notice) return null;
  if (notice.kind === "api") {
    return (
      <div data-testid="finance-prep-notice">
        <FinanceStructuredApiError
          envelope={notice.error.envelope}
          status={notice.error.status}
          announcementRole={structuredAnnouncementRole}
        />
      </div>
    );
  }
  const textRole = structuredAnnouncementRole === "alert" ? "alert" : "status";
  return (
    <p
      data-testid="finance-prep-notice"
      role={textRole}
      style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.65rem" }}
    >
      {notice.text}
    </p>
  );
}
