import { randomUUID } from "node:crypto";
import { assertOfferCreateVersionAllowedForStatus } from "../domain/offer-create-version-policy.js";
import { DomainError } from "../errors/domain-error.js";
import { OfferStatus, OfferVersion, TenantId, UserId, UUID } from "../domain/types.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { OfferPersistencePort } from "../persistence/offer-persistence.js";
import { noopOfferPersistence } from "../persistence/offer-persistence.js";
import { AuditService } from "./audit-service.js";
import { LvReferenceValidator } from "./lv-reference-validator.js";

const ALLOWED_STATUS_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  ENTWURF: ["IN_FREIGABE", "ARCHIVIERT"],
  IN_FREIGABE: ["FREIGEGEBEN", "ENTWURF", "ARCHIVIERT"],
  FREIGEGEBEN: ["VERSENDET", "ARCHIVIERT"],
  VERSENDET: ["ANGENOMMEN", "ABGELEHNT", "ARCHIVIERT"],
  ANGENOMMEN: ["ARCHIVIERT"],
  ABGELEHNT: ["ARCHIVIERT"],
  ARCHIVIERT: [],
};

export class OfferService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly auditService: AuditService,
    private readonly lvRef: LvReferenceValidator,
    private readonly offerPersistence: OfferPersistencePort = noopOfferPersistence,
  ) {}

  public async createVersion(input: {
    tenantId: TenantId;
    offerId: UUID;
    lvVersionId: UUID;
    editingText: string;
    actorUserId: UserId;
    reason: string;
  }): Promise<OfferVersion> {
    const offer = this.repos.getOfferByTenant(input.tenantId, input.offerId);
    if (!offer) {
      throw new DomainError("OFFER_NOT_FOUND", "Angebot nicht gefunden", 404);
    }
    const currentVersion = this.repos.getOfferVersionByTenant(input.tenantId, offer.currentVersionId);
    if (!currentVersion) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Aktuelle Angebotsversion nicht gefunden", 404);
    }
    assertOfferCreateVersionAllowedForStatus(currentVersion.status);
    this.lvRef.assertLvVersionExists(input.tenantId, input.lvVersionId);

    const version: OfferVersion = {
      id: randomUUID(),
      tenantId: input.tenantId,
      offerId: input.offerId,
      versionNumber: currentVersion.versionNumber + 1,
      status: "ENTWURF",
      lvVersionId: input.lvVersionId,
      systemText: currentVersion.systemText,
      editingText: input.editingText,
      createdAt: new Date(),
      createdBy: input.actorUserId,
    };

    this.repos.putOfferVersion(version);
    this.repos.putOffer({ ...offer, currentVersionId: version.id });
    await this.offerPersistence.syncOfferSubgraphFromMemory(this.repos, input.tenantId, offer.id);
    await this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "OFFER_VERSION",
      entityId: version.id,
      action: "VERSION_CREATED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: new Date(),
      beforeState: { versionNumber: currentVersion.versionNumber },
      afterState: { versionNumber: version.versionNumber },
    });
    return version;
  }

  public async transitionStatus(input: {
    tenantId: TenantId;
    offerVersionId: UUID;
    nextStatus: OfferStatus;
    actorUserId: UserId;
    reason: string;
  }): Promise<OfferVersion> {
    const version = this.repos.getOfferVersionByTenant(input.tenantId, input.offerVersionId);
    if (!version) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Angebotsversion nicht gefunden", 404);
    }
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[version.status];
    if (!allowedNext.includes(input.nextStatus)) {
      throw new DomainError("STATUS_TRANSITION_FORBIDDEN", "Ungültiger Statuswechsel", 409);
    }

    const updated: OfferVersion = {
      ...version,
      status: input.nextStatus,
      releasedAt: input.nextStatus === "FREIGEGEBEN" ? new Date() : version.releasedAt,
    };
    this.repos.putOfferVersion(updated);
    await this.offerPersistence.syncOfferSubgraphFromMemory(this.repos, input.tenantId, version.offerId);
    await this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "OFFER_VERSION",
      entityId: version.id,
      action: "STATUS_CHANGED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: new Date(),
      beforeState: { status: version.status },
      afterState: { status: updated.status },
    });
    return updated;
  }
}
