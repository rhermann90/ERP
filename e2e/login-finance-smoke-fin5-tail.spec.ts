import { expect, test } from "@playwright/test";
import {
  E2E_MEMORY_API_ROUTE_RX,
  E2E_RECREATE_INVOICE_ID,
  SEED_INVOICE_DRAFT_SMALL_BUSINESS_ID,
  SEED_LV_VERSION_ID,
  SEED_MEASUREMENT_ID,
  SEED_OFFER_VERSION_ID,
  SEED_PROJECT_ID,
} from "./login-finance-smoke-constants.js";

/**
 * Zweiter Playwright-Prozess (`verify:pre-merge`): FIN-5-/Memory-lastige Schritte —
 * vermeidet OOM bei einem einzelnen langen E2E-Lauf mit allen Shell-Tests.
 */
test.describe("Login → Finanz (Vorbereitung)", () => {
  /**
   * Shared Memory-API (PATCH Steuerprofil, Mahn-Kandidaten, …).
   * Liegt vor FIN-5 Paket B/D: nach Paket D kann die In-Memory-Rechnungs-/Steuer-Sicht inkonsistent sein,
   * sodass GET Seed-Rechnung + Parallel-Reads im Folgeschritt fehlschlagen (Flake).
   */
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
    await expect(page.getByLabel("Rechnungs-ID für GET")).toHaveValue("44444444-4444-4444-8444-444444444444");

    await page.getByRole("button", { name: "Rechnung laden" }).click();
    await expect(page.getByTestId("finance-invoice-kernzahlen")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }).click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("finance-dunning-batch-email-section")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("finance-dunning-batch-email-dry-run")).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole("heading", { name: /Steuerprofil Rechnung \(FIN-5\)/i })).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("finance-invoice-tax-load").click();
    await expect(page.getByTestId("finance-invoice-tax-tenant-json")).toContainText("defaultInvoiceTaxRegime", { timeout: 20_000 });
    await page.getByTestId("finance-invoice-tax-patch-tenant").click();
    /** PATCH-Antwort (nicht GET-Mandanten-JSON): erst nach erfolgreichem Schreibpfad sichtbar. */
    await expect(page.getByTestId("finance-invoice-tax-mutation-json")).toContainText("11111111-1111-4111-8111-111111111111", {
      timeout: 20_000,
    });
    await expect(page.getByTestId("finance-invoice-tax-mutation-json")).toContainText("defaultInvoiceTaxRegime");
    await page.getByTestId("finance-invoice-tax-put-project").click();
    await expect(page.getByTestId("finance-invoice-tax-delete-project")).toBeEnabled({ timeout: 20_000 });
    await page.getByTestId("finance-invoice-tax-delete-project").click();
    await expect(page.getByTestId("finance-invoice-tax-panel")).toContainText("DELETE_PROJECT_INVOICE_TAX_OVERRIDE", { timeout: 20_000 });

    await page.getByLabel("asOfDate fuer Mahnlauf und Kandidaten").fill("2099-12-31");
    await page.getByRole("button", { name: "Kandidaten laden (GET)" }).click();
    await expect(page.getByText("Rohantwort GET /finance/dunning-reminder-candidates", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Items aus Kandidaten (Platzhalter-E-Mail)" }).click();
    await page.getByTestId("finance-dunning-batch-email-dry-run").click();
    await expect(page.getByTestId("finance-dunning-batch-email-result")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-testid="finance-dunning-batch-email-result"]')).toContainText("DRY_RUN");

    await page.getByRole("tab", { name: /^Mahnwesen$/i }).click();
    await expect(page.getByRole("heading", { name: /Mahn-Ereignis \(FIN-4\)/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("tab", { name: /^Fortgeschritten$/i }).click();
    await expect(page.getByRole("heading", { name: /SoT — erlaubte Aktionen \(Fortgeschritten\)/i })).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByLabel("entityType für allowed-actions")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("Dokument-ID für allowed-actions")).toBeVisible();

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

  test("Finanz-Vorbereitung: Pflicht-Hinweise bei SMALL_BUSINESS_19-Rechnung (FIN-5 Paket B)", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Rechnung & Zahlung/i }).click();
    await page.getByLabel("Rechnungs-ID für GET").fill(SEED_INVOICE_DRAFT_SMALL_BUSINESS_ID);
    await page.getByRole("button", { name: "Rechnung laden" }).click();

    const notices = page.getByTestId("finance-invoice-mandatory-tax-notices");
    await expect(notices).toBeVisible({ timeout: 15_000 });
    await expect(notices).toContainText("§ 19 UStG");
  });

  test("Finanz-Vorbereitung: Buchung 409 INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT → CTA Neuen Entwurf laden (FIN-5 Paket D)", async ({
    page,
  }) => {
    await page.route(E2E_MEMORY_API_ROUTE_RX, async (route, request) => {
      const path = new URL(request.url()).pathname;
      const method = request.method();

      if (method === "POST" && /\/invoices\/[^/]+\/book$/u.test(path)) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            code: "INVOICE_TAX_REGIME_CHANGED_RECREATE_DRAFT",
            message: "Steuerregime seit Entwurf geaendert — Entwurf verwerfen und neu anlegen",
            correlationId: "e2e-fin5-regime-drift",
            retryable: false,
            blocking: true,
          }),
        });
        return;
      }

      if (method === "POST" && path === "/invoices") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            invoiceId: E2E_RECREATE_INVOICE_ID,
            lvNetCents: 100_000,
            vatRateBps: 1900,
            vatCents: 19_000,
            totalGrossCents: 119_000,
            skontoBps: 200,
            invoiceTaxRegime: "STANDARD_VAT_19",
            mandatoryTaxNoticeLines: [],
          }),
        });
        return;
      }

      if (method === "GET" && path === `/invoices/${E2E_RECREATE_INVOICE_ID}`) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            invoiceId: E2E_RECREATE_INVOICE_ID,
            projectId: SEED_PROJECT_ID,
            customerId: "20202020-2020-4020-8020-202020202020",
            measurementId: SEED_MEASUREMENT_ID,
            lvVersionId: SEED_LV_VERSION_ID,
            offerId: "o0000000-0000-4000-8000-000000000002",
            offerVersionId: SEED_OFFER_VERSION_ID,
            status: "ENTWURF",
            skontoBps: 200,
            lvNetCents: 100_000,
            vatRateBps: 1900,
            vatCents: 19_000,
            totalGrossCents: 119_000,
            totalPaidCents: 0,
            invoiceTaxRegime: "STANDARD_VAT_19",
          }),
        });
        return;
      }

      await route.continue();
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

      await page.getByLabel("Rechnungs-ID für GET").fill(SEED_INVOICE_DRAFT_SMALL_BUSINESS_ID);
      await page.getByRole("button", { name: "Rechnung laden" }).click();
      await expect(page.getByTestId("finance-invoice-mandatory-tax-notices")).toBeVisible({ timeout: 15_000 });

      await page.getByRole("button", { name: /^Rechnung buchen$/i }).click();
      await expect(page.getByTestId("finance-invoice-recreate-draft-cta")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Steuerregime hat sich seit dem Entwurf geändert \(FIN-5 §8\.16\)/i)).toBeVisible();

      await page.getByTestId("finance-invoice-recreate-draft-cta").click();
      await expect(page.getByLabel("Rechnungs-ID für GET")).toHaveValue(E2E_RECREATE_INVOICE_ID, { timeout: 15_000 });
    } finally {
      await page.unroute(E2E_MEMORY_API_ROUTE_RX);
    }
  });

  test("Finanz-Vorbereitung: Tastatur — Tab erreicht Schritt-Schaltflächen nacheinander", async ({ page }) => {
    await page.goto("/#/login");

    await page.getByLabel("E-Mail").fill("e2e-ops@example.com");
    await page.getByLabel("Passwort").fill("e2e-correct-horse-battery-staple");
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).not.toHaveURL(/#\/login/, { timeout: 20_000 });

    await page.getByRole("link", { name: "Finanz (Vorbereitung)" }).click();
    await expect(page.locator("section.finance-prep")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Rechnung & Zahlung/i }).click();
    const b1 = page.getByRole("button", { name: "GET Konditionen laden" });
    const b2 = page.getByRole("button", { name: "Rechnungsentwurf anlegen" });
    const b3 = page.getByRole("button", { name: "Rechnung laden" });

    await b1.focus();
    await expect(b1).toBeFocused();

    const tabUntil = async (locator: ReturnType<typeof page.getByRole>) => {
      for (let i = 0; i < 28; i++) {
        if (await locator.evaluate((el) => el === document.activeElement)) return;
        await page.keyboard.press("Tab");
      }
      throw new Error("Tab-Runde erreichte Ziel-Button nicht");
    };

    await tabUntil(page.getByRole("button", { name: "POST neue Version" }));
    await expect(page.getByRole("button", { name: "POST neue Version" })).toBeFocused();

    await tabUntil(b2);
    await expect(b2).toBeFocused();

    await tabUntil(b3);
    await expect(b3).toBeFocused();
  });
});
