import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OfferSupplementWorkspacePage } from "./OfferSupplementWorkspacePage.js";
import { DEMO_SEED_IDS as SEED } from "../../lib/demo-seed-ids.js";

describe("OfferSupplementWorkspacePage", () => {
  it("loads supplement detail on Nachtrag lesen", async () => {
    const getSupplementVersion = vi.fn().mockResolvedValue({
      id: SEED.supplementVersionId,
      status: "ENTWURF",
      baseOfferVersionId: SEED.offerVersionId,
      supplementOfferId: SEED.supplementOfferId,
      tenantId: SEED.tenantId,
    });
    const api = {
      getOfferVersion: vi.fn(),
      getAllowedActions: vi.fn().mockResolvedValue({ allowedActions: [] }),
      getSupplementVersion,
    } as never;
    render(<OfferSupplementWorkspacePage api={api} />);
    fireEvent.click(screen.getByTestId("ows-supp-detail-load"));
    await waitFor(() => expect(getSupplementVersion).toHaveBeenCalled());
    expect(screen.getByTestId("ows-supp-detail-dl")).toBeTruthy();
    expect(screen.getByTestId("ows-supp-detail-dl").textContent).toContain(SEED.offerVersionId);
  });

  it("blendet Integrations-Route-Zeile ohne showIntegrationHints aus", () => {
    const api = {
      getOfferVersion: vi.fn(),
      getAllowedActions: vi.fn().mockResolvedValue({ allowedActions: [] }),
      getSupplementVersion: vi.fn(),
    } as never;
    render(<OfferSupplementWorkspacePage api={api} showIntegrationHints={false} />);
    expect(screen.queryByTestId("ows-integration-route-hint")).toBeNull();
  });
});
