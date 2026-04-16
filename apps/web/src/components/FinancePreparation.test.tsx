import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancePreparation } from "./FinancePreparation.js";

describe("FinancePreparation", () => {
  it("renders read-only heading and doc paths", () => {
    render(<FinancePreparation />);
    expect(screen.getByRole("heading", { name: /Finanz \(Vorbereitung\)/i })).not.toBeNull();
    expect(screen.getByText(/docs\/adr\/0007-finance-persistence-and-invoice-boundaries\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/FIN-2-START-GATE\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/finance-fin0-openapi-mapping\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/contracts\/qa-fin-0-stub-test-matrix\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/ENTWICKLUNGSPHASEN-MVP-V1\.3\.md/)).not.toBeNull();
    expect(screen.getByText(/docs\/tickets\/PL-SYSTEM-ZUERST-2026-04-14\.md/)).not.toBeNull();
  });
});
