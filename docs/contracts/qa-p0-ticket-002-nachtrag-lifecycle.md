# P0-Tests — TICKET-002 Nachtrags-Lebenszyklus (v1.2)

**Gültig nach Freigabe TICKET-002.** Alle P0 müssen grün sein vor Merge.

| ID | Bereich | Vorbedingung | Aktion | Erwartung |
|----|---------|--------------|--------|-----------|
| P0-N-01 | Tenant | Nachtrag Tenant A | Read/Write mit Tenant B Token | 403/404, kein Leak |
| P0-N-02 | Lifecycle | Nachtrag ENTWURF | Erlaubter Übergang IN_FREIGABE | 200 + Audit STATUS_CHANGED |
| P0-N-03 | Lifecycle | IN_FREIGABE | Übergang FREIGEGEBEN mit berechtigter Rolle | 200 + Audit |
| P0-N-04 | Lifecycle | FREIGEGEBEN | VERSENDET | 200 + Audit |
| P0-N-05 | Lifecycle | VERSENDET | BEAUFTRAGT vs ABGELEHNT | 200; Endstatus konsistent |
| P0-N-06 | Wirkung | Status \< BEAUFTRAGT | API die Aufmass-/Rechnungswirkung auslösen würde | 409 fail-closed (Code festzulegen) |
| P0-N-07 | Wirkung | BEAUFTRAGT | Minimal-Kopplung Aufmass (o. ä.) | 201/200, Referenz Nachtrag + Basisversion |
| P0-N-08 | Immutability | BEAUFTRAGT | Mutation `baseOfferVersionId` / Basisversion | 409/403, keine Änderung |
| P0-N-09 | Traceability | Rechnung mit Nachtrag | Export-Preflight INVOICE | fail-closed wenn Kette bricht |
| P0-N-10 | SoT | Pro Status | allowed-actions (SoT) vs. tatsächlicher Endpoint | keine Aktion ohne SoT-Eintrag |

## Hinweis
Konkrete Endpunkte, Fehlercodes und Rollen pro Zeile werden beim Implementierungsstart aus `action-contracts.json` und ADR-0002 übernommen.

## Beispiel-Requests je P0-ID

### P0-N-01 Tenant-Isolation (Fastify inject)
```ts
await app.inject({
  method: "GET",
  url: `/supplements/${supplementId}`,
  headers: { ...buildHeaders("ADMIN"), "x-tenant-id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
});
// Erwartung: 403 TENANT_SCOPE_VIOLATION (oder 404 ohne Leak)
```

### P0-N-02 ENTWURF -> IN_FREIGABE (curl)
```bash
curl -s -X POST http://localhost:3000/supplements/status \
  -H "authorization: Bearer <token_VERTRIEB_BAULEITUNG>" -H "x-tenant-id: <tenant>" -H "content-type: application/json" \
  -d '{"supplementVersionId":"<id>","nextStatus":"IN_FREIGABE","reason":"Freigabe starten"}'
```

### P0-N-03 IN_FREIGABE -> FREIGEGEBEN (Fastify inject)
```ts
await app.inject({
  method: "POST",
  url: "/supplements/status",
  headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
  payload: { supplementVersionId: supplementId, nextStatus: "FREIGEGEBEN", reason: "Freigabe erteilt" },
});
```

### P0-N-04 FREIGEGEBEN -> VERSENDET (curl)
```bash
curl -s -X POST http://localhost:3000/supplements/status \
  -H "authorization: Bearer <token_VERTRIEB_BAULEITUNG>" -H "x-tenant-id: <tenant>" -H "content-type: application/json" \
  -d '{"supplementVersionId":"<id>","nextStatus":"VERSENDET","reason":"Nachtrag versendet"}'
```

### P0-N-05 VERSENDET -> BEAUFTRAGT/ABGELEHNT (Fastify inject)
```ts
await app.inject({
  method: "POST",
  url: "/supplements/status",
  headers: buildHeaders("GESCHAEFTSFUEHRUNG"),
  payload: { supplementVersionId: supplementId, nextStatus: "BEAUFTRAGT", reason: "Auftrag bestaetigt" },
});
```

### P0-N-06 Wirkung vor BEAUFTRAGT blockiert (Fastify inject)
```ts
const blocked = await app.inject({
  method: "POST",
  url: `/supplements/${supplementId}/billing-impact`,
  headers: buildHeaders("BUCHHALTUNG"),
  payload: { invoiceId: SEED_IDS.invoiceId, reason: "Zu frueh" },
});
expect(blocked.statusCode).toBe(409);
expect(blocked.json().code).toBe("SUPPLEMENT_BILLING_EFFECT_FORBIDDEN");
```

### P0-N-07 Wirkung ab BEAUFTRAGT erlaubt (curl)
```bash
curl -s -X POST http://localhost:3000/supplements/<supplementId>/billing-impact \
  -H "authorization: Bearer <token_BUCHHALTUNG>" -H "x-tenant-id: <tenant>" -H "content-type: application/json" \
  -d '{"invoiceId":"<invoiceId>","reason":"Abrechnungswirkung aktivieren"}'
# Erwartung: 200 + supplementVersionId/invoiceId gesetzt
```

### P0-N-08 Immutability Basisversion (Fastify inject)
```ts
const blocked = await app.inject({
  method: "POST",
  url: `/offers/${offerId}/supplements`,
  headers: buildHeaders("VERTRIEB_BAULEITUNG"),
  payload: { baseOfferVersionId: nonAcceptedBaseId, lvVersionId: newLvId, editingText: "x", reason: "x1234" },
});
expect(blocked.statusCode).toBe(409);
expect(blocked.json().code).toBe("SUPPLEMENT_BASE_NOT_ACCEPTED");
```

### P0-N-09 Traceability Export fail-closed (curl)
```bash
curl -s -X POST http://localhost:3000/exports \
  -H "authorization: Bearer <token_BUCHHALTUNG>" -H "x-tenant-id: <tenant>" -H "content-type: application/json" \
  -d '{"entityType":"INVOICE","entityId":"<brokenTraceInvoiceId>","format":"XRECHNUNG"}'
# Erwartung: 422 TRACEABILITY_LINK_MISSING oder TRACEABILITY_FIELD_MISMATCH
```

### P0-N-10 allowedActions SoT (Fastify inject)
```ts
const allowed = await app.inject({
  method: "GET",
  url: `/documents/${supplementId}/allowed-actions?entityType=SUPPLEMENT_VERSION`,
  headers: buildHeaders("VERTRIEB_BAULEITUNG"),
});
expect(allowed.statusCode).toBe(200);
// UI darf nur Actions aus allowed.json().allowedActions ausfuehren.
```
