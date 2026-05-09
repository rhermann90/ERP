import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HilfeHubPage } from "./HilfeHubPage.js";
import { STAMMDATEN_HASH } from "../../lib/hash-route.js";

describe("HilfeHubPage", () => {
  it("verlinkt Pilot-Stammdaten-Hub und ERP-Abschnitt 18.1 (Listenpunkt)", () => {
    render(<HilfeHubPage />);
    const stamm = screen.getByTestId("hilfe-link-stammdaten-pilot");
    expect(stamm.getAttribute("href")).toBe(STAMMDATEN_HASH);
    expect(screen.getByRole("heading", { name: /Pilot: Stammdaten/ })).toBeTruthy();
    expect(screen.getByText(/ERP-Systembeschreibung — Abschnitt 18\.1/)).toBeTruthy();
  });
});
