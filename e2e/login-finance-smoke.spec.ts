import { expect, test } from "@playwright/test";
import {
  SEED_INVOICE_ID,
  SEED_LV_VERSION_ID,
  SEED_MEASUREMENT_ID,
  SEED_MEASUREMENT_VERSION_ID,
  SEED_OFFER_VERSION_ID,
  SEED_PROJECT_ID,
  SEED_SUPPLEMENT_VERSION_ID,
} from "./login-finance-smoke-constants.js";

test.describe("Login → Finanz (Vorbereitung)", () => {
  test("Haupt-Shell: LV_VERSION GET-Detail (Snapshot)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const docPanel = page.getByTestId("shell-document-panel");
    await docPanel.getByTestId("shell-document-entity-type").selectOption("LV_VERSION");
    await docPanel.getByTestId("shell-document-id").fill(SEED_LV_VERSION_ID);
    await docPanel.getByTestId("shell-document-detail-get").click();

    await expect(page.getByTestId("lv-shell-detail")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("lv-shell-detail")).toContainText("structureNodes");
    await expect(page.getByTestId("lv-shell-detail")).toContainText(SEED_LV_VERSION_ID);
  });

  test("Haupt-Shell: GET /finance/dunning-reminder-config (read-only)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("shell-dunning-config-panel")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("shell-dunning-config-fetch").click();
    await expect(page.getByTestId("shell-dunning-config-json")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("shell-dunning-config-json")).toContainText('"stages"');
    await expect(page.getByTestId("shell-dunning-config-json")).toContainText("MVP_STATIC_DEFAULTS");
  });

  test("Haupt-Shell: FIN-4 weitere Lesepfade — Vorlagen/Footer/Automation (GET)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("shell-fin4-extra-readonly-panel")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("shell-dunning-templates-fetch").click();
    await expect(page.getByTestId("shell-dunning-templates-json")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("shell-dunning-templates-json")).toContainText("templateSource");

    await page.getByTestId("shell-dunning-footer-fetch").click();
    await expect(page.getByTestId("shell-dunning-footer-json")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("shell-dunning-footer-json")).toContainText("footerSource");

    await page.getByTestId("shell-dunning-automation-fetch").click();
    await expect(page.getByTestId("shell-dunning-automation-json")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("shell-dunning-automation-json")).toContainText("runMode");
  });

  test("Haupt-Shell: OFFER_VERSION GET-Detail", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const docPanel = page.getByTestId("shell-document-panel");
    await docPanel.getByTestId("shell-document-entity-type").selectOption("OFFER_VERSION");
    await docPanel.getByTestId("shell-document-id").fill(SEED_OFFER_VERSION_ID);
    await docPanel.getByTestId("shell-document-detail-get").click();

    await expect(page.getByTestId("offer-shell-detail")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("offer-version-system-text")).toBeVisible();
    await expect(page.getByTestId("offer-shell-detail")).toContainText("ENTWURF");
    await expect(page.getByTestId("offer-shell-detail")).toContainText("22222222-2222-4222-8222-222222222222");
    await expect(page.getByTestId("offer-shell-detail")).toContainText(SEED_LV_VERSION_ID);
  });

  test("Haupt-Shell: INVOICE GET-Detail und Lesepfade payment-intakes / dunning-reminders", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const docPanel = page.getByTestId("shell-document-panel");
    await docPanel.getByTestId("shell-document-entity-type").selectOption("INVOICE");
    await docPanel.getByTestId("shell-document-id").fill(SEED_INVOICE_ID);
    await docPanel.getByTestId("shell-document-detail-get").click();

    const invoiceDetail = page.getByTestId("invoice-shell-detail");
    await expect(invoiceDetail).toBeVisible({ timeout: 15_000 });
    await expect(invoiceDetail).toContainText(SEED_INVOICE_ID);

    const subreads = page.getByTestId("shell-invoice-readonly-subreads");
    await subreads.getByRole("button", { name: "Zahlungseingänge (GET)" }).click();
    await expect(page.getByRole("heading", { name: "Antwort payment-intakes" })).toBeVisible({ timeout: 15_000 });

    await subreads.getByRole("button", { name: "Mahn-Ereignisse (GET)" }).click();
    await expect(page.getByRole("heading", { name: "Antwort dunning-reminders" })).toBeVisible({ timeout: 15_000 });

    await subreads
      .getByRole("button", { name: /Zahlungsbedingungen zum Projekt der Rechnung laden \(GET\)/ })
      .click();
    await expect(page.getByRole("heading", { name: "Antwort GET /finance/payment-terms (Projekt)" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("shell-invoice-payment-terms-json")).toContainText(SEED_PROJECT_ID);

    await subreads
      .getByRole("button", { name: /Erlaubte Aktionen für diese Rechnung laden \(GET\)/ })
      .click();
    await expect(page.getByRole("heading", { name: "Antwort allowed-actions (INVOICE)" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("shell-invoice-allowed-actions-json")).toContainText("allowedActions");
  });

  test("Haupt-Shell: MEASUREMENT_VERSION GET-Detail", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const docPanel = page.getByTestId("shell-document-panel");
    await docPanel.getByTestId("shell-document-entity-type").selectOption("MEASUREMENT_VERSION");
    await docPanel.getByTestId("shell-document-id").fill(SEED_MEASUREMENT_VERSION_ID);
    await docPanel.getByTestId("shell-document-detail-get").click();

    const measurementPanel = page.getByTestId("measurement-shell-detail");
    await expect(measurementPanel).toBeVisible({ timeout: 15_000 });
    await expect(measurementPanel).toContainText(SEED_MEASUREMENT_ID);
    await expect(measurementPanel.getByTestId("system-text-block")).toBeVisible();
    await expect(measurementPanel.getByTestId("editing-text-block")).toBeVisible();
  });

  test("Haupt-Shell: SUPPLEMENT_VERSION GET-Detail", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const docPanel = page.getByTestId("shell-document-panel");
    await docPanel.getByTestId("shell-document-entity-type").selectOption("SUPPLEMENT_VERSION");
    await docPanel.getByTestId("shell-document-id").fill(SEED_SUPPLEMENT_VERSION_ID);
    await docPanel.getByTestId("shell-document-detail-get").click();

    const supplementPanel = page.getByTestId("supplement-shell-detail");
    await expect(supplementPanel).toBeVisible({ timeout: 15_000 });
    await expect(supplementPanel).toContainText("ENTWURF");
    await expect(supplementPanel).toContainText(SEED_SUPPLEMENT_VERSION_ID);
    await expect(supplementPanel).toContainText("33333333-3333-4333-8333-333333333333");
  });

  test("Finanz-Vorbereitung: Grundeinstellungen — Kandidaten-GET zeigt Eligibility-Region (data-testid)", async ({
    page,
  }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }).click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel("Mahn-Stufe fuer Kandidaten und Batch").fill("1");
    /** Nach Seed-Rechnung (issueDate + 14 Kalendertage laut MVP-Stufen-Defaults) — Kandidat für Stufe 1. */
    await page.getByLabel("asOfDate fuer Mahnlauf und Kandidaten").fill("2026-04-28");
    await page.getByRole("button", { name: "Kandidaten laden (GET)" }).click();

    const region = page.getByTestId("finance-dunning-candidates-region");
    await expect(region).toBeVisible({ timeout: 15_000 });
    await expect(region.getByTestId("finance-dunning-candidate-invoice-0")).toContainText(SEED_INVOICE_ID);
    await expect(region).toContainText("Fälligkeit / Kontext (B3)");
  });

  test("Finanz: Deep-Link #/finanz-grundeinstellungen zeigt Mahn-Grundeinstellungen (Option A / M4 IA)", async ({
    page,
  }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

    await page.goto("/#/finanz-grundeinstellungen");

    await expect(page.getByRole("heading", { name: "Finanz (Vorbereitung) — Mahn-Grundeinstellungen" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/finanz-grundeinstellungen/);
  });

  test("Haupt-Shell: GET /tenant/pwa-display-settings (read-only)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await expect(page.getByRole("heading", { name: "Schnellzugriff" })).toBeVisible({ timeout: 20_000 });

    const panel = page.getByTestId("shell-tenant-pwa-display-panel");
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await panel.getByTestId("shell-tenant-pwa-display-fetch").click();
    await expect(panel.getByTestId("shell-tenant-pwa-display-json")).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByTestId("shell-tenant-pwa-display-json")).toContainText("pwaExpertModeEnabled");
  });

  test("Finanz-Vorbereitung: Haupt-Tabs per data-testid (Mahnwesen, Fortgeschritten, zurück Rechnung)", async ({
    page,
  }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });
    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("finance-prep-tab-mahnwesen").click();
    await expect(page.getByRole("heading", { name: /Mahn-Ereignis \(FIN-4\)/i })).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("finance-prep-tab-fortgeschritten").click();
    await expect(page.getByRole("heading", { name: /SoT — erlaubte Aktionen \(Fortgeschritten\)/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("finance-prep-tab-grundeinstellungen").click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("finance-prep-tab-rechnung").click();
    await expect(page.getByRole("button", { name: "Rechnung laden" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("finance-prep-skonto-bps-input")).toBeVisible({ timeout: 10_000 });
  });

  test("Finanz-Vorbereitung: unbekannte Rechnungs-ID → strukturierter API-Fehler (Rechnung laden)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

    await page.goto("/#/finanz-vorbereitung?tab=rechnung");

    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Rechnungs-ID für GET").fill("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    await page.getByRole("button", { name: "Rechnung laden" }).click();

    await expect(page.getByTestId("finance-structured-api-error-disclaimer")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("finance-prep-notice")).toContainText("DOCUMENT_NOT_FOUND");
  });

  test("Finanz-Vorbereitung: Tenant-Mismatch (GET Rechnung) → strukturierter API-Fehler", async ({ page }) => {
    await page.route("**/invoices/**", async (route, request) => {
      if (request.method() !== "GET") {
        await route.continue();
        return;
      }
      const headers = { ...request.headers() };
      headers["x-tenant-id"] = "22222222-2222-4222-8222-222222222222";
      await route.continue({ headers });
    });

    try {
      await page.goto("/#/login");

      await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
      await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
      await page.getByRole("button", { name: "Anmelden" }).click();

      await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

      await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
      await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });
      await page.getByRole("tab", { name: /Rechnung & Zahlung/i }).click();
      await page.getByRole("button", { name: "Rechnung laden" }).click();

      await expect(page.getByTestId("finance-prep-notice")).toContainText("TENANT_SCOPE_VIOLATION", { timeout: 20_000 });
    } finally {
      await page.unroute("**/invoices/**");
    }
  });
});
