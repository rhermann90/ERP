import { DomainError } from "../errors/domain-error.js";
import type { MeasurementStatus } from "./types.js";

export const ALLOWED_MEASUREMENT_TRANSITIONS: Record<MeasurementStatus, MeasurementStatus[]> = {
  ENTWURF: ["GEPRUEFT"],
  GEPRUEFT: ["FREIGEGEBEN"],
  FREIGEGEBEN: ["ABGERECHNET"],
  ABGERECHNET: ["ARCHIVIERT"],
  ARCHIVIERT: [],
};

export function assertMeasurementTransitionAllowed(from: MeasurementStatus, to: MeasurementStatus): void {
  if (!ALLOWED_MEASUREMENT_TRANSITIONS[from].includes(to)) {
    throw new DomainError(
      "MEASUREMENT_STATUS_TRANSITION_FORBIDDEN",
      "Aufmass-Statuswechsel laut §5.4 nicht zulaessig",
      409,
    );
  }
}

/** Positionen nur im Entwurf editierbar; ab Freigabe nur neue Aufmassversion (§5.4). */
export function measurementVersionAllowsPositionEdit(status: MeasurementStatus): boolean {
  return status === "ENTWURF";
}
