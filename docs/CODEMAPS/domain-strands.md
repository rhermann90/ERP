# Domänen-Stränge — eine Seite Orientierung

Kompakte Landkarte **ohne** Vollständigkeit der Fachlogik (dafür: [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md)). Ziel: schnell den richtigen Einstieg und das passende ADR finden.

| Strang | Typische API-/UI-Oberfläche | Backend-Einstieg | PWA-Einstieg | ADR / Vertrag |
|--------|------------------------------|------------------|--------------|---------------|
| **LV (Lesepfad §9)** | `GET /lv/versions/...`, Struktur/Knoten/Positionen | `src/api/*lv*`, `src/services/lv-service.ts`, `lv-hierarchy-service.ts` | `LvWorkbench.tsx`, `LvBearbeitenPage.tsx`, Hash `#/lv-bearbeiten` | ADR-0013, ADR-0005; OpenAPI `docs/api-contract.yaml` |
| **Aufmass / Messung** | Messungs-Routen, Dokument-Shell `MEASUREMENT_VERSION` | `measurement-service`, zugehörige `*-routes.ts` | `DocumentTextPanels.tsx`, Pilot `MeasurementPilotListPage.tsx` | ADR-0004; Systembeschreibung §5.4 |
| **Angebot & Nachtrag** | Offers, Supplements, Dokument-Shell Offer | `offer-service`, `src/api/offers-*`, Supplement-Routen | `OfferSupplementWorkspacePage.tsx`, `GeschaeftsprozessWizard` | ADR-0002, ADR-0006 |
| **Finanz (Rechnung, Zahlung, Mahn, Steuer)** | `/finance/*`, `/invoices/*`, Differenzbuchungen | `invoice-service`, `finance-*-routes.ts`, Dunning-/Payment-Services | `FinancePreparation.tsx`, Shell `InvoiceShellReadonlyPanel`, `FinanceOperationalWorklistPage` | ADR-0007, ADR-0008–0011, ADR-0012, ADR-0015; `docs/contracts/*` |
| **Differenzbuchung (DOM-8-6)** | `difference-bookings`, Zuordnung, Konditions-Differenz | `difference-booking-service`, `src/api/*difference*` | `PaymentTermsDifferenceBookingPanel`, `InvoiceDraftDifferenceAllocatePanel`, Hub `#/lv-aufmass` | ADR-0020–0023 |
| **CRM-Stamm (W1)** | `/crm/...` | `crm-stammdaten-routes`, `crm-stammdaten-service`, `crm-*-persistence` | Stammdaten-Hub `#/stammdaten` | ADR-0019 |
| **Auth & Nutzer** | Login, Passwort-Reset, `GET /users` | `src/auth/`, `auth-login-routes`, `user-account-*` | `AuthProvider`, Login-Flows | `docs/authentication-login.md` |
| **PWA-IA / Shell / Routing** | — (hashbasiert) | `pwa-http-layer.ts` (API-HTTP) | `App.tsx`, `hash-route.ts`, `AppPrimaryNav.tsx`, Hubs | [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md), Pläne unter `docs/plans/pwa-*.md` |

**OpenAPI zentral:** [`docs/api-contract.yaml`](../api-contract.yaml) — bei neuen Endpunkten immer mitführen, wo verbindlich.
