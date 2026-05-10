import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LvWorkbench } from "./LvWorkbench.js";
import type { ApiClient, LvVersionSnapshot } from "../../lib/api-client.js";

const snap: LvVersionSnapshot = {
  catalog: { id: "c1", name: "Kat", currentVersionId: "v1", isCurrentVersion: true },
  version: {
    id: "v1",
    tenantId: "t1",
    lvCatalogId: "c1",
    versionNumber: 1,
    status: "ENTWURF",
    headerSystemText: "H",
    headerEditingText: "He",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: "u1",
  },
  structureNodes: [
    {
      id: "n1",
      tenantId: "t1",
      lvVersionId: "v1",
      parentNodeId: null,
      kind: "BEREICH",
      sortOrdinal: "1",
      systemText: "S",
      editingText: "E",
    },
  ],
  positions: [
    {
      id: "p1",
      tenantId: "t1",
      lvVersionId: "v1",
      parentNodeId: "n1",
      kind: "NORMAL",
      sortOrdinal: "1",
      systemText: "Ps",
      editingText: "Pe",
      quantity: 1,
      unit: "m2",
      unitPriceCents: 1000,
    },
  ],
};

describe("LvWorkbench", () => {
  it("shows structure summary counts from snapshot", async () => {
    const api = { getLvVersionSnapshot: vi.fn().mockResolvedValue(snap) } as unknown as ApiClient;
    render(<LvWorkbench api={api} lvVersionId="v1" showIntegrationHints={false} />);
    await waitFor(() => expect(api.getLvVersionSnapshot).toHaveBeenCalledWith("v1"));
    expect(screen.getByTestId("lv-workbench-structure-summary").textContent).toMatch(/1 Strukturknoten/);
    expect(screen.getByTestId("lv-workbench-structure-summary").textContent).toMatch(/1 Positionen/);
  });
});
