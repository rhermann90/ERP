import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as hashRoute from "../../lib/hash-route.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import { StammdatenHubPage } from "./StammdatenHubPage.js";

const CID = "11111111-1111-4111-8111-111111111111";

describe("StammdatenHubPage", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows login hint without session", () => {
    render(<StammdatenHubPage api={null} hasSession={false} />);
    expect(screen.getAllByText(/Bitte anmelden/).length).toBeGreaterThan(0);
  });

  it("loads customer list and opens detail when Anzeigen is clicked", async () => {
    const listCustomerEInvoiceParties = vi.fn().mockResolvedValue({
      customers: [
        {
          customerId: CID,
          legalName: "Test GmbH",
          streetName: "Weg 1",
          cityName: "Berlin",
          postalZone: "10115",
          countryCode: "DE",
        },
      ],
    });
    const getCustomerEInvoiceParty = vi.fn().mockResolvedValue({
      configured: true,
      customerId: CID,
      party: {
        legalName: "Test GmbH",
        streetName: "Weg 1",
        cityName: "Berlin",
        postalZone: "10115",
        countryCode: "DE",
      },
    });
    const getTenantEInvoiceParty = vi.fn().mockResolvedValue({
      configured: false,
      party: null,
    });

    const api = {
      listCustomerEInvoiceParties,
      getCustomerEInvoiceParty,
      getTenantEInvoiceParty,
      getPaymentTermsByProject: vi.fn(),
      listCrmConstructionSites: vi.fn().mockResolvedValue({ data: [] }),
      listCrmCustomers: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjects: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjectContacts: vi.fn().mockResolvedValue({ data: [] }),
      getCrmProject: vi.fn(),
    };

    const applySpy = vi.spyOn(hashRoute, "applyStammdatenCustomerIdToLocationHash");

    render(<StammdatenHubPage api={api as never} hasSession />);

    await waitFor(() => expect(listCustomerEInvoiceParties).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId(`stamm-customer-open-${CID}`));

    expect(applySpy).toHaveBeenCalledWith(CID);

    await waitFor(() => expect(getCustomerEInvoiceParty).toHaveBeenCalledWith(CID));
    await waitFor(() => expect(screen.getByTestId("stamm-customer-detail-panel")).toBeTruthy());
    expect(screen.getByTestId("stamm-customer-configured").textContent).toBe("ja");
  });

  it("renders structured payment terms without JSON when expert hints off", async () => {
    const paymentTerms = {
      paymentTermsHeadId: "22222222-2222-4222-8222-222222222222",
      projectId: "33333333-3333-4333-8333-333333333333",
      customerId: CID,
      createdAt: "2026-01-15T10:00:00.000Z",
      createdBy: "44444444-4444-4444-8444-444444444444",
      versions: [
        {
          paymentTermsVersionId: "55555555-5555-4555-8555-555555555555",
          versionNumber: 1,
          termsLabel: "14 Tage netto",
          createdAt: "2026-01-15T10:00:00.000Z",
          createdBy: "44444444-4444-4444-8444-444444444444",
        },
      ],
    };

    const api = {
      listCustomerEInvoiceParties: vi.fn().mockResolvedValue({ customers: [] }),
      getTenantEInvoiceParty: vi.fn().mockResolvedValue({ configured: false, party: null }),
      getPaymentTermsByProject: vi.fn().mockResolvedValue(paymentTerms),
      listCrmConstructionSites: vi.fn().mockResolvedValue({ data: [] }),
      listCrmCustomers: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjects: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjectContacts: vi.fn().mockResolvedValue({ data: [] }),
      getCrmProject: vi.fn(),
    };

    render(<StammdatenHubPage api={api as never} hasSession showIntegrationHints={false} />);

    await waitFor(() => expect(api.listCustomerEInvoiceParties).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Zahlungsbedingungen zum Pilot-Projekt laden/ }));

    await waitFor(() => expect(screen.getByTestId("stamm-payment-terms-structured")).toBeTruthy());
    expect(screen.getByTestId("stamm-payment-terms-versions-table")).toBeTruthy();
    expect(screen.queryByTestId("stamm-payment-terms-json")).toBeNull();
  });

  it("FIN-1 Kunden-Sprung ruft applyStammdatenCustomerIdToLocationHash auf", async () => {
    const customerId = "20202020-2020-4020-8020-202020202020";
    const paymentTerms = {
      paymentTermsHeadId: "22222222-2222-4222-8222-222222222222",
      projectId: "10101010-1010-4010-8010-101010101010",
      customerId,
      createdAt: "2026-01-15T10:00:00.000Z",
      createdBy: "44444444-4444-4444-8444-444444444444",
      versions: [
        {
          paymentTermsVersionId: "55555555-5555-4555-8555-555555555555",
          versionNumber: 1,
          termsLabel: "14 Tage netto",
          createdAt: "2026-01-15T10:00:00.000Z",
          createdBy: "44444444-4444-4444-8444-444444444444",
        },
      ],
    };

    const listCustomerEInvoiceParties = vi.fn().mockResolvedValue({
      customers: [
        {
          customerId,
          legalName: "Seed-Kunde GmbH",
          streetName: "Hauptstraße 1",
          cityName: "München",
          postalZone: "80331",
          countryCode: "DE",
        },
      ],
    });
    const getPaymentTermsByProject = vi.fn().mockResolvedValue(paymentTerms);
    const getCustomerEInvoiceParty = vi.fn().mockResolvedValue({
      configured: true,
      customerId,
      party: {
        legalName: "Seed-Kunde GmbH",
        streetName: "Hauptstraße 1",
        cityName: "München",
        postalZone: "80331",
        countryCode: "DE",
      },
    });

    const api = {
      listCustomerEInvoiceParties,
      getTenantEInvoiceParty: vi.fn().mockResolvedValue({ configured: false, party: null }),
      getPaymentTermsByProject,
      getCustomerEInvoiceParty,
      listCrmConstructionSites: vi.fn().mockResolvedValue({ data: [] }),
      listCrmCustomers: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjects: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjectContacts: vi.fn().mockResolvedValue({ data: [] }),
      getCrmProject: vi.fn(),
    };

    const applySpy = vi.spyOn(hashRoute, "applyStammdatenCustomerIdToLocationHash");

    render(<StammdatenHubPage api={api as never} hasSession showIntegrationHints={false} />);

    await waitFor(() => expect(listCustomerEInvoiceParties).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Zahlungsbedingungen zum Pilot-Projekt laden/ }));
    await waitFor(() => expect(screen.getByTestId("stamm-payment-terms-customer-jump")).toBeTruthy());

    fireEvent.click(screen.getByTestId("stamm-payment-terms-customer-jump"));

    expect(applySpy).toHaveBeenCalledWith(customerId);
    await waitFor(() => expect(getCustomerEInvoiceParty).toHaveBeenCalledWith(customerId));
    await waitFor(() => expect(screen.getByTestId("stamm-customer-detail-panel")).toBeTruthy());
  });

  it("lädt Mandanten-Verkäufer (XRechnung) beim Mount und bei Aktualisieren erneut", async () => {
    const getTenantEInvoiceParty = vi.fn().mockResolvedValue({
      configured: true,
      party: {
        legalName: "Mandant GmbH",
        streetName: "Werkstr. 2",
        cityName: "Hamburg",
        postalZone: "20095",
        countryCode: "DE",
      },
    });
    const api = {
      listCustomerEInvoiceParties: vi.fn().mockResolvedValue({ customers: [] }),
      getTenantEInvoiceParty,
      getPaymentTermsByProject: vi.fn(),
      listCrmConstructionSites: vi.fn().mockResolvedValue({ data: [] }),
      listCrmCustomers: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjects: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjectContacts: vi.fn().mockResolvedValue({ data: [] }),
      getCrmProject: vi.fn(),
    };

    render(<StammdatenHubPage api={api as never} hasSession />);

    await waitFor(() => expect(getTenantEInvoiceParty).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("stamm-tenant-seller-panel")).toBeTruthy());
    expect(screen.getByTestId("stamm-tenant-configured").textContent).toBe("ja");

    fireEvent.click(screen.getByTestId("stamm-tenant-seller-refresh"));
    await waitFor(() => expect(getTenantEInvoiceParty).toHaveBeenCalledTimes(2));
  });

  it("CRM Pilot-PATCH Panel bei Schreibrolle und Pilot-Projekt", async () => {
    const pilotRow = {
      tenantId: SEED.tenantId,
      id: SEED.projectId,
      primaryCustomerId: SEED.customerId,
      constructionSiteId: SEED.crmConstructionSiteId,
      status: "ACTIVE",
      versionNumber: 1,
      label: "Pilot",
      createdAt: "2026-01-01T00:00:00.000Z",
      createdBy: "44444444-4444-4444-8444-444444444444",
    };
    const patchCrmProject = vi.fn().mockResolvedValue({ ...pilotRow, label: "Neu" });
    const api = {
      listCustomerEInvoiceParties: vi.fn().mockResolvedValue({ customers: [] }),
      getTenantEInvoiceParty: vi.fn().mockResolvedValue({ configured: false, party: null }),
      getPaymentTermsByProject: vi.fn(),
      listCrmConstructionSites: vi.fn().mockResolvedValue({ data: [] }),
      listCrmCustomers: vi.fn().mockResolvedValue({ data: [] }),
      listCrmProjects: vi.fn().mockResolvedValue({ data: [pilotRow] }),
      listCrmProjectContacts: vi.fn().mockResolvedValue({ data: [] }),
      getCrmProject: vi.fn(),
      patchCrmProject,
    };

    render(<StammdatenHubPage api={api as never} hasSession canWriteCrmStammdaten />);

    await waitFor(() => expect(screen.getByTestId("stamm-crm-pilot-patch")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Neu" } });
    fireEvent.click(screen.getByTestId("stamm-crm-pilot-patch-submit"));
    await waitFor(() => expect(patchCrmProject).toHaveBeenCalled());
    expect(patchCrmProject).toHaveBeenCalledWith(SEED.projectId, { label: "Neu", reason: expect.any(String) });
  });
});
