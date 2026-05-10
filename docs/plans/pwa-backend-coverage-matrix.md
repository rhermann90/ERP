# PWA ↔ Backend — Coverage-Matrix (Phase 0)

**Zweck:** Messbare Übersicht, welche Backend-Fähigkeiten die PWA **endnutzerorientiert**, nur als **Shell/Diagnose**, nur **Expertenmodus** oder **gar nicht** abdeckt.  
**Quellen:** [`docs/api-contract.yaml`](../../docs/api-contract.yaml), Route-Mounts und Inline-Routen in [`src/api/app.ts`](../../src/api/app.ts), [`apps/web/src/lib/api-client.ts`](../../apps/web/src/lib/api-client.ts), Hash-Routen [`apps/web/src/lib/hash-route.ts`](../../apps/web/src/lib/hash-route.ts), Screen-Schalter in [`apps/web/src/App.tsx`](../../apps/web/src/App.tsx).

**Legende**

| Status | Bedeutung |
|--------|-----------|
| **Produkt** | Geführte UI (Formulare, Karten, klare Primäraktionen) ohne Pflicht-Rohtext im Standardfluss |
| **Teil** | API angebunden, aber starker JSON-/Technik-Anteil oder nur Pilot-Wizard |
| **Shell** | vor allem [`#/dokument`](../../apps/web/src/lib/hash-route.ts) / `executeAction` / Lesepfade |
| **Experte** | sinnvoll nur mit `showExpertUi` (Vite-Dev, `VITE_PWA_EXPERT_UI`, Mandanten-PWA) |
| **Fehlt** | kein bewusstes PWA-UI (nur API) |

Keine zweite SoT-Logik in der UI — [`docs/contracts/ui-action-executor-coverage.md`](../../docs/contracts/ui-action-executor-coverage.md).

---

## Matrix (aggregiert)

| Bereich | Backend (Auszug) | `ApiClient` | PWA-Oberfläche | Ziel-Produktstatus |
|---------|-------------------|-------------|----------------|---------------------|
| **Auth** | `POST /auth/login`, Passwort-Reset | über Login-/Reset-Seiten | Login, Passwort-Reset | Produkt |
| **Nutzer (Admin)** | `GET/POST/PATCH /users` | ja (`listTenantUsers`, …) | **`#/admin/users`** (ADMIN) | Produkt (Listen + Erstellung); Detail/Policy weiter vertiefbar |
| **LV Lesen** | `GET /lv/versions/…`, Struktur, Knoten, Position | ja | `#/lv-bearbeiten` (**LvWorkbench:** Knoten-/Positionszähler neben Baum) + `#/dokument` | Produkt (Lesen OK); Schreiben siehe unten |
| **LV Schreiben** | Knoten/Position/Status, PATCH Text | über SoT `executeAction` | Shell + `LvVersionSotPanel` + **`LvEntityTextSotPanel`** (`#/lv-bearbeiten`) | **Teil** (Pilot-Formulare); Roh-JSON weiter Experte |
| **Aufmass** | CRUD/Version/Positionen; **`GET /projects/{projectId}/measurements`** | `create*` teils Wizard; GET Snapshot; **`listProjectMeasurements`** | Wizard, Shell, **`#/aufmass-messungen`** (Projektliste + Positions-Detail) | **Teil** (Pilot-Liste/Detail) |
| **Angebot / Nachtrag** | Offers, Supplements, Status; `GET /projects/:projectId/offers`, `GET /projects/:projectId/supplements`, `GET /supplements/:supplementVersionId` | `createOffer`, GET Version, `listProjectOffers`, `listProjectSupplements`, `getSupplementVersion` | Wizard, Shell, **`#/angebote-arbeitsflaeche`** (Projektlisten + SoT; Deep-Link Version-IDs; Nachtrag lesen + Link Basis-OFFER_VERSION) | **Teil** (Pilot-Arbeitsfläche) |
| **Rechnung** | Entwurf, Buchung, Lesepfad; Buchungsantwort inkl. `schlussrechnungMitigation`; `billingKind`; `allocatedDifferenceBookings`; Slice-2b PT-Differenz; Entwurf allocate/deallocate | `getInvoice`, `allocateDifferenceBookingsToInvoiceDraft`, `deallocateDifferenceBookingsFromInvoiceDraft`, `createPaymentTermsDifferenceBooking`, … | `FinancePreparation` Schritt 3; **Shell INVOICE** + **`#/lv-aufmass`** Hub: gleiche PT-/Allocate-Panels + Bezugsrechnung-GET wie Shell; Slice-2b Mitigation/BillingKind ohne Client-Delta; Roh-JSON nur Experte | Produkt (Schwerpunkt FIN) |
| **Zahlung (FIN-3)** | `POST …/payments/intake` | ja | Finanz-Vorbereitung | Produkt (SoT) |
| **Mahnwesen (FIN-4)** | Konfig, Automation, **`GET /finance/open-receivables`**, Kandidaten, Run, E-Mail, … | ja (`getOpenReceivables`, …) | Finanz-Tabs + Panels + **`#/finanz-arbeitsliste`** (Tabs Offene Posten / Mahn-Kandidaten, `?tab=mahn`; Deep-Link **`#/finanz-grundeinstellungen`**; E2E `login-finance-smoke`; Roh-JSON nur **Experte**) | **Teil** / **Experte** je Panel |
| **Steuer FIN-5** | Invoice-Tax-Profile, Projekt-Override | ja | Finanz Steuer-UI (GET/PATCH-Roh-JSON nur Experte) | Produkt (Teilbereiche Experte) |
| **XRechnung Parteien** | `GET …/e-invoice-parties…` | ja | Shell/Invoice-Readonly | **Teil** |
| **Export** | `POST /exports` | über Action-Executor | Shell | **Teil** |
| **Audit** | `GET /audit-events` | ja | Shell / Tab Fortgeschritten | **Experte** |
| **Mandant PWA** | `GET/PATCH /tenant/pwa-display-settings` | ja | Shell + Finanz-Meta | **Teil** |
| **Zahlungsbedingungen** | FIN-1 Projekt | `getPaymentTermsByProject` | Shell + Finanz; zusätzlich geführte FIN-1-Tabelle unter **`#/stammdaten`** (Pilot, Lesepfad) | **Teil** |
| **Dokument-SoT** | `GET /documents/:id/allowed-actions` | ja | überall zentral | Shell + Guards; nach erfolgreicher Shell-`executeAction` **Kurzmeldung** ohne volles Antwort-JSON, wenn Experte aus ([`App.tsx`](../../apps/web/src/App.tsx)) |
| **Domänen-Navigation** | — | — | `AppPrimaryNav`, Hubs + Pilot `#/aufmass-messungen`, `#/angebote-arbeitsflaeche`, `#/finanz-arbeitsliste`, `#/admin/users`; Start gruppiert nach IA | **Teil** |
| **Stammdaten (W1 / Pilot)** | FIN-5 Buyer/Seller, FIN-1 Zahlungsbedingungen, CRM-Stamm ADR-0019, Dokument `PROJECT` | CRM: `list/get/post/patch` für `CrmConstructionSite`, `CrmCustomer`, `CrmProject`, `CrmProjectContact` (alle mit `versionNumber` wo PATCH); plus FIN-Stammpfade wie oben | **`#/stammdaten`** — CRM-CRUD + Konflikt-409; Wizard-Link zu Hub; Memory-API: CRM-Hinweis | **Produkt** (CRM Postgres + Opt-Lock + Audit; Rollen wie FIN-1) |

---

## Fehlende Produkt-Schicht (Gap-Liste, priorisierbar)

1. **Stammdaten (§18.1 Pilot):** CRM lesend/schreibend im Hub mit Opt-Lock und Audit; Persistenz-Nachweise in Integrationstests. **Lücken (Zielbild / spätere Wellen):** §18.1 Objekt-Historie/DMS, weitere Rollenfeinjustierung — ADR [`0019-w1-stammdaten-project-customer-object-option-c.md`](../adr/0019-w1-stammdaten-project-customer-object-option-c.md); Ticket [`PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md`](../tickets/PHASE-2-BACKLOG-PROJECT-CUSTOMER-STAMM.md) (DoD W1).
2. **LV-Editing:** Pilot-Formulare (`LvEntityTextSotPanel`); weiterhin nicht alle `LV_*`-Aktionen ohne Roh-JSON.
3. **Aufmass / Angebot:** Pilot-Screens `#/aufmass-messungen` (Deep-Link `?measurementVersionId=`), `#/angebote-arbeitsflaeche` ergänzen Wizard/Shell. **Roadmap-Schwerpunkt (2026-05-10):** zuerst **Aufmass Bund 3** vertiefen — siehe [`pwa-domain-increment-roadmap.md`](./pwa-domain-increment-roadmap.md) Abschnitt „Nächster gewählter Schwerpunkt“.
4. **Finanz-Operation (Feinschliff):** `#/finanz-arbeitsliste` — Offene Posten mit optionalen Filtern **`projectId`** / **`customerId`** am `GET /finance/open-receivables`; weiterhin offen: Aging, gebündelte Kurzaktionen ohne Shell — Team-Priorität.
5. **Admin:** `#/admin/users` für ADMIN; erweiterte Policy-UX optional.
6. **§5.4 / §8.6 Differenzbuchung:** `GET /projects/{projectId}/difference-bookings` + **`GET .../difference-bookings/summary`** (`open` vs. **`allocatedByDraft`**) + Persistenz `difference_bookings` (ADR [`0020`](../adr/0020-difference-booking-measurement-8-6-slice.md)); gebündelte Lesesicht Slice 3; Gutschrift/Folge mit **`mitigationFollowUpSourceInvoiceId`** — Ticket [`DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](../tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md). PWA: Shell + Hub + Finanz-Vorbereitung teilen **PT-Differenz**, **allocate/deallocate**, Summary-Button im Hub; Einpreisung zugeordneter Beträge in Entwurfssummen bewusst zurückgestellt — ADR [`0025`](../adr/0025-dom86-deferred-difference-to-invoice-totals.md).

---

## Programm — weitere Artefakte

- [`pwa-information-architecture.md`](./pwa-information-architecture.md) — IA und globale Navigation
- [`pwa-ux-patterns-end-user.md`](./pwa-ux-patterns-end-user.md) — verbindliche UX-Muster
- [`pwa-domain-increment-roadmap.md`](./pwa-domain-increment-roadmap.md) — priorisierte Inkremente
- [`pwa-qa-quality-bar.md`](./pwa-qa-quality-bar.md) — E2E, A11y, Verify
- [`w2-pwa-ux-backend-exposure-inventory.md`](./w2-pwa-ux-backend-exposure-inventory.md) — sichtbare Roh-JSON/API-Je nach Route (W2-Pflege)

---

## Pflege

Bei neuen OpenAPI-Pfaden oder `ApiClient`-Methoden: diese Matrix um eine Zeile ergänzen oder Status anpassen. Bei größeren Umbauten: mit [`pwa-domain-increment-roadmap.md`](./pwa-domain-increment-roadmap.md) abgleichen. **Hinweis:** Zeile „Stammdaten (W1 / Pilot)“ bündelt die gleiche FIN-1-Lesepfad-Oberfläche wie in „Zahlungsbedingungen“ erwähnt — Status **Produkt** vs. **Teil** bewusst nach Oberflächen-Tiefe (Hub vs. Gesamtpaket Finanz/Shell).
