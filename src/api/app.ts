import { randomUUID } from "node:crypto";
import Fastify, { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { assertSystemTextNotInUpdatePayload } from "../domain/lv-text-structure-policy.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";
import { AuditService } from "../services/audit-service.js";
import { AuthorizationService } from "../services/authorization-service.js";
import { ExportService } from "../services/export-service.js";
import { LvReferenceValidator } from "../services/lv-reference-validator.js";
import { LvService } from "../services/lv-service.js";
import { MeasurementService } from "../services/measurement-service.js";
import { OfferService } from "../services/offer-service.js";
import { SupplementService } from "../services/supplement-service.js";
import { PaymentTermsService } from "../services/payment-terms-service.js";
import { InvoiceService } from "../services/invoice-service.js";
import { TraceabilityService } from "../services/traceability-service.js";
import {
  addLvPositionSchema,
  addLvStructureNodeSchema,
  allowedActionsQuerySchema,
  applySupplementBillingImpactSchema,
  auditListQuerySchema,
  authHeaderSchema,
  createLvCatalogSchema,
  createLvCatalogVersionSchema,
  createMeasurementSchema,
  createMeasurementVersionSchema,
  createSupplementSchema,
  createOfferVersionSchema,
  patchLvPositionSchema,
  prepareExportSchema,
  transitionLvVersionStatusSchema,
  transitionMeasurementStatusSchema,
  transitionSupplementStatusSchema,
  transitionOfferStatusSchema,
  updateLvNodeEditingSchema,
  updateMeasurementPositionsSchema,
} from "../validation/schemas.js";
import { seedDemoData } from "../composition/seed.js";
import { seedAuthUsers } from "../composition/seed-auth-prisma.js";
import {
  buildFastifyLoggerOptions,
  normalizeCorsOrigins,
  parseCorsOriginsFromEnv,
  registerPwaHttpHooks,
} from "../http/pwa-http-layer.js";
import { PrismaClient, createPrismaClient } from "../prisma-client.js";
import {
  assertDatabaseUrlForPostgresMode,
  resolveRepositoryMode,
  type RepositoryMode,
} from "../config/repository-mode.js";
import { noopOfferPersistence, PrismaOfferPersistence, type OfferPersistencePort } from "../persistence/offer-persistence.js";
import {
  noopSupplementPersistence,
  PrismaSupplementPersistence,
  type SupplementPersistencePort,
} from "../persistence/supplement-persistence.js";
import {
  noopPaymentTermsPersistence,
  PrismaPaymentTermsPersistence,
  type PaymentTermsPersistencePort,
} from "../persistence/payment-terms-persistence.js";
import {
  noopInvoicePersistence,
  PrismaInvoicePersistence,
  type InvoicePersistencePort,
} from "../persistence/invoice-persistence.js";
import {
  noopLvMeasurementPersistence,
  PrismaLvMeasurementPersistence,
  type LvMeasurementPersistencePort,
} from "../persistence/lv-measurement-persistence.js";
import {
  noopPaymentIntakePersistence,
  PrismaPaymentIntakePersistence,
  type PaymentIntakePersistencePort,
} from "../persistence/payment-intake-persistence.js";
import {
  noopDunningReminderPersistence,
  PrismaDunningReminderPersistence,
  type DunningReminderPersistencePort,
} from "../persistence/dunning-reminder-persistence.js";
import {
  noopDunningStageConfigPersistence,
  PrismaDunningStageConfigPersistence,
  type DunningStageConfigPersistencePort,
} from "../persistence/dunning-stage-config-persistence.js";
import {
  noopDunningTemplatePersistence,
  PrismaDunningTemplatePersistence,
  type DunningTemplatePersistencePort,
} from "../persistence/dunning-template-persistence.js";
import {
  noopDunningEmailFooterPersistence,
  PrismaDunningEmailFooterPersistence,
  type DunningEmailFooterPersistencePort,
} from "../persistence/dunning-email-footer-persistence.js";
import {
  noopDunningEmailSendPersistence,
  PrismaDunningEmailSendPersistence,
  type DunningEmailSendPersistencePort,
} from "../persistence/dunning-email-send-persistence.js";
import {
  MemoryDunningReminderRunIntentPersistence,
  PrismaDunningReminderRunIntentPersistence,
} from "../persistence/dunning-reminder-run-intent-persistence.js";
import {
  noopDunningTenantAutomationPersistence,
  PrismaDunningTenantAutomationPersistence,
} from "../persistence/dunning-tenant-automation-persistence.js";
import { createSmtpMailTransportFromEnv, type MailTransportPort } from "../integrations/smtp-mail-transport.js";
import { DunningReminderCandidatesService } from "../services/dunning-reminder-candidates-service.js";
import { DunningReminderConfigService } from "../services/dunning-reminder-config-service.js";
import { DunningReminderTemplateService } from "../services/dunning-reminder-template-service.js";
import { DunningEmailFooterService } from "../services/dunning-email-footer-service.js";
import { DunningReminderEmailService } from "../services/dunning-reminder-email-service.js";
import { DunningReminderBatchEmailService } from "../services/dunning-reminder-batch-email-service.js";
import { DunningReminderRunService } from "../services/dunning-reminder-run-service.js";
import { DunningReminderService } from "../services/dunning-reminder-service.js";
import { DunningTenantAutomationService } from "../services/dunning-tenant-automation-service.js";
import { PaymentIntakeService } from "../services/payment-intake-service.js";
import { registerPaymentIntakeRoutes } from "./finance-payment-intake-routes.js";
import { registerPaymentTermsRoutes } from "./finance-payment-terms-routes.js";
import { registerDunningReminderConfigRoutes } from "./finance-dunning-config-routes.js";
import { registerInvoiceFinanceRoutes } from "./finance-invoice-routes.js";
import { registerAuthLoginRoutes } from "./auth-login-routes.js";
import { registerPasswordResetRoutes } from "./password-reset-routes.js";
import { registerUserAccountRoutes } from "./user-account-routes.js";
import { DomainError } from "../errors/domain-error.js";
import { handleHttpError, parseAuthContext } from "./http-response.js";

export type BuildAppOptions = {
  seedDemoData?: boolean;
  /** Test-Override; in Produktion: `CORS_ORIGINS` (kommagetrennt). Leer = kein CORS. */
  corsOrigins?: string[];
  /** Explizit In-Memory erzwingen (Vitest, lokale Demos ohne DB). */
  repositoryMode?: RepositoryMode;
  /** Vitest: Mock-SMTP fuer Mahn-E-Mail-Versand (M4 Slice 5a). */
  mailTransport?: MailTransportPort;
  /** Optionales Test-/Runtime-Override fuer das globale HTTP-Rate-Limit. */
  rateLimit?: {
    max?: number;
    timeWindow?: number | string;
  };
};

export async function buildApp(options?: BuildAppOptions): Promise<FastifyInstance> {
  const logger =
    process.env.NODE_ENV === "test" || process.env.LOG_DISABLE === "1"
      ? false
      : buildFastifyLoggerOptions();
  const app = Fastify({
    logger,
    routerOptions: { ignoreTrailingSlash: true },
    /** Eine ID pro Request — Fehler-Body und Header `x-correlation-id` (Hook in `pwa-http-layer`). */
    genReqId: (req) => {
      const raw = req.headers["x-request-id"];
      if (typeof raw === "string") {
        const id = raw.trim().slice(0, 256);
        if (/^[a-zA-Z0-9_.-]{8,256}$/.test(id)) return id;
      }
      return randomUUID();
    },
  });
  const corsList = options?.corsOrigins ?? parseCorsOriginsFromEnv();
  registerPwaHttpHooks(app, normalizeCorsOrigins(corsList));
  // HTTP-Rate-Limiting: `@fastify/rate-limit` mit `global: true` — jede registrierte Route erhaelt
  // ein Limit (Plugin-Hook `onRoute`), sofern nicht explizit `config: { rateLimit: false }` gesetzt
  // (z. B. `/health` fuer Probes). Zusaetzlich setzen wir auf besonders missbrauchsgefaehrdeten
  // Routen (Login, Reset, Benutzerverwaltung) engere `config.rateLimit`-Werte (Defense in Depth).
  //
  // Code scanning: Die Regel `js/missing-rate-limiting` erkennt dieses globale Fastify-Muster nicht
  // zuverlaessig; die Repo-Konfiguration liegt unter `.github/codeql/codeql-config.yml` (in GitHub
  // unter Code scanning als Custom configuration file verknuepfen, wenn Default setup genutzt wird).
  await app.register(rateLimit, {
    global: true,
    max: options?.rateLimit?.max ?? 100,
    timeWindow: options?.rateLimit?.timeWindow ?? "1 minute",
  });

  app.get(
    "/health",
    {
      config: {
        rateLimit: false,
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({ status: "ok" as const });
    },
  );

  const repos = new InMemoryRepositories();
  const repositoryMode = resolveRepositoryMode({ repositoryMode: options?.repositoryMode });
  let prisma: PrismaClient | null = null;
  let offerPersistence: OfferPersistencePort = noopOfferPersistence;
  let supplementPersistence: SupplementPersistencePort = noopSupplementPersistence;
  let lvMeasurementPersistence: LvMeasurementPersistencePort = noopLvMeasurementPersistence;
  let paymentTermsPersistence: PaymentTermsPersistencePort = noopPaymentTermsPersistence;
  let invoicePersistence: InvoicePersistencePort = noopInvoicePersistence;
  let paymentIntakePersistence: PaymentIntakePersistencePort = noopPaymentIntakePersistence;
  let dunningReminderPersistence: DunningReminderPersistencePort = noopDunningReminderPersistence;
  let dunningStageConfigPersistence: DunningStageConfigPersistencePort = noopDunningStageConfigPersistence;
  let dunningTemplatePersistence: DunningTemplatePersistencePort = noopDunningTemplatePersistence;
  let dunningEmailFooterPersistence: DunningEmailFooterPersistencePort = noopDunningEmailFooterPersistence;
  let dunningEmailSendPersistence: DunningEmailSendPersistencePort = noopDunningEmailSendPersistence;
  let dunningTenantAutomationPersistence = noopDunningTenantAutomationPersistence;

  if (repositoryMode === "postgres") {
    assertDatabaseUrlForPostgresMode(repositoryMode);
    prisma = createPrismaClient(process.env.DATABASE_URL!.trim());
    offerPersistence = new PrismaOfferPersistence(prisma);
    supplementPersistence = new PrismaSupplementPersistence(prisma);
    lvMeasurementPersistence = new PrismaLvMeasurementPersistence(prisma);
    paymentTermsPersistence = new PrismaPaymentTermsPersistence(prisma);
    invoicePersistence = new PrismaInvoicePersistence(prisma);
    paymentIntakePersistence = new PrismaPaymentIntakePersistence(prisma);
    dunningReminderPersistence = new PrismaDunningReminderPersistence(prisma);
    dunningStageConfigPersistence = new PrismaDunningStageConfigPersistence(prisma);
    dunningTemplatePersistence = new PrismaDunningTemplatePersistence(prisma);
    dunningEmailFooterPersistence = new PrismaDunningEmailFooterPersistence(prisma);
    dunningEmailSendPersistence = new PrismaDunningEmailSendPersistence(prisma);
    dunningTenantAutomationPersistence = new PrismaDunningTenantAutomationPersistence(prisma);
    if (options?.seedDemoData ?? true) {
      seedDemoData(repos);
      await lvMeasurementPersistence.syncAllFromMemory(repos);
      await offerPersistence.syncAllOffersFromMemory(repos);
      await supplementPersistence.syncAllSupplementsFromMemory(repos);
      await paymentTermsPersistence.syncAllPaymentTermsFromMemory(repos);
      await invoicePersistence.syncAllInvoicesFromMemory(repos);
      await paymentIntakePersistence.hydrateIntoMemory(repos);
      await dunningReminderPersistence.hydrateIntoMemory(repos);
      await dunningEmailSendPersistence.hydrateIntoMemory(repos);
    } else {
      await lvMeasurementPersistence.hydrateIntoMemory(repos);
      await offerPersistence.hydrateOffersIntoMemory(repos);
      await supplementPersistence.hydrateSupplementsIntoMemory(repos);
      await paymentTermsPersistence.hydratePaymentTermsIntoMemory(repos);
      await invoicePersistence.hydrateInvoicesIntoMemory(repos);
      await paymentIntakePersistence.hydrateIntoMemory(repos);
      await dunningReminderPersistence.hydrateIntoMemory(repos);
      await dunningEmailSendPersistence.hydrateIntoMemory(repos);
    }
    app.addHook("onClose", async () => {
      await prisma?.$disconnect();
    });
    app.log.info(
      "Persistenz: Postgres LV+Aufmass (ADR-0004/0005) + Offer+OfferVersion (ADR-0006) + Supplement (ADR-0002 D5) + Zahlungsbedingungen (FIN-1) + Rechnungen (FIN-2) + Zahlungseingang (FIN-3) + Mahn-Ereignisse (FIN-4) + Mahnstufen-Konfig + Mahn-Vorlagen Lesepfad (FIN-4/M4) + E-Mail-Footer-Stammdaten (M4 Slice 3); übrige Entitäten weiter In-Memory.",
    );
  } else {
    if (options?.seedDemoData ?? true) {
      seedDemoData(repos);
    }
    if (process.env.NODE_ENV !== "test") {
      app.log.warn(
        "repositoryMode=memory: keine Postgres-Persistenz für Offers (ERP_REPOSITORY=memory oder ohne DATABASE_URL).",
      );
    }
  }

  const dunningReminderRunIntentPersistence =
    repositoryMode === "postgres" && prisma
      ? new PrismaDunningReminderRunIntentPersistence(prisma)
      : new MemoryDunningReminderRunIntentPersistence();

  app.get("/ready", async (_request, reply) => {
    if (repositoryMode !== "postgres" || !prisma) {
      return reply.status(200).send({
        status: "ready" as const,
        checks: { database: "not_configured" as const },
      });
    }
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        status: "ready" as const,
        checks: { database: "ok" as const },
      });
    } catch {
      return reply.status(503).send({
        status: "not_ready" as const,
        checks: { database: "error" as const },
      });
    }
  });

  if (prisma && (options?.seedDemoData ?? true)) {
    await seedAuthUsers(prisma);
  }

  registerAuthLoginRoutes(app, () => prisma);

  const audit = new AuditService(repos, prisma);
  const lvRef = new LvReferenceValidator(repos);
  const traceabilityService = new TraceabilityService(repos);
  const offerService = new OfferService(repos, audit, lvRef, offerPersistence);
  const supplementService = new SupplementService(repos, audit, lvRef, supplementPersistence);
  const paymentTermsService = new PaymentTermsService(repos, audit, paymentTermsPersistence);
  const invoiceService = new InvoiceService(repos, audit, invoicePersistence, traceabilityService);
  const paymentIntakeService = new PaymentIntakeService(repos, audit, invoicePersistence, paymentIntakePersistence);
  const dunningReminderService = new DunningReminderService(repos, audit, dunningReminderPersistence);
  const dunningReminderConfigService = new DunningReminderConfigService(dunningStageConfigPersistence, audit, prisma);
  const dunningTenantAutomationService = new DunningTenantAutomationService(
    dunningTenantAutomationPersistence,
    audit,
    prisma,
  );
  const dunningReminderCandidatesService = new DunningReminderCandidatesService(
    repos,
    dunningReminderConfigService,
    prisma
      ? { get: (tenantId: string) => dunningTenantAutomationService.getEligibilityContext(tenantId) }
      : undefined,
  );
  const dunningReminderRunService = new DunningReminderRunService(
    dunningReminderCandidatesService,
    dunningReminderService,
    dunningReminderRunIntentPersistence,
    dunningTenantAutomationService,
  );
  const dunningReminderTemplateService = new DunningReminderTemplateService(dunningTemplatePersistence, audit, prisma);
  const dunningEmailFooterService = new DunningEmailFooterService(dunningEmailFooterPersistence, audit, prisma);
  const mailTransport = options?.mailTransport ?? createSmtpMailTransportFromEnv();
  const dunningReminderEmailService = new DunningReminderEmailService(
    invoiceService,
    dunningReminderConfigService,
    dunningReminderTemplateService,
    dunningEmailFooterService,
    audit,
    repos,
    dunningEmailSendPersistence,
    mailTransport,
  );
  const dunningReminderBatchEmailService = new DunningReminderBatchEmailService(
    dunningReminderCandidatesService,
    dunningTenantAutomationService,
    dunningReminderEmailService,
  );
  const authorizationService = new AuthorizationService(repos);
  const measurementService = new MeasurementService(repos, audit, lvRef, lvMeasurementPersistence);
  const lvService = new LvService(repos, audit, lvMeasurementPersistence, authorizationService);
  const exportService = new ExportService(repos, audit);

  registerPasswordResetRoutes(app, { getPrisma: () => prisma, audit });

  app.post("/lv/catalogs", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanCreateLvCatalog(auth.role);
      const body = createLvCatalogSchema.parse(request.body);
      const result = await lvService.createCatalogWithSkeleton({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/lv/catalogs/:lvCatalogId/version", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { lvCatalogId: string };
      const body = createLvCatalogVersionSchema.parse(request.body);
      authorizationService.assertLvCreateNextVersionForCatalog(auth.tenantId, auth.role, params.lvCatalogId);
      const result = await lvService.createNewVersionFromCatalog({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvCatalogId: params.lvCatalogId,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/lv/versions/:lvVersionId", async (request, reply) => {
    try {
      const params = request.params as { lvVersionId: string };
      const result = lvService.getVersionSnapshotForHttpHeaders(request.headers, params.lvVersionId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/lv/versions/:lvVersionId/status", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { lvVersionId: string };
      const body = transitionLvVersionStatusSchema.parse(request.body);
      authorizationService.assertCanTransitionLvVersion(auth.role, body.nextStatus);
      const result = await lvService.transitionVersionStatus({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvVersionId: params.lvVersionId,
        nextStatus: body.nextStatus,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/lv/versions/:lvVersionId/nodes", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanAddLvStructureNode(auth.role);
      const params = request.params as { lvVersionId: string };
      const body = addLvStructureNodeSchema.parse(request.body);
      const result = await lvService.addStructureNode({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvVersionId: params.lvVersionId,
        parentNodeId: body.parentNodeId,
        kind: body.kind,
        sortOrdinal: body.sortOrdinal,
        systemText: body.systemText,
        editingText: body.editingText,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/lv/nodes/:nodeId/editing-text", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanUpdateLvNodeEditing(auth.role);
      const params = request.params as { nodeId: string };
      assertSystemTextNotInUpdatePayload(request.body as Record<string, unknown>, "systemText");
      const body = updateLvNodeEditingSchema.parse(request.body);
      const result = await lvService.updateNodeEditingText({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        nodeId: params.nodeId,
        editingText: body.editingText,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/lv/versions/:lvVersionId/positions", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanAddLvPosition(auth.role);
      const params = request.params as { lvVersionId: string };
      const body = addLvPositionSchema.parse(request.body);
      const result = await lvService.addPosition({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        lvVersionId: params.lvVersionId,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.patch("/lv/positions/:positionId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanUpdateLvPosition(auth.role);
      const params = request.params as { positionId: string };
      assertSystemTextNotInUpdatePayload(request.body as Record<string, unknown>, "systemText");
      const body = patchLvPositionSchema.parse(request.body);
      const result = await lvService.updatePosition({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        positionId: params.positionId,
        editingText: body.editingText,
        quantity: body.quantity,
        unit: body.unit,
        unitPriceCents: body.unitPriceCents,
        sortOrdinal: body.sortOrdinal,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/measurements", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanCreateMeasurement(auth.role);
      const body = createMeasurementSchema.parse(request.body);
      const result = await measurementService.createMeasurement({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/measurements/status", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = transitionMeasurementStatusSchema.parse(request.body);
      authorizationService.assertCanTransitionMeasurementStatus(auth.role, body.nextStatus);
      const result = await measurementService.transitionStatus({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/measurements/version", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = createMeasurementVersionSchema.parse(request.body);
      authorizationService.assertMeasurementCreateVersionForMeasurement(auth.tenantId, auth.role, body.measurementId);
      const result = await measurementService.createVersion({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        measurementId: body.measurementId,
        reason: body.reason,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/measurements/:measurementVersionId/positions", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanUpdateMeasurementPositions(auth.role);
      const params = request.params as { measurementVersionId: string };
      const body = updateMeasurementPositionsSchema.parse(request.body);
      const result = await measurementService.updatePositions({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        measurementVersionId: params.measurementVersionId,
        positions: body.positions,
        reason: body.reason,
      });
      return reply.status(200).send({ positions: result });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/measurements/:measurementVersionId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { measurementVersionId: string };
      const result = measurementService.getVersionDetail(auth.tenantId, params.measurementVersionId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/offers/version", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = createOfferVersionSchema.parse(request.body);
      authorizationService.assertOfferCreateVersionForOffer(auth.tenantId, auth.role, body.offerId);
      const result = await offerService.createVersion({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/offer-versions/:offerVersionId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { offerVersionId: string };
      const result = offerService.getVersionDetail(auth.tenantId, params.offerVersionId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/offers/:offerId/supplements", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanCreateSupplement(auth.role);
      const params = request.params as { offerId: string };
      const body = createSupplementSchema.parse(request.body);
      const result = await supplementService.createFromAcceptedOffer({
        tenantId: auth.tenantId,
        offerId: params.offerId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(201).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/supplements/status", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = transitionSupplementStatusSchema.parse(request.body);
      authorizationService.assertCanTransitionSupplementStatus(auth.role, body.nextStatus);
      const result = await supplementService.transitionStatus({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/supplements/:supplementVersionId/billing-impact", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      authorizationService.assertCanApplySupplementBillingImpact(auth.role);
      const params = request.params as { supplementVersionId: string };
      const body = applySupplementBillingImpactSchema.parse(request.body);
      const result = await supplementService.applyBillingImpact({
        tenantId: auth.tenantId,
        supplementVersionId: params.supplementVersionId,
        invoiceId: body.invoiceId,
        actorUserId: auth.userId,
        reason: body.reason,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/supplements/:supplementVersionId", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { supplementVersionId: string };
      const result = supplementService.getById(auth.tenantId, params.supplementVersionId);
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/offers/status", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = transitionOfferStatusSchema.parse(request.body);
      authorizationService.assertCanTransitionOfferStatus(auth.role, body.nextStatus);
      const result = await offerService.transitionStatus({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.post("/exports", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const body = prepareExportSchema.parse(request.body);
      authorizationService.assertCanExport(auth.role, body.entityType, body.format);
      if (body.entityType === "INVOICE") {
        traceabilityService.assertInvoiceTraceability(auth.tenantId, body.entityId);
      }
      const run = await exportService.prepareExport({
        tenantId: auth.tenantId,
        actorUserId: auth.userId,
        ...body,
      });
      return reply.status(201).send(run);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/audit-events", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const query = auditListQuerySchema.parse(request.query);
      const result = await audit.listByTenant({
        tenantId: auth.tenantId,
        role: auth.role,
        page: query.page,
        pageSize: query.pageSize,
      });
      return reply.status(200).send(result);
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  app.get("/documents/:id/allowed-actions", async (request, reply) => {
    try {
      const auth = parseAuthContext(request.headers);
      const params = request.params as { id: string };
      const query = allowedActionsQuerySchema.parse(request.query);
      const allowedActions = authorizationService.getAllowedActions(auth.tenantId, query.entityType, params.id, auth.role);
      return reply.status(200).send({
        documentId: params.id,
        entityType: query.entityType,
        allowedActions,
      });
    } catch (error) {
      return handleHttpError(error, request, reply);
    }
  });

  registerUserAccountRoutes(app, {
    getPrisma: () => prisma,
    audit,
    authorizationService,
  });

  registerPaymentTermsRoutes(app, {
    authorizationService,
    paymentTermsService,
  });

  registerDunningReminderConfigRoutes(app, {
    authorizationService,
    dunningReminderConfigService,
    dunningReminderTemplateService,
    dunningEmailFooterService,
    dunningReminderCandidatesService,
    dunningReminderRunService,
    dunningReminderBatchEmailService,
    dunningTenantAutomationService,
  });

  registerInvoiceFinanceRoutes(app, {
    authorizationService,
    invoiceService,
    dunningReminderService,
    dunningReminderEmailService,
  });

  registerPaymentIntakeRoutes(app, {
    authorizationService,
    paymentIntakeService,
  });

  return app;
}
