import { DomainError } from "../errors/domain-error.js";
import type { LvVersionStatus } from "./types.js";

/** Nicht-destruktive LV-Version: nur von freigegebener Version (§6 / §9, analog Aufmass). */
export const LV_CREATE_VERSION_ALLOWED_STATUSES = new Set<LvVersionStatus>(["FREIGEGEBEN"]);

export function assertLvCreateVersionAllowedForStatus(status: LvVersionStatus): void {
  if (!LV_CREATE_VERSION_ALLOWED_STATUSES.has(status)) {
    throw new DomainError(
      "LV_NEW_VERSION_FORBIDDEN",
      "Neue LV-Version nur nach FREIGEGEBEN zulaessig",
      409,
    );
  }
}

export function statusAllowsLvCreateVersion(status: LvVersionStatus): boolean {
  return LV_CREATE_VERSION_ALLOWED_STATUSES.has(status);
}
