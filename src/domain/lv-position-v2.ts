import type { LvPosition } from "./types.js";

/**
 * §9: Systemtext darf nach Anlage nicht durch Bearbeitungs-Endpunkte geändert werden
 * (Runtime erzwingt das; diese Hilfsfunktion dient Tests/Dokumentation).
 */
export function assertSystemTextUnchanged(before: LvPosition, after: LvPosition): void {
  if (before.systemText !== after.systemText) {
    throw new Error("LV systemText immutable per §9");
  }
}

/** Positions-Typ-Label (Normal / Alternativ / Eventual). */
export function positionKindLabel(kind: LvPosition["kind"]): "NORMAL" | "ALTERNATIV" | "EVENTUAL" {
  return kind;
}
