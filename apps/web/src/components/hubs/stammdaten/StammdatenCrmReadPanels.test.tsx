import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/api-error.js";
import { DEMO_SEED_IDS as SEED } from "../../../lib/demo-seed-ids.js";
import { StammdatenCrmReadPanels } from "./StammdatenCrmReadPanels.js";

function apiError(code: string, message: string, status: number): ApiError {
  return new ApiError(status, {
    code,
    message,
    correlationId: "test-correlation",
    retryable: false,
    blocking: true,
  });
}

describe("StammdatenCrmReadPanels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("zeigt Memory-Hinweis wenn CRM_PERSISTENCE_UNAVAILABLE (503)", async () => {
    const listCrmConstructionSites = vi.fn().mockRejectedValue(apiError("CRM_PERSISTENCE_UNAVAILABLE", "nur Postgres", 503));
    const listCrmCustomers = vi.fn().mockResolvedValue({ data: [] });
    const listCrmProjects = vi.fn().mockResolvedValue({ data: [] });
    const api = { listCrmConstructionSites, listCrmCustomers, listCrmProjects };

    render(<StammdatenCrmReadPanels api={api as never} hasSession />);

    await waitFor(() => expect(listCrmConstructionSites).toHaveBeenCalled());
    expect(screen.getByTestId("stamm-crm-memory-hint")).toBeTruthy();
    expect(screen.getByTestId("stamm-crm-memory-hint").textContent).toMatch(/ohne Postgres/);
    expect(screen.getByTestId("stamm-crm-panels")).toBeTruthy();
  });

  it("mappt CRM_STALE_VERSION auf nutzerfreundliche Speichern-Meldung", async () => {
    const site = {
      id: SEED.crmConstructionSiteId,
      tenantId: SEED.tenantId,
      label: "Demo-Baustelle",
      versionNumber: 1,
      street: null,
      postalCode: "10115",
      city: "Berlin",
      countryCode: "DE",
      createdAt: "2026-01-01T00:00:00.000Z",
      createdBy: "00000000-0000-4000-8000-000000000001",
    };
    const listCrmConstructionSites = vi.fn().mockResolvedValue({ data: [site] });
    const listCrmCustomers = vi.fn().mockResolvedValue({ data: [] });
    const listCrmProjects = vi.fn().mockResolvedValue({
      data: [
        {
          id: SEED.projectId,
          tenantId: SEED.tenantId,
          primaryCustomerId: SEED.customerId,
          constructionSiteId: SEED.crmConstructionSiteId,
          status: "AKTIV",
          versionNumber: 1,
          label: "Pilot",
          createdAt: "2026-01-01T00:00:00.000Z",
          createdBy: "00000000-0000-4000-8000-000000000001",
        },
      ],
    });
    const listCrmProjectContacts = vi.fn().mockResolvedValue({ data: [] });
    const patchCrmConstructionSite = vi.fn().mockRejectedValue(
      apiError("CRM_STALE_VERSION", "Konflikt", 409),
    );

    const api = {
      listCrmConstructionSites,
      listCrmCustomers,
      listCrmProjects,
      listCrmProjectContacts,
      patchCrmConstructionSite,
    };

    render(<StammdatenCrmReadPanels api={api as never} hasSession canWriteCrmStammdaten />);

    await waitFor(() => expect(screen.getByTestId("stamm-crm-panels")).toBeTruthy());

    const sitesTable = screen.getByTestId("stamm-crm-sites-table");
    fireEvent.click(within(sitesTable).getByRole("button", { name: "Bearbeiten" }));

    await waitFor(() => expect(screen.getByTestId("stamm-crm-edit-site")).toBeTruthy());

    fireEvent.click(within(screen.getByTestId("stamm-crm-edit-site")).getByRole("button", { name: "Speichern" }));

    await waitFor(() => expect(patchCrmConstructionSite).toHaveBeenCalled());
    await waitFor(() => {
      const msg = screen.getByTestId("stamm-crm-patch-message");
      expect(msg.textContent).toMatch(/zwischenzeitlich geändert/);
    });
  });
});
