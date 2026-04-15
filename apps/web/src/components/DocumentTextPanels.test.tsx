import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentTextPanels } from "./DocumentTextPanels.js";

describe("DocumentTextPanels", () => {
  it("renders system and editing text read-only without injection", () => {
    render(
      <DocumentTextPanels
        status="ENTWURF"
        measurementId="m-1"
        systemText={'System <img src=x onerror="alert(1)" />'}
        editingText={'Edit <script>alert("xss")</script>'}
      />,
    );

    const system = screen.getByTestId("system-text-block");
    const editing = screen.getByTestId("editing-text-block");

    expect(system.textContent).toContain('System <img src=x onerror="alert(1)" />');
    expect(editing.textContent).toContain('Edit <script>alert("xss")</script>');
    expect(system.querySelector("textarea,input,select")).toBeNull();
    expect(editing.querySelector("textarea,input,select")).toBeNull();
    expect(system.querySelector("script")).toBeNull();
    expect(editing.querySelector("script")).toBeNull();
  });
});
