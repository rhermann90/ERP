import { randomUUID } from "node:crypto";
import { assertOfferCreateVersionAllowedForStatus } from "../domain/offer-create-version-policy.js";
import { DomainError } from "../errors/domain-error.js";
import { Offer, OfferStatus, OfferVersion, TenantId, UserId, UUID } from "../domain/types.js";
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

  /** Neues Angebots-Aggregat mit erster Version (ENTWURF). */
  public async createOfferWithInitialVersion(input: {
    tenantId: TenantId;
    actorUserId: UserId;
    projectId: UUID;
    customerId: UUID;
    lvVersionId: UUID;
    systemText: string;
    editingText: string;
    reason: string;
  }): Promise<{ offerId: UUID; offerVersionId: UUID }> {
    this.lvRef.assertLvVersionExists(input.tenantId, input.lvVersionId);
    const lv = this.repos.getLvVersionByTenant(input.tenantId, input.lvVersionId);
    if (!lv) {
      throw new DomainError("LV_VERSION_NOT_FOUND", "LV-Version nicht gefunden", 404);
    }
    const catalog = this.repos.getLvCatalogByTenant(input.tenantId, lv.lvCatalogId);
    if (catalog?.projectId != null && catalog.projectId !== input.projectId) {
      throw new DomainError(
        "LV_PROJECT_MISMATCH",
        "LV-Katalog ist einem anderen Projekt zugeordnet als angegeben",
        422,
      );
    }

    const offerId = randomUUID();
    const offerVersionId = randomUUID();
    const now = new Date();

    const version: OfferVersion = {
      id: offerVersionId,
      tenantId: input.tenantId,
      offerId,
      versionNumber: 1,
      status: "ENTWURF",
      lvVersionId: input.lvVersionId,
      systemText: input.systemText,
      editingText: input.editingText,
      createdAt: now,
      createdBy: input.actorUserId,
    };

    const offer: Offer = {
      id: offerId,
      tenantId: input.tenantId,
      projectId: input.projectId,
      customerId: input.customerId,
      currentVersionId: offerVersionId,
      createdAt: now,
      createdBy: input.actorUserId,
    };

    this.repos.putOfferVersion(version);
    this.repos.putOffer(offer);
    await this.offerPersistence.syncOfferSubgraphFromMemory(this.repos, input.tenantId, offerId);
    await this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "OFFER_VERSION",
      entityId: offerVersionId,
      action: "VERSION_CREATED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: now,
      beforeState: {},
      afterState: { offerId, versionNumber: 1, status: "ENTWURF" },
    });

    return { offerId, offerVersionId };
  }

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

  /** Lesepfad für PWA-Shell — gleiche Tenant-Isolation wie Repos. */
  public getVersionDetail(tenantId: TenantId, offerVersionId: UUID): OfferVersion {
    const version = this.repos.getOfferVersionByTenant(tenantId, offerVersionId);
    if (!version) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Angebotsversion nicht gefunden", 404);
    }
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

  /** Lesepfad Pilot/PWA: Angebotsköpfe je Projekt mit aktueller Version (tenant-gefiltert). */
  public listProjectOffers(tenantId: TenantId, projectId: UUID): {
    data: Array<{
      offerId: UUID;
      projectId: UUID;
      customerId: UUID;
      currentOfferVersionId: UUID;
      createdAt: string;
      currentVersion: {
        id: UUID;
        versionNumber: number;
        status: OfferStatus;
        lvVersionId: UUID;
        createdAt: string;
      };
    }>;
  } {
    if (!this.repos.tenantHasProjectContext(tenantId, projectId)) {
      throw new DomainError("PROJECT_NOT_FOUND", "Projekt-Kontext fuer Mandant nicht gefunden", 404);
    }
    const rows = this.repos.listOffersForProject(tenantId, projectId);
    const sorted = [...rows].sort((a, b) => {
      const t = a.createdAt.getTime() - b.createdAt.getTime();
      if (t !== 0) return t;
      return a.id.localeCompare(b.id);
    });
    const data = sorted.map((offer) => {
      const v = this.repos.getOfferVersionByTenant(tenantId, offer.currentVersionId);
      if (!v) {
        throw new DomainError("OFFER_INCONSISTENT", "Aktuelle Angebotsversion fehlt im Repository", 500);
      }
      return {
        offerId: offer.id,
        projectId: offer.projectId,
        customerId: offer.customerId,
        currentOfferVersionId: offer.currentVersionId,
        createdAt: offer.createdAt.toISOString(),
        currentVersion: {
          id: v.id,
          versionNumber: v.versionNumber,
          status: v.status,
          lvVersionId: v.lvVersionId,
          createdAt: v.createdAt.toISOString(),
        },
      };
    });
    return { data };
  }
}
