import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDashboard } from "./HomeDashboard.js";

describe("HomeDashboard", () => {
  it("renders Start and standard intro without integration jargon", () => {
    render(<HomeDashboard />);

    expect(screen.getByRole("heading", { name: "Start" })).not.toBeNull();
    expect(screen.getByText(/Wählen Sie einen Bereich — die linke Navigation/).textContent).toMatch(/Domänen-Hubs/);
    expect(screen.queryByText(/Diagnose/)).toBeNull();
    expect(screen.queryByTestId("home-nav-document-workspace")).toBeNull();
  });

  it("shows integration intro and document link when showIntegrationHints", () => {
    render(<HomeDashboard showIntegrationHints />);

    expect(screen.getByText(/Lesepfade und Diagnose/).textContent).toMatch(/Diagnose/);
    expect(screen.getByTestId("home-nav-document-workspace").getAttribute("href")).toBe("#/dokument");
  });

  it("lists tiles in IA-Reihenfolge (Stammdaten → Finanz → LV → Angebote/Dokument)", () => {
    const { container } = render(<HomeDashboard />);
    const titles = container.querySelectorAll(".quick-role-tile-title");
    const order = [...titles].map((el) => el.textContent);
    expect(order).toEqual([
      "Stammdaten",
      "Finanz-Vorbereitung",
      "Grundeinstellungen Mahnlauf",
      "Finanz-Arbeitsliste",
      "LV & Aufmaß (Übersicht)",
      "LV lesen",
      "Messungen (Pilot)",
      "Geschäftsprozess",
      "Angebote & Nachträge",
      "Angebots-Arbeitsfläche",
      "Dokument und Details",
    ]);
  });
});
