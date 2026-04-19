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

const userRoleEnum = z.enum(["ADMIN", "BUCHHALTUNG", "GESCHAEFTSFUEHRUNG", "VERTRIEB", "VIEWER"]);

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
