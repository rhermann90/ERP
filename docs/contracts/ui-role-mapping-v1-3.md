# UI — Abbild fachlicher Rollen (v1.3 §11.1) auf API-Rollen (`UserRole`)

**Quelle:** [`ERP Systembeschreibung v1.3.md`](../../ERP%20Systembeschreibung%20v1.3.md) §11.1 *Rollenbeispiele* und §11.2 *Aktionsrechte je Status*.  
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
- Zeile **„v1.3-Bezug“** pro API-Rolle: `v13DomainRolesForApiRole` in `apps/web/src/lib/v13-domain-role-mapping.ts` (reine **Hinweis-Texte**, keine Rechteänderung).

## 3) Änderungen an dieser Tabelle

Änderungen nur mit **PL-/ADR-Abstimmung**, wenn sich Mandanten-Policies oder das Backend-Rollenmodell ändern.
