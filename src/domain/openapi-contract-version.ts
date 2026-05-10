/**
 * Single source of truth for public API contract label (must match `docs/api-contract.yaml` `info.version`).
 * CI: `npm run validate:api-contract-yaml` asserts equality.
 */
export const ERP_OPENAPI_INFO_VERSION = "1.39.0-measurement-detail-traceability" as const;
