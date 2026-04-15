import { DomainError } from "../errors/domain-error.js";
import type { LvVersionStatus } from "./types.js";

export const ALLOWED_LV_VERSION_TRANSITIONS: Record<LvVersionStatus, LvVersionStatus[]> = {
  ENTWURF: ["FREIGEGEBEN"],
  FREIGEGEBEN: ["ARCHIVIERT"],
  ARCHIVIERT: [],
};

export function assertLvVersionTransitionAllowed(from: LvVersionStatus, to: LvVersionStatus): void {
  if (!ALLOWED_LV_VERSION_TRANSITIONS[from].includes(to)) {
    throw new DomainError("LV_STATUS_TRANSITION_FORBIDDEN", "LV-Statuswechsel laut §9 nicht zulaessig", 409);
  }
}
