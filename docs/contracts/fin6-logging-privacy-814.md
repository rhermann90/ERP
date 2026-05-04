# FIN-6 — Hinweise Logging und Datensparsamkeit (Systembeschreibung 8.14)

**Zweck:** Operative Mindestregeln für Backend-Logs im Finanz-/Zahlungskontext, bis eine vollständige Feldklassifikation in Code und Betriebshandbuch vorliegt.

## Header

- Strukturierte Request-Logs serialisieren **keine** Werte aus `Authorization`, `Cookie`, `Set-Cookie` (bereits in [`src/http/pwa-http-layer.ts`](../../src/http/pwa-http-layer.ts) `sanitizeHeaders`).  
- **`Idempotency-Key`** (FIN-3 Zahlungseingang): Wert nicht in Klartext in strukturierten Logs ausgeben — Header wird für die Serializer-Ausgabe unterdrückt (gleiche Datei).

## Request-/Response-Body

- Fastify-Standard-`req`-Serializer loggt **keinen** Body; das beibehalten.  
- Bei künftigen Debug-Hooks: keine Rohpayloads von `POST /finance/payments/intake` oder Zahlungsmetadaten loggen; nur Domänencodes / `correlationId`.

## PWA

- Keine Offline-Schreibpfade für Finanz — siehe [`apps/web/README.md`](../../apps/web/README.md) und README Root.

## Abnahme

- Bei FIN-6-Abschluss: Stichprobe gegen Quality Gate 15 und dieses Dokument; Erweiterung um konkrete Feldlisten sobald Datenschutz-Fach die Klassifikation liefert.
