import type { FastifyInstance } from "fastify";
import { handleHttpError, parseAuthContext } from "./http-response.js";
import { parseIdempotencyKeyHeader } from "./idempotency-header.js";
import type { AuthorizationService } from "../services/authorization-service.js";
import type { DunningReminderEmailService } from "../services/dunning-reminder-email-service.js";
import type { DunningReminderService } from "../services/dunning-reminder-service.js";
import type { DifferenceBookingService } from "../services/difference-booking-service.js";
import { differenceBookingToReadJson } from "../services/difference-booking-service.js";
import { schlussrechnungFollowUpDraftToJson, type InvoiceService } from "../services/invoice-service.js";
import {
  allocateDifferenceBookingsToInvoiceDraftSchema,
  bookInvoiceSchema,
  createDunningReminderSchema,
  createInvoiceDraftSchema,
  deallocateDifferenceBookingsFromInvoiceDraftSchema,
  dunningReminderEmailPreviewSchema,
  dunningReminderEmailSendSchema,
} from "../validation/schemas.js";

export function registerInvoiceFinanceRoutes(
  app: FastifyInstance,
  deps: {
    authorizationService: AuthorizationService;
    invoiceService: InvoiceService;
    differenceBookingService: DifferenceBookingService;
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
        measurementId: body.measurementId,
        paymentTermsVersionId: body.paymentTermsVersionId,
        skontoBps: body.skontoBps,
        billingKind: body.billingKind,
        mitigationFollowUpSourceInvoiceId: body.mitigationFollowUpSourceInvoiceId,
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

  app.get("/invoices/:invoiceId/difference-bookings", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanReadInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const rows = deps.differenceBookingService.listForInvoiceReference(auth.tenantId, params.invoiceId);
      return reply.status(200).send({
        data: rows.map(differenceBookingToReadJson),
      });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/difference-bookings/allocate", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanBookInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const body = allocateDifferenceBookingsToInvoiceDraftSchema.parse(request.body);
      await deps.differenceBookingService.allocateToInvoiceDraft({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        differenceBookingIds: body.differenceBookingIds,
        reason: body.reason,
      });
      return reply.status(204).send();
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/invoices/:invoiceId/difference-bookings/deallocate", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      deps.authorizationService.assertCanBookInvoice(auth.role);
      const params = request.params as { invoiceId: string };
      const body = deallocateDifferenceBookingsFromInvoiceDraftSchema.parse(request.body);
      await deps.differenceBookingService.deallocateFromInvoiceDraft({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        invoiceId: params.invoiceId,
        differenceBookingIds: body.differenceBookingIds,
        reason: body.reason,
      });
      return reply.status(204).send();
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
      const { settledSnapshots } = await deps.differenceBookingService.settleAllocationsAfterInvoiceBooked({
        tenantId: auth.tenantId,
        invoiceId: params.invoiceId,
        actorUserId: auth.userId,
        reason: body.reason,
      });
      const schlussrechnungMitigation = deps.differenceBookingService.buildSchlussrechnungMitigation({
        tenantId: auth.tenantId,
        bookedInvoiceId: params.invoiceId,
        issueDate: result.issueDate,
        settledSnapshots,
      });
      const schlussrechnungFollowUpDraft = await deps.invoiceService.resolveSchlussrechnungFollowUpDraft({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        bookedInvoiceId: params.invoiceId,
        mitigation: schlussrechnungMitigation,
        bookReason: body.reason,
      });
      return reply.status(200).send({
        ...result,
        schlussrechnungMitigation,
        schlussrechnungFollowUpDraft: schlussrechnungFollowUpDraftToJson(schlussrechnungFollowUpDraft),
      });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });
}
