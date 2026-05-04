import type { ExportRun } from "../domain/types.js";
import type { PrismaClient } from "../prisma-client.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface ExportRunPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopExportRunPersistence: ExportRunPersistencePort = {
  async hydrateIntoMemory() {},
};

export class PrismaExportRunPersistence implements ExportRunPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const rows = await this.prisma.exportRunRow.findMany();
    for (const row of rows) {
      const errs = row.validationErrors;
      const validationErrors = Array.isArray(errs)
        ? errs.filter((e): e is string => typeof e === "string")
        : [];
      const run: ExportRun = {
        id: row.id,
        tenantId: row.tenantId,
        entityType: row.entityType as ExportRun["entityType"],
        entityId: row.entityId,
        format: row.format as ExportRun["format"],
        status: row.status as ExportRun["status"],
        validationErrors,
        createdAt: row.createdAt,
        createdBy: row.createdBy,
      };
      repos.putExportRun(run);
    }
  }
}
