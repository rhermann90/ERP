import { expect, test } from "@playwright/test";

test.describe("Login → Finanz (Vorbereitung)", () => {
  test("Anmeldung und Finanz-Seite erreichbar", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.getByRole("heading", { name: /Finanz \(Vorbereitung\)/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Rechnung & Zahlung/i }).click();
    await expect(page.getByRole("button", { name: "Rechnung laden" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }).click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { name: /Batch-E-Mail \(M4 Slice 5c\)/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("tab", { name: /^Mahnwesen$/i }).click();
    await expect(page.getByRole("heading", { name: /Mahn-Ereignis \(FIN-4\)/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("tab", { name: /^Fortgeschritten$/i }).click();
    await expect(page.getByRole("heading", { name: /SoT — erlaubte Aktionen \(Fortgeschritten\)/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Voreinstellung: Angebotsversion" }).click();
    await expect(page.getByLabel("entityType für allowed-actions")).toHaveValue("OFFER_VERSION");

    await page.getByRole("button", { name: "Erlaubte Aktionen laden" }).click();
    await expect(page.getByText("Rohantwort allowed-actions (JSON)", { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Voreinstellung: LV-Position" }).click();
    await expect(page.getByLabel("entityType für allowed-actions")).toHaveValue("LV_POSITION");

    await page.getByRole("button", { name: "Erlaubte Aktionen laden" }).click();
    await expect(page.getByText("Rohantwort allowed-actions (JSON)", { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Audit-Ereignisse laden (letzte 15)" }).click();
    await expect(page.getByText("Rohantwort GET /audit-events (JSON)", { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
