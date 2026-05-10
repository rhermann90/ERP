import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LvVersionSotPanel } from "./LvVersionSotPanel.js";

describe("LvVersionSotPanel", () => {
  it("read-only mode shows allowed list without action runner", async () => {
    const getAllowedActions = vi.fn().mockResolvedValue({
      documentId: "v1",
      entityType: "LV_VERSION",
      allowedActions: ["LV_SET_FREIGEGEBEN", "OTHER"],
    });
    const api = { getAllowedActions } as never;
    render(<LvVersionSotPanel api={api} lvVersionId="v1" allowExecution={false} />);
    fireEvent.click(screen.getByTestId("lv-sot-load"));
    await waitFor(() => expect(getAllowedActions).toHaveBeenCalledWith("v1", "LV_VERSION"));
    expect(screen.getByTestId("lv-sot-allowed-list").textContent).toContain("LV_SET_FREIGEGEBEN");
    expect(screen.queryByTestId("lv-sot-allowed-json")).toBeNull();
    expect(screen.queryByTestId("lv-sot-action-select")).toBeNull();
    expect(screen.queryByTestId("lv-sot-run")).toBeNull();
  });

  it("expert mode shows action select when LV actions exist", async () => {
    const getAllowedActions = vi.fn().mockResolvedValue({
      documentId: "v1",
      entityType: "LV_VERSION",
      allowedActions: ["LV_SET_FREIGEGEBEN"],
    });
    const api = { getAllowedActions } as never;
    render(<LvVersionSotPanel api={api} lvVersionId="v1" allowExecution />);
    fireEvent.click(screen.getByTestId("lv-sot-load"));
    await waitFor(() => expect(screen.getByTestId("lv-sot-action-select")).toBeTruthy());
  });
});
