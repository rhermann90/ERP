import { randomUUID } from "node:crypto";
import {
  assertStageOrdinalInRange,
  findEmailTemplateBodyForStage,
  findStageFeeCents,
  formatEmailFooterBlockPlainText,
  formatEurFromCents,
  substituteDunningEmailPlaceholders,
} from "../domain/dunning-email-compose.js";
import type { DunningEmailFooterFields } from "../domain/dunning-email-footer.js";
import type { AuditEvent, DunningEmailSend, TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { MailTransportPort } from "../integrations/smtp-mail-transport.js";
import type { DunningEmailSendPersistencePort } from "../persistence/dunning-email-send-persistence.js";
import type { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "./audit-service.js";
import type { DunningEmailFooterService } from "./dunning-email-footer-service.js";
import type { DunningReminderConfigService } from "./dunning-reminder-config-service.js";
import type { DunningReminderTemplateService } from "./dunning-reminder-template-service.js";
import type { InvoiceService } from "./invoice-service.js";

export type DunningEmailPreviewRow = {
  stageOrdinal: number;
  templateBodyRaw: string;
  templateBodyWithPlaceholders: string;
  footerPlainText: string;
  fullPlainText: string;
  readyForEmailFooter: boolean;
  missingMandatoryFields: string[];
  impressumComplianceTier: string;
  impressumGaps: string[];
  warnings: string[];
};

export type DunningEmailPreviewResponse = { data: DunningEmailPreviewRow };

export type DunningEmailSendStubResponse = {
  data: {
    outcome: "NOT_SENT_NO_SMTP";
    stageOrdinal: number;
    auditEventId: UUID;
    message: string;
  };
};

export type DunningEmailSendResponse = {
  data: {
    outcome: "SENT" | "REPLAY";
    stageOrdinal: number;
    auditEventId: UUID;
    smtpMessageId?: string;
    recipientEmail: string;
    message: string;
  };
};

function skontoPreviewFromInvoice(inv: { lvNetCents?: number; skontoBps: number }): { skontoBetragEur: string; skontofristDatum: string } {
  if (inv.lvNetCents == null || inv.skontoBps <= 0) {
    return { skontoBetragEur: formatEurFromCents(0), skontofristDatum: "—" };
  }
  const skontoCents = Math.round((inv.lvNetCents * inv.skontoBps) / 10_000);
  return { skontoBetragEur: formatEurFromCents(skontoCents), skontofristDatum: "—" };
}

function normEmail(s: string): string {
  return s.trim().toLowerCase();
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

export class DunningReminderEmailService {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly configService: DunningReminderConfigService,
    private readonly templateService: DunningReminderTemplateService,
    private readonly footerService: DunningEmailFooterService,
    private readonly audit: AuditService,
    private readonly repos: InMemoryRepositories,
    private readonly dunningEmailSendPersistence: DunningEmailSendPersistencePort,
    private readonly mailTransport: MailTransportPort,
  ) {}

  public async preview(input: {
    tenantId: TenantId;
    invoiceId: UUID;
    stageOrdinal: number;
    reason: string;
  }): Promise<DunningEmailPreviewResponse> {
    assertStageOrdinalInRange(input.stageOrdinal);
    const inv = this.invoiceService.getInvoice(input.tenantId, input.invoiceId);
    const [cfg, tpl, footerRm] = await Promise.all([
      this.configService.getReadModel(input.tenantId),
      this.templateService.getReadModel(input.tenantId),
      this.footerService.getReadModel(input.tenantId),
    ]);
    const templateBody = findEmailTemplateBodyForStage(tpl.stages, input.stageOrdinal);
    if (!templateBody) {
      throw new DomainError("DUNNING_EMAIL_TEMPLATE_NOT_FOUND", "Keine E-Mail-Vorlage für diese Stufe", 404);
    }
    const feeCents = findStageFeeCents(cfg.stages, input.stageOrdinal);
    if (feeCents === null) {
      throw new DomainError("DUNNING_EMAIL_STAGE_CONFIG_NOT_FOUND", "Keine Mahnstufen-Konfiguration für diese Stufe", 404);
    }
    const sk = skontoPreviewFromInvoice(inv);
    const ctx = {
      mahngebuehrEur: formatEurFromCents(feeCents),
      skontoBetragEur: sk.skontoBetragEur,
      skontofristDatum: inv.issueDate ?? sk.skontofristDatum,
    };
    const templateBodyWithPlaceholders = substituteDunningEmailPlaceholders(templateBody, ctx);
    const footerFields: DunningEmailFooterFields = {
      companyLegalName: footerRm.companyLegalName,
      streetLine: footerRm.streetLine,
      postalCode: footerRm.postalCode,
      city: footerRm.city,
      countryCode: footerRm.countryCode,
      publicEmail: footerRm.publicEmail,
      publicPhone: footerRm.publicPhone,
      legalRepresentative: footerRm.legalRepresentative,
      registerCourt: footerRm.registerCourt,
      registerNumber: footerRm.registerNumber,
      vatId: footerRm.vatId,
      signatureLine: footerRm.signatureLine,
    };
    const footerPlainText = formatEmailFooterBlockPlainText(footerFields);
    const fullPlainText = `${templateBodyWithPlaceholders}\n\n---\n${footerPlainText}`.trim();
    const warnings: string[] = [];
    if (!footerRm.readyForEmailFooter) {
      warnings.push("Footer: technische Mindestfelder unvollständig (readyForEmailFooter=false).");
    }
    if (footerRm.impressumGaps.length > 0) {
      warnings.push(`Impressum-Heuristik: ${footerRm.impressumGaps.join(", ")}`);
    }
    if (inv.skontoBps > 0 && !inv.issueDate) {
      warnings.push("Skonto-Frist in der Vorschau nicht gesetzt (Rechnung ohne Ausstellungsdatum).");
    }
    return {
      data: {
        stageOrdinal: input.stageOrdinal,
        templateBodyRaw: templateBody,
        templateBodyWithPlaceholders,
        footerPlainText,
        fullPlainText,
        readyForEmailFooter: footerRm.readyForEmailFooter,
        missingMandatoryFields: footerRm.missingMandatoryFields,
        impressumComplianceTier: footerRm.impressumComplianceTier,
        impressumGaps: footerRm.impressumGaps,
        warnings,
      },
    };
  }

  public async sendStub(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    invoiceId: UUID;
    stageOrdinal: number;
    reason: string;
  }): Promise<DunningEmailSendStubResponse> {
    const preview = await this.preview({
      tenantId: input.tenantId,
      invoiceId: input.invoiceId,
      stageOrdinal: input.stageOrdinal,
      reason: input.reason,
    });
    if (!preview.data.readyForEmailFooter) {
      throw new DomainError(
        "DUNNING_EMAIL_FOOTER_NOT_READY",
        "E-Mail-Versand (Stub): Footer-Stammdaten technisch unvollständig.",
        400,
        { missingMandatoryFields: preview.data.missingMandatoryFields },
      );
    }
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: input.invoiceId,
      action: "DUNNING_EMAIL_SEND_STUB",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {
        stageOrdinal: input.stageOrdinal,
        outcome: "NOT_SENT_NO_SMTP",
        previewBytes: preview.data.fullPlainText.length,
      },
    };
    await this.audit.append(auditEvent);
    return {
      data: {
        outcome: "NOT_SENT_NO_SMTP",
        stageOrdinal: input.stageOrdinal,
        auditEventId: auditEvent.id,
        message: "Kein SMTP-Versand in diesem Slice; nur Audit-Protokoll.",
      },
    };
  }

  /**
   * M4 Slice 5a: echter SMTP-Versand (global `ERP_SMTP_*`), Idempotenz über Header + Persistenz.
   */
  public async sendEmail(input: {
    tenantId: TenantId;
    actorUserId: UUID;
    invoiceId: UUID;
    stageOrdinal: number;
    reason: string;
    toEmail: string;
    idempotencyKey: UUID;
  }): Promise<DunningEmailSendResponse> {
    assertStageOrdinalInRange(input.stageOrdinal);
    const existing = this.repos.getDunningEmailSendByIdempotency(input.tenantId, input.idempotencyKey);
    if (existing) {
      if (
        existing.invoiceId !== input.invoiceId ||
        existing.stageOrdinal !== input.stageOrdinal ||
        normEmail(existing.recipientEmail) !== normEmail(input.toEmail)
      ) {
        throw new DomainError(
          "DUNNING_EMAIL_IDEMPOTENCY_MISMATCH",
          "Idempotency-Key bereits für andere Parameter verwendet",
          400,
        );
      }
      return {
        data: {
          outcome: "REPLAY",
          stageOrdinal: input.stageOrdinal,
          auditEventId: existing.auditEventId,
          smtpMessageId: existing.smtpMessageId,
          recipientEmail: existing.recipientEmail,
          message: "Gleicher Idempotency-Key: vorheriger Versand wird zurückgegeben.",
        },
      };
    }

    const preview = await this.preview({
      tenantId: input.tenantId,
      invoiceId: input.invoiceId,
      stageOrdinal: input.stageOrdinal,
      reason: input.reason,
    });
    if (!preview.data.readyForEmailFooter) {
      throw new DomainError(
        "DUNNING_EMAIL_FOOTER_NOT_READY",
        "E-Mail-Versand: Footer-Stammdaten technisch unvollständig.",
        400,
        { missingMandatoryFields: preview.data.missingMandatoryFields },
      );
    }
    if (!this.mailTransport.isConfigured()) {
      throw new DomainError(
        "DUNNING_EMAIL_SMTP_NOT_CONFIGURED",
        "SMTP nicht konfiguriert (ERP_SMTP_HOST leer oder Transport deaktiviert).",
        503,
      );
    }

    const inv = this.invoiceService.getInvoice(input.tenantId, input.invoiceId);
    const footerRm = await this.footerService.getReadModel(input.tenantId);
    const subjectNr = inv.invoiceNumber?.trim() || input.invoiceId;
    const subject = `Mahnung Stufe ${input.stageOrdinal} — Rechnung ${subjectNr}`;
    const fromHeader = footerRm.publicEmail.trim().length > 0 ? footerRm.publicEmail.trim() : "";

    let smtpMessageId: string;
    try {
      const sent = await this.mailTransport.send({
        from: fromHeader,
        to: input.toEmail.trim(),
        subject,
        text: preview.data.fullPlainText,
      });
      smtpMessageId = sent.messageId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new DomainError("DUNNING_EMAIL_SMTP_ERROR", `SMTP-Versand fehlgeschlagen: ${msg}`, 502);
    }

    const auditEvent: AuditEvent = {
      id: randomUUID(),
      tenantId: input.tenantId,
      entityType: "INVOICE",
      entityId: input.invoiceId,
      action: "DUNNING_EMAIL_SENT",
      timestamp: new Date(),
      actorUserId: input.actorUserId,
      reason: input.reason,
      beforeState: {},
      afterState: {
        stageOrdinal: input.stageOrdinal,
        recipientEmail: input.toEmail.trim(),
        smtpMessageId,
        idempotencyKey: input.idempotencyKey,
      },
    };
    await this.audit.append(auditEvent);

    const row: DunningEmailSend = {
      id: randomUUID(),
      tenantId: input.tenantId,
      invoiceId: input.invoiceId,
      idempotencyKey: input.idempotencyKey,
      stageOrdinal: input.stageOrdinal,
      recipientEmail: input.toEmail.trim(),
      auditEventId: auditEvent.id,
      smtpMessageId,
      createdAt: new Date(),
    };
    this.repos.putDunningEmailSend(row);
    try {
      await this.dunningEmailSendPersistence.persistSend(row);
    } catch (err) {
      this.repos.removeDunningEmailSend(row);
      if (isPrismaUniqueViolation(err)) {
        const replay = this.repos.getDunningEmailSendByIdempotency(input.tenantId, input.idempotencyKey);
        if (replay) {
          return {
            data: {
              outcome: "REPLAY",
              stageOrdinal: replay.stageOrdinal,
              auditEventId: replay.auditEventId,
              smtpMessageId: replay.smtpMessageId,
              recipientEmail: replay.recipientEmail,
              message: "Konkurrierender Versand: Idempotenz-Treffer nach Persistenz-Kollision.",
            },
          };
        }
      }
      throw err;
    }

    return {
      data: {
        outcome: "SENT",
        stageOrdinal: input.stageOrdinal,
        auditEventId: auditEvent.id,
        smtpMessageId,
        recipientEmail: row.recipientEmail,
        message: "E-Mail wurde über SMTP versendet.",
      },
    };
  }
}
