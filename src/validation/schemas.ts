import { z } from "zod";

/**
 * Eingabe-E-Mail für Auth/Benutzer, normalisiert zu Lowercase.
 * Zod `.email()` lehnt `name@localhost` ab (Domain ohne Punkt); Seeds nutzen `admin@localhost`.
 */
export const authEmailInputSchema = z
  .string()
  .trim()
  .transform((s) => s.toLowerCase())
  .pipe(
    z.string().superRefine((val, ctx) => {
      if (z.string().email().safeParse(val).success) return;
      if (/^[^\s@]{1,64}@localhost$/u.test(val)) return;
      ctx.addIssue({ code: "custom", message: "Invalid email address" });
    }),
  );

export const authHeaderSchema = z.object({
  authorization: z.string().min(10),
  "x-tenant-id": z.string().uuid().optional(),
});

export const createOfferVersionSchema = z.object({
  offerId: z.string().uuid(),
  lvVersionId: z.string().uuid(),
  editingText: z.string().min(1),
  reason: z.string().min(5),
});

export const createSupplementSchema = z.object({
  baseOfferVersionId: z.string().uuid(),
  lvVersionId: z.string().uuid(),
  editingText: z.string().min(1),
  reason: z.string().min(5),
});


export const createPaymentTermsVersionSchema = z.object({
  projectId: z.string().uuid(),
  customerId: z.string().uuid(),
  termsLabel: z.string().max(200),
  reason: z.string().min(5),
});



export const paymentTermsListQuerySchema = z.object({
  projectId: z.string().uuid(),
});

export const createInvoiceDraftSchema = z.object({
  lvVersionId: z.string().uuid(),
  offerVersionId: z.string().uuid(),
  invoiceCurrencyCode: z.enum(["EUR"]),
  /** Optional: gebundene Zahlungsbedingungs-Version (FIN-1), gleiches Projekt wie Angebot. */
  paymentTermsVersionId: z.string().uuid().optional(),
  /** 8.4(2) B2-1a: Skonto in Basispunkten (0 = kein Abzug). */
  skontoBps: z.number().int().min(0).max(10_000).optional(),
  reason: z.string().min(5),
});

export const bookInvoiceSchema = z.object({
  reason: z.string().min(5),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
});

/** FIN-4: manuelles Mahn-Ereignis protokollieren (kein E-Mail-/Lauf). */
export const createDunningReminderSchema = z.object({
  stageOrdinal: z.number().int().min(1).max(9),
  note: z.string().max(500).optional(),
  reason: z.string().min(5),
});

/** M4 Slice 4: E-Mail-Vorschau / Versand-Stub je Rechnung. */
export const dunningReminderEmailPreviewSchema = z
  .object({
    stageOrdinal: z.number().int().min(1).max(9),
    reason: z.string().min(5).max(500),
  })
  .strict();

/** M4 Slice 5a: echter E-Mail-Versand; Empfaenger explizit (kein Kundenstamm mit E-Mail in diesem MVP). */
export const dunningReminderEmailSendSchema = z
  .object({
    stageOrdinal: z.number().int().min(1).max(9),
    reason: z.string().min(5).max(500),
    toEmail: z.string().email().max(320),
  })
  .strict();

const dunningStageConfigWriteRowSchema = z.object({
  stageOrdinal: z.number().int().min(1).max(9),
  daysAfterDue: z.number().int().min(0).max(3650),
  feeCents: z.number().int().min(0).max(100_000_000),
  label: z.string().min(1).max(200),
});

/** FIN-4: volle Ersetzung der 9 Mahnstufen (Ordinal 1–9 je einmal). */
export const putDunningReminderConfigSchema = z
  .object({
    stages: z.array(dunningStageConfigWriteRowSchema).length(9),
    reason: z.string().min(5).max(500),
  })
  .strict()
  .superRefine((val, ctx) => {
    const ord = val.stages.map((s) => s.stageOrdinal);
    const set = new Set(ord);
    if (set.size !== 9) {
      ctx.addIssue({
        code: "custom",
        path: ["stages"],
        message: "stageOrdinal muss 1 bis 9 je einmal vorkommen",
      });
      return;
    }
    for (let n = 1; n <= 9; n += 1) {
      if (!set.has(n)) {
        ctx.addIssue({
          code: "custom",
          path: ["stages"],
          message: `stageOrdinal ${n} fehlt`,
        });
        return;
      }
    }
  });

/** FIN-4: einzelne Mahnstufe patchen (mindestens ein Feld außer reason). */
export const patchDunningReminderStageSchema = z
  .object({
    daysAfterDue: z.number().int().min(0).max(3650).optional(),
    feeCents: z.number().int().min(0).max(100_000_000).optional(),
    label: z.string().min(1).max(200).optional(),
    reason: z.string().min(5).max(500),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.daysAfterDue === undefined && val.feeCents === undefined && val.label === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Mindestens eines von daysAfterDue, feeCents, label erforderlich",
      });
    }
  });

export const deleteDunningReminderStageSchema = z.object({
  reason: z.string().min(5).max(500),
});

/** M4 Slice 5b-0: Mahnlauf-Kandidaten (Lesepfad). */
export const dunningReminderCandidatesQuerySchema = z
  .object({
    stageOrdinal: z.coerce.number().int().min(1).max(9),
    asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

/** M4 Slice 5b-1: Mahnlauf (Vorschau oder protokollierter Batch) — siehe ADR-0010. */
export const dunningReminderRunBodySchema = z
  .object({
    stageOrdinal: z.number().int().min(1).max(9),
    reason: z.string().min(5).max(500),
    mode: z.enum(["DRY_RUN", "EXECUTE"]),
    asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    invoiceIds: z.array(z.string().uuid()).max(500).optional(),
    note: z.string().max(500).optional(),
  })
  .strict();

const dunningBatchEmailItemSchema = z
  .object({
    invoiceId: z.string().uuid(),
    toEmail: z.string().email().max(320),
    idempotencyKey: z.string().uuid().optional(),
  })
  .strict();

/** M4 Slice 5c: Batch-SMTP je Rechnung (5a pro Zeile); max. 25 Zeilen. */
export const dunningReminderBatchEmailBodySchema = z
  .object({
    stageOrdinal: z.number().int().min(1).max(9),
    reason: z.string().min(5).max(500),
    mode: z.enum(["DRY_RUN", "EXECUTE"]),
    asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    confirmBatchSend: z.literal(true).optional(),
    items: z.array(dunningBatchEmailItemSchema).min(1).max(25),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.mode === "EXECUTE") {
      for (let i = 0; i < val.items.length; i += 1) {
        if (!val.items[i].idempotencyKey) {
          ctx.addIssue({
            code: "custom",
            path: ["items", i, "idempotencyKey"],
            message: "EXECUTE: idempotencyKey pro item erforderlich",
          });
        }
      }
    }
  });

/** Mandanten-Modus Mahnlauf (OFF | SEMI); SEMI-Kontext für Fälligkeit/Kanal (ADR-0011). */
export const patchDunningTenantAutomationSchema = z
  .object({
    reason: z.string().min(5).max(500),
    runMode: z.enum(["OFF", "SEMI"]),
    ianaTimezone: z.string().min(1).max(64).optional(),
    federalStateCode: z.string().min(2).max(4).nullable().optional(),
    paymentTermDayKind: z.enum(["CALENDAR", "BUSINESS"]).optional(),
    preferredDunningChannel: z.enum(["EMAIL", "PRINT"]).optional(),
  })
  .strict();

/** M4 Slice 2: Vorlagentext einer Stufe/Kanal patchen (Pflichtplatzhalter serverseitig). */
export const patchDunningReminderTemplateBodySchema = z
  .object({
    body: z.string().min(1).max(50_000),
    reason: z.string().min(5).max(500),
  })
  .strict();

const optionalFooterString = (max: number) => z.string().max(max).optional();

export const patchDunningEmailFooterSchema = z
  .object({
    reason: z.string().min(5).max(500),
    companyLegalName: optionalFooterString(300),
    streetLine: optionalFooterString(300),
    postalCode: optionalFooterString(20),
    city: optionalFooterString(120),
    countryCode: z.string().length(2).regex(/^[A-Za-z]{2}$/).optional(),
    publicEmail: optionalFooterString(320),
    publicPhone: optionalFooterString(80),
    legalRepresentative: optionalFooterString(300),
    registerCourt: optionalFooterString(200),
    registerNumber: optionalFooterString(120),
    vatId: optionalFooterString(32),
    signatureLine: optionalFooterString(200),
  })
  .strict()
  .superRefine((data, ctx) => {
    const keys = Object.keys(data).filter((k) => k !== "reason");
    if (!keys.some((k) => data[k as keyof typeof data] !== undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "PATCH: mindestens ein Stammdaten-Feld neben reason erforderlich",
      });
    }
  });

export const transitionSupplementStatusSchema = z.object({
  supplementVersionId: z.string().uuid(),
  nextStatus: z.enum(["ENTWURF", "IN_FREIGABE", "FREIGEGEBEN", "VERSENDET", "BEAUFTRAGT", "ABGELEHNT", "ARCHIVIERT"]),
  reason: z.string().min(5),
});

export const applySupplementBillingImpactSchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().min(5),
});

export const transitionOfferStatusSchema = z.object({
  offerVersionId: z.string().uuid(),
  nextStatus: z.enum([
    "ENTWURF",
    "IN_FREIGABE",
    "FREIGEGEBEN",
    "VERSENDET",
    "ANGENOMMEN",
    "ABGELEHNT",
    "ARCHIVIERT",
  ]),
  reason: z.string().min(5),
});

export const prepareExportSchema = z.object({
  entityType: z.enum(["OFFER_VERSION", "SUPPLEMENT_VERSION", "INVOICE"]),
  entityId: z.string().uuid(),
  format: z.enum(["XRECHNUNG", "GAEB"]),
});

export const auditListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const exportRunListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum(["OFFER_VERSION", "SUPPLEMENT_VERSION", "INVOICE"]).optional(),
  status: z.enum(["PENDING", "FAILED", "SUCCEEDED"]).optional(),
  format: z.enum(["XRECHNUNG", "GAEB"]).optional(),
});

export const exportRunIdParamsSchema = z.object({
  exportRunId: z.string().uuid(),
});

export const allowedActionsQuerySchema = z.object({
  entityType: z.enum([
    "OFFER_VERSION",
    "SUPPLEMENT_VERSION",
    "MEASUREMENT_VERSION",
    "LV_VERSION",
    "LV_STRUCTURE_NODE",
    "LV_POSITION",
    "INVOICE",
  ]),
});

export const measurementPositionSchema = z.object({
  lvPositionId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(32),
  note: z.string().max(500).optional(),
});

export const createMeasurementSchema = z.object({
  projectId: z.string().uuid(),
  customerId: z.string().uuid(),
  lvVersionId: z.string().uuid(),
  positions: z.array(measurementPositionSchema).min(1),
  reason: z.string().min(5),
});

export const transitionMeasurementStatusSchema = z.object({
  measurementVersionId: z.string().uuid(),
  nextStatus: z.enum(["GEPRUEFT", "FREIGEGEBEN", "ABGERECHNET", "ARCHIVIERT"]),
  reason: z.string().min(5),
});

export const createMeasurementVersionSchema = z.object({
  measurementId: z.string().uuid(),
  reason: z.string().min(5),
});

export const updateMeasurementPositionsSchema = z.object({
  positions: z.array(measurementPositionSchema).min(1),
  reason: z.string().min(5),
});

export const createLvCatalogSchema = z.object({
  name: z.string().min(1).max(200),
  headerSystemText: z.string().min(1),
  headerEditingText: z.string().min(1),
  projectId: z.string().uuid().optional(),
  reason: z.string().min(5),
});

export const transitionLvVersionStatusSchema = z.object({
  nextStatus: z.enum(["FREIGEGEBEN", "ARCHIVIERT"]),
  reason: z.string().min(5),
});

export const createLvCatalogVersionSchema = z.object({
  reason: z.string().min(5),
});

export const addLvStructureNodeSchema = z.object({
  parentNodeId: z.string().uuid().nullable(),
  kind: z.enum(["BEREICH", "TITEL", "UNTERTITEL"]),
  sortOrdinal: z.string().min(1).max(64),
  systemText: z.string().min(1),
  editingText: z.string().min(1),
  reason: z.string().min(5),
});

export const updateLvNodeEditingSchema = z
  .object({
    editingText: z.string().min(1),
    reason: z.string().min(5),
  })
  .strict();

export const addLvPositionSchema = z.object({
  parentNodeId: z.string().uuid(),
  sortOrdinal: z.string().min(1).max(64),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(32),
  unitPriceCents: z.number().int().min(0),
  kind: z.enum(["NORMAL", "ALTERNATIV", "EVENTUAL"]),
  systemText: z.string().min(1),
  editingText: z.string().min(1),
  stammPositionsRef: z.string().uuid().optional(),
  reason: z.string().min(5),
});

export const patchLvPositionSchema = z
  .object({
    editingText: z.string().min(1).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().min(1).max(32).optional(),
    unitPriceCents: z.number().int().min(0).optional(),
    sortOrdinal: z.string().min(1).max(64).optional(),
    reason: z.string().min(5),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (
      val.editingText === undefined &&
      val.quantity === undefined &&
      val.unit === undefined &&
      val.unitPriceCents === undefined &&
      val.sortOrdinal === undefined
    ) {
      ctx.addIssue({ code: "custom", message: "Mindestens ein zu aenderndes Feld erforderlich" });
    }
  });

export const loginRequestSchema = z.object({
  tenantId: z.string().uuid(),
  email: authEmailInputSchema,
  password: z.string().min(1).max(2000),
});

const userRoleEnum = z.enum(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB_BAULEITUNG", "VIEWER"]);

export const createTenantUserSchema = z.object({
  email: authEmailInputSchema,
  password: z.string().min(12).max(2000),
  role: userRoleEnum,
  reason: z.string().min(5),
});

export const patchTenantUserSchema = z
  .object({
    role: userRoleEnum.optional(),
    active: z.boolean().optional(),
    password: z.string().min(12).max(2000).optional(),
    email: authEmailInputSchema.optional(),
    reason: z.string().min(5),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (
      val.role === undefined &&
      val.active === undefined &&
      val.password === undefined &&
      val.email === undefined
    ) {
      ctx.addIssue({ code: "custom", message: "Mindestens eines von role, active, password, email erforderlich" });
    }
  });

export const requestPasswordResetSchema = z.object({
  tenantId: z.string().uuid(),
  email: authEmailInputSchema,
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(20).max(500),
  password: z.string().min(12).max(2000),
});
