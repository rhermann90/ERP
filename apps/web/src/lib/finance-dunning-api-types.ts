/**
 * PWA-Typen für FIN-4 Mahn-Kandidaten und Mahnlauf (OpenAPI-konform, read-only).
 * SoT: `docs/api-contract.yaml` — bei Schema-Änderungen hier und in Stubs angleichen.
 */

export type DunningCandidatesEligibilityContextRead = {
  ianaTimezone: string;
  federalStateCode: string | null;
  paymentTermDayKind: "CALENDAR" | "BUSINESS";
  preferredDunningChannel: "EMAIL" | "PRINT";
};

export type DunningReminderCandidateRow = {
  invoiceId: string;
  dueDate: string;
  stageDeadlineIso: string;
  openAmountCents: number;
  lastDunningStageOrdinal?: number;
};

export type DunningReminderCandidatesReadResponse = {
  data: {
    configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
    asOfDate: string;
    stageOrdinal: number;
    daysAfterDueForStage: number;
    eligibilityContext: DunningCandidatesEligibilityContextRead;
    candidates: DunningReminderCandidateRow[];
  };
};

export type DunningReminderRunPlannedRow = {
  invoiceId: string;
  dueDate: string;
  stageDeadlineIso: string;
  openAmountCents: number;
  wouldRecordStageOrdinal: number;
};

export type DunningReminderRunExecutedRow = {
  invoiceId: string;
  dunningReminderId: string;
  createdAt: string;
  stageOrdinal: number;
};

export type DunningReminderRunResponseData =
  | {
      mode: "DRY_RUN";
      outcome: "PREVIEW";
      stageOrdinal: number;
      asOfDate: string;
      configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
      planned: DunningReminderRunPlannedRow[];
    }
  | {
      mode: "EXECUTE";
      outcome: "COMPLETED" | "REPLAY";
      stageOrdinal: number;
      asOfDate: string;
      configSource: "MVP_STATIC_DEFAULTS" | "TENANT_DATABASE";
      executed: DunningReminderRunExecutedRow[];
    };

export type DunningReminderRunResponse = {
  data: DunningReminderRunResponseData;
};

export type DunningReminderBatchEmailRowResult = {
  invoiceId: string;
  toEmail: string;
  outcome: "WOULD_SEND" | "BLOCKED" | "SENT" | "REPLAY" | "FAILED";
  code?: string;
  message?: string;
  auditEventId?: string;
  smtpMessageId?: string;
};

export type DunningReminderBatchEmailResponse = {
  data: {
    mode: "DRY_RUN" | "EXECUTE";
    stageOrdinal: number;
    asOfDate: string;
    results: DunningReminderBatchEmailRowResult[];
  };
};
