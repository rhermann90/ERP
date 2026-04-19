import { randomUUID } from "node:crypto";
import {
  Invoice,
  LvCatalog,
  LvPosition,
  LvStructureNode,
  LvVersion,
  Measurement,
  MeasurementPosition,
  MeasurementVersion,
  Offer,
  OfferVersion,
} from "../domain/types.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export const SEED_IDS = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  offerId: "22222222-2222-4222-8222-222222222222",
  offerVersionId: "33333333-3333-4333-8333-333333333333",
  invoiceId: "44444444-4444-4444-8444-444444444444",
  draftInvoiceId: "55555555-5555-4555-8555-555555555555",
  inconsistentInvoiceId: "66666666-6666-4666-8666-666666666666",
  lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001",
  measurementId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001",
  measurementVersionId: "cccccccc-cccc-4ccc-8ccc-cccccccc0001",
  lvPositionSeedA: "dddddddd-dddd-4ddd-8ddd-dddddddd0001",
  lvCatalogId: "fafa0000-0000-4000-8000-000000000001",
  lvBereichId: "ee101010-1010-4101-81ee-101010101010",
  lvTitelId: "ee202020-2020-4202-82ee-202020202020",
  lvUntertitelId: "ee303030-3030-4303-83ee-303030303030",
  /** Persistente Login-Benutzer (Postgres-Seed), konsistent mit Dev-Token-Skript. */
  seedAdminUserId: "77777777-7777-4777-8777-777777777777",
  seedViewerUserId: "88888888-8888-4888-8888-888888888888",
} as const;

export function seedDemoData(repos: InMemoryRepositories): void {
  const offer: Offer = {
    id: SEED_IDS.offerId,
    tenantId: SEED_IDS.tenantId,
    customerId: randomUUID(),
    projectId: randomUUID(),
    currentVersionId: SEED_IDS.offerVersionId,
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const version: OfferVersion = {
    id: SEED_IDS.offerVersionId,
    tenantId: SEED_IDS.tenantId,
    offerId: SEED_IDS.offerId,
    versionNumber: 1,
    status: "ENTWURF",
    lvVersionId: SEED_IDS.lvVersionId,
    systemText: "Systemtext exportrelevant",
    editingText: "Bearbeitungstext",
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const lvCatalog: LvCatalog = {
    id: SEED_IDS.lvCatalogId,
    tenantId: SEED_IDS.tenantId,
    projectId: offer.projectId,
    name: "Seed-LV",
    currentVersionId: SEED_IDS.lvVersionId,
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const lvVersion: LvVersion = {
    id: SEED_IDS.lvVersionId,
    tenantId: SEED_IDS.tenantId,
    lvCatalogId: SEED_IDS.lvCatalogId,
    versionNumber: 1,
    status: "FREIGEGEBEN",
    headerSystemText: "LV-Kopf System (Seed)",
    headerEditingText: "LV-Kopf Bearbeitung (Seed)",
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const lvBereich: LvStructureNode = {
    id: SEED_IDS.lvBereichId,
    tenantId: SEED_IDS.tenantId,
    lvVersionId: SEED_IDS.lvVersionId,
    parentNodeId: null,
    kind: "BEREICH",
    sortOrdinal: "1",
    systemText: "Bereich Sys",
    editingText: "Bereich Ed",
  };
  const lvTitel: LvStructureNode = {
    id: SEED_IDS.lvTitelId,
    tenantId: SEED_IDS.tenantId,
    lvVersionId: SEED_IDS.lvVersionId,
    parentNodeId: SEED_IDS.lvBereichId,
    kind: "TITEL",
    sortOrdinal: "1.1",
    systemText: "Titel Sys",
    editingText: "Titel Ed",
  };
  const lvUntertitel: LvStructureNode = {
    id: SEED_IDS.lvUntertitelId,
    tenantId: SEED_IDS.tenantId,
    lvVersionId: SEED_IDS.lvVersionId,
    parentNodeId: SEED_IDS.lvTitelId,
    kind: "UNTERTITEL",
    sortOrdinal: "1.1.1",
    systemText: "Untertitel Sys",
    editingText: "Untertitel Ed",
  };
  const lvPositionSeed: LvPosition = {
    id: SEED_IDS.lvPositionSeedA,
    tenantId: SEED_IDS.tenantId,
    lvVersionId: SEED_IDS.lvVersionId,
    parentNodeId: SEED_IDS.lvUntertitelId,
    sortOrdinal: "1.1.1.1",
    quantity: 100,
    unit: "m2",
    unitPriceCents: 1250,
    kind: "NORMAL",
    systemText: "Positions-Systemtext Seed",
    editingText: "Positions-Bearbeitung Seed",
  };
  const measurement: Measurement = {
    id: SEED_IDS.measurementId,
    tenantId: SEED_IDS.tenantId,
    projectId: offer.projectId,
    customerId: offer.customerId,
    lvVersionId: SEED_IDS.lvVersionId,
    currentVersionId: SEED_IDS.measurementVersionId,
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const measurementVersion: MeasurementVersion = {
    id: SEED_IDS.measurementVersionId,
    tenantId: SEED_IDS.tenantId,
    measurementId: SEED_IDS.measurementId,
    versionNumber: 1,
    status: "ABGERECHNET",
    createdAt: new Date(),
    createdBy: randomUUID(),
  };
  const measurementPosition: MeasurementPosition = {
    id: randomUUID(),
    tenantId: SEED_IDS.tenantId,
    measurementVersionId: SEED_IDS.measurementVersionId,
    lvPositionId: SEED_IDS.lvPositionSeedA,
    quantity: 12.5,
    unit: "m2",
    note: "Seed-Aufmassposition",
  };
  const invoice: Invoice = {
    id: SEED_IDS.invoiceId,
    tenantId: SEED_IDS.tenantId,
    projectId: offer.projectId,
    customerId: offer.customerId,
    measurementId: SEED_IDS.measurementId,
    lvId: SEED_IDS.lvVersionId,
    offerId: offer.id,
    status: "GEBUCHT_VERSENDET",
    immutableFromStatus: "GEBUCHT_VERSENDET",
    invoiceNumber: "RE-2026-0001",
    issueDate: "2026-04-14",
    totalGrossCents: 145000,
  };
  const draftInvoice: Invoice = {
    id: SEED_IDS.draftInvoiceId,
    tenantId: SEED_IDS.tenantId,
    projectId: offer.projectId,
    customerId: offer.customerId,
    measurementId: SEED_IDS.measurementId,
    lvId: SEED_IDS.lvVersionId,
    offerId: offer.id,
    status: "ENTWURF",
    immutableFromStatus: "GEBUCHT_VERSENDET",
  };
  const inconsistentInvoice: Invoice = {
    id: SEED_IDS.inconsistentInvoiceId,
    tenantId: SEED_IDS.tenantId,
    projectId: offer.projectId,
    customerId: offer.customerId,
    measurementId: SEED_IDS.measurementId,
    lvId: SEED_IDS.lvVersionId,
    offerId: offer.id,
    status: "GEBUCHT_VERSENDET",
    immutableFromStatus: "GEBUCHT_VERSENDET",
    invoiceNumber: "RE-2026-0002",
    issueDate: "2026-04-14",
    totalGrossCents: 31000,
  };

  repos.putOffer(offer);
  repos.putOfferVersion(version);
  repos.lvCatalogs.set(lvCatalog.id, lvCatalog);
  repos.lvVersions.set(lvVersion.id, lvVersion);
  repos.lvStructureNodes.set(lvBereich.id, lvBereich);
  repos.lvStructureNodes.set(lvTitel.id, lvTitel);
  repos.lvStructureNodes.set(lvUntertitel.id, lvUntertitel);
  repos.lvPositions.set(lvPositionSeed.id, lvPositionSeed);
  repos.measurements.set(measurement.id, measurement);
  repos.measurementVersions.set(measurementVersion.id, measurementVersion);
  repos.measurementPositions.set(measurementPosition.id, measurementPosition);
  repos.invoices.set(invoice.id, invoice);
  repos.invoices.set(draftInvoice.id, draftInvoice);
  repos.invoices.set(inconsistentInvoice.id, inconsistentInvoice);
  repos.traceabilityLinks.set(invoice.id, {
    tenantId: SEED_IDS.tenantId,
    invoiceId: invoice.id,
    measurementId: invoice.measurementId,
    lvId: invoice.lvId,
    offerId: invoice.offerId,
    projectId: invoice.projectId,
    customerId: invoice.customerId,
  });
  repos.traceabilityLinks.set(draftInvoice.id, {
    tenantId: SEED_IDS.tenantId,
    invoiceId: draftInvoice.id,
    measurementId: draftInvoice.measurementId,
    lvId: draftInvoice.lvId,
    offerId: draftInvoice.offerId,
    projectId: draftInvoice.projectId,
    customerId: draftInvoice.customerId,
  });
  repos.traceabilityLinks.set(inconsistentInvoice.id, {
    tenantId: SEED_IDS.tenantId,
    invoiceId: inconsistentInvoice.id,
    // Intentionally mismatched to verify strict traceability consistency checks.
    measurementId: randomUUID(),
    lvId: inconsistentInvoice.lvId,
    offerId: inconsistentInvoice.offerId,
    projectId: inconsistentInvoice.projectId,
    customerId: inconsistentInvoice.customerId,
  });
}
