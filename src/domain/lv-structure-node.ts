import type { LvStructureNode } from "./types.js";

/** Bereich nur als Wurzel (§9). */
export function isBereichRootNode(node: Pick<LvStructureNode, "kind" | "parentNodeId">): boolean {
  return node.kind === "BEREICH" && node.parentNodeId === null;
}

/** Knoten gehört zu dieser LV-Version. */
export function structureNodeVersionId(node: LvStructureNode): string {
  return node.lvVersionId;
}
