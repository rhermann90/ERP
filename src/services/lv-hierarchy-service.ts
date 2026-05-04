import { DomainError } from "../errors/domain-error.js";
import type { LvPosition, LvStructureNode } from "../domain/types.js";
import type { LvService } from "./lv-service.js";

/**
 * Lesende Projektionen §9 — identische Arrays wie `GET /lv/versions/{id}` (Knoten/Positionen),
 * ohne Katalog- und Versionskopf. Kein Feldumbenennen: `editingText` wie Domäne/API-Resource.
 */
export class LvHierarchyService {
  constructor(private readonly lvService: LvService) {}

  public getHierarchySnapshotForHttpHeaders(
    rawHeaders: unknown,
    lvVersionId: string,
  ): {
    lvVersionId: string;
    structureNodes: LvStructureNode[];
    positions: LvPosition[];
  } {
    const snap = this.lvService.getVersionSnapshotForHttpHeaders(rawHeaders, lvVersionId);
    return {
      lvVersionId: snap.version.id,
      structureNodes: snap.structureNodes,
      positions: snap.positions,
    };
  }

  public getPositionForHttpHeaders(rawHeaders: unknown, lvVersionId: string, positionId: string): LvPosition {
    const snap = this.lvService.getVersionSnapshotForHttpHeaders(rawHeaders, lvVersionId);
    const pos = snap.positions.find((p) => p.id === positionId);
    if (!pos) {
      throw new DomainError("LV_POSITION_NOT_FOUND", "LV-Position nicht gefunden", 404);
    }
    return pos;
  }

  public getStructureNodeForHttpHeaders(
    rawHeaders: unknown,
    lvVersionId: string,
    nodeId: string,
  ): LvStructureNode {
    const snap = this.lvService.getVersionSnapshotForHttpHeaders(rawHeaders, lvVersionId);
    const node = snap.structureNodes.find((n) => n.id === nodeId);
    if (!node) {
      throw new DomainError("LV_NODE_NOT_FOUND", "Strukturknoten nicht gefunden", 404);
    }
    return node;
  }
}
