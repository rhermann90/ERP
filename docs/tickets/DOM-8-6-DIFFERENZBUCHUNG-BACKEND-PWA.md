# DOM — §5.4 / §8.6 Differenzbuchung (Backend vor PWA-Tiefe)

**Status:** Backlog / Domänen-Inkrement  
**Stand:** 2026-05-07  
**Bezug:** [`docs/ERP-Systembeschreibung.md`](../ERP-Systembeschreibung.md) (v3.0 — Aufmasskorrekturen nach Rechnung, Differenzbuchung, nächster Entwurf; nach Schlussrechnung Plus/Minus-Automatik), Teil IV Lieferplan Zeile „Aufmass–Rechnung–Differenz“, Teil V Welle W2.

## Problem

Die normative Domäne verlangt persistierte **Differenzbuchungen** und nachvollziehbare Auslöser (Aufmassversionspaar, Konditionswechsel). Im Repository sind hierfür **keine** dedizierten Prisma-/API-/OpenAPI-Schichten als abgeschlossener Slice erkennbar — eine PWA kann §8.6 nicht belastbar darstellen, bevor Lesepfade und Daten existieren.

## Ziel

1. Domänenmodell + Migration + Service (mandantenisoliert, auditierbar).  
2. OpenAPI + Contract-Tests + ADR (Non-Goals vs. gebuchte Rechnung unverändert).  
3. PWA: Rechnungs-Shell oder Projektansicht um **Differenz-/Auslöser-Metadaten** erweitern (read-only zuerst).

## Nicht-Ziele

- Gebuchte Rechnungen mutieren.  
- Clientseitige Berechnung von Differenzbeträgen.

## Verweise

- [`docs/PWA-Entwicklungsreferenz.md`](../PWA-Entwicklungsreferenz.md) — Ist-Matrix Traceability / FIN.  
- [`docs/plans/pwa-backend-coverage-matrix.md`](../plans/pwa-backend-coverage-matrix.md).
