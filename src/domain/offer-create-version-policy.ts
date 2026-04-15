import { DomainError } from "../errors/domain-error.js";
import type { OfferStatus } from "./types.js";

/**
 * ERP Systembeschreibung v1.2: Inhaltliche Anpassungen der Angebotsversion sind in
 * ENTWURF und bis vor verbindlicher Annahme zulässig — technisch als neue Version,
 * nicht als Überschreibung. Ab ANGENOMMEN nur noch Nachtrag (Folgedokument).
 *
 * Single Source of Truth für: OfferService.createVersion, AuthorizationService,
 * GET /documents/{id}/allowed-actions (über AuthorizationService).
 */
export const OFFER_CREATE_VERSION_ALLOWED_STATUSES = new Set<OfferStatus>([
  "ENTWURF",
  "IN_FREIGABE",
  "FREIGEGEBEN",
  "VERSENDET",
]);

export function assertOfferCreateVersionAllowedForStatus(status: OfferStatus): void {
  if (!OFFER_CREATE_VERSION_ALLOWED_STATUSES.has(status)) {
    throw new DomainError(
      "FOLLOWUP_DOCUMENT_REQUIRED",
      "Korrekturen sind in diesem Status nur über Nachtrag oder Folgedokument zulässig",
      409,
    );
  }
}

export function statusAllowsOfferCreateVersion(status: OfferStatus): boolean {
  return OFFER_CREATE_VERSION_ALLOWED_STATUSES.has(status);
}
