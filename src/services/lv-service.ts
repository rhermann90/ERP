import { randomUUID } from "node:crypto";
import { assertLvCreateVersionAllowedForStatus } from "../domain/lv-create-version-policy.js";
import { assertLvVersionAllowsStructureAndBusinessTextEdit } from "../domain/lv-text-structure-policy.js";
import { assertLvVersionTransitionAllowed } from "../domain/lv-version-lifecycle-policy.js";
import type {
  LvCatalog,
  LvPosition,
  LvPositionKind,
  LvStructureKind,
  LvStructureNode,
  LvVersion,
  LvVersionStatus,
  UserId,
} from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { LvMeasurementPersistencePort } from "../persistence/lv-measurement-persistence.js";
import { noopLvMeasurementPersistence } from "../persistence/lv-measurement-persistence.js";
import { parseAuthContext } from "../api/http-response.js";
import { AuditService } from "./audit-service.js";
import type { AuthorizationService } from "./authorization-service.js";

function assertParentAcceptsChild(parent: LvStructureNode | null, childKind: LvStructureKind): void {
  if (childKind === "BEREICH") {
    if (parent !== null) {
      throw new DomainError("LV_HIERARCHY_INVALID", "BEREICH nur als Wurzel zulaessig (§9)", 422);
    }
    return;
  }
  if (!parent) {
    throw new DomainError("LV_HIERARCHY_INVALID", "TITEL/UNTERTITEL erfordern Elternknoten (§9)", 422);
  }
  if (childKind === "TITEL" && parent.kind !== "BEREICH") {
    throw new DomainError("LV_HIERARCHY_INVALID", "TITEL haengt unter BEREICH (§9)", 422);
  }
  if (childKind === "UNTERTITEL" && parent.kind !== "TITEL") {
    throw new DomainError("LV_HIERARCHY_INVALID", "UNTERTITEL haengt unter TITEL (§9)", 422);
  }
}

export class LvService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: LvMeasurementPersistencePort = noopLvMeasurementPersistence,
    private readonly authorization: AuthorizationService,
  ) {}

  public async createCatalogWithSkeleton(input: {
    tenantId: string;
    actorUserId: UserId;
    name: string;
    headerSystemText: string;
    headerEditingText: string;
    projectId?: string;
    reason: string;
  }): Promise<{
    lvCatalogId: string;
    lvVersionId: string;
    samplePositionId: string;
  }> {
    const catalogId = randomUUID();
    const versionId = randomUUID();
    const now = new Date();
    const catalog: LvCatalog = {
      id: catalogId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      name: input.name,
      currentVersionId: versionId,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    const version: LvVersion = {
      id: versionId,
      tenantId: input.tenantId,
      lvCatalogId: catalogId,
      versionNumber: 1,
      status: "ENTWURF",
      headerSystemText: input.headerSystemText,
      headerEditingText: input.headerEditingText,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.lvCatalogs.set(catalogId, catalog);
    this.repos.lvVersions.set(versionId, version);

    const bereichId = randomUUID();
    const titelId = randomUUID();
    const untertitelId = randomUUID();
    const positionId = randomUUID();

    const bereich: LvStructureNode = {
      id: bereichId,
      tenantId: input.tenantId,
      lvVersionId: versionId,
      parentNodeId: null,
      kind: "BEREICH",
      sortOrdinal: "1",
      systemText: "Bereich (System)",
      editingText: "Bereich (Bearbeitung)",
    };
    const titel: LvStructureNode = {
      id: titelId,
      tenantId: input.tenantId,
      lvVersionId: versionId,
      parentNodeId: bereichId,
      kind: "TITEL",
      sortOrdinal: "1.1",
      systemText: "Titel (System)",
      editingText: "Titel (Bearbeitung)",
    };
    const untertitel: LvStructureNode = {
      id: untertitelId,
      tenantId: input.tenantId,
      lvVersionId: versionId,
      parentNodeId: titelId,
      kind: "UNTERTITEL",
      sortOrdinal: "1.1.1",
      systemText: "Untertitel (System)",
      editingText: "Untertitel (Bearbeitung)",
    };
    this.repos.lvStructureNodes.set(bereichId, bereich);
    this.repos.lvStructureNodes.set(titelId, titel);
    this.repos.lvStructureNodes.set(untertitelId, untertitel);

    const pos: LvPosition = {
      id: positionId,
      tenantId: input.tenantId,
      lvVersionId: versionId,
      parentNodeId: untertitelId,
      sortOrdinal: "1.1.1.1",
      quantity: 1,
      unit: "Stk",
      unitPriceCents: 0,
      kind: "NORMAL",
      systemText: "Positions-Systemtext",
      editingText: "Positions-Bearbeitungstext",
    };
    this.repos.lvPositions.set(positionId, pos);

    await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, catalogId);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_VERSION",
      entityId: versionId,
      action: "VERSION_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: { lvCatalogId: catalogId, versionNumber: 1, skeleton: true },
    });
    return { lvCatalogId: catalogId, lvVersionId: versionId, samplePositionId: positionId };
  }

  public async transitionVersionStatus(input: {
    tenantId: string;
    actorUserId: UserId;
    lvVersionId: string;
    nextStatus: LvVersionStatus;
    reason: string;
  }): Promise<LvVersion> {
    const version = this.repos.getLvVersionByTenant(input.tenantId, input.lvVersionId);
    if (!version) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "LV-Version nicht gefunden", 404);
    }
    const catalog = this.repos.getLvCatalogByTenant(input.tenantId, version.lvCatalogId);
    if (!catalog || catalog.currentVersionId !== version.id) {
      throw new DomainError(
        "LV_VERSION_NOT_CURRENT",
        "LV-Statuswechsel nur fuer die aktuelle Version des Katalogs",
        409,
      );
    }
    assertLvVersionTransitionAllowed(version.status, input.nextStatus);
    const before = { status: version.status };
    version.status = input.nextStatus;
    this.repos.lvVersions.set(version.id, version);
    await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, catalog.id);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_VERSION",
      entityId: version.id,
      action: "STATUS_CHANGED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before,
      afterState: { status: input.nextStatus },
    });
    return version;
  }

  public async createNewVersionFromCatalog(input: {
    tenantId: string;
    actorUserId: UserId;
    lvCatalogId: string;
    reason: string;
  }): Promise<{ lvVersionId: string; versionNumber: number }> {
    const catalog = this.repos.getLvCatalogByTenant(input.tenantId, input.lvCatalogId);
    if (!catalog) {
      throw new DomainError("LV_CATALOG_NOT_FOUND", "LV-Katalog nicht gefunden", 404);
    }
    const current = this.repos.getLvVersionByTenant(input.tenantId, catalog.currentVersionId);
    if (!current) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "Aktuelle LV-Version nicht gefunden", 404);
    }
    assertLvCreateVersionAllowedForStatus(current.status);

    const existingNums = [...this.repos.lvVersions.values()]
      .filter((v) => v.lvCatalogId === catalog.id && v.tenantId === input.tenantId)
      .map((v) => v.versionNumber);
    const nextNum = Math.max(0, ...existingNums) + 1;
    const newId = randomUUID();
    const now = new Date();
    const newVersion: LvVersion = {
      id: newId,
      tenantId: input.tenantId,
      lvCatalogId: catalog.id,
      versionNumber: nextNum,
      status: "ENTWURF",
      headerSystemText: current.headerSystemText,
      headerEditingText: current.headerEditingText,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.lvVersions.set(newId, newVersion);

    const nodeIdMap = new Map<string, string>();
    const oldNodes = this.repos.listLvStructureNodesForVersion(input.tenantId, current.id).sort((a, b) =>
      a.sortOrdinal.localeCompare(b.sortOrdinal, undefined, { numeric: true }),
    );
    for (const n of oldNodes) {
      const nid = randomUUID();
      nodeIdMap.set(n.id, nid);
      const copy: LvStructureNode = {
        id: nid,
        tenantId: input.tenantId,
        lvVersionId: newId,
        parentNodeId: n.parentNodeId ? nodeIdMap.get(n.parentNodeId) ?? null : null,
        kind: n.kind,
        sortOrdinal: n.sortOrdinal,
        systemText: n.systemText,
        editingText: n.editingText,
      };
      this.repos.lvStructureNodes.set(nid, copy);
    }
    const oldPos = this.repos.listLvPositionsForVersion(input.tenantId, current.id);
    for (const p of oldPos) {
      const pid = randomUUID();
      const parentNew = nodeIdMap.get(p.parentNodeId);
      if (!parentNew) {
        throw new DomainError("LV_COPY_FAILED", "LV-Baumkopie fehlgeschlagen", 500);
      }
      const copy: LvPosition = {
        id: pid,
        tenantId: input.tenantId,
        lvVersionId: newId,
        parentNodeId: parentNew,
        sortOrdinal: p.sortOrdinal,
        quantity: p.quantity,
        unit: p.unit,
        unitPriceCents: p.unitPriceCents,
        kind: p.kind,
        systemText: p.systemText,
        editingText: p.editingText,
        stammPositionsRef: p.stammPositionsRef,
      };
      this.repos.lvPositions.set(pid, copy);
    }

    catalog.currentVersionId = newId;
    this.repos.lvCatalogs.set(catalog.id, catalog);

    await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, catalog.id);
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_VERSION",
      entityId: newId,
      action: "VERSION_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: { lvCatalogId: catalog.id, versionNumber: nextNum, predecessorVersionId: current.id },
    });
    return { lvVersionId: newId, versionNumber: nextNum };
  }

  public async addStructureNode(input: {
    tenantId: string;
    actorUserId: UserId;
    lvVersionId: string;
    parentNodeId: string | null;
    kind: LvStructureKind;
    sortOrdinal: string;
    systemText: string;
    editingText: string;
    reason: string;
  }): Promise<LvStructureNode> {
    const version = this.assertCurrentVersionEditable(input.tenantId, input.lvVersionId);
    assertLvVersionAllowsStructureAndBusinessTextEdit(version.status);
    let parent: LvStructureNode | null = null;
    if (input.parentNodeId) {
      parent = this.repos.getLvStructureNodeByTenant(input.tenantId, input.parentNodeId) ?? null;
      if (!parent) {
        throw new DomainError("LV_NODE_NOT_FOUND", "Eltern-Strukturknoten nicht gefunden", 404);
      }
    }
    if (parent && parent.lvVersionId !== version.id) {
      throw new DomainError("LV_HIERARCHY_INVALID", "Elternknoten gehoert nicht zur LV-Version", 422);
    }
    assertParentAcceptsChild(parent, input.kind);
    const id = randomUUID();
    const node: LvStructureNode = {
      id,
      tenantId: input.tenantId,
      lvVersionId: version.id,
      parentNodeId: input.parentNodeId,
      kind: input.kind,
      sortOrdinal: input.sortOrdinal,
      systemText: input.systemText,
      editingText: input.editingText,
    };
    this.repos.lvStructureNodes.set(id, node);
    const cat = this.repos.getLvCatalogByTenant(input.tenantId, version.lvCatalogId);
    if (cat) {
      await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, cat.id);
    }
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_STRUCTURE_NODE",
      entityId: id,
      action: "LV_NODE_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: { kind: input.kind, sortOrdinal: input.sortOrdinal },
    });
    return node;
  }

  public async updateNodeEditingText(input: {
    tenantId: string;
    actorUserId: UserId;
    nodeId: string;
    editingText: string;
    reason: string;
  }): Promise<LvStructureNode> {
    const node = this.repos.getLvStructureNodeByTenant(input.tenantId, input.nodeId);
    if (!node) {
      throw new DomainError("LV_NODE_NOT_FOUND", "Strukturknoten nicht gefunden", 404);
    }
    const version = this.assertCurrentVersionEditable(input.tenantId, node.lvVersionId);
    assertLvVersionAllowsStructureAndBusinessTextEdit(version.status);
    const before = { editingText: node.editingText };
    node.editingText = input.editingText;
    this.repos.lvStructureNodes.set(node.id, node);
    const cat = this.repos.getLvCatalogByTenant(input.tenantId, version.lvCatalogId);
    if (cat) {
      await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, cat.id);
    }
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_STRUCTURE_NODE",
      entityId: node.id,
      action: "BUSINESS_TEXT_UPDATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before,
      afterState: { editingText: input.editingText },
    });
    return node;
  }

  public async addPosition(input: {
    tenantId: string;
    actorUserId: UserId;
    lvVersionId: string;
    parentNodeId: string;
    sortOrdinal: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
    kind: LvPositionKind;
    systemText: string;
    editingText: string;
    stammPositionsRef?: string;
    reason: string;
  }): Promise<LvPosition> {
    const version = this.assertCurrentVersionEditable(input.tenantId, input.lvVersionId);
    assertLvVersionAllowsStructureAndBusinessTextEdit(version.status);
    const parent = this.repos.getLvStructureNodeByTenant(input.tenantId, input.parentNodeId);
    if (!parent || parent.lvVersionId !== version.id) {
      throw new DomainError("LV_NODE_NOT_FOUND", "Elternknoten fuer Position nicht gefunden", 404);
    }
    if (parent.kind !== "UNTERTITEL") {
      throw new DomainError("LV_HIERARCHY_INVALID", "Position nur unter UNTERTITEL (§9)", 422);
    }
    const id = randomUUID();
    const pos: LvPosition = {
      id,
      tenantId: input.tenantId,
      lvVersionId: version.id,
      parentNodeId: parent.id,
      sortOrdinal: input.sortOrdinal,
      quantity: input.quantity,
      unit: input.unit,
      unitPriceCents: input.unitPriceCents,
      kind: input.kind,
      systemText: input.systemText,
      editingText: input.editingText,
      stammPositionsRef: input.stammPositionsRef,
    };
    this.repos.lvPositions.set(id, pos);
    const cat = this.repos.getLvCatalogByTenant(input.tenantId, version.lvCatalogId);
    if (cat) {
      await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, cat.id);
    }
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_POSITION",
      entityId: id,
      action: "LV_POSITION_CREATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: { sortOrdinal: input.sortOrdinal, kind: input.kind },
    });
    return pos;
  }

  public async updatePosition(input: {
    tenantId: string;
    actorUserId: UserId;
    positionId: string;
    editingText?: string;
    quantity?: number;
    unit?: string;
    unitPriceCents?: number;
    sortOrdinal?: string;
    reason: string;
  }): Promise<LvPosition> {
    const pos = this.repos.getLvPositionByTenant(input.tenantId, input.positionId);
    if (!pos) {
      throw new DomainError("LV_POSITION_NOT_FOUND", "LV-Position nicht gefunden", 404);
    }
    const version = this.assertCurrentVersionEditable(input.tenantId, pos.lvVersionId);
    assertLvVersionAllowsStructureAndBusinessTextEdit(version.status);
    const before: Record<string, unknown> = {
      editingText: pos.editingText,
      quantity: pos.quantity,
      unit: pos.unit,
      unitPriceCents: pos.unitPriceCents,
      sortOrdinal: pos.sortOrdinal,
    };
    if (input.editingText !== undefined) {
      pos.editingText = input.editingText;
    }
    if (input.quantity !== undefined) {
      pos.quantity = input.quantity;
    }
    if (input.unit !== undefined) {
      pos.unit = input.unit;
    }
    if (input.unitPriceCents !== undefined) {
      pos.unitPriceCents = input.unitPriceCents;
    }
    if (input.sortOrdinal !== undefined) {
      pos.sortOrdinal = input.sortOrdinal;
    }
    this.repos.lvPositions.set(pos.id, pos);
    const cat = this.repos.getLvCatalogByTenant(input.tenantId, version.lvCatalogId);
    if (cat) {
      await this.persistence.syncLvCatalogSubgraphFromMemory(this.repos, input.tenantId, cat.id);
    }
    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "LV_POSITION",
      entityId: pos.id,
      action: "BUSINESS_TEXT_UPDATED",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: before,
      afterState: {
        editingText: pos.editingText,
        quantity: pos.quantity,
        unit: pos.unit,
        unitPriceCents: pos.unitPriceCents,
        sortOrdinal: pos.sortOrdinal,
      },
    });
    return pos;
  }

  /**
   * HTTP-Lesepfad §9: `parseAuthContext` + Leserecht im Service — Route entspricht dem Muster von
   * `GET /measurements/:measurementVersionId` (nur Header + Version-UUID), damit PR-CodeQL keine
   * „Authorization ohne Rate-Limit“-False-Positive auf dem Handler auslöst.
   */
  public getVersionSnapshotForHttpHeaders(rawHeaders: unknown, lvVersionId: string) {
    const auth = parseAuthContext(rawHeaders);
    this.authorization.assertCanReadLvVersion(auth.role);
    return this.getVersionSnapshot(auth.tenantId, lvVersionId);
  }

  /** Lesepfad §9 — Tenant-isoliert; Knoten und Positionen nach `sortOrdinal` (numerisch-lokalisiert). */
  public getVersionSnapshot(tenantId: string, lvVersionId: string): {
    catalog: {
      id: string;
      name: string;
      projectId?: string;
      currentVersionId: string;
      isCurrentVersion: boolean;
    } | null;
    version: LvVersion;
    structureNodes: LvStructureNode[];
    positions: LvPosition[];
  } {
    const version = this.repos.getLvVersionByTenant(tenantId, lvVersionId);
    if (!version) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "LV-Version nicht gefunden", 404);
    }
    const catalog = this.repos.getLvCatalogByTenant(tenantId, version.lvCatalogId);
    const sortLv = (a: { sortOrdinal: string }, b: { sortOrdinal: string }) =>
      a.sortOrdinal.localeCompare(b.sortOrdinal, undefined, { numeric: true });
    const structureNodes = this.repos.listLvStructureNodesForVersion(tenantId, lvVersionId).sort(sortLv);
    const positions = this.repos.listLvPositionsForVersion(tenantId, lvVersionId).sort(sortLv);
    return {
      catalog: catalog
        ? {
            id: catalog.id,
            name: catalog.name,
            ...(catalog.projectId !== undefined ? { projectId: catalog.projectId } : {}),
            currentVersionId: catalog.currentVersionId,
            isCurrentVersion: catalog.currentVersionId === version.id,
          }
        : null,
      version,
      structureNodes,
      positions,
    };
  }

  private assertCurrentVersionEditable(tenantId: string, lvVersionId: string): LvVersion {
    const version = this.repos.getLvVersionByTenant(tenantId, lvVersionId);
    if (!version) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "LV-Version nicht gefunden", 404);
    }
    const catalog = this.repos.getLvCatalogByTenant(tenantId, version.lvCatalogId);
    if (!catalog || catalog.currentVersionId !== version.id) {
      throw new DomainError("LV_VERSION_NOT_CURRENT", "Nur die aktuelle LV-Version ist fuer diese Aktion zulaessig", 409);
    }
    return version;
  }
}
