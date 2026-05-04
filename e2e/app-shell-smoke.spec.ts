import { expect, test } from "@playwright/test";

/**
 * Read-only Rauchtest ohne Login: Landing/Login und Passwort-Reset-Shell.
 * Keine Secrets, keine SMTP-/Reset-Ausführung.
 */
test.describe("App-Shell (ohne Login)", () => {
  test("Login-Route zeigt Anmeldeformular", async ({ page }) => {
    await page.goto("/#/login");
    await expect(page.getByRole("heading", { name: "Anmeldung" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
  });

  test("Passwort-Reset-Route zeigt Anfrage-Formular", async ({ page }) => {
    await page.goto("/#/password-reset");
    await expect(page.getByRole("heading", { name: "Passwort zurücksetzen" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByRole("button", { name: "Link anfordern" })).toBeVisible();
  });

  test("Hash-Start lädt ohne Fehler (Shell oder Login)", async ({ page }) => {
    await page.goto("/#/");
    await expect(page.locator("body")).toBeVisible();
    const loginHeading = page.getByRole("heading", { name: "Anmeldung" });
    const quickHeading = page.getByRole("heading", { name: "Schnellzugriff" });
    await expect(loginHeading.or(quickHeading)).toBeVisible({ timeout: 20_000 });
  });
});
