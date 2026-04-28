import type { TenantId, UUID } from "../domain/types.js";
import { DomainError } from "../errors/domain-error.js";
import type { DunningReminderCandidatesService } from "./dunning-reminder-candidates-service.js";
import type { DunningReminderEmailService } from "./dunning-reminder-email-service.js";
import type { DunningTenantAutomationService } from "./dunning-tenant-automation-service.js";

/**
 * Max. Empfaengerzeilen pro Request.
 * Kanonische Doku: `docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md` — Abschnitt **Implementationsanker** (bei Aenderung Spec-Zeile Rate-Limit dort mitpflegen).
 */
export const DUNNING_BATCH_EMAIL_MAX_ITEMS = 25;

export type DunningBatchEmailItemInput = {
  invoiceId: UUID;
  toEmail: string;
  idempotencyKey?: UUID;
};

export type DunningBatchEmailRunInput = {
  tenantId: TenantId;
  actorUserId: UUID;
  stageOrdinal: number;
  reason: string;
  asOfDate?: string;
  mode: "DRY_RUN" | "EXECUTE";
  /** Pflicht bei EXECUTE: explizite API-Bestaetigung (kein stiller Massenversand). */
  confirmBatchSend?: boolean;
  items: DunningBatchEmailItemInput[];
};

export type DunningBatchEmailRowResult = {
  invoiceId: UUID;
  toEmail: string;
  outcome: "WOULD_SEND" | "BLOCKED" | "SENT" | "REPLAY" | "FAILED";
  code?: string;
  message?: string;
  auditEventId?: UUID;
  smtpMessageId?: string;
};

export class DunningReminderBatchEmailService {
  constructor(
    private readonly candidatesService: DunningReminderCandidatesService,
    private readonly automationService: DunningTenantAutomationService,
    private readonly emailService: DunningReminderEmailService,
  ) {}

  public async run(input: DunningBatchEmailRunInput): Promise<{
    data: {
      mode: "DRY_RUN" | "EXECUTE";
      stageOrdinal: number;
      asOfDate: string;
      results: DunningBatchEmailRowResult[];
    };
  }> {
    const automation = await this.automationService.getReadModel(input.tenantId);
    if (automation.runMode === "OFF") {
      throw new DomainError(
        "DUNNING_REMINDER_RUN_DISABLED",
        "Mahnlauf ist fuer diesen Mandanten auf AUS (OFF); Batch-E-Mail ist nicht verfuegbar.",
        409,
      );
    }

    if (input.items.length === 0) {
      throw new DomainError("VALIDATION_FAILED", "items muss mindestens ein Element enthalten", 400);
    }
    if (input.items.length > DUNNING_BATCH_EMAIL_MAX_ITEMS) {
      throw new DomainError(
        "DUNNING_BATCH_EMAIL_TOO_MANY_ITEMS",
        "Zu viele Empfaengerzeilen (max. " + String(DUNNING_BATCH_EMAIL_MAX_ITEMS) + ")",
        400,
        { maxItems: DUNNING_BATCH_EMAIL_MAX_ITEMS, received: input.items.length },
      );
    }

    if (input.mode === "EXECUTE" && input.confirmBatchSend !== true) {
      throw new DomainError(
        "DUNNING_BATCH_EMAIL_CONFIRM_REQUIRED",
        "EXECUTE erfordert confirmBatchSend: true",
        400,
      );
    }

    const seenInvoices = new Set<string>();
    for (const it of input.items) {
      if (seenInvoices.has(it.invoiceId)) {
        throw new DomainError(
          "DUNNING_BATCH_EMAIL_DUPLICATE_INVOICE_ID",
          "invoiceId in items mehrfach",
          400,
          { duplicateInvoiceId: it.invoiceId },
        );
      }
      seenInvoices.add(it.invoiceId);
    }

    if (input.mode === "EXECUTE") {
      const seenKeys = new Set<string>();
      for (const it of input.items) {
        if (!it.idempotencyKey) {
          throw new DomainError(
            "VALIDATION_FAILED",
            "EXECUTE: jedes item benoetigt idempotencyKey (UUID)",
            400,
          );
        }
        if (seenKeys.has(it.idempotencyKey)) {
          throw new DomainError(
            "DUNNING_BATCH_EMAIL_DUPLICATE_IDEMPOTENCY_KEY",
            "idempotencyKey in items mehrfach",
            400,
            { duplicateKey: it.idempotencyKey },
          );
        }
        seenKeys.add(it.idempotencyKey);
      }
    }

    const candidatesResult = await this.candidatesService.listCandidates({
      tenantId: input.tenantId,
      stageOrdinal: input.stageOrdinal,
      asOfDate: input.asOfDate,
    });
    const { asOfDate, stageOrdinal, candidates } = candidatesResult.data;
    const allowed = new Set(candidates.map((c) => c.invoiceId));
    const invalid = input.items.filter((it) => !allowed.has(it.invoiceId)).map((it) => it.invoiceId);
    if (invalid.length > 0) {
      throw new DomainError(
        "DUNNING_RUN_INVOICES_INVALID",
        "invoiceIds enthalten Rechnungen, die fuer diese Stufe/asOfDate nicht als Kandidaten gelten",
        400,
        { invalidInvoiceIds: invalid },
      );
    }

    if (input.mode === "DRY_RUN") {
      const results: DunningBatchEmailRowResult[] = [];
      for (const it of input.items) {
        try {
          const preview = await this.emailService.preview({
            tenantId: input.tenantId,
            invoiceId: it.invoiceId,
            stageOrdinal,
            reason: input.reason,
          });
          if (!preview.data.readyForEmailFooter) {
            results.push({
              invoiceId: it.invoiceId,
              toEmail: it.toEmail.trim(),
              outcome: "BLOCKED",
              code: "DUNNING_EMAIL_FOOTER_NOT_READY",
              message: "Footer-Stammdaten technisch unvollstaendig",
            });
          } else {
            results.push({
              invoiceId: it.invoiceId,
              toEmail: it.toEmail.trim(),
              outcome: "WOULD_SEND",
              message: "Vorschau OK; kein SMTP in DRY_RUN",
            });
          }
        } catch (e) {
          if (e instanceof DomainError) {
            results.push({
              invoiceId: it.invoiceId,
              toEmail: it.toEmail.trim(),
              outcome: "BLOCKED",
              code: e.code,
              message: e.message,
            });
          } else {
            results.push({
              invoiceId: it.invoiceId,
              toEmail: it.toEmail.trim(),
              outcome: "FAILED",
              code: "VALIDATION_FAILED",
              message: String(e),
            });
          }
        }
      }
      return { data: { mode: "DRY_RUN", stageOrdinal, asOfDate, results } };
    }

    const results: DunningBatchEmailRowResult[] = [];
    for (const it of input.items) {
      const idem = it.idempotencyKey!;
      try {
        const sent = await this.emailService.sendEmail({
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
          invoiceId: it.invoiceId,
          stageOrdinal,
          reason: input.reason,
          toEmail: it.toEmail,
          idempotencyKey: idem,
        });
        results.push({
          invoiceId: it.invoiceId,
          toEmail: it.toEmail.trim(),
          outcome: sent.data.outcome,
          auditEventId: sent.data.auditEventId,
          smtpMessageId: sent.data.smtpMessageId,
          message: sent.data.message,
        });
      } catch (e) {
        if (e instanceof DomainError) {
          results.push({
            invoiceId: it.invoiceId,
            toEmail: it.toEmail.trim(),
            outcome: "FAILED",
            code: e.code,
            message: e.message,
          });
        } else {
          results.push({
            invoiceId: it.invoiceId,
            toEmail: it.toEmail.trim(),
            outcome: "FAILED",
            code: "VALIDATION_FAILED",
            message: String(e),
          });
        }
      }
    }

    return { data: { mode: "EXECUTE", stageOrdinal, asOfDate, results } };
  }
}
