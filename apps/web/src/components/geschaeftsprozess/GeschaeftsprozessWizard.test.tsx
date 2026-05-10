import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GeschaeftsprozessWizard } from "./GeschaeftsprozessWizard.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";
import { DOCUMENT_WORKSPACE_HASH, measurementPilotListHashWithVersionId } from "../../lib/hash-route.js";
import type { ApiClient, LvVersionSnapshot } from "../../lib/api-client.js";

const snap: LvVersionSnapshot = {
  catalog: { id: "c1", name: "Kat", currentVersionId: SEED.lvVersionId, isCurrentVersion: true },
  version: {
    id: SEED.lvVersionId,
    tenantId: SEED.tenantId,
    lvCatalogId: SEED.lvCatalogId,
    versionNumber: 1,
    status: "ENTWURF",
    headerSystemText: "H",
    headerEditingText: "He",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
  },
  structureNodes: [],
  positions: [],
};

describe("GeschaeftsprozessWizard", () => {
  it("shows traceability links to offer workspace and shell after offer step", async () => {
    const getLvVersionSnapshot = vi.fn().mockResolvedValue(snap);
    const createOffer = vi.fn().mockResolvedValue({ offerVersionId: SEED.offerVersionId });
    const createInvoiceDraft = vi.fn();
    const api = { getLvVersionSnapshot, createOffer, createInvoiceDraft } as unknown as ApiClient;

    render(<GeschaeftsprozessWizard api={api} showIntegrationHints={false} />);
    await waitFor(() => expect(getLvVersionSnapshot).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Weiter zu Aufmass/ }));
    fireEvent.click(screen.getByTestId("geschaeftsprozess-step-measurement-next"));
    fireEvent.click(screen.getByTestId("geschaeftsprozess-create-offer"));
    await waitFor(() => expect(createOffer).toHaveBeenCalled());

    const shell = screen.getByTestId("geschaeftsprozess-trace-offer-shell");
    expect(shell.getAttribute("href")).toContain(DOCUMENT_WORKSPACE_HASH);
    expect(shell.getAttribute("href")).toContain(encodeURIComponent(SEED.offerVersionId));
    expect(shell.getAttribute("href")).toContain("OFFER_VERSION");
    expect(screen.getByTestId("geschaeftsprozess-trace-links").textContent).toContain(SEED.supplementVersionId);
  });

  it("zeigt geführte Aufmass-Felder statt Roh-positionsJson ohne Expertenhinweise", async () => {
    const getLvVersionSnapshot = vi.fn().mockResolvedValue(snap);
    const getAllowedActions = vi.fn().mockResolvedValue({
      documentId: SEED.projectId,
      entityType: "PROJECT",
      allowedActions: ["MEASUREMENT_CREATE"],
    });
    const api = { getLvVersionSnapshot, getAllowedActions } as unknown as ApiClient;

    render(<GeschaeftsprozessWizard api={api} showIntegrationHints={false} />);
    await waitFor(() => expect(getLvVersionSnapshot).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Weiter zu Aufmass/ }));
    fireEvent.click(screen.getByTestId("geschaeftsprozess-project-sot-load"));
    await waitFor(() => expect(getAllowedActions).toHaveBeenCalled());

    expect(screen.queryByTestId("geschaeftsprozess-measurement-positions-json")).toBeNull();
    expect(screen.getByTestId("geschaeftsprozess-measurement-pilot-quantity")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByTestId("geschaeftsprozess-measurement-pilot-unit")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByTestId("geschaeftsprozess-measurement-pilot-note")).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("nach MEASUREMENT_CREATE: Shell- und Pilotlisten-Links mit Messungsversions-ID", async () => {
    const newMeasurementId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb099";
    const newVersionId = "cccccccc-cccc-4ccc-8ccc-cccccccc0999";
    const requestJson = vi.fn(async (method: string, path: string) => {
      if (method === "POST" && path === "/measurements") {
        return { measurementId: newMeasurementId, measurementVersionId: newVersionId };
      }
      throw new Error(`unexpected ${method} ${path}`);
    });
    const getLvVersionSnapshot = vi.fn().mockResolvedValue(snap);
    const getAllowedActions = vi.fn().mockResolvedValue({
      documentId: SEED.projectId,
      entityType: "PROJECT",
      allowedActions: ["MEASUREMENT_CREATE"],
    });
    const api = { getLvVersionSnapshot, getAllowedActions, requestJson } as unknown as ApiClient;

    render(<GeschaeftsprozessWizard api={api} showIntegrationHints={false} />);
    await waitFor(() => expect(getLvVersionSnapshot).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Weiter zu Aufmass/ }));
    fireEvent.click(screen.getByTestId("geschaeftsprozess-project-sot-load"));
    await waitFor(() => expect(getAllowedActions).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId("geschaeftsprozess-measurement-create"));
    await waitFor(() => expect(requestJson).toHaveBeenCalled());

    const shell = screen.getByTestId("geschaeftsprozess-measurement-trace-measurement-shell");
    expect(shell.getAttribute("href")).toContain(DOCUMENT_WORKSPACE_HASH);
    expect(shell.getAttribute("href")).toContain(encodeURIComponent(newVersionId));
    expect(shell.getAttribute("href")).toContain("MEASUREMENT_VERSION");

    const pilot = screen.getByTestId("geschaeftsprozess-measurement-trace-pilot-list");
    expect(pilot.getAttribute("href")).toBe(measurementPilotListHashWithVersionId(newVersionId));
  });
});
