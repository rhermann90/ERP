import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LvAufmassHubPage } from "./LvAufmassHubPage.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";

describe("LvAufmassHubPage", () => {
  it("shows login hint for difference panel without session", () => {
    render(<LvAufmassHubPage api={null} hasSession={false} tenantId={SEED.tenantId} />);
    expect(screen.getByTestId("hub-lv-diff-login-hint")).toBeTruthy();
  });

  it("shows PT-diff login hint without session", () => {
    render(<LvAufmassHubPage api={null} hasSession={false} tenantId={SEED.tenantId} />);
    expect(screen.getByTestId("hub-lv-pt-diff-login-hint")).toBeTruthy();
  });

  it("loads difference bookings for seed project", async () => {
    const listProjectDifferenceBookings = vi.fn().mockResolvedValue({
      data: [
        {
          id: "d1",
          projectId: SEED.projectId,
          measurementId: "m1",
          predecessorMeasurementVersionId: "a1",
          subsequentMeasurementVersionId: "b1",
          predecessorPaymentTermsVersionId: null,
          subsequentPaymentTermsVersionId: null,
          kind: "MEASUREMENT_CORRECTION_AFTER_INVOICE",
          amountNetCents: 100,
          status: "OPEN",
          referenceInvoiceId: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          createdBy: "u1",
        },
      ],
    });
    const api = { listProjectDifferenceBookings } as never;
    render(<LvAufmassHubPage api={api} hasSession={true} tenantId={SEED.tenantId} />);
    fireEvent.click(screen.getByTestId("hub-lv-diff-load"));
    await waitFor(() => expect(listProjectDifferenceBookings).toHaveBeenCalledWith(SEED.projectId));
    expect(screen.getByTestId("hub-lv-diff-table")).toBeTruthy();
  });

  it("loads difference bookings summary for seed project", async () => {
    const getProjectDifferenceBookingsSummary = vi.fn().mockResolvedValue({
      open: [
        {
          id: "o1",
          projectId: SEED.projectId,
          measurementId: "m1",
          predecessorMeasurementVersionId: null,
          subsequentMeasurementVersionId: null,
          predecessorPaymentTermsVersionId: null,
          subsequentPaymentTermsVersionId: null,
          kind: "MEASUREMENT_CORRECTION_AFTER_INVOICE",
          amountNetCents: 50,
          status: "OPEN",
          referenceInvoiceId: undefined,
          createdAt: "2026-01-01T00:00:00.000Z",
          createdBy: "u1",
        },
      ],
      allocatedByDraft: [],
    });
    const api = { getProjectDifferenceBookingsSummary } as never;
    render(<LvAufmassHubPage api={api} hasSession={true} tenantId={SEED.tenantId} />);
    fireEvent.click(screen.getByTestId("hub-lv-diff-summary-load"));
    await waitFor(() => expect(getProjectDifferenceBookingsSummary).toHaveBeenCalledWith(SEED.projectId));
    expect(screen.getByTestId("hub-lv-diff-summary-block")).toBeTruthy();
    expect(screen.getByTestId("hub-lv-diff-summary-open-table")).toBeTruthy();
  });
});
