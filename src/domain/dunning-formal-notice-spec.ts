/**
 * Pflicht-Cluster für späteres formelles Mahn-PDF (B5).
 * Keine Rechtsberatung — Inhalte und Formulierungen nur mit StB/Anwalt; hier nur technische Anker-IDs.
 */
export const FORMAL_DUNNING_NOTICE_DOCUMENT_CLUSTERS = [
  "creditorIdentity",
  "debtorIdentity",
  "invoiceReference",
  "principalClaim",
  "dueDateOrMaturity",
  "defaultInterestDisclaimer",
  "signatureOrSendMeta",
] as const;

export type FormalDunningNoticeDocumentClusterId =
  (typeof FORMAL_DUNNING_NOTICE_DOCUMENT_CLUSTERS)[number];
