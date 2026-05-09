import bcrypt from "bcryptjs";
import type { PrismaClient } from "../prisma-client.js";
import { SEED_IDS } from "./seed.js";

const BCRYPT_COST = 12;

/**
 * Legt Demo-Loginbenutzer für den Seed-Mandanten an (nur bei Postgres + seedDemoData).
 * Produktion: ohne `ERP_SEED_ADMIN_PASSWORD` (min. 12 Zeichen) wird nichts gesät — keine stillen Default-Passwörter.
 */
export async function seedAuthUsers(prisma: PrismaClient): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";
  let adminPlain = process.env.ERP_SEED_ADMIN_PASSWORD?.trim();
  if (!adminPlain || adminPlain.length < 12) {
    if (isProd) {
      console.warn("[erp] ERP_SEED_ADMIN_PASSWORD fehlt oder zu kurz; keine Auth-User gesät.");
      return;
    }
    adminPlain = "dev-seed-admin-12";
  }
  let viewerPlain = process.env.ERP_SEED_VIEWER_PASSWORD?.trim();
  if (!viewerPlain || viewerPlain.length < 12) {
    viewerPlain = isProd ? adminPlain : "dev-seed-viewer-12";
  }

  const emailAdmin = (process.env.ERP_SEED_ADMIN_EMAIL ?? "admin@localhost").trim().toLowerCase();
  const emailViewer = (process.env.ERP_SEED_VIEWER_EMAIL ?? "viewer@localhost").trim().toLowerCase();

  const hashAdmin = bcrypt.hashSync(adminPlain, BCRYPT_COST);
  const hashViewer = bcrypt.hashSync(viewerPlain, BCRYPT_COST);
  const now = new Date();

  /** PK ist `(tenantId, id)` — Upsert nur per E-Mail bricht, wenn dieselbe `id` schon mit anderer E-Mail existiert (z. B. E2E-Postgres mit abweichendem `ERP_SEED_ADMIN_EMAIL`). */
  await prisma.user.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.seedAdminUserId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.seedAdminUserId,
      emailNorm: emailAdmin,
      passwordHash: hashAdmin,
      role: "ADMIN",
      active: true,
      createdAt: now,
    },
    update: { emailNorm: emailAdmin, passwordHash: hashAdmin, role: "ADMIN", active: true },
  });

  await prisma.user.upsert({
    where: { tenantId_id: { tenantId: SEED_IDS.tenantId, id: SEED_IDS.seedViewerUserId } },
    create: {
      tenantId: SEED_IDS.tenantId,
      id: SEED_IDS.seedViewerUserId,
      emailNorm: emailViewer,
      passwordHash: hashViewer,
      role: "VIEWER",
      active: true,
      createdAt: now,
    },
    update: { emailNorm: emailViewer, passwordHash: hashViewer, role: "VIEWER", active: true },
  });
}
