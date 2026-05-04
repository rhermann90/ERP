import { expect, test } from "@playwright/test";

/** Abgleich mit `apps/web/src/lib/demo-seed-ids.ts` / Backend-Seed (E2E-Tenant). */
const SEED_LV_VERSION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001";
const SEED_OFFER_VERSION_ID = "33333333-3333-4333-8333-333333333333";
const SEED_INVOICE_ID = "44444444-4444-4444-8444-444444444444";
const SEED_MEASUREMENT_VERSION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccc0001";
const SEED_SUPPLEMENT_VERSION_ID = "91919191-9191-4191-8191-919191919191";
/** Eltern-Aufmass zur Seed-Version — UI zeigt `measurementId`, nicht die Versions-UUID (`src/composition/seed.ts`). */
const SEED_MEASUREMENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001";
/** Seed-Projekt der gebuchten Demo-Rechnung (`src/composition/seed.ts` SEED_IDS.projectId). */
const SEED_PROJECT_ID = "10101010-1010-4010-8010-101010101010";

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
    await expect(page.getByRole("group", { name: "Kernzahlen Rechnung" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: /Grundeinstellungen Mahnlauf/i }).click();
    await expect(page.getByRole("heading", { name: /Grundeinstellungen Mahnlauf \(SEMI, ADR-0011\)/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("finance-dunning-batch-email-section")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("finance-dunning-batch-email-dry-run")).toBeVisible({ timeout: 10_000 });

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

