import { describe, expect, it } from "vitest";
import { SEED_IDS } from "../src/composition/seed.js";
import { seedDemoData } from "../src/composition/seed.js";
import { DomainError } from "../src/errors/domain-error.js";
import { InMemoryRepositories } from "../src/repositories/in-memory-repositories.js";
import { AuditService } from "../src/services/audit-service.js";
import { ExportService } from "../src/services/export-service.js";
import type { Invoice } from "../src/domain/types.js";

describe("ExportService XRechnung — unbekanntes Steuerregime", () => {
  it("liefert EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED wenn invoice_tax_regime nicht in FIN-5-Enum", async () => {
    const repos = new InMemoryRepositories();
    seedDemoData(repos);
    const inv = repos.getInvoiceByTenant(SEED_IDS.tenantId, SEED_IDS.invoiceId);
    expect(inv).toBeDefined();
    const corrupted: Invoice = {
      ...inv!,
      invoiceTaxRegime: "FUTURE_UNKNOWN_REGIME" as Invoice["invoiceTaxRegime"],
    };
    repos.invoices.set(corrupted.id, corrupted);

    const exportService = new ExportService(repos, new AuditService(repos, null));
    await expect(
      exportService.prepareExport({
        tenantId: SEED_IDS.tenantId,
        format: "XRECHNUNG",
        entityType: "INVOICE",
        entityId: SEED_IDS.invoiceId,
        actorUserId: SEED_IDS.seedAdminUserId,
      }),
    ).rejects.toSatisfy((e: unknown) => {
      if (!(e instanceof DomainError)) return false;
      if (e.code !== "EXPORT_PREFLIGHT_FAILED") return false;
      const ve = e.details?.validationErrors as string[] | undefined;
      return Array.isArray(ve) && ve.includes("EXPORT_INVOICE_TAX_REGIME_NOT_MAPPED");
    });
  });
});
