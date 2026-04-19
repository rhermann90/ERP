import { randomUUID } from "node:crypto";
import { DomainError } from "../errors/domain-error.js";
import { SupplementStatus, SupplementVersion, TenantId, UserId, UUID } from "../domain/types.js";
import { noopSupplementPersistence, type SupplementPersistencePort } from "../persistence/supplement-persistence.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "./audit-service.js";
import { LvReferenceValidator } from "./lv-reference-validator.js";

const ALLOWED_SUPPLEMENT_TRANSITIONS: Record<SupplementStatus, SupplementStatus[]> = {
  ENTWURF: ["IN_FREIGABE", "ARCHIVIERT"],
  IN_FREIGABE: ["FREIGEGEBEN", "ENTWURF", "ARCHIVIERT"],
  FREIGEGEBEN: ["VERSENDET", "ARCHIVIERT"],
  VERSENDET: ["BEAUFTRAGT", "ABGELEHNT", "ARCHIVIERT"],
  BEAUFTRAGT: ["ARCHIVIERT"],
  ABGELEHNT: ["ARCHIVIERT"],
  ARCHIVIERT: [],
};

export class SupplementService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly auditService: AuditService,
    private readonly lvRef: LvReferenceValidator,
    private readonly supplementPersistence: SupplementPersistencePort = noopSupplementPersistence,
  ) {}

  public async createFromAcceptedOffer(input: {
    tenantId: TenantId;
    offerId: UUID;
    baseOfferVersionId: UUID;
    lvVersionId: UUID;
    editingText: string;
    actorUserId: UserId;
    reason: string;
  }): Promise<SupplementVersion> {
    const offer = this.repos.getOfferByTenant(input.tenantId, input.offerId);
    if (!offer) {
      throw new DomainError("OFFER_NOT_FOUND", "Angebot nicht gefunden", 404);
    }
    const baseVersion = this.repos.getOfferVersionByTenant(input.tenantId, input.baseOfferVersionId);
    if (!baseVersion || baseVersion.offerId !== offer.id) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Basis-Angebotsversion nicht gefunden", 404);
    }
    const currentVersion = this.repos.getOfferVersionByTenant(input.tenantId, offer.currentVersionId);
    if (!currentVersion) {
      throw new DomainError("OFFER_VERSION_NOT_FOUND", "Aktuelle Angebotsversion nicht gefunden", 404);
    }
    if (currentVersion.status !== "ANGENOMMEN" || baseVersion.status !== "ANGENOMMEN") {
      throw new DomainError(
        "SUPPLEMENT_BASE_NOT_ACCEPTED",
        "Nachtrag ist nur für angenommene Basis-Angebotsversion zulässig",
        409,
      );
    }
    this.lvRef.assertLvVersionExists(input.tenantId, input.lvVersionId);

    const supplementOfferId = randomUUID();
    const supplementVersion: SupplementVersion = {
      id: randomUUID(),
      tenantId: input.tenantId,
      supplementOfferId,
      versionNumber: 1,
      status: "ENTWURF",
      lvVersionId: input.lvVersionId,
      systemText: baseVersion.systemText,
      editingText: input.editingText,
      createdAt: new Date(),
      createdBy: input.actorUserId,
    };
    this.repos.putSupplementOffer({
      id: supplementOfferId,
      tenantId: input.tenantId,
      offerId: input.offerId,
      baseOfferVersionId: input.baseOfferVersionId,
      createdAt: new Date(),
      createdBy: input.actorUserId,
    });
    this.repos.putSupplementVersion(supplementVersion);
    await this.supplementPersistence.syncSupplementSubgraphFromMemory(this.repos, input.tenantId, supplementOfferId);
    this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "SUPPLEMENT_VERSION",
      entityId: supplementVersion.id,
      action: "VERSION_CREATED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: new Date(),
      beforeState: { baseOfferVersionId: input.baseOfferVersionId },
      afterState: { supplementVersionId: supplementVersion.id },
    });
    return supplementVersion;
  }

  public getById(tenantId: TenantId, supplementVersionId: UUID): {
    id: UUID;
    status: SupplementStatus;
    baseOfferVersionId: UUID;
    supplementOfferId: UUID;
    tenantId: TenantId;
  } {
    const version = this.repos.getSupplementVersionByTenant(tenantId, supplementVersionId);
    if (!version) {
      throw new DomainError("SUPPLEMENT_NOT_FOUND", "Nachtragsversion nicht gefunden", 404);
    }
    const offer = this.repos.getSupplementOfferByTenant(tenantId, version.supplementOfferId);
    if (!offer) {
      throw new DomainError("SUPPLEMENT_NOT_FOUND", "Nachtragsangebot nicht gefunden", 404);
    }
    return {
      id: version.id,
      status: version.status,
      baseOfferVersionId: offer.baseOfferVersionId,
      supplementOfferId: version.supplementOfferId,
      tenantId: version.tenantId,
    };
  }

  public async transitionStatus(input: {
    tenantId: TenantId;
    supplementVersionId: UUID;
    nextStatus: SupplementStatus;
    actorUserId: UserId;
    reason: string;
  }): Promise<SupplementVersion> {
    const current = this.repos.getSupplementVersionByTenant(input.tenantId, input.supplementVersionId);
    if (!current) {
      throw new DomainError("SUPPLEMENT_NOT_FOUND", "Nachtragsversion nicht gefunden", 404);
    }
    if (!ALLOWED_SUPPLEMENT_TRANSITIONS[current.status].includes(input.nextStatus)) {
      throw new DomainError("SUPPLEMENT_STATUS_TRANSITION_FORBIDDEN", "Ungültiger Nachtrags-Statuswechsel", 409);
    }
    const updated: SupplementVersion = { ...current, status: input.nextStatus };
    this.repos.putSupplementVersion(updated);
    await this.supplementPersistence.syncSupplementSubgraphFromMemory(
      this.repos,
      input.tenantId,
      updated.supplementOfferId,
    );
    this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "SUPPLEMENT_VERSION",
      entityId: updated.id,
      action: "STATUS_CHANGED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: new Date(),
      beforeState: { status: current.status },
      afterState: { status: updated.status },
    });
    return updated;
  }

  public applyBillingImpact(input: {
    tenantId: TenantId;
    supplementVersionId: UUID;
    invoiceId: UUID;
    actorUserId: UserId;
    reason: string;
  }): { invoiceId: UUID; supplementVersionId: UUID } {
    const supplement = this.repos.getSupplementVersionByTenant(input.tenantId, input.supplementVersionId);
    if (!supplement) {
      throw new DomainError("SUPPLEMENT_NOT_FOUND", "Nachtragsversion nicht gefunden", 404);
    }
    if (supplement.status !== "BEAUFTRAGT") {
      throw new DomainError(
        "SUPPLEMENT_BILLING_EFFECT_FORBIDDEN",
        "Wirkung auf abrechenbare Strukturen erst ab Status BEAUFTRAGT zulässig",
        409,
      );
    }
    const supplementOffer = this.repos.getSupplementOfferByTenant(input.tenantId, supplement.supplementOfferId);
    if (!supplementOffer) {
      throw new DomainError("SUPPLEMENT_NOT_FOUND", "Nachtragsangebot nicht gefunden", 404);
    }
    const invoice = this.repos.getInvoiceByTenant(input.tenantId, input.invoiceId);
    if (!invoice) {
      throw new DomainError("EXPORT_ENTITY_NOT_FOUND", "Rechnung nicht gefunden", 404);
    }

    const link = this.repos.traceabilityLinks.get(invoice.id);
    if (!link || link.tenantId !== input.tenantId) {
      throw new DomainError("TRACEABILITY_LINK_MISSING", "Traceability-Link für Rechnung fehlt", 422);
    }
    const updatedInvoice = {
      ...invoice,
      supplementOfferId: supplementOffer.id,
      supplementVersionId: supplement.id,
    };
    this.repos.invoices.set(updatedInvoice.id, updatedInvoice);
    this.repos.traceabilityLinks.set(updatedInvoice.id, {
      ...link,
      supplementOfferId: supplementOffer.id,
      supplementVersionId: supplement.id,
    });
    this.auditService.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: updatedInvoice.id,
      action: "STATUS_CHANGED",
      actorUserId: input.actorUserId,
      reason: input.reason,
      timestamp: new Date(),
      beforeState: { supplementVersionId: invoice.supplementVersionId ?? null },
      afterState: { supplementVersionId: updatedInvoice.supplementVersionId },
    });
    return { invoiceId: updatedInvoice.id, supplementVersionId: supplement.id };
  }
}
