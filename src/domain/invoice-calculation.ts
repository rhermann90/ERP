import type { LvPosition } from "./types.js";

/** Regel 8.11 / MVP: Regelsteuersatz 19 % (Deutschland), in Basispunkten. */
export const GERMAN_VAT_STANDARD_BPS = 1900;

/**
 * 8.4 Schritt 1 — LV-Summe (Netto): nur Positionsart NORMAL; je Zeile `round(Menge × Einzelpreis Cent)`.
 * ALTERNATIV/EVENTUAL werden nicht in die Summe einbezogen (kein fachlicher Mix im MVP-Slice).
 */
export function sumLvNetCentsStep84_1(positions: LvPosition[]): number {
  let sum = 0;
  for (const p of positions) {
    if (p.kind !== "NORMAL") continue;
    sum += Math.round(p.quantity * p.unitPriceCents);
  }
  return sum;
}

/**
 * 8.4 Schritte 2–6: in diesem Slice keine konfigurierten Nachlässe/Abzüge/Einbehalte — Netto unverändert.
 * Schritt 7: Umsatzsteuer 19 % auf das Netto nach Schritt 6 (hier = nach Schritt 1).
 * Schritt 8: Brutto = Netto + Steuer (Cent, serverseitig nach 8.12).
 */
export function computeGrossFromLvNetEurMvp(lvNetCents: number): {
  lvNetCents: number;
  vatRateBps: typeof GERMAN_VAT_STANDARD_BPS;
  vatCents: number;
  totalGrossCents: number;
} {
  const vatCents = Math.round((lvNetCents * GERMAN_VAT_STANDARD_BPS) / 10000);
  const totalGrossCents = lvNetCents + vatCents;
  return {
    lvNetCents,
    vatRateBps: GERMAN_VAT_STANDARD_BPS,
    vatCents,
    totalGrossCents,
  };
}
