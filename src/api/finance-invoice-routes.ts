import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import { parseIdempotencyKeyHeader } from "./idempotency-header.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { DunningReminderEmailService } from "../services/dunning-reminder-email-service.js";
import type { DunningReminderService } from "../services/dunning-reminder-service.js";
import type { InvoiceService } from "../services/invoice-service.js";
import {
  bookInvoiceSchema,
  createDunningReminderSchema,
  createInvoiceDraftSchema,
  dunningReminderEmailPreviewSchema,
  dunningReminderEmailSendSchema,
} from "../validation/schemas.js";

export function registerInvoiceFinanceRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    invoiceService: InvoiceService;
    dunningReminderService: DunningReminderService;
    dunningReminderEmailService: DunningReminderEmailService;
  },
): void {
  app.post("/invoices", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanCreateInvoiceDraft(auth.role);
      const body = createInvoiceDraftSchema.parse(request.body);
      const result = await deps.invoiceService.createDraft({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvVersionId: body.lvVersionId,
        offerVersionId: body.offerVersionId,
        invoiceCurrencyCode: body.invoiceCurrencyCode,
        paymentTermsVersionId: body.paymentTermsVersionId,
        skontoBps: body.skontoBps,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/invoices/:invoiceId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const result = deps.invoiceService.getInvoice(auth.tenantId, params.invoiceId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/invoices/:invoiceId/payment-intakes", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const data = deps.invoiceService.listPaymentIntakesForInvoiceRead(auth.tenantId, params.invoiceId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/invoices/:invoiceId/dunning-reminders", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const data = deps.invoiceService.listDunningRemindersForInvoiceRead(auth.tenantId, params.invoiceId);
      return reply.status(200).send({ data });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/dunning-reminders", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanRecordDunningReminder(auth.role);
      const params = request.params as { invoiceId: string };
      const body = createDunningReminderSchema.parse(request.body);
      const result = await deps.dunningReminderService.record({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        stageOrdinal: body.stageOrdinal,
        note: body.note,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/dunning-reminders/email-preview", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const body = dunningReminderEmailPreviewSchema.parse(request.body);
      const result = await deps.dunningReminderEmailService.preview({
        tenantId: auth.tenantId,
        invoiceId: params.invoiceId,
        stageOrdinal: body.stageOrdinal,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/dunning-reminders/send-email-stub", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanRecordDunningReminder(auth.role);
      const params = request.params as { invoiceId: string };
      const body = dunningReminderEmailPreviewSchema.parse(request.body);
      const result = await deps.dunningReminderEmailService.sendStub({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        stageOrdinal: body.stageOrdinal,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/dunning-reminders/send-email", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanRecordDunningReminder(auth.role);
      const params = request.params as { invoiceId: string };
      const idempotencyKey = parseIdempotencyKeyHeader(request.headers as Record<string, string | string[] | undefined>);
      const body = dunningReminderEmailSendSchema.parse(request.body);
      const result = await deps.dunningReminderEmailService.sendEmail({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        stageOrdinal: body.stageOrdinal,
        reason: body.reason,
        toEmail: body.toEmail,
        idempotencyKey,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/book", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanBookInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const body = bookInvoiceSchema.parse(request.body);
      const result = await deps.invoiceService.bookInvoice({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        reason: body.reason,
        issueDate: body.issueDate,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
