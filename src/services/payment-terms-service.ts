import { randomUUID } from "node:crypto";
import type { PaymentTermsHead, PaymentTermsVersion, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import type { PaymentTermsPersistencePort } from "../persistence/payment-terms-persistence.js";
import { AuditService } from "./audit-service.js";

export type CreatePaymentTermsVersionInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  projectId: UUID;
  customerId: UUID;
  termsLabel: string;
  reason: string;
};

export class PaymentTermsService {
  constructor(
    private readonly repos: InMemoryRepositories,
    private readonly audit: AuditService,
    private readonly persistence: PaymentTermsPersistencePort,
  ) {}

  public async createVersion(input: CreatePaymentTermsVersionInput): Promise<{
    paymentTermsVersionId: UUID;
    paymentTermsHeadId: UUID;
    versionNumber: number;
    projectId: UUID;
  }> {
    const existingHead = this.repos.getPaymentTermsHeadByTenantProject(input.tenantId, input.projectId);
    if (existingHead && existingHead.customerId !== input.customerId) {
      throw new DomainError("VALIDATION_FAILED", "customerId weicht vom bestehenden Konditionskopf ab", 409);
    }

    const now = new Date();
    let headId: UUID;
    let versionNumber: number;

    if (!existingHead) {
      headId = randomUUID();
      const head: PaymentTermsHead = {
        id: headId,
        tenantId: input.tenantId,
        projectId: input.projectId,
        customerId: input.customerId,
        createdAt: now,
        createdBy: input.actorUserId,
      };
      this.repos.putPaymentTermsHead(head);
      versionNumber = 1;
    } else {
      headId = existingHead.id;
      const forHead = [...this.repos.paymentTermsVersions.values()].filter(
        (v) => v.tenantId === input.tenantId && v.headId === headId,
      );
      versionNumber = forHead.length === 0 ? 1 : Math.max(...forHead.map((v) => v.versionNumber)) + 1;
    }

    const version: PaymentTermsVersion = {
      id: randomUUID(),
      tenantId: input.tenantId,
      headId,
      versionNumber,
      termsLabel: input.termsLabel,
      createdAt: now,
      createdBy: input.actorUserId,
    };
    this.repos.putPaymentTermsVersion(version);

    await this.persistence.syncPaymentTermsSubgraphFromMemory(this.repos, input.tenantId, headId);

    await this.audit.append({
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "PAYMENT_TERMS_VERSION",
      entityId: version.id,
      action: "VERSION_CREATED",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      afterState: {
        versionNumber: version.versionNumber,
        termsLabel: version.termsLabel,
        headId: version.headId,
        projectId: input.projectId,
      },
    });

    return {
      paymentTermsVersionId: version.id,
      paymentTermsHeadId: headId,
      versionNumber,
      projectId: input.projectId,
    };
  }

  /** Lesepfad FIN-1 (Spez: Lesen/Schreiben mit Audit) — Konditionskopf + alle Versionen sortiert. */
  public listForProject(tenantId: TenantId, projectId: UUID): {
    paymentTermsHeadId: UUID;
    projectId: UUID;
    customerId: UUID;
    createdAt: string;
    createdBy: UUID;
    versions: Array<{
      paymentTermsVersionId: UUID;
      versionNumber: number;
      termsLabel: string;
      createdAt: string;
      createdBy: UUID;
    }>;
  } {
    const head = this.repos.getPaymentTermsHeadByTenantProject(tenantId, projectId);
    if (!head) {
      throw new DomainError("DOCUMENT_NOT_FOUND", "Kein Konditionskopf fuer dieses Projekt", 404);
    }
    const versions = [...this.repos.paymentTermsVersions.values()]
      .filter((v) => v.tenantId === tenantId && v.headId === head.id)
      .sort((a, b) => a.versionNumber - b.versionNumber)
      .map((v) => ({
        paymentTermsVersionId: v.id,
        versionNumber: v.versionNumber,
        termsLabel: v.termsLabel,
        createdAt: v.createdAt.toISOString(),
        createdBy: v.createdBy,
      }));
    return {
      paymentTermsHeadId: head.id,
      projectId: head.projectId,
      customerId: head.customerId,
      createdAt: head.createdAt.toISOString(),
      createdBy: head.createdBy,
      versions,
    };
  }
}
