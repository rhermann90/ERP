import { randomUUID } from "node:crypto";
import { assertMeasurementCreateVersionAllowedForStatus } from "../domain/measurement-create-version-policy.js";
import {
  assertMeasurementTransitionAllowed,
  measurementVersionAllowsPositionEdit,
} from "../domain/measurement-lifecycle-policy.js";
import type {
  Measurement,
  MeasurementPosition,
  MeasurementStatus,
  MeasurementVersion,
  UserId,
} from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { LvMeasurementPersistencePort } from "../persistence/lv-measurement-persistence.js";
import { noopLvMeasurementPersistence } from "../persistence/lv-measurement-persistence.js";
import { AuditService } from "./audit-service.js";
import { LvReferenceValidator } from "./lv-reference-validator.js";

export type MeasurementPositionInput = {
  lvPositionId: string;
  quantity: number;
  unit: string;
  note?: string;
};

export class MeasurementService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly lvRef: LvReferenceValidator,
    private readonly persistence: LvMeasurementPersistencePort = noopLvMeasurementPersistence,
  ) {}

  public async createMeasurement(input: {
    tenantId: string;
    actorUserId: UserId;
    projectId: string;
    customerId: string;
    lvVersionId: string;
    positions: MeasurementPositionInput[];
    reason: string;
  }): Promise<{ measurementId: string; measurementVersionId: string }> {
    if (input.positions.length < 1) {
      throw new DomainError("MEASUREMENT_POSITIONS_REQUIRED", "Mindestens eine Aufmassposition erforderlich", 422);
    }
    this.lvRef.assertLvVersionExists(input.tenantId, input.lvVersionId);
    for (const p of input.positions) {
      this.lvRef.assertLvPositionBelongsToLvVersion(input.tenantId, p.lvPositionId, input.lvVersionId);
    }
    const measurementId = randomUUID();
    const versionId = randomUUID();
    const now = new Date();
    const measurement: Measurement = {
      id: measurementId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      customerId: input.customerId,
      lvVersionId: input.lvVersionId,
      currentVersionId: versionId,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    const version: MeasurementVersion = {
      id: versionId,
      tenantId: input.tenantId,
      measurementId,
      versionNumber: 1,
      status: "ENTWURF",
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.measurements.set(measurementId, measurement);
    this.repos.measurementVersions.set(versionId, version);
    for (const p of input.positions) {
      const pos: MeasurementPosition = {
        id: randomUUID(),
        tenantId: input.tenantId,
        measurementVersionId: versionId,
        lvPositionId: p.lvPositionId,
        quantity: p.quantity,
        unit: p.unit,
        note: p.note,
      };
      this.repos.measurementPositions.set(pos.id, pos);
    }
    this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "MEASUREMENT_VERSION",
      entityId: versionId,
      action: "VERSION_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: { measurementId, versionNumber: 1, status: "ENTWURF" },
    });
    await this.persistence.syncMeasurementSubgraphFromMemory(this.repos, input.tenantId, measurementId);
    return { measurementId, measurementVersionId: versionId };
  }

  public async transitionStatus(input: {
    tenantId: string;
    actorUserId: UserId;
    measurementVersionId: string;
    nextStatus: MeasurementStatus;
    reason: string;
  }): Promise<MeasurementVersion> {
    const version = this.repos.getMeasurementVersionByTenant(input.tenantId, input.measurementVersionId);
    if (!version) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmassversion nicht gefunden", 404);
    }
    const measurement = this.repos.getMeasurementByTenant(input.tenantId, version.measurementId);
    if (!measurement || measurement.currentVersionId !== version.id) {
      throw new DomainError(
        "MEASUREMENT_VERSION_NOT_CURRENT",
        "Statuswechsel nur fuer die aktuelle Aufmassversion zulaessig",
        409,
      );
    }
    assertMeasurementTransitionAllowed(version.status, input.nextStatus);
    const before = { status: version.status };
    version.status = input.nextStatus;
    this.repos.measurementVersions.set(version.id, version);
    this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "MEASUREMENT_VERSION",
      entityId: version.id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before,
      afterState: { status: input.nextStatus },
    });
    await this.persistence.syncMeasurementSubgraphFromMemory(this.repos, input.tenantId, measurement.id);
    return version;
  }

  public async createVersion(input: {
    tenantId: string;
    actorUserId: UserId;
    measurementId: string;
    reason: string;
  }): Promise<{ measurementVersionId: string; versionNumber: number }> {
    const measurement = this.repos.getMeasurementByTenant(input.tenantId, input.measurementId);
    if (!measurement) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmass nicht gefunden", 404);
    }
    const current = this.repos.getMeasurementVersionByTenant(input.tenantId, measurement.currentVersionId);
    if (!current) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aktuelle Aufmassversion nicht gefunden", 404);
    }
    assertMeasurementCreateVersionAllowedForStatus(current.status);
    const existingNumbers = [...this.repos.measurementVersions.values()]
      .filter((v) => v.measurementId === measurement.id && v.tenantId === input.tenantId)
      .map((v) => v.versionNumber);
    const nextNumber = Math.max(0, ...existingNumbers) + 1;
    const newVersionId = randomUUID();
    const now = new Date();
    const newVersion: MeasurementVersion = {
      id: newVersionId,
      tenantId: input.tenantId,
      measurementId: measurement.id,
      versionNumber: nextNumber,
      status: "ENTWURF",
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.measurementVersions.set(newVersionId, newVersion);
    const oldPositions = this.repos.listMeasurementPositionsForVersion(input.tenantId, current.id);
    for (const p of oldPositions) {
      const copy: MeasurementPosition = {
        id: randomUUID(),
        tenantId: input.tenantId,
        measurementVersionId: newVersionId,
        lvPositionId: p.lvPositionId,
        quantity: p.quantity,
        unit: p.unit,
        note: p.note,
      };
      this.repos.measurementPositions.set(copy.id, copy);
    }
    measurement.currentVersionId = newVersionId;
    this.repos.measurements.set(measurement.id, measurement);
    this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "MEASUREMENT_VERSION",
      entityId: newVersionId,
      action: "VERSION_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        measurementId: measurement.id,
        versionNumber: nextNumber,
        status: "ENTWURF",
        predecessorVersionId: current.id,
      },
    });
    await this.persistence.syncMeasurementSubgraphFromMemory(this.repos, input.tenantId, measurement.id);
    return { measurementVersionId: newVersionId, versionNumber: nextNumber };
  }

  public async updatePositions(input: {
    tenantId: string;
    actorUserId: UserId;
    measurementVersionId: string;
    positions: MeasurementPositionInput[];
    reason: string;
  }): Promise<MeasurementPosition[]> {
    if (input.positions.length < 1) {
      throw new DomainError("MEASUREMENT_POSITIONS_REQUIRED", "Mindestens eine Aufmassposition erforderlich", 422);
    }
    const version = this.repos.getMeasurementVersionByTenant(input.tenantId, input.measurementVersionId);
    if (!version) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmassversion nicht gefunden", 404);
    }
    const measurement = this.repos.getMeasurementByTenant(input.tenantId, version.measurementId);
    if (!measurement || measurement.currentVersionId !== version.id) {
      throw new DomainError(
        "MEASUREMENT_POSITION_EDIT_FORBIDDEN",
        "Positionen nur auf der aktuellen Aufmassversion und nur im Entwurf editierbar (§5.4)",
        409,
      );
    }
    if (!measurementVersionAllowsPositionEdit(version.status)) {
      throw new DomainError(
        "MEASUREMENT_POSITION_EDIT_FORBIDDEN",
        "Nach Freigabe nur Korrektur ueber neue Aufmassversion (§5.4)",
        409,
      );
    }
    for (const p of input.positions) {
      this.lvRef.assertLvPositionBelongsToLvVersion(input.tenantId, p.lvPositionId, measurement.lvVersionId);
    }
    const existing = this.repos.listMeasurementPositionsForVersion(input.tenantId, version.id);
    const beforeSummary = existing.map((p) => ({ lvPositionId: p.lvPositionId, quantity: p.quantity }));
    for (const p of existing) {
      this.repos.measurementPositions.delete(p.id);
    }
    const created: MeasurementPosition[] = [];
    for (const p of input.positions) {
      const pos: MeasurementPosition = {
        id: randomUUID(),
        tenantId: input.tenantId,
        measurementVersionId: version.id,
        lvPositionId: p.lvPositionId,
        quantity: p.quantity,
        unit: p.unit,
        note: p.note,
      };
      this.repos.measurementPositions.set(pos.id, pos);
      created.push(pos);
    }
    this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "MEASUREMENT_VERSION",
      entityId: version.id,
      action: "POSITIONS_UPDATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: { positions: beforeSummary },
      afterState: { positions: input.positions.map((p) => ({ lvPositionId: p.lvPositionId, quantity: p.quantity })) },
    });
    await this.persistence.syncMeasurementSubgraphFromMemory(this.repos, input.tenantId, measurement.id);
    return created;
  }

  public getVersionDetail(tenantId: string, measurementVersionId: string): {
    version: MeasurementVersion;
    measurementId: string;
    positions: MeasurementPosition[];
  } {
    const version = this.repos.getMeasurementVersionByTenant(tenantId, measurementVersionId);
    if (!version) {
      throw new DomainError("MEASUREMENT_NOT_FOUND", "Aufmassversion nicht gefunden", 404);
    }
    const positions = this.repos.listMeasurementPositionsForVersion(tenantId, version.id);
    return { version, measurementId: version.measurementId, positions };
  }
}
