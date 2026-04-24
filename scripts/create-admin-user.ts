/**
 * Einmaliges Anlegen/Aktualisieren eines ADMIN-Benutzers (Postgres).
 *
 *   ERP_ADMIN_EMAIL=… ERP_ADMIN_PASSWORD=… [ERP_ADMIN_TENANT_ID=…] npx tsx scripts/create-admin-user.ts
 *
 * Ohne ERP_ADMIN_TENANT_ID: Seed-Mandant aus `SEED_IDS` (Demo-LV-Mandant).
 * Lädt Projekt-`.env` (einfache `KEY=value`-Zeilen), falls `DATABASE_URL` noch fehlt oder leer ist.
 */
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { SEED_IDS } from "../src/composition/seed.js";

const BCRYPT_COST = 12;

function mergeDotEnvIfNeeded(): void {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const dotEnvPath = resolve(projectRoot, ".env");
  if (!existsSync(dotEnvPath)) return;
  if (process.env.DATABASE_URL?.trim()) return;
  for (const line of readFileSync(dotEnvPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!v) continue;
    if (process.env[k] === undefined || (k === "DATABASE_URL" && !process.env.DATABASE_URL?.trim())) {
      process.env[k] = v;
    }
  }
}

mergeDotEnvIfNeeded();

const tenantId = (process.env.ERP_ADMIN_TENANT_ID ?? SEED_IDS.tenantId).trim();
const emailNorm = (process.env.ERP_ADMIN_EMAIL ?? "").trim().toLowerCase();
const passwordPlain = process.env.ERP_ADMIN_PASSWORD ?? "";

if (!emailNorm || !passwordPlain) {
  console.error("Pflicht: ERP_ADMIN_EMAIL, ERP_ADMIN_PASSWORD");
  process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "DATABASE_URL fehlt oder ist leer. Bitte in `.env` setzen (postgresql://…) oder exportieren, dann erneut ausführen.",
  );
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

try {
  const passwordHash = bcrypt.hashSync(passwordPlain, BCRYPT_COST);
  const now = new Date();
  const row = await prisma.user.upsert({
    where: { tenantId_emailNorm: { tenantId, emailNorm } },
    create: {
      tenantId,
      id: randomUUID(),
      emailNorm,
      passwordHash,
      role: "ADMIN",
      active: true,
      createdAt: now,
    },
    update: { passwordHash, role: "ADMIN", active: true },
  });
  console.log(JSON.stringify({ ok: true, tenantId, userId: row.id, emailNorm: row.emailNorm, role: row.role }, null, 2));
} finally {
  await prisma.$disconnect();
}
