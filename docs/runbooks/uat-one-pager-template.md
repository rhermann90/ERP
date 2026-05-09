# UAT — Ein-Pager (Zugänge und Referenzdaten)

**Anleitung:** Kopieren, ausfüllen und UAT-Teilnehmern geben (nicht committen, wenn echte Secrets enthalten). Für **reines Repo-Demo ohne echte Mandanten** können Referenz-UUIDs mit [`apps/web/src/lib/demo-seed-ids.ts`](../../apps/web/src/lib/demo-seed-ids.ts) / [`src/composition/seed.ts`](../../src/composition/seed.ts) übereinstimmen — auf **Staging mit anderem Mandanten** nur die vom Team freigegebenen IDs verwenden ([`PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md`](../tickets/PILOT-PRODUKTIV-GO-FIN-PHASE2-CHARTER.md)).

| Feld | Wert |
|------|------|
| Umgebungsname | z. B. Staging |
| PWA-Basis-URL (HTTPS) | |
| API-Basis-URL (öffentlich, HTTPS) | |
| Deploy-Commit / Tag | |
| Datum Übergabe | |

## Mandant und Anmeldung

| Feld | Wert |
|------|------|
| Mandanten-ID (`tenantId` beim Login) | |
| Admin — E-Mail | |
| Admin — Passwort | *(getrennt übergeben, nicht im Git)* |
| Viewer — E-Mail (falls vorhanden) | |
| Viewer — Passwort | |

**Hinweis Auth:** [`docs/authentication-login.md`](../authentication-login.md). In Development sind Seed-Passwörter oft `dev-seed-admin-12` / `dev-seed-viewer-12`; **Staging/Prod** immer team-vergebene Passwörter.

## Referenz-UUIDs für manuelle Tests

*(Repo-Seed-Beispiele — nur nutzen, wenn Staging dieselben Seeds lädt.)*

| Rolle im Test | UUID | Quelle im Repo |
|---------------|------|----------------|
| LV_VERSION (Lesepfad / Shell) | `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001` | `DEMO_SEED_IDS.lvVersionId` |
| OFFER_VERSION | `33333333-3333-4333-8333-333333333333` | `DEMO_SEED_IDS.offerVersionId` |
| INVOICE (gebucht) | `44444444-4444-4444-8444-444444444444` | `DEMO_SEED_IDS.invoiceId` |
| INVOICE ENTWURF (SMALL_BUSINESS_19) | `57575757-5757-4575-8575-575757575757` | `DEMO_SEED_IDS.invoiceDraftSmallBusinessId` |
| MEASUREMENT_VERSION | `cccccccc-cccc-4ccc-8ccc-cccccccc0001` | `DEMO_SEED_IDS.measurementVersionId` |
| SUPPLEMENT_VERSION | `91919191-9191-4191-8191-919191919191` | `DEMO_SEED_IDS.supplementVersionId` |
| Projekt / Kunde (Pilot-Kontext) | siehe `projectId` / `customerId` in `demo-seed-ids.ts` | |

**Staging-spezifische IDs:** Wenn abweichend, hier eintragen:

| Entität | Staging-UUID |
|---------|----------------|
| Pilot-Projekt | |
| Pilot-Kunde | |
| LV_VERSION | |
| OFFER_VERSION | |
| INVOICE | |

## Optionale Integrations für erweiterte UAT

| Thema | Konfiguriert? | Notiz |
|-------|----------------|-------|
| SMTP / Passwort-Reset | ja/nein | |
| Mahn-E-Mail (Versand oder Sandbox) | ja/nein | [`m4-slice-5c-pl-mandanten-go.md`](./m4-slice-5c-pl-mandanten-go.md) |
