# Phase-1 Integration Note (Backend/QA)

## Scope
- Contracts are finalized in:
  - `docs/contracts/module-contracts.json`
  - `docs/contracts/action-contracts.json`
  - `docs/contracts/error-codes.json`

## Backend Integration Requirements
- Provide `allowedActions` as source of truth on:
  - document level: `GET /documents/{id}/allowed-actions`
  - row level for LV/Measurement: `GET /documents/{id}/rows/allowed-actions`
  - bulk level for LV/Measurement: `POST /documents/{id}/bulk-allowed-actions`
- Enforce immutable fields server-side, independent of UI.
- Return standardized error envelope:
  - `code`, `message`, `correlationId`, `retryable`, `blocking`, optional `details|fieldErrors`.
- Enforce idempotency for all critical write actions.
- Respect ADR decisions:
  - `createVersion` is allowed after offer status `SENT` as non-destructive correction path (alternative: follow-up document).
  - Export fail-closed with `EXPORT_PREFLIGHT_FAILED`.
  - Traceability checks before legal export with `TRACEABILITY_LINK_MISSING` / `TRACEABILITY_FIELD_MISMATCH`.

## QA Gate Checklist
- Verify each critical UI action appears in backend `allowedActions`.
- Verify forbidden transitions return workflow error codes (no silent fallback).
- Verify immutable fields cannot be changed by direct API calls.
- Verify `VERSION_CONFLICT` behavior by field class:
  - immutable -> server wins + hard block
  - status-locked/legal fields -> manual resolution
  - auxiliary notes -> auto-merge only if non-overlapping
- Verify all error classes map to defined UI behavior patterns.

## Go/No-Go Rule
- Go only if backend responses and UI behavior are contract-consistent for:
  - tenant
  - authorization
  - status/workflow
  - validation
  - export/preflight
  - sync/conflict
