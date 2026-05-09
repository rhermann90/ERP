import type { PrismaClient } from "../prisma-client.js";
import { SEED_IDS } from "./seed.js";

/**
 * ADR 0019: CRM-Stammzeilen für den Demo-Mandanten — PKs `projectId`/`customerId`
 * stimmen mit Offer/Aufmass/Rechnung überein (kein zweites ID-System).
 */
export async function seedCrmStammdaten(prisma: PrismaClient): Promise<void> {
  const actor = SEED_IDS.seedAdminUserId;
  const now = new Date();

  await prisma.crmConstructionSite.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.crmConstructionSiteId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.crmConstructionSiteId,
      label: "Demo-Baustelle Nord",
      street: "Baustellenweg 1",
      postalCode: "10115",
      city: "Berlin",
      countryCode: "DE",
      createdAt: now,
      createdBy: actor,
    },
    update: {
      label: "Demo-Baustelle Nord",
      street: "Baustellenweg 1",
      postalCode: "10115",
      city: "Berlin",
      countryCode: "DE",
    },
  });

  await prisma.crmCustomer.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.customerId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.customerId,
      legalName: "Demo-Kunde AG (CRM)",
      street: "Kundenallee 2",
      postalCode: "80331",
      city: "München",
      countryCode: "DE",
      createdAt: now,
      createdBy: actor,
    },
    update: {
      legalName: "Demo-Kunde AG (CRM)",
      street: "Kundenallee 2",
      postalCode: "80331",
      city: "München",
      countryCode: "DE",
    },
  });

  await prisma.crmProject.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.projectId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.projectId,
      primaryCustomerId: SEED_IDS.customerId,
      constructionSiteId: SEED_IDS.crmConstructionSiteId,
      status: "AKTIV",
      versionNumber: 1,
      label: "Pilot-Projekt (CRM)",
      createdAt: now,
      createdBy: actor,
    },
    update: {
      primaryCustomerId: SEED_IDS.customerId,
      constructionSiteId: SEED_IDS.crmConstructionSiteId,
      label: "Pilot-Projekt (CRM)",
    },
  });

  await prisma.crmProjectContact.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.crmProjectContactId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.crmProjectContactId,
      projectId: SEED_IDS.projectId,
      customerId: SEED_IDS.customerId,
      role: "ANSPRECHPARTNER",
      displayName: "Max Mustermann",
      email: "max@example.com",
      phone: "+49 30 000000",
      createdAt: now,
      createdBy: actor,
    },
    update: {
      role: "ANSPRECHPARTNER",
      displayName: "Max Mustermann",
      email: "max@example.com",
      phone: "+49 30 000000",
    },
  });
}
