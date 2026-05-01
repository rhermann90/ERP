# M4 — Mini-Slice 1: Mahn-Vorlagen Lesepfad (read-only, ohne Versand)

**Status:** Erledigt (Repo, 2026-04-23) — Merge-Reife mit `verify:ci` + `verify:ci:local-db`; Folge: [`M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md`](./M4-MINI-SLICE-2-PLACEHOLDERS-PATCH-2026-04-23.md)  
**Rahmen:** [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0 (Sprint-Kontext / System — zuerst) — technische Umsetzung erfolgt im Team-Clone; **Team-Entscheid** für Priorität **Vorlagen-Read** vor **E-Mail-Stammdaten** bzw. **erweitertes Mahnprotokoll** ist dokumentiert als **Default für diesen Slice** (nachfolgende Team-Vetos ersetzen dieses Ticket explizit).

## Team-Entscheid — gewählter erster M4-Mini-Slice

| Option | Entscheid |
|--------|-----------|
| **Vorlagen-Read** | **Gewählt** für Slice 1 — vertikaler Lesepfad `GET /finance/dunning-reminder-templates` (Schema + GET + OpenAPI + Tests + ADR), **ohne** Versand, **ohne** Rendering-Engine, **ohne** Platzhalter-Validierung (Folge-Slice). |
| E-Mail-Stammdaten (Footer-Pflichtfelder) | Zurückgestellt — eigener Slice nach §8.10 Pflichtfooter. |
| Erweitertes Mahnprotokoll (Versandart, …) | Zurückgestellt — `dunning_reminders` bleibt bis dahin Anker; Erweiterung nur mit ADR-Folge. |

## Ableitung aus §8.10 (`docs/ERP-Systembeschreibung.md`)

Für diesen Slice relevant (Auszug):

- **Vorlagen-Typ-Kardinalität:** Je Mahnstufe **genau ein** Vorlagen-Typ (`REMINDER` = Zahlungserinnerung, `DEMAND_NOTE` = Zahlungsavis, `DUNNING` = Mahnung) — im Read-Modell als Feld `templateType` je Stufe und Kanal ausgeliefert.
- **Kanäle:** Pro Stufe getrennte Texte für **E-Mail** und **Druck/PDF** erlaubt — im Modell `channel`: `EMAIL` | `PRINT`.
- **Pflichtplatzhalter (Spez, nicht automatisch validiert in Slice 1):** Jede Mahn-Vorlage enthält **`{{MahngebuehrEUR}}`**; Typen REMINDER/DEMAND_NOTE zusätzlich **`{{SkontoBetragEUR}}`**, **`{{SkontofristDatum}}`** — MVP-Default-Texte enthalten diese Strings als **Illustration** für Integrationstests/Lesepfad.
- **Non-Goals Slice 1:** E-Mail-Systemfooter-Stammdaten, Versand, Massenversand, Vorschau-UI, serverseitiges Platzhalter-Rendering, HTML-Sanitization-Pflicht (Folge-Inkremente).

## Lieferumfang (Slice 1)

| Artefakt | Beschreibung |
|----------|--------------|
| **HTTP** | `GET /finance/dunning-reminder-templates` — `{ data: { templateSource, tenantId, stages[] } }` mit je Stufe Einträgen pro Kanal |
| **Persistenz** | Tabelle `dunning_tenant_stage_templates` (PK `tenant_id`, `stage_ordinal`, `channel`); optional `deleted_at` für spätere Soft-Delete-Parität |
| **Vollständigkeit** | Exakt **18** aktive Zeilen (9 Stufen × 2 Kanäle) → `templateSource: TENANT_DATABASE`, sonst `MVP_STATIC_DEFAULTS` |
| **Auth** | `assertCanReadInvoice` (wie Konfig-Lesepfad) |
| **Verträge** | OpenAPI `finDunningReminderTemplatesGet`; ADR-0010 „M4 Slice 1“ |

## Referenzen

- Vorlagen / M4: [`docs/adr/0010-fin4-m4-dunning-email-and-templates.md`](../adr/0010-fin4-m4-dunning-email-and-templates.md)  
- Stufen-Konfig (Kontext): [`docs/adr/0009-fin4-mahnwesen-slice.md`](../adr/0009-fin4-mahnwesen-slice.md)  
- Wellendoku: [`NEXT-INCREMENT-FINANCE-WAVE3.md`](./NEXT-INCREMENT-FINANCE-WAVE3.md)
