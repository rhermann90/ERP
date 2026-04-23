import type { ApiClient } from "./api-client.js";

/**
 * Kanonische Export-actionId für Rechnungen (GET allowed-actions).
 * @see docs/contracts/action-contracts.json → EXPORT_INVOICE.backendPolicyMirror.canonicalActionId
 * Legacy `EXPORT_INVOICE_XRECHNUNG` ist ausdrücklich verboten (legacyForbidden).
 */
export const CANONICAL_EXPORT_INVOICE_ACTION_ID = "EXPORT_INVOICE" as const;

/** Pflichtfeld „Grund“ (reason) für fast alle Schreiboperationen (min. 5 Zeichen Backend). */
export type ActionFormFields = {
  reason: string;
  offerId?: string;
  measurementId?: string;
  lvVersionId?: string;
  editingText?: string;
  invoiceId?: string;
  projectId?: string;
  customerId?: string;
  positionsJson?: string;
  exportFormat?: "XRECHNUNG" | "GAEB";
  lvCatalogId?: string;
  name?: string;
  headerSystemText?: string;
  headerEditingText?: string;
  parentNodeId?: string;
  kind?: string;
  sortOrdinal?: string;
  systemText?: string;
  quantity?: string;
  unit?: string;
  unitPriceCents?: string;
  positionKind?: "NORMAL" | "ALTERNATIV" | "EVENTUAL";
  nodeEditingText?: string;
  positionPatchJson?: string;
  /** Optional ISO `yyyy-mm-dd` für `POST /invoices/{id}/book` (BOOK_INVOICE). */
  issueDate?: string;
  /** Für RECORD_DUNNING_REMINDER: Stufe 1–9 (String wird geparst). */
  dunningStageOrdinal?: string;
  dunningNote?: string;
};

const OFFER_NEXT: Record<string, string> = {
  OFFER_SET_IN_FREIGABE: "IN_FREIGABE",
  OFFER_SET_FREIGEGEBEN: "FREIGEGEBEN",
  OFFER_SET_VERSENDET: "VERSENDET",
  OFFER_SET_ANGENOMMEN: "ANGENOMMEN",
  OFFER_SET_ABGELEHNT: "ABGELEHNT",
  OFFER_SET_ARCHIVIERT: "ARCHIVIERT",
};

const SUPP_NEXT: Record<string, string> = {
  SUPPLEMENT_SET_IN_FREIGABE: "IN_FREIGABE",
  SUPPLEMENT_SET_FREIGEGEBEN: "FREIGEGEBEN",
  SUPPLEMENT_SET_VERSENDET: "VERSENDET",
  SUPPLEMENT_SET_BEAUFTRAGT: "BEAUFTRAGT",
  SUPPLEMENT_SET_ABGELEHNT: "ABGELEHNT",
  SUPPLEMENT_SET_ARCHIVIERT: "ARCHIVIERT",
};

const MEAS_NEXT: Record<string, string> = {
  MEASUREMENT_SET_GEPRUEFT: "GEPRUEFT",
  MEASUREMENT_SET_FREIGEGEBEN: "FREIGEGEBEN",
  MEASUREMENT_SET_ABGERECHNET: "ABGERECHNET",
  MEASUREMENT_SET_ARCHIVIERT: "ARCHIVIERT",
};

function needReason(r: string): string {
  const t = r.trim();
  if (t.length < 5) throw new Error("Grund (reason): mindestens 5 Zeichen (Backend-Validierung).");
  return t;
}

function parseJsonArray(raw: string | undefined, label: string): unknown[] {
  if (!raw?.trim()) throw new Error(`${label}: JSON-Array erforderlich.`);
  const v = JSON.parse(raw) as unknown;
  if (!Array.isArray(v)) throw new Error(`${label}: muss ein JSON-Array sein.`);
  return v;
}

/**
 * Führt genau eine Aktion aus, die zuvor in GET allowed-actions enthalten war (UI-Gate).
 * Keine zusätzlichen Schreibpfade außerhalb dieser Mapper.
 */
export async function executeAllowedAction(
  client: ApiClient,
  actionId: string,
  _entityType: string,
  documentId: string,
  fields: ActionFormFields,
  measurementContext?: { measurementId: string },
): Promise<unknown> {
  const reason = needReason(fields.reason);

  if (OFFER_NEXT[actionId]) {
    return client.requestJson("POST", "/offers/status", {
      offerVersionId: documentId,
      nextStatus: OFFER_NEXT[actionId],
      reason,
    });
  }

  if (SUPP_NEXT[actionId]) {
    return client.requestJson("POST", "/supplements/status", {
      supplementVersionId: documentId,
      nextStatus: SUPP_NEXT[actionId],
      reason,
    });
  }

  if (actionId === "SUPPLEMENT_APPLY_BILLING_IMPACT") {
    const invoiceId = fields.invoiceId?.trim();
    if (!invoiceId) throw new Error("invoiceId erforderlich.");
    return client.requestJson(
      "POST",
      `/supplements/${encodeURIComponent(documentId)}/billing-impact`,
      { invoiceId, reason },
    );
  }

  if (MEAS_NEXT[actionId]) {
    return client.requestJson("POST", "/measurements/status", {
      measurementVersionId: documentId,
      nextStatus: MEAS_NEXT[actionId],
      reason,
    });
  }

  if (actionId === "MEASUREMENT_CREATE_VERSION") {
    const measurementId = measurementContext?.measurementId ?? fields.measurementId?.trim();
    if (!measurementId?.trim()) throw new Error("measurementId fehlt (aus Detail laden oder eingeben).");
    return client.requestJson("POST", "/measurements/version", { measurementId: measurementId.trim(), reason });
  }

  if (actionId === "MEASUREMENT_UPDATE_POSITIONS") {
    const positions = parseJsonArray(fields.positionsJson, "positions");
    return client.requestJson("POST", `/measurements/${encodeURIComponent(documentId)}/positions`, {
      positions,
      reason,
    });
  }

  if (actionId === "MEASUREMENT_CREATE") {
    const projectId = fields.projectId?.trim();
    const customerId = fields.customerId?.trim();
    const lvVersionId = fields.lvVersionId?.trim();
    const positions = parseJsonArray(fields.positionsJson, "positions");
    if (!projectId || !customerId || !lvVersionId) throw new Error("projectId, customerId, lvVersionId erforderlich.");
    return client.requestJson("POST", "/measurements", {
      projectId,
      customerId,
      lvVersionId,
      positions,
      reason,
    });
  }

  if (actionId === "OFFER_CREATE_VERSION") {
    const offerId = fields.offerId?.trim();
    const lvVersionId = fields.lvVersionId?.trim();
    const editingText = fields.editingText?.trim();
    if (!offerId || !lvVersionId || !editingText) throw new Error("offerId, lvVersionId, editingText erforderlich.");
    return client.requestJson("POST", "/offers/version", { offerId, lvVersionId, editingText, reason });
  }

  if (actionId === "OFFER_CREATE_SUPPLEMENT") {
    const offerId = fields.offerId?.trim();
    const lvVersionId = fields.lvVersionId?.trim();
    const editingText = fields.editingText?.trim();
    if (!offerId || !lvVersionId || !editingText) throw new Error("offerId, lvVersionId, editingText erforderlich.");
    return client.requestJson("POST", `/offers/${encodeURIComponent(offerId)}/supplements`, {
      baseOfferVersionId: documentId,
      lvVersionId,
      editingText,
      reason,
    });
  }

  if (actionId === "EXPORT_INVOICE_XRECHNUNG") {
    throw new Error(
      "EXPORT_INVOICE_XRECHNUNG ist kein SoT-actionId. Kanonisch nur EXPORT_INVOICE (Format XRECHNUNG in POST /exports; siehe docs/contracts/action-contracts.json).",
    );
  }

  if (actionId === "BOOK_INVOICE") {
    const body: { reason: string; issueDate?: string } = { reason };
    const issueDate = fields.issueDate?.trim();
    if (issueDate) body.issueDate = issueDate;
    return client.requestJson("POST", `/invoices/${encodeURIComponent(documentId)}/book`, body);
  }

  if (actionId === "RECORD_DUNNING_REMINDER") {
    const raw = fields.dunningStageOrdinal?.trim() ?? "1";
    const stageOrdinal = Number.parseInt(raw, 10);
    if (!Number.isFinite(stageOrdinal) || stageOrdinal < 1 || stageOrdinal > 9) {
      throw new Error("Mahn-Stufe (dunningStageOrdinal): ganze Zahl 1–9.");
    }
    const body: { stageOrdinal: number; reason: string; note?: string } = { stageOrdinal, reason };
    const note = fields.dunningNote?.trim();
    if (note) body.note = note;
    return client.requestJson("POST", `/invoices/${encodeURIComponent(documentId)}/dunning-reminders`, body);
  }

  if (
    actionId === "EXPORT_OFFER_VERSION" ||
    actionId === "EXPORT_SUPPLEMENT_VERSION" ||
    actionId === CANONICAL_EXPORT_INVOICE_ACTION_ID
  ) {
    const entityTypeExport =
      actionId === "EXPORT_SUPPLEMENT_VERSION"
        ? "SUPPLEMENT_VERSION"
        : actionId === "EXPORT_OFFER_VERSION"
          ? "OFFER_VERSION"
          : "INVOICE";
    // src/services/export-service.ts formatPolicy + action-contracts: INVOICE nur XRECHNUNG; Angebot/Nachtrag nur GAEB
    const format: "XRECHNUNG" | "GAEB" = entityTypeExport === "INVOICE" ? "XRECHNUNG" : "GAEB";
    return client.requestJson("POST", "/exports", {
      entityType: entityTypeExport,
      entityId: documentId,
      format,
    });
  }

  if (actionId === "LV_CATALOG_CREATE") {
    const name = fields.name?.trim();
    const headerSystemText = fields.headerSystemText?.trim();
    const headerEditingText = fields.headerEditingText?.trim();
    if (!name || !headerSystemText || !headerEditingText) throw new Error("name, headerSystemText, headerEditingText erforderlich.");
    const body: Record<string, unknown> = { name, headerSystemText, headerEditingText, reason };
    const pid = fields.projectId?.trim();
    if (pid) body.projectId = pid;
    return client.requestJson("POST", "/lv/catalogs", body);
  }

  if (actionId === "LV_CREATE_NEXT_VERSION") {
    const lvCatalogId = fields.lvCatalogId?.trim();
    if (!lvCatalogId) throw new Error("lvCatalogId erforderlich.");
    return client.requestJson("POST", `/lv/catalogs/${encodeURIComponent(lvCatalogId)}/version`, { reason });
  }

  if (actionId === "LV_SET_FREIGEGEBEN") {
    return client.requestJson("POST", `/lv/versions/${encodeURIComponent(documentId)}/status`, {
      nextStatus: "FREIGEGEBEN",
      reason,
    });
  }

  if (actionId === "LV_SET_ARCHIVIERT") {
    return client.requestJson("POST", `/lv/versions/${encodeURIComponent(documentId)}/status`, {
      nextStatus: "ARCHIVIERT",
      reason,
    });
  }

  if (actionId === "LV_ADD_STRUCTURE_NODE") {
    const parentRaw = fields.parentNodeId?.trim();
    const parentNodeId = parentRaw === "" || parentRaw === "null" ? null : parentRaw;
    const kind = fields.kind as "BEREICH" | "TITEL" | "UNTERTITEL" | undefined;
    const sortOrdinal = fields.sortOrdinal?.trim();
    const systemText = fields.systemText?.trim();
    const editingText = fields.editingText?.trim();
    if (!kind || !sortOrdinal || !systemText || !editingText) throw new Error("kind, sortOrdinal, systemText, editingText erforderlich.");
    return client.requestJson("POST", `/lv/versions/${encodeURIComponent(documentId)}/nodes`, {
      parentNodeId,
      kind,
      sortOrdinal,
      systemText,
      editingText,
      reason,
    });
  }

  if (actionId === "LV_ADD_POSITION") {
    const parentNodeId = fields.parentNodeId?.trim();
    const sortOrdinal = fields.sortOrdinal?.trim();
    const quantity = Number(fields.quantity);
    const unit = fields.unit?.trim();
    const unitPriceCents = Number(fields.unitPriceCents);
    const kind = fields.positionKind ?? "NORMAL";
    const systemText = fields.systemText?.trim();
    const editingText = fields.editingText?.trim();
    if (!parentNodeId || !sortOrdinal || !unit || !systemText || !editingText || Number.isNaN(quantity) || Number.isNaN(unitPriceCents)) {
      throw new Error("Pflichtfelder für Position unvollständig.");
    }
    return client.requestJson("POST", `/lv/versions/${encodeURIComponent(documentId)}/positions`, {
      parentNodeId,
      sortOrdinal,
      quantity,
      unit,
      unitPriceCents,
      kind,
      systemText,
      editingText,
      reason,
    });
  }

  if (actionId === "LV_UPDATE_NODE_EDITING_TEXT") {
    const editingText = fields.nodeEditingText?.trim();
    if (!editingText) throw new Error("Bearbeitungstext erforderlich.");
    return client.requestJson("PATCH", `/lv/nodes/${encodeURIComponent(documentId)}/editing-text`, {
      editingText,
      reason,
    });
  }

  if (actionId === "LV_UPDATE_POSITION") {
    let patch: Record<string, unknown> = {};
    const raw = fields.positionPatchJson?.trim();
    if (raw) {
      patch = JSON.parse(raw) as Record<string, unknown>;
    } else {
      const editingText = fields.editingText?.trim();
      if (editingText) patch.editingText = editingText;
    }
    patch.reason = reason;
    return client.requestJson("PATCH", `/lv/positions/${encodeURIComponent(documentId)}`, patch);
  }

  if (actionId === "AUDIT_READ") {
    return client.requestJson("GET", "/audit-events?page=1&pageSize=20");
  }

  throw new Error(`Kein Executor für actionId=${actionId} (bitte Backend/Contracts prüfen).`);
}

export async function executeActionWithSotGuard(
  client: ApiClient,
  actionId: string,
  entityType: string,
  documentId: string,
  allowedActions: readonly string[],
  fields: ActionFormFields,
  measurementContext?: { measurementId: string },
): Promise<unknown> {
  if (!allowedActions.includes(actionId)) {
    throw new Error(`Action ${actionId} ist laut allowedActions nicht freigegeben.`);
  }
  return executeAllowedAction(client, actionId, entityType, documentId, fields, measurementContext);
}

/** entityType laut GET /documents/.../allowed-actions */
export const ENTITY_TYPES = [
  "OFFER_VERSION",
  "SUPPLEMENT_VERSION",
  "MEASUREMENT_VERSION",
  "LV_VERSION",
  "LV_STRUCTURE_NODE",
  "LV_POSITION",
  "INVOICE",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
