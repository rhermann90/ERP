import { DomainError } from "../errors/domain-error.js";
import { InMemoryRepositories } from "../repositories/in-memory-repositories.js";

export class TraceabilityService {
  constructor(private readonly repos: InMemoryRepositories) {}

  public assertInvoiceTraceability(tenantId: string, invoiceId: string): void {
    const link = this.repos.traceabilityLinks.get(invoiceId);
    if (!link || link.tenantId !== tenantId) {
      throw new DomainError(
        "TRACEABILITY_LINK_MISSING",
        "Traceability Rechnung -> Aufmass -> LV -> Angebot -> Projekt -> Kunde fehlt",
        422,
      );
    }
    const invoice = this.repos.getInvoiceByTenant(tenantId, invoiceId);
    if (!invoice) {
      throw new DomainError("TRACEABILITY_LINK_MISSING", "Rechnung fehlt für Traceability-Prüfung", 422);
    }
    const offer = this.repos.getOfferByTenant(tenantId, invoice.offerId);
    if (!offer) {
      throw new DomainError("TRACEABILITY_LINK_MISSING", "Angebot fehlt für Traceability-Prüfung", 422);
    }
    const measurement = this.repos.getMeasurementByTenant(tenantId, invoice.measurementId);
    if (!measurement) {
      throw new DomainError("TRACEABILITY_LINK_MISSING", "Aufmass fehlt für Traceability-Prüfung", 422);
    }
    const measurementOk =
      measurement.projectId === invoice.projectId &&
      measurement.customerId === invoice.customerId &&
      measurement.lvVersionId === invoice.lvId &&
      measurement.tenantId === tenantId;
    if (!measurementOk) {
      throw new DomainError(
        "TRACEABILITY_FIELD_MISMATCH",
        "Aufmass-Bezüge (Projekt/Kunde/LV) passen nicht zur Rechnung",
        422,
      );
    }
    const lvVersion = this.repos.getLvVersionByTenant(tenantId, invoice.lvId);
    if (!lvVersion) {
      throw new DomainError(
        "TRACEABILITY_LINK_MISSING",
        "LV-Version fuer Rechnungs-Traceability nicht gefunden",
        422,
      );
    }
    const consistent =
      link.offerId === invoice.offerId &&
      link.projectId === invoice.projectId &&
      link.customerId === invoice.customerId &&
      link.measurementId === invoice.measurementId &&
      link.lvId === invoice.lvId &&
      offer.projectId === invoice.projectId &&
      offer.customerId === invoice.customerId;
    if (!consistent) {
      throw new DomainError(
        "TRACEABILITY_FIELD_MISMATCH",
        "Traceability-Kette Rechnung -> Aufmass -> LV -> Angebot -> Projekt -> Kunde inkonsistent",
        422,
      );
    }
    if (invoice.supplementVersionId) {
      const supplement = this.repos.getSupplementVersionByTenant(tenantId, invoice.supplementVersionId);
      if (!supplement || supplement.status !== "BEAUFTRAGT") {
        throw new DomainError(
          "SUPPLEMENT_BILLING_EFFECT_FORBIDDEN",
          "Nachtragswirkung auf Rechnung nur bei BEAUFTRAGT zulässig",
          409,
        );
      }
      if (link.supplementVersionId !== supplement.id) {
        throw new DomainError(
          "TRACEABILITY_FIELD_MISMATCH",
          "Traceability-Kette enthält inkonsistenten Nachtragsbezug",
          422,
        );
      }
    }
  }
}
