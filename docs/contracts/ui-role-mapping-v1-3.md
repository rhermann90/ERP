# UI — Abbild fachlicher Rollen (v1.3 §11.1) auf API-Rollen (`UserRole`)

**Quelle:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) §11.1 *Rollenbeispiele* und §11.2 *Aktionsrechte je Status*.  
**Technische Wahrheit:** Das Backend kennt nur die fünf `UserRole`-Werte aus [`src/domain/types.ts`](../../src/domain/types.ts); fachliche Titel wie *Disposition* oder *Bauleitung* sind **Mandanten-/Prozessrollen** und werden in der MVP-PWA **nicht** separat authentisiert.

## 1) MVP-Zuordnung (1:n, empfohlen für UI-Texte und Schulung)

| Fachliche Rolle (v1.3 §11.1) | Typische API-Rolle | Bemerkung |
| --- | --- | --- |
| Admin | `ADMIN` | Vollzugriff inkl. technischer Demos. |
| Buchhaltung | `BUCHHALTUNG` | FIN-1/2/3, Exporte, Zahlungseingang (§8). |
| Geschäftsführung | `GESCHAEFTSFUEHRUNG` | Kritische Freigaben / Statusübergänge (§11.2). |
| Vertrieb / Bauleitung | `VERTRIEB_BAULEITUNG` | Angebote, LV, Aufmaß, Nachträge, Kundenbezug und operative Ausführung — eine API-Rolle (früher nur „Vertrieb“). |
| Kalkulation | `VERTRIEB_BAULEITUNG` oder `BUCHHALTUNG` | Angebots-/LV-Kern → oft `VERTRIEB_BAULEITUNG`; reine Kostenrechnung/Abgrenzung → oft `BUCHHALTUNG` — **Mandanten-Policy** festlegen. |
| Disposition | `VERTRIEB_BAULEITUNG` oder `VIEWER` | Operative Koordination: Schreiben → `VERTRIEB_BAULEITUNG`; reine Einsicht → `VIEWER`. |

**Segregation of Duties (v1.3 §11, Ergänzung Zahlung):** Erfassung von Zahlungseingang vs. Zuordnung/Freigabe soll **rollentechnisch trennbar** sein, wo der Mandant es verlangt. Die PWA bietet nur **eine** authentisierte Session — produktive Trennung erfordert **separate Benutzerkonten** (unterschiedliche API-Rollen) oder Mandanten-Workflow außerhalb der Shell.

## 2) PWA-Verhalten

- **Schnellzugriff** priorisiert Kacheln nach **API-Rolle** aus dem Token (`decodeTokenPayload` in `apps/web/src/lib/token-payload.ts`).
- **Globale Hauptnavigation** (`AppPrimaryNav`): operative Links (Stammdaten, LV & Aufmaß, …) nur mit gültiger Session; **Einstellungen**-Eintrag nur für `ADMIN`, `GESCHAEFTSFUEHRUNG`, `BUCHHALTUNG` (Anzeige — gleiche Grenzen wie Mandanten-Expertenmodus-Toggle). Start, Hilfe, Anmeldung und Passwort bleiben sichtbar.
- **Stammdaten-Navigationspunkt:** Sichtbarkeit wie die übrigen operativen Domänen-Links — `isPrimaryNavLinkVisible("stammdaten", { hasSession, role })` in [`apps/web/src/lib/pwa-primary-nav-visibility.ts`](../../apps/web/src/lib/pwa-primary-nav-visibility.ts): bei gültiger Session für alle API-Rollen mit Datenzugang (`VIEWER` … `ADMIN`); ohne Session ausgeblendet.
- Zeile **„v1.3-Bezug“** pro API-Rolle: `v13DomainRolesForApiRole` in `apps/web/src/lib/v13-domain-role-mapping.ts` (reine **Hinweis-Texte**, keine Rechteänderung).

## 3) Änderungen an dieser Tabelle

Änderungen nur mit **PL-/ADR-Abstimmung**, wenn sich Mandanten-Policies oder das Backend-Rollenmodell ändern.

## 4) Phase-2 Pilot: Offer-Stamm (`OFFER_CREATE`) vs. LV (`LV_*`)

**Quelle der technischen Matrix:** [`src/services/authorization-service.ts`](../../src/services/authorization-service.ts) (`OFFER_STATUS_ACTION_BY_ROLE`, `LV_ACTION_BY_ROLE`, sowie `getAllowedActions` / projektbezogene Aktionen).

| Thema | Verhalten |
| --- | --- |
| **Offer-Stamm anlegen** | `OFFER_CREATE` ist für **`ADMIN`** und **`VERTRIEB_BAULEITUNG`** vorgesehen (nicht für `GESCHAEFTSFUEHRUNG`, `BUCHHALTUNG`, `VIEWER`). HTTP: `POST /offers` nur nach erfolgreicher AuthZ-Assertion. |
| **LV-Struktur bearbeiten** (`LV_ADD_*`, Updates am ENTWURF u. a.) | **`ADMIN`** und **`VERTRIEB_BAULEITUNG`**; **`GESCHAEFTSFUEHRUNG`** hat Freigabe-/Versions-Aktionen auf LV-Ebene (`LV_SET_FREIGEGEBEN`, `LV_CREATE_NEXT_VERSION`, …), aber **keine** `LV_ADD_*` gemäß `LV_ACTION_BY_ROLE`. |
| **„Nur LV, nie Offer“ pro Benutzer** | Im Backend gibt es **keine** feinere Aufteilung innerhalb von `VERTRIEB_BAULEITUNG`. Trennung erfordert **separate Konten/Rollen** oder eine **bewusste Policy-Erweiterung** (Ticket + Anpassung von `action-contracts.json` / Backend — nicht Teil des MVP-Pilot-Defaults). |

Die PWA zeigt Schreibaktionen **nur**, wenn sie in `GET /documents/:id/allowed-actions` stehen ([`docs/contracts/ui-action-executor-coverage.md`](./ui-action-executor-coverage.md)).

