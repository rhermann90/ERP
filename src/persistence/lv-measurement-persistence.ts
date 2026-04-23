import type { PrismaClient } from "../prisma-client.js";
import type {
  LvCatalog,
  LvPosition,
  LvPositionKind,
  LvStructureKind,
  LvStructureNode,
  LvVersion,
  LvVersionStatus,
  Measurement,
  MeasurementPosition,
  MeasurementStatus,
  MeasurementVersion,
  TenantId,
  UUID,
} from "../domain/types.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export interface LvMeasurementPersistencePort {
  hydrateIntoMemory(repos: InMemoryRepositories): Promise<void>;
  syncLvCatalogSubgraphFromMemory(repos: InMemoryRepositories, tenantId: TenantId, catalogId: UUID): Promise<void>;
  syncMeasurementSubgraphFromMemory(repos: InMemoryRepositories, tenantId: TenantId, measurementId: UUID): Promise<void>;
  syncAllFromMemory(repos: InMemoryRepositories): Promise<void>;
}

export const noopLvMeasurementPersistence: LvMeasurementPersistencePort = {
  async hydrateIntoMemory() {},
  async syncLvCatalogSubgraphFromMemory() {},
  async syncMeasurementSubgraphFromMemory() {},
  async syncAllFromMemory() {},
};

function toDomainLvCatalog(row: {
  tenantId: string;
  id: string;
  projectId: string | null;
  name: string;
  currentVersionId: string;
  createdAt: Date;
  createdBy: string;
}): LvCatalog {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId ?? undefined,
    name: row.name,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainLvVersion(row: {
  tenantId: string;
  id: string;
  lvCatalogId: string;
  versionNumber: number;
  status: string;
  headerSystemText: string;
  headerEditingText: string;
  createdAt: Date;
  createdBy: string;
}): LvVersion {
  return {
    tenantId: row.tenantId,
    id: row.id,
    lvCatalogId: row.lvCatalogId,
    versionNumber: row.versionNumber,
    status: row.status as LvVersionStatus,
    headerSystemText: row.headerSystemText,
    headerEditingText: row.headerEditingText,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainLvNode(row: {
  tenantId: string;
  id: string;
  lvVersionId: string;
  parentNodeId: string | null;
  kind: string;
  sortOrdinal: string;
  systemText: string;
  editingText: string;
}): LvStructureNode {
  return {
    tenantId: row.tenantId,
    id: row.id,
    lvVersionId: row.lvVersionId,
    parentNodeId: row.parentNodeId,
    kind: row.kind as LvStructureKind,
    sortOrdinal: row.sortOrdinal,
    systemText: row.systemText,
    editingText: row.editingText,
  };
}

function toDomainLvPosition(row: {
  tenantId: string;
  id: string;
  lvVersionId: string;
  parentNodeId: string;
  sortOrdinal: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  kind: string;
  systemText: string;
  editingText: string;
  stammPositionsRef: string | null;
}): LvPosition {
  return {
    tenantId: row.tenantId,
    id: row.id,
    lvVersionId: row.lvVersionId,
    parentNodeId: row.parentNodeId,
    sortOrdinal: row.sortOrdinal,
    quantity: row.quantity,
    unit: row.unit,
    unitPriceCents: row.unitPriceCents,
    kind: row.kind as LvPositionKind,
    systemText: row.systemText,
    editingText: row.editingText,
    stammPositionsRef: row.stammPositionsRef ?? undefined,
  };
}

function toDomainMeasurement(row: {
  tenantId: string;
  id: string;
  projectId: string;
  customerId: string;
  lvVersionId: string;
  currentVersionId: string;
  createdAt: Date;
  createdBy: string;
}): Measurement {
  return {
    tenantId: row.tenantId,
    id: row.id,
    projectId: row.projectId,
    customerId: row.customerId,
    lvVersionId: row.lvVersionId,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainMeasurementVersion(row: {
  tenantId: string;
  id: string;
  measurementId: string;
  versionNumber: number;
  status: string;
  createdAt: Date;
  createdBy: string;
}): MeasurementVersion {
  return {
    tenantId: row.tenantId,
    id: row.id,
    measurementId: row.measurementId,
    versionNumber: row.versionNumber,
    status: row.status as MeasurementStatus,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

function toDomainMeasurementPosition(row: {
  tenantId: string;
  id: string;
  measurementVersionId: string;
  lvPositionId: string;
  quantity: number;
  unit: string;
  note: string | null;
}): MeasurementPosition {
  return {
    tenantId: row.tenantId,
    id: row.id,
    measurementVersionId: row.measurementVersionId,
    lvPositionId: row.lvPositionId,
    quantity: row.quantity,
    unit: row.unit,
    note: row.note ?? undefined,
  };
}

export class PrismaLvMeasurementPersistence implements LvMeasurementPersistencePort {
  constructor(private readonly prisma: PrismaClient) {}

  public async hydrateIntoMemory(repos: InMemoryRepositories): Promise<void> {
    const catalogs = await this.prisma.lvCatalog.findMany();
    for (const row of catalogs) {
      repos.lvCatalogs.set(row.id, toDomainLvCatalog(row));
    }
    const versions = await this.prisma.lvVersion.findMany();
    for (const row of versions) {
      repos.lvVersions.set(row.id, toDomainLvVersion(row));
    }
    const nodes = await this.prisma.lvStructureNode.findMany();
    for (const row of nodes) {
      repos.lvStructureNodes.set(row.id, toDomainLvNode(row));
    }
    const positions = await this.prisma.lvPosition.findMany();
    for (const row of positions) {
      repos.lvPositions.set(row.id, toDomainLvPosition(row));
    }
    const measurements = await this.prisma.measurement.findMany();
    for (const row of measurements) {
      repos.measurements.set(row.id, toDomainMeasurement(row));
    }
    const mvers = await this.prisma.measurementVersion.findMany();
    for (const row of mvers) {
      repos.measurementVersions.set(row.id, toDomainMeasurementVersion(row));
    }
    const mpos = await this.prisma.measurementPosition.findMany();
    for (const row of mpos) {
      repos.measurementPositions.set(row.id, toDomainMeasurementPosition(row));
    }
  }

  public async syncAllFromMemory(repos: InMemoryRepositories): Promise<void> {
    const seenCatalog = new Set<string>();
    for (const c of repos.lvCatalogs.values()) {
      const key = `${c.tenantId}:${c.id}`;
      if (seenCatalog.has(key)) continue;
      seenCatalog.add(key);
      await this.syncLvCatalogSubgraphFromMemory(repos, c.tenantId, c.id);
    }
    const seenMeas = new Set<string>();
    for (const m of repos.measurements.values()) {
      const key = `${m.tenantId}:${m.id}`;
      if (seenMeas.has(key)) continue;
      seenMeas.add(key);
      await this.syncMeasurementSubgraphFromMemory(repos, m.tenantId, m.id);
    }
  }

  public async syncLvCatalogSubgraphFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    catalogId: UUID,
  ): Promise<void> {
    const catalog = repos.getLvCatalogByTenant(tenantId, catalogId);
    if (!catalog) return;

    const versions = [...repos.lvVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.lvCatalogId === catalogId,
    );
    const versionIds = versions.map((v) => v.id);
    const nodes = [...repos.lvStructureNodes.values()].filter(
      (n) => n.tenantId === tenantId && versionIds.includes(n.lvVersionId),
    );
    const positions = [...repos.lvPositions.values()].filter(
      (p) => p.tenantId === tenantId && versionIds.includes(p.lvVersionId),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED`);
      // Katalog zuerst: FK lv_versions → lv_catalogs ist nicht deferrable; Katalog → aktuelle Version ist deferrable.
      await tx.lvCatalog.upsert({
        where: { tenantId_id: { tenantId: catalog.tenantId, id: catalog.id } },
        create: {
          tenantId: catalog.tenantId,
          id: catalog.id,
          projectId: catalog.projectId ?? null,
          name: catalog.name,
          currentVersionId: catalog.currentVersionId,
          createdAt: catalog.createdAt,
          createdBy: catalog.createdBy,
        },
        update: {
          projectId: catalog.projectId ?? null,
          name: catalog.name,
          currentVersionId: catalog.currentVersionId,
        },
      });
      for (const v of versions) {
        await tx.lvVersion.upsert({
          where: { tenantId_id: { tenantId: v.tenantId, id: v.id } },
          create: {
            tenantId: v.tenantId,
            id: v.id,
            lvCatalogId: v.lvCatalogId,
            versionNumber: v.versionNumber,
            status: v.status,
            headerSystemText: v.headerSystemText,
            headerEditingText: v.headerEditingText,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          },
          update: {
            versionNumber: v.versionNumber,
            status: v.status,
            headerSystemText: v.headerSystemText,
            headerEditingText: v.headerEditingText,
          },
        });
      }
      for (const n of nodes) {
        await tx.lvStructureNode.upsert({
          where: { tenantId_id: { tenantId: n.tenantId, id: n.id } },
          create: {
            tenantId: n.tenantId,
            id: n.id,
            lvVersionId: n.lvVersionId,
            parentNodeId: n.parentNodeId,
            kind: n.kind,
            sortOrdinal: n.sortOrdinal,
            systemText: n.systemText,
            editingText: n.editingText,
          },
          update: {
            lvVersionId: n.lvVersionId,
            parentNodeId: n.parentNodeId,
            kind: n.kind,
            sortOrdinal: n.sortOrdinal,
            systemText: n.systemText,
            editingText: n.editingText,
          },
        });
      }
      for (const p of positions) {
        await tx.lvPosition.upsert({
          where: { tenantId_id: { tenantId: p.tenantId, id: p.id } },
          create: {
            tenantId: p.tenantId,
            id: p.id,
            lvVersionId: p.lvVersionId,
            parentNodeId: p.parentNodeId,
            sortOrdinal: p.sortOrdinal,
            quantity: p.quantity,
            unit: p.unit,
            unitPriceCents: p.unitPriceCents,
            kind: p.kind,
            systemText: p.systemText,
            editingText: p.editingText,
            stammPositionsRef: p.stammPositionsRef ?? null,
          },
          update: {
            lvVersionId: p.lvVersionId,
            parentNodeId: p.parentNodeId,
            sortOrdinal: p.sortOrdinal,
            quantity: p.quantity,
            unit: p.unit,
            unitPriceCents: p.unitPriceCents,
            kind: p.kind,
            systemText: p.systemText,
            editingText: p.editingText,
            stammPositionsRef: p.stammPositionsRef ?? null,
          },
        });
      }
    });
  }

  public async syncMeasurementSubgraphFromMemory(
    repos: InMemoryRepositories,
    tenantId: TenantId,
    measurementId: UUID,
  ): Promise<void> {
    const measurement = repos.getMeasurementByTenant(tenantId, measurementId);
    if (!measurement) return;

    const versions = [...repos.measurementVersions.values()].filter(
      (v) => v.tenantId === tenantId && v.measurementId === measurementId,
    );
    const versionIds = versions.map((v) => v.id);
    const positions = [...repos.measurementPositions.values()].filter(
      (p) => p.tenantId === tenantId && versionIds.includes(p.measurementVersionId),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET CONSTRAINTS ALL DEFERRED`);
      // Aufmass-Zeile zuerst (current_version_id deferrable); Versionen benötigen measurement_id (nicht deferrable).
      await tx.measurement.upsert({
        where: { tenantId_id: { tenantId: measurement.tenantId, id: measurement.id } },
        create: {
          tenantId: measurement.tenantId,
          id: measurement.id,
          projectId: measurement.projectId,
          customerId: measurement.customerId,
          lvVersionId: measurement.lvVersionId,
          currentVersionId: measurement.currentVersionId,
          createdAt: measurement.createdAt,
          createdBy: measurement.createdBy,
        },
        update: {
          projectId: measurement.projectId,
          customerId: measurement.customerId,
          lvVersionId: measurement.lvVersionId,
          currentVersionId: measurement.currentVersionId,
        },
      });
      for (const v of versions) {
        await tx.measurementVersion.upsert({
          where: { tenantId_id: { tenantId: v.tenantId, id: v.id } },
          create: {
            tenantId: v.tenantId,
            id: v.id,
            measurementId: v.measurementId,
            versionNumber: v.versionNumber,
            status: v.status,
            createdAt: v.createdAt,
            createdBy: v.createdBy,
          },
          update: {
            versionNumber: v.versionNumber,
            status: v.status,
          },
        });
      }
      await tx.measurementPosition.deleteMany({
        where: { tenantId, measurementVersionId: { in: versionIds } },
      });
      for (const p of positions) {
        await tx.measurementPosition.create({
          data: {
            tenantId: p.tenantId,
            id: p.id,
            measurementVersionId: p.measurementVersionId,
            lvPositionId: p.lvPositionId,
            quantity: p.quantity,
            unit: p.unit,
            note: p.note ?? null,
          },
        });
      }
    });
  }
}
