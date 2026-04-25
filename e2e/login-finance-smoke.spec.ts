import { expect, test } from "@playwright/test";

test.describe("Login → Finanz (Vorbereitung)", () => {
  test("Anmeldung und Finanz-Seite erreichbar", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page.getByText(/Angemeldet/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.getByRole("heading", { name: /Finanz \(Vorbereitung\)/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }).click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});
