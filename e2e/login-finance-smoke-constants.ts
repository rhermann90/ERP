/** Abgleich mit `apps/web/src/lib/demo-seed-ids.ts` / Backend-Seed (E2E-Tenant). */
export const SEED_LV_VERSION_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001";
export const SEED_OFFER_VERSION_ID = "33333333-3333-4333-8333-333333333333";
/** Seed-Angebotskopf (`src/composition/seed.ts` SEED_IDS.offerId). */
export const SEED_OFFER_ID = "22222222-2222-4222-8222-222222222222";
/** Seed-Nachtragsangebot (`src/composition/seed.ts` SEED_IDS.supplementOfferId). */
export const SEED_SUPPLEMENT_OFFER_ID = "90909090-9090-4090-8090-909090909090";
export const SEED_INVOICE_ID = "44444444-4444-4444-8444-444444444444";
/** Seed ENTWURF SMALL_BUSINESS_19 — Pflicht-Hinweise (FIN-5 Paket B); `src/composition/seed.ts` SEED_IDS.invoiceDraftSmallBusinessId. */
export const SEED_INVOICE_DRAFT_SMALL_BUSINESS_ID = "57575757-5757-4575-8575-575757575757";
export const SEED_MEASUREMENT_VERSION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccc0001";
export const SEED_SUPPLEMENT_VERSION_ID = "91919191-9191-4191-8191-919191919191";
/** Eltern-Aufmass zur Seed-Version — UI zeigt `measurementId`, nicht die Versions-UUID (`src/composition/seed.ts`). */
export const SEED_MEASUREMENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001";
/** Seed-Projekt der gebuchten Demo-Rechnung (`src/composition/seed.ts` SEED_IDS.projectId). */
export const SEED_PROJECT_ID = "10101010-1010-4010-8010-101010101010";
/** Seed-Kunde der Demo-Rechnung SEED_INVOICE_ID (`src/composition/seed.ts` SEED_IDS.customerId). */
export const SEED_CUSTOMER_ID = "20202020-2020-4020-8020-202020202020";
/** Nur E2E-Route-Mock (Paket D Recreate) — keine Backend-Seed-ID. */
export const E2E_RECREATE_INVOICE_ID = "fafafaaf-fafa-4afa-8afa-fafafafafafa";

/**
 * Nur Memory-API (`playwright.config.ts` ERP_HTTP_PORT 13000).
 * Kein Catch-All auf allen URLs — sonst Vite (Port 15173) und Folge-Tests laufen durch den Handler (Flakes).
 */
export const E2E_MEMORY_API_ROUTE_RX = /^http:\/\/127\.0\.0\.1:13000\//u;
