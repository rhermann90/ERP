import type { InvoiceOverview } from "../../lib/api-client.js";

/** entityType-Werte für den SoT-Explorer (Fortgeschritten). */
export const SOT_ENTITY_TYPES = [
  "INVOICE",
  "OFFER_VERSION",
  "SUPPLEMENT_VERSION",
  "MEASUREMENT_VERSION",
  "LV_VERSION",
  "LV_STRUCTURE_NODE",
  "LV_POSITION",
] as const;

export type SotEntityType = (typeof SOT_ENTITY_TYPES)[number];

export type FinancePrepDocLink = { label: string; repoPath: string };

/** Repo-Pfade zu ADRs/Tickets für die Navigationsliste unter der Finanz-Vorbereitung. */
export const DOC_LINKS: FinancePrepDocLink[] = [
  {
    label: "ADR 0007 — Finance-Persistenz und Rechnungsgrenzen",
    repoPath: "docs/adr/0007-finance-persistence-and-invoice-boundaries.md",
  },
  {
    label: "ADR 0008 — Zahlungsbedingungen (FIN-1)",
    repoPath: "docs/adr/0008-payment-terms-fin1.md",
  },
  {
    label: "ADR 0009 — Mahnwesen (FIN-4 Slice)",
    repoPath: "docs/adr/0009-fin4-mahnwesen-slice.md",
  },
  {
    label: "ADR 0010 — FIN-4 / M4: Vorlagen, Footer und E-Mail",
    repoPath: "docs/adr/0010-fin4-m4-dunning-email-and-templates.md",
  },
  {
    label: "ADR 0011 — FIN-4: SEMI-Mahnkontext (Zeitzone, Fristlogik, Kanal)",
    repoPath: "docs/adr/0011-fin4-semi-dunning-context.md",
  },
  {
    label: "M4 Mini-Slice 1 — Vorlagen-Read",
    repoPath: "docs/tickets/M4-MINI-SLICE-1-VORLAGEN-READ-2026-04-23.md",
  },
  {
    label: "M4 Mini-Slice 4 — E-Mail-Vorschau + Versand-Stub",
    repoPath: "docs/tickets/M4-MINI-SLICE-4-EMAIL-PREVIEW-SEND-STUB-2026-04-24.md",
  },
  {
    label: "M4 Mini-Slice 5a — Mahn-E-Mail (SMTP)",
    repoPath: "docs/tickets/M4-MINI-SLICE-5-REAL-SMTP-2026-04-24.md",
  },
  {
    label: "M4 Mini-Slice 5b — Mahnlauf-Orchestrierung (PL)",
    repoPath: "docs/tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md",
  },
  {
    label: "M4 Slice 5c — Massen-E-Mail Mahnwesen (Spec)",
    repoPath: "docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md",
  },
  {
    label: "FIN-2-Start-Gate (G1–G10)",
    repoPath: "docs/tickets/FIN-2-START-GATE.md",
  },
  {
    label: "OpenAPI-Mapping FIN-0 (fail-closed)",
    repoPath: "docs/contracts/finance-fin0-openapi-mapping.md",
  },
  {
    label: "Stub-Testmatrix FIN-0 (QA)",
    repoPath: "docs/contracts/qa-fin-0-stub-test-matrix.md",
  },
  {
    label: "MVP Finanz — Phasen und Arbeitsablauf (FIN-0 … FIN-6)",
    repoPath: "docs/MVP-FINANZ-PHASEN-UND-ARBEITSPLAN.md",
  },
  {
    label: "Roadmap — Weg zur fertigen App (Phasen A–E)",
    repoPath: "docs/plans/roadmap-fertige-app.md",
  },
  {
    label: "Nächstes Inkrement — Finanz Welle 3 (Option A Default)",
    repoPath: "docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md",
  },
  {
    label: "PL / System — Sprint-Snapshot (Koordination)",
    repoPath: "docs/tickets/PL-SYSTEM-ZUERST-2026-04-14.md",
  },
  {
    label: "UI — v1.3-Fachrollen → API-Rollen (Mapping)",
    repoPath: "docs/contracts/ui-role-mapping-v1-3.md",
  },
];

/** Seed-Projekt aus Backend SEED_IDS.projectId (Demos). */
export const DEMO_PROJECT_ID = "10101010-1010-4010-8010-101010101010";
export const DEMO_CUSTOMER_ID = "20202020-2020-4020-8020-202020202020";
/** Seed-Rechnung SEED_IDS.invoiceId (gebucht, mit 8.4-Beträgen). */
export const DEMO_INVOICE_ID = "44444444-4444-4444-8444-444444444444";

export function formatEurFromCents(cents: number | undefined): string {
  if (cents === undefined) return "—";
  return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

export function openAmountCents(overview: InvoiceOverview | null): number | null {
  if (!overview || overview.totalGrossCents === undefined) return null;
  const paid = overview.totalPaidCents ?? 0;
  return Math.max(0, overview.totalGrossCents - paid);
}
