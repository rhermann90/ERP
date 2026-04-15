import { DomainError } from "../errors/domain-error.js";
import type { LvVersionStatus } from "./types.js";

/** Struktur und Bearbeitungstext nur in ENTWURF; Systemtext nie per Update-API (§9). */
export function assertLvVersionAllowsStructureAndBusinessTextEdit(status: LvVersionStatus): void {
  if (status !== "ENTWURF") {
    throw new DomainError(
      "LV_STRUCTURE_LOCKED",
      "LV-Struktur und Bearbeitungstext nur im Status ENTWURF aenderbar (§9)",
      409,
    );
  }
}

export function lvVersionAllowsStructureEdit(status: LvVersionStatus): boolean {
  return status === "ENTWURF";
}

export function assertSystemTextNotInUpdatePayload(payload: Record<string, unknown>, fieldName: string): void {
  if (fieldName in payload) {
    throw new DomainError(
      "LV_SYSTEM_TEXT_IMMUTABLE",
      "Systemtext ist unveraenderlich und darf nicht per Update gesendet werden (§9)",
      409,
    );
  }
}
