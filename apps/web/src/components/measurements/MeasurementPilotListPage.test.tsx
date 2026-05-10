import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeasurementPilotListPage } from "./MeasurementPilotListPage.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";

describe("MeasurementPilotListPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("zeigt Nachvollziehbarkeits-Karte und LV-Spalten nach Detail-Laden", async () => {
    const detail = {
      measurementId: SEED.measurementId,
      projectId: SEED.projectId,
      customerId: SEED.customerId,
      lvVersionId: SEED.lvVersionId,
      measurementCreatedAt: "2026-01-15T12:00:00.000Z",
      version: {
        id: SEED.measurementVersionId,
        tenantId: SEED.tenantId,
        measurementId: SEED.measurementId,
        versionNumber: 1,
        status: "ENTWURF",
        createdAt: "2026-01-01T00:00:00.000Z",
        createdBy: "u1",
      },
      positions: [
        {
          id: "pos-row-1",
          tenantId: SEED.tenantId,
          measurementVersionId: SEED.measurementVersionId,
          lvPositionId: SEED.lvPositionId,
          quantity: 12,
          unit: "m2",
          note: "Pilot",
        },
      ],
    };
    const getMeasurementVersion = vi.fn().mockResolvedValue(detail);
    const getLvVersionSnapshot = vi.fn().mockResolvedValue({
      catalog: null,
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
      positions: [
        {
          id: SEED.lvPositionId,
          tenantId: SEED.tenantId,
          lvVersionId: SEED.lvVersionId,
          parentNodeId: SEED.lvBereichId,
          sortOrdinal: "01.02",
          quantity: 1,
          unit: "m2",
          unitPriceCents: 100,
          kind: "NORMAL",
          systemText: "Sys LV Pos",
          editingText: "Bearb LV Pos",
        },
      ],
    });
    const api = {
      getMeasurementVersion,
      getLvVersionSnapshot,
      listProjectMeasurements: vi.fn(),
    } as never;

    render(<MeasurementPilotListPage api={api} tenantId={SEED.tenantId} />);
    fireEvent.click(screen.getByTestId("meas-pilot-load"));

    await waitFor(() => expect(getMeasurementVersion).toHaveBeenCalledWith(SEED.measurementVersionId));
    await waitFor(() => expect(getLvVersionSnapshot).toHaveBeenCalledWith(SEED.lvVersionId));

    expect(screen.getByTestId("meas-pilot-trace-card")).toBeTruthy();
    expect(screen.getByTestId("meas-pilot-trace-dl").textContent).toContain(SEED.projectId);
    expect(screen.getByTestId("meas-pilot-measurement-created-at").textContent).toMatch(/\d{1,2}\./);

    const table = screen.getByTestId("meas-pilot-positions").querySelector("table");
    expect(table?.textContent).toContain("01.02");
    expect(table?.textContent).toContain("Bearb LV Pos");
  });
});
