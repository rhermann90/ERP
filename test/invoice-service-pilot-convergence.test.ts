import { describe, expect, it } from "vitest";
import { InvoiceService } from "../src/services/invoice-service.js";
import { AuditService } from "../src/services/audit-service.js";
import { TraceabilityService } from "../src/services/traceability-service.js";
import { noopInvoicePersistence } from "../src/persistence/invoice-persistence.js";
import { InMemoryRepositories } from "../src/repositories/in-memory-repositories.js";
import { seedDemoData, SEED_IDS } from "../src/composition/seed.js";

function seedSecondMeasurementForSameChain(repos: InMemoryRepositories): string {
  const seed = repos.measurements.get(SEED_IDS.measurementId);
  if (!seed) throw new Error("seed measurement missing");
  const secondMeasurementId = "aaaaaaaa-bbbb-4bbb-8bbb-aaaaaaaa0999";
  const secondVersionId = "aaaaaaaa-bbbb-4bbb-8bbb-aaaaaaaa0998";
  repos.measurements.set(secondMeasurementId, {
    ...seed,
    id: secondMeasurementId,
    currentVersionId: secondVersionId,
    createdAt: new Date(seed.createdAt.getTime() + 60_000),
  });
  repos.measurementVersions.set(secondVersionId, {
    id: secondVersionId,
    tenantId: seed.tenantId,
    measurementId: secondMeasurementId,
    versionNumber: 1,
    status: "ENTWURF",
    createdAt: new Date(seed.createdAt.getTime() + 60_000),
    createdBy: seed.createdBy,
  });
  return secondMeasurementId;
}

describe("Pilot FIN-2 Konvergenz (ADR-0018): Aufmass-Pflicht vor Rechnungsentwurf", () => {
  it("createDraft wirft TRACEABILITY_LINK_MISSING ohne Aufmass zur LV/Projekt/Kunde-Kette", async () => {
    const repos = new InMemoryRepositories();
    seedDemoData(repos);
    repos.measurements.clear();

    const audit = new AuditService(repos, null);
    const traceability = new TraceabilityService(repos);
    const svc = new InvoiceService(repos, audit, noopInvoicePersistence, traceability);

    await expect(
      svc.createDraft({
        tenantId: SEED_IDS.tenantId,
        actorUserId: SEED_IDS.seedAdminUserId,
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        paymentTermsVersionId: SEED_IDS.paymentTermsVersionId,
        reason: "Pilot-Konvergenz Negativtest ohne Aufmass",
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      code: "TRACEABILITY_LINK_MISSING",
    });
  });

  it("createDraft ohne measurementId wählt bei zwei Aufmassen das zeitlich ältere", async () => {
    const repos = new InMemoryRepositories();
    seedDemoData(repos);
    seedSecondMeasurementForSameChain(repos);

    const audit = new AuditService(repos, null);
    const traceability = new TraceabilityService(repos);
    const svc = new InvoiceService(repos, audit, noopInvoicePersistence, traceability);

    const draft = await svc.createDraft({
      tenantId: SEED_IDS.tenantId,
      actorUserId: SEED_IDS.seedAdminUserId,
      lvVersionId: SEED_IDS.lvVersionId,
      offerVersionId: SEED_IDS.offerVersionId,
      invoiceCurrencyCode: "EUR",
      paymentTermsVersionId: SEED_IDS.paymentTermsVersionId,
      reason: "Pilot-Konvergenz zwei Aufmasse ohne measurementId",
    });
    expect(repos.invoices.get(draft.invoiceId)?.measurementId).toBe(SEED_IDS.measurementId);
  });

  it("createDraft mit measurementId nutzt das angegebene Aufmass", async () => {
    const repos = new InMemoryRepositories();
    seedDemoData(repos);
    const secondId = seedSecondMeasurementForSameChain(repos);

    const audit = new AuditService(repos, null);
    const traceability = new TraceabilityService(repos);
    const svc = new InvoiceService(repos, audit, noopInvoicePersistence, traceability);

    const draft = await svc.createDraft({
      tenantId: SEED_IDS.tenantId,
      actorUserId: SEED_IDS.seedAdminUserId,
      lvVersionId: SEED_IDS.lvVersionId,
      offerVersionId: SEED_IDS.offerVersionId,
      invoiceCurrencyCode: "EUR",
      paymentTermsVersionId: SEED_IDS.paymentTermsVersionId,
      measurementId: secondId,
      reason: "Pilot-Konvergenz explizites measurementId",
    });
    expect(repos.invoices.get(draft.invoiceId)?.measurementId).toBe(secondId);
  });

  it("createDraft mit unbekannter measurementId → MEASUREMENT_NOT_FOUND", async () => {
    const repos = new InMemoryRepositories();
    seedDemoData(repos);

    const audit = new AuditService(repos, null);
    const traceability = new TraceabilityService(repos);
    const svc = new InvoiceService(repos, audit, noopInvoicePersistence, traceability);

    await expect(
      svc.createDraft({
        tenantId: SEED_IDS.tenantId,
        actorUserId: SEED_IDS.seedAdminUserId,
        lvVersionId: SEED_IDS.lvVersionId,
        offerVersionId: SEED_IDS.offerVersionId,
        invoiceCurrencyCode: "EUR",
        paymentTermsVersionId: SEED_IDS.paymentTermsVersionId,
        measurementId: "99999999-9999-4999-8999-999999999999",
        reason: "Pilot-Konvergenz unbekannte measurementId",
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      code: "MEASUREMENT_NOT_FOUND",
    });
  });
});
