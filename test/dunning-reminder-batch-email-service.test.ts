import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  DUNNING_BATCH_EMAIL_MAX_ITEMS,
  DunningReminderBatchEmailService,
} from "../src/services/dunning-reminder-batch-email-service.js";
import { DomainError } from "../src/errors/domain-error.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const actorUserId = "77777777-7777-4777-8777-777777777777";

function candidateRow(invoiceId: string) {
  return {
    invoiceId,
    dueDate: "2026-04-14",
    stageDeadlineIso: "2026-04-28",
    openAmountCents: 10_000,
  };
}

function buildMocks(opts: {
  runMode: "OFF" | "SEMI";
  candidateInvoiceIds: string[];
}) {
  const automationService = {
    getReadModel: vi.fn().mockResolvedValue({ runMode: opts.runMode }),
  };
  const candidates = opts.candidateInvoiceIds.map((id) => candidateRow(id));
  const candidatesService = {
    listCandidates: vi.fn().mockResolvedValue({
      data: {
        asOfDate: "2026-04-28",
        stageOrdinal: 1,
        candidates,
      },
    }),
  };
  const emailService = {
    preview: vi.fn().mockResolvedValue({
      data: { readyForEmailFooter: true, plainTextPreview: "x" },
    }),
    sendEmail: vi.fn(),
  };
  return {
    svc: new DunningReminderBatchEmailService(
      candidatesService as never,
      automationService as never,
      emailService as never,
    ),
    candidatesService,
    emailService,
  };
}

describe("DunningReminderBatchEmailService", () => {
  it("rejects when tenant automation is OFF (409)", async () => {
    const { svc } = buildMocks({ runMode: "OFF", candidateInvoiceIds: [randomUUID()] });
    await expect(
      svc.run({
        tenantId,
        actorUserId,
        stageOrdinal: 1,
        reason: "unit",
        mode: "DRY_RUN",
        items: [{ invoiceId: randomUUID(), toEmail: "a@example.com" }],
      }),
    ).rejects.toMatchObject({
      code: "DUNNING_REMINDER_RUN_DISABLED",
      statusCode: 409,
    });
  });

  it("rejects empty items (400)", async () => {
    const { svc } = buildMocks({ runMode: "SEMI", candidateInvoiceIds: [] });
    await expect(
      svc.run({
        tenantId,
        actorUserId,
        stageOrdinal: 1,
        reason: "unit",
        mode: "DRY_RUN",
        items: [],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", statusCode: 400 });
  });

  it("rejects more than DUNNING_BATCH_EMAIL_MAX_ITEMS rows (400)", async () => {
    const ids = Array.from({ length: DUNNING_BATCH_EMAIL_MAX_ITEMS + 1 }, () => randomUUID());
    const { svc } = buildMocks({ runMode: "SEMI", candidateInvoiceIds: ids });
    const items = ids.map((invoiceId) => ({ invoiceId, toEmail: "k@example.com" }));
    await expect(
      svc.run({
        tenantId,
        actorUserId,
        stageOrdinal: 1,
        reason: "unit",
        mode: "DRY_RUN",
        items,
      }),
    ).rejects.toMatchObject({
      code: "DUNNING_BATCH_EMAIL_TOO_MANY_ITEMS",
      statusCode: 400,
    });
  });

  it("EXECUTE requires confirmBatchSend true (400)", async () => {
    const id = randomUUID();
    const { svc } = buildMocks({ runMode: "SEMI", candidateInvoiceIds: [id] });
    await expect(
      svc.run({
        tenantId,
        actorUserId,
        stageOrdinal: 1,
        reason: "unit",
        mode: "EXECUTE",
        confirmBatchSend: false,
        items: [{ invoiceId: id, toEmail: "k@example.com", idempotencyKey: randomUUID() }],
      }),
    ).rejects.toMatchObject({
      code: "DUNNING_BATCH_EMAIL_CONFIRM_REQUIRED",
      statusCode: 400,
    });
  });

  it("DRY_RUN returns per-row results when preview succeeds", async () => {
    const id = randomUUID();
    const { svc, emailService } = buildMocks({ runMode: "SEMI", candidateInvoiceIds: [id] });
    const out = await svc.run({
      tenantId,
      actorUserId,
      stageOrdinal: 1,
      reason: "unit dry",
      mode: "DRY_RUN",
      items: [{ invoiceId: id, toEmail: " k@example.com " }],
    });
    expect(out.data.mode).toBe("DRY_RUN");
    expect(out.data.results).toHaveLength(1);
    expect(out.data.results[0].outcome).toBe("WOULD_SEND");
    expect(out.data.results[0].invoiceId).toBe(id);
    expect(emailService.preview).toHaveBeenCalledTimes(1);
  });

  it("DRY_RUN maps DomainError from preview to BLOCKED row", async () => {
    const id = randomUUID();
    const { svc, emailService } = buildMocks({ runMode: "SEMI", candidateInvoiceIds: [id] });
    emailService.preview.mockRejectedValueOnce(new DomainError("DUNNING_STAGE_NOT_ACTIVE", "stufe", 422));
    const out = await svc.run({
      tenantId,
      actorUserId,
      stageOrdinal: 1,
      reason: "unit dry",
      mode: "DRY_RUN",
      items: [{ invoiceId: id, toEmail: "k@example.com" }],
    });
    expect(out.data.results[0].outcome).toBe("BLOCKED");
    expect(out.data.results[0].code).toBe("DUNNING_STAGE_NOT_ACTIVE");
  });
});
