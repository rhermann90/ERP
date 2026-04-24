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
 * 8.4 Schritt 2 (Inkrement **B2-1a**): Skonto aliquot in Basispunkten (0–10_000) auf Netto nach Schritt 1.
 * Abzug in Cent: `round(net × skontoBps / 10_000)`, höchstens `net` (kein negatives Netto).
 */
export function skontoNetReductionCents84_2(netAfterStep1Cents: number, skontoBps: number): number {
  if (netAfterStep1Cents <= 0 || skontoBps <= 0) return 0;
  const bps = Math.min(10_000, Math.max(0, skontoBps));
  const raw = Math.round((netAfterStep1Cents * bps) / 10_000);
  return Math.min(raw, netAfterStep1Cents);
}

/**
 * 8.4 Schritte 2–6: **B2-1a** wendet nur Schritt 2 (Skonto in BP) an; Schritte 3–6 bleiben Identität.
 * Ohne `skontoBps` bzw. bei `0` entspricht das weiterhin **B2-0** (Netto nach 6 = Netto nach 1).
 */
export function netCentsAfterStep84_6Mvp(
  lvNetAfterStep1Cents: number,
  options?: { skontoBps?: number },
): number {
  const skontoBps = options?.skontoBps ?? 0;
  const reduction = skontoNetReductionCents84_2(lvNetAfterStep1Cents, skontoBps);
  return lvNetAfterStep1Cents - reduction;
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
