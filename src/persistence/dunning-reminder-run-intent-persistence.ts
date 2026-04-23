import type { PrismaClient } from "@prisma/client";
import type { TenantId, UUID } from "../domain/types.js";

export type DunningReminderRunIntentRow = {
  id: UUID;
  tenantId: TenantId;
  idempotencyKey: UUID;
  fingerprint: string;
  responseJson: string;
};

export interface DunningReminderRunIntentPersistencePort {
  findByTenantAndKey(tenantId: TenantId, idempotencyKey: UUID): Promise<DunningReminderRunIntentRow | null>;
  insert(row: DunningReminderRunIntentRow): Promise<void>;
}

export const noopDunningReminderRunIntentPersistence: DunningReminderRunIntentPersistencePort = {
  async findByTenantAndKey() {
    return null;
  },
  async insert() {},
};

/** Prozesslokaler Store (Vitest / repositoryMode memory). */
export class MemoryDunningReminderRunIntentPersistence implements DunningReminderRunIntentPersistencePort {
  private readonly store = new Map<string, DunningReminderRunIntentRow>();

  public async findByTenantAndKey(tenantId: TenantId, idempotencyKey: UUID): Promise<DunningReminderRunIntentRow | null> {
    return this.store.get(`${tenantId}:${idempotencyKey}`) ?? null;
  }

  public async insert(row: DunningReminderRunIntentRow): Promise<void> {
    const k = `${row.tenantId}:${row.idempotencyKey}`;
    if (this.store.has(k)) {
      const err = new Error("Unique constraint failed");
      Object.assign(err, { code: "P2002" });
      throw err;
    }
    this.store.set(k, row);
  }
}

export class PrismaDunningReminderRunIntentPersistence implements DunningReminderRunIntentPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByTenantAndKey(tenantId: TenantId, idempotencyKey: UUID): Promise<DunningReminderRunIntentRow | null> {
    const row = await this.prisma.dunningReminderRunIntent.findUnique({
      where: {
        tenantId_idempotencyKey: { tenantId, idempotencyKey },
      },
    });
    if (!row) return null;
    return {
      id: row.id as UUID,
      tenantId: row.tenantId as TenantId,
      idempotencyKey: row.idempotencyKey as UUID,
      fingerprint: row.fingerprint,
      responseJson: row.responseJson,
    };
  }

  public async insert(row: DunningReminderRunIntentRow): Promise<void> {
    await this.prisma.dunningReminderRunIntent.create({
      data: {
        id: row.id,
        tenantId: row.tenantId,
        idempotencyKey: row.idempotencyKey,
        fingerprint: row.fingerprint,
        responseJson: row.responseJson,
      },
    });
  }
}
