# Informationsarchitektur und globale Navigation (PWA)

**Zweck:** Aufgabenorientierte erste Ebene statt „Integrations-Shell als Haupteinstieg“. Dieses Dokument ist die **Ziel-IA** und die **Ist-Anbindung** an Rollen; Enforcement bleibt ausschließlich serverseitig (`allowedActions`, Mandantisolation).

**Siehe auch:** Abdeckungslage [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md), Rollen-Mapping [`docs/contracts/ui-role-mapping-v1-3.md`](../contracts/ui-role-mapping-v1-3.md), Kurzlabels [`apps/web/src/lib/v13-domain-role-mapping.ts`](../../apps/web/src/lib/v13-domain-role-mapping.ts), Hash-Routen [`apps/web/src/lib/hash-route.ts`](../../apps/web/src/lib/hash-route.ts).

---

## Ziel-Ebenen (Domänen als Kopfnavigation)

| Ebene 1 (Domäne) | Inhalt / Aggregate | Typische Rollen-Schwerpunkte |
|-------------------|-------------------|------------------------------|
| **Start** | Home-Dashboard, Schnellzugriff | alle (`roleForQuickNav` in [`App.tsx`](../../apps/web/src/App.tsx)) |
| **Stammdaten** | Projekt, Kunde, Zahlungsbedingungen (Lesepfade) | Vertrieb/Bauleitung, Buchhaltung — Nav-Sichtbarkeit: `isPrimaryNavLinkVisible("stammdaten")` bei Session für alle Rollen mit Datenzugang ([`pwa-primary-nav-visibility.ts`](../../apps/web/src/lib/pwa-primary-nav-visibility.ts)) |
| **LV und Aufmass** | LV §9 Lesepfad, Struktur, Messungen | Vertrieb/Bauleitung |
| **Angebote / Nachträge** | Angebotsversion, Supplement | Vertrieb/Bauleitung |
| **Finanzen** | Rechnung, Zahlung, Mahnwesen, Steuer/XRechnung-Stammdaten | Buchhaltung, Geschäftsführung (Freigaben) |
| **Arbeitsbereich Dokument** | SoT-gestützte Shell (`#/dokument`) | Integratoren, Piloten, Experten |
| **Einstellungen / Mandant** | PWA-Anzeige, Expertenmodus (Anzeige nur) | Admin, GF, Buchhaltung |
| **Hilfe / Diagnose** | Verweise auf Runbooks, strukturierte Fehler | Experte |

Menü-Sichtbarkeit: aus JWT-Rolle ableiten (**Anzeige**); ob eine Aktion ausgeführt werden darf, ergibt sich weiterhin aus **`GET /documents/{id}/allowed-actions`** bzw. den jeweiligen Finanz-/Domänen-Endpunkten.

---

## Ist-Routing (Hash)

Kanonical definiert in [`hash-route.ts`](../../apps/web/src/lib/hash-route.ts) und verzweigt in [`App.tsx`](../../apps/web/src/App.tsx):

| Pfad | Screen |
|------|--------|
| `#/` | Home-Dashboard (wenn nicht andere Spezialroute) |
| `#/dokument` | Dokument-Workspace / Shell |
| `#/finanz-vorbereitung`, `#/finanz-grundeinstellungen` | Finanz-Vorbereitung (Tabs) |
| `#/geschaeftsprozess` | Pilot-Wizard LV → Angebot → Rechnung |
| `#/lv-bearbeiten` | LV §9 Lesepfad + Sprung zur Shell |
| `#/login`, `#/password-reset` | Auth |
| `#/stammdaten` | Stammdaten-Hub (XRechnung Kunde/Mandant, FIN-1 Konditionen; optional `?customerId=` für Buyer-Detail) |
| `#/lv-aufmass` | LV- und Aufmaß-Hub |
| `#/angebote-nachtraege` | Angebote- und Nachtrags-Hub |
| `#/einstellungen` | Einstellungen (Verweise; Sitzung weiter auf Start) |
| `#/hilfe` | Hilfe und Repo-Doku-Verweise |
| `#/aufmass-messungen` | Pilot: Messungsliste und Detail (`MeasurementPilotListPage`) |
| `#/angebote-arbeitsflaeche` | Pilot: Angebots-/Nachtrags-SoT (`OfferSupplementWorkspacePage`) |
| `#/finanz-arbeitsliste` | Pilot: Mahn-Kandidaten als Arbeitsliste (`FinanceOperationalWorklistPage`) |
| `#/admin/users` | Mandanten-Benutzer (nur Session + Rolle **ADMIN**; Server enforced) |

Implementierung: [`AppPrimaryNav.tsx`](../../apps/web/src/components/AppPrimaryNav.tsx), [`pwa-primary-nav-visibility.ts`](../../apps/web/src/lib/pwa-primary-nav-visibility.ts).

**Langfristig:** bei wachsender Screen-Anzahl eigenes minimales ADR, falls von reinem Hash zu erweiterten Pfaden oder einem Router gewechselt wird — ohne Duplikat-SoT in der UI.

---

## Navigation ↔ Rollen-Mapping

- **Vertragliche Rolle → UI:** [`ui-role-mapping-v1-3.md`](../contracts/ui-role-mapping-v1-3.md) (v1.3 §11.1).
- **Kurztexte in der PWA:** `v13DomainRolesForApiRole` — rein informativ.
- **Quick-Nav-Rolle:** `roleForQuickNav` in [`token-payload.ts`](../../apps/web/src/lib/token-payload.ts) (null → VIEWER), durchgereicht z. B. an das Home-Dashboard.

Neue globale Nav-Einträge: immer mit einem Eintrag in `ui-role-mapping-v1-3.md` oder expliziter Begründung im PR, wenn eine neue Sicht für eine bestehende Rolle hinzukommt.

---

## Pflege

Bei neuen Hash-Routen: `hash-route.ts`, `App.tsx`, diese Datei und [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) anpassen.
