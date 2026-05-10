/**
 * DOM-8-6: optionales Slice-3-Hinweis-Gate (ADR-0024 Gutschrift-Pfad).
 * Steuert nur den ausführlichen Nutzer-Hinweistext in der Finanz-Vorbereitung; Mandanten/Domäne bleiben API-seitig.
 */

/** Slice 3 — ausführlicher Hinweistext nach Buchung bei `GUTSCHRIFT_REQUIRES_MANUAL_DRAFT` (Next Steps). */
export function isDom86Slice3MitigationGutschriftHintUiEnabled(): boolean {
  const raw = import.meta.env.VITE_DOM86_SLICE3_MITIGATION_GUTSCHRIFT_HINT;
  return typeof raw === "string" && raw.trim() === "1";
}
