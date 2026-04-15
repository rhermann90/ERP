# QA P0 – Angebotsversion v1.2 (VERSENDET / ANGENOMMEN)

Referenz: `ERP Systembeschreibung v1.2`, `docs/contracts/module-contracts.json`, `src/domain/offer-create-version-policy.ts`.  
Automatisierte Evidenz: `test/app.test.ts` (Abschnitte zu Versand, Annahme, Nachtrag).

## P0-1 VERSENDET – keine In-Place-Änderung, nur neue Version

| ID | Prüfpunkt | Erwartung | Negativfall |
| --- | --- | --- | --- |
| P0-V12-01 | Bestehende `OfferVersion` mit Status `VERSENDET` darf inhaltlich nicht per „Update gleicher Datensatz“ geändert werden (kein PATCH auf Kerndaten der Version). | Nur dokumentierte Schreibwege: Statuswechsel oder neue Version. | Jede API, die `systemText`/`editingText`/`lvVersionId` der **gleichen** `offerVersionId` überschreibt, ist P0-Fail. |
| P0-V12-02 | `POST /offers/version` mit gültigem `offerId` und aktueller Version `VERSENDET` erzeugt **neue** Version (`201`, höhere `versionNumber`, neuer `OfferVersion`-Satz). | `201`, neue Entwurfsversion; alte `VERSENDET`-Zeile unverändert. | `409` mit falscher Business-Begründung oder Überschreiben der alten Version. |
| P0-V12-03 | `GET /documents/{currentOfferVersionId}/allowed-actions?entityType=OFFER_VERSION` für Rolle mit Recht enthält `OFFER_CREATE_VERSION`, solange Policy `OFFER_CREATE_VERSION_ALLOWED_STATUSES` `VERSENDET` einschließt. | Action-Liste enthält `OFFER_CREATE_VERSION` (SoT). | Action fehlt, obwohl Backend-Policy erlaubt. |

## P0-2 ANGENOMMEN – kein OFFER_CREATE_VERSION, Nachtragspfad

| ID | Prüfpunkt | Erwartung | Negativfall |
| --- | --- | --- | --- |
| P0-V12-04 | Aktuelle Version `ANGENOMMEN`: `POST /offers/version` | `409`, `code: FOLLOWUP_DOCUMENT_REQUIRED`. | `201` oder anderer Code als dokumentiert. |
| P0-V12-05 | Aktuelle Version `ANGENOMMEN`: `allowed-actions` für berechtigte Rolle | **Kein** `OFFER_CREATE_VERSION`. | `OFFER_CREATE_VERSION` in Liste. |
| P0-V12-06 | Nachtrag nur nach Annahme: `POST /offers/{offerId}/supplements` mit `baseOfferVersionId` = angenommene Version | `201`, neue Version/Angebotsteil im Status `ENTWURF` (laut API-Vertrag). | `409` `SUPPLEMENT_BASE_NOT_ACCEPTED`, wenn Basis nicht `ANGENOMMEN`. |
| P0-V12-07 | Nachtrag ohne Annahme: gleicher Request bei Basis ≠ `ANGENOMMEN` | `409`, `SUPPLEMENT_BASE_NOT_ACCEPTED` (oder dokumentierter gleichwertiger Code). | Erfolg ohne Annahme. |

## Querschnitt P0 (Tenant / AuthZ)

| ID | Prüfpunkt | Erwartung |
| --- | --- | --- |
| P0-V12-08 | `POST /offers/version` / Nachtrag mit `x-tenant-id` ≠ Token-Tenant | `403`, `TENANT_SCOPE_VIOLATION` |
| P0-V12-09 | Aktion ohne Rolle (z. B. `VIEWER`) | `403`, `AUTH_ROLE_FORBIDDEN` |

## Abnahme

- Alle P0-V12-01 … P0-V12-09 **bestanden** → v1.2-Policy für diesen Slice **GO**.  
- Ein Fail bei P0-V12-01,02, 04, 05, 06, 07 → **NO_GO** (Rechts-/Konsistenzrisiko).

## Konkrete Beispiele je P0-ID

### P0-V12-01 (Fastify inject)
```ts
const blockedUpdate = await app.inject({
  method: "PATCH",
  url: `/offer-versions/${SEED_IDS.offerVersionId}`,
  headers: buildHeaders("VERTRIEB"),
  payload: { editingText: "In-place Versuch" },
});
expect([404, 405]).toContain(blockedUpdate.statusCode);
```

### P0-V12-02 (Fastify inject)
```ts
const createAfterSent = await app.inject({
  method: "POST",
  url: "/offers/version",
  headers: buildHeaders("VERTRIEB"),
  payload: {
    offerId: SEED_IDS.offerId,
    lvVersionId: "99999999-9999-4999-8999-999999999999",
    editingText: "Nach Versand neue Version",
    reason: "Nicht-destruktive Anpassung",
  },
});
expect(createAfterSent.statusCode).toBe(201);
```

### P0-V12-03 (curl)
```bash
curl -s -X GET "http://localhost:3000/documents/<offerVersionId>/allowed-actions?entityType=OFFER_VERSION" \
  -H "authorization: Bearer <token_VERTRIEB>" \
  -H "x-tenant-id: <tenantId>"
# Erwartung: allowedActions enthält OFFER_CREATE_VERSION (bei Status VERSENDET)
```

### P0-V12-04 (Fastify inject)
```ts
const blockedCreate = await app.inject({
  method: "POST",
  url: "/offers/version",
  headers: buildHeaders("VERTRIEB"),
  payload: {
    offerId: SEED_IDS.offerId,
    lvVersionId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    editingText: "Nach Annahme nicht erlaubt",
    reason: "Muss Nachtrag sein",
  },
});
expect(blockedCreate.statusCode).toBe(409);
expect(blockedCreate.json().code).toBe("FOLLOWUP_DOCUMENT_REQUIRED");
```

### P0-V12-05 (Fastify inject)
```ts
const actionsAfterAccepted = await app.inject({
  method: "GET",
  url: `/documents/${SEED_IDS.offerVersionId}/allowed-actions?entityType=OFFER_VERSION`,
  headers: buildHeaders("VERTRIEB"),
});
expect(actionsAfterAccepted.statusCode).toBe(200);
expect(actionsAfterAccepted.json().allowedActions).not.toContain("OFFER_CREATE_VERSION");
```

### P0-V12-06 (Fastify inject)
```ts
const supplement = await app.inject({
  method: "POST",
  url: `/offers/${SEED_IDS.offerId}/supplements`,
  headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
  payload: {
    baseOfferVersionId: SEED_IDS.offerVersionId,
    lvVersionId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    editingText: "Nachtragsleistung",
    reason: "Korrektur nach Annahme",
  },
});
expect(supplement.statusCode).toBe(201);
expect(supplement.json().status).toBe("ENTWURF");
```

### P0-V12-07 (curl)
```bash
curl -s -X POST "http://localhost:3000/offers/<offerId>/supplements" \
  -H "authorization: Bearer <token_GESCHAEFTSFUEHRUNG>" \
  -H "x-tenant-id: <tenantId>" \
  -H "content-type: application/json" \
  -d '{
    "baseOfferVersionId":"<notAcceptedVersionId>",
    "lvVersionId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    "editingText":"Nicht erlaubt",
    "reason":"Basis noch nicht angenommen"
  }'
# Erwartung: HTTP 409, code=SUPPLEMENT_BASE_NOT_ACCEPTED
```

### P0-V12-08 (Fastify inject)
```ts
const tenantMismatch = await app.inject({
  method: "POST",
  url: "/offers/version",
  headers: {
    ...buildHeaders("VERTRIEB"),
    "x-tenant-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  },
  payload: {
    offerId: SEED_IDS.offerId,
    lvVersionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    editingText: "Tenant mismatch",
    reason: "Soll blockieren",
  },
});
expect(tenantMismatch.statusCode).toBe(403);
expect(tenantMismatch.json().code).toBe("TENANT_SCOPE_VIOLATION");
```

### P0-V12-09 (Fastify inject)
```ts
const forbidden = await app.inject({
  method: "POST",
  url: `/offers/${SEED_IDS.offerId}/supplements`,
  headers: buildHeaders("VIEWER"),
  payload: {
    baseOfferVersionId: SEED_IDS.offerVersionId,
    lvVersionId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    editingText: "Unberechtigt",
    reason: "Role check",
  },
});
expect(forbidden.statusCode).toBe(403);
expect(forbidden.json().code).toBe("AUTH_ROLE_FORBIDDEN");
```
