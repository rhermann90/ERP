import { DomainError } from "../errors/domain-error.js";
import type { MeasurementStatus } from "./types.js";

/** Nach §5.4: Korrektur nach Freigabe nur über neue Aufmassversion — abgeschlossene ARCHIVIERT-Version nicht fortsetzbar. */
export const MEASUREMENT_CREATE_VERSION_ALLOWED_STATUSES = new Set<MeasurementStatus>(["FREIGEGEBEN", "ABGERECHNET"]);

export function assertMeasurementCreateVersionAllowedForStatus(status: MeasurementStatus): void {
  if (!MEASUREMENT_CREATE_VERSION_ALLOWED_STATUSES.has(status)) {
    throw new DomainError(
      "MEASUREMENT_NEW_VERSION_FORBIDDEN",
      "Neue Aufmassversion nur nach Freigabe bzw. bei abgerechneter Version zulaessig (§5.4)",
      409,
    );
  }
}

export function statusAllowsMeasurementCreateVersion(status: MeasurementStatus): boolean {
  return MEASUREMENT_CREATE_VERSION_ALLOWED_STATUSES.has(status);
}
