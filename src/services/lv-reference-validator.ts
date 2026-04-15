import { DomainError } from "../errors/domain-error.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export class LvReferenceValidator {
  constructor(private readonly repos: InMemoryRepositories) {}

  public assertLvVersionExists(tenantId: string, lvVersionId: string): void {
    const v = this.repos.getLvVersionByTenant(tenantId, lvVersionId);
    if (!v) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "LV-Version nicht gefunden", 404);
    }
  }

  public assertLvPositionBelongsToLvVersion(tenantId: string, lvPositionId: string, lvVersionId: string): void {
    const pos = this.repos.getLvPositionByTenant(tenantId, lvPositionId);
    if (!pos) {
      throw new DomainError("LV_POSITION_NOT_FOUND", "LV-Position nicht gefunden", 404);
    }
    if (pos.lvVersionId !== lvVersionId) {
      throw new DomainError(
        "LV_POSITION_VERSION_MISMATCH",
        "LV-Position gehoert nicht zur angegebenen LV-Version",
        422,
      );
    }
  }
}
