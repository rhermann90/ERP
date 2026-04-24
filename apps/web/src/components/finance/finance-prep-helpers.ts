import type { DunningEmailFooterReadResponse } from "../../lib/api-client.js";

/** Loose UUID v4 check for enabling buttons (server validates strictly). */
export function isUuidShape(value: string): boolean {
  const t = value.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(t);
}

export function formatSkontoDisplay(skontoBps: number | undefined): string {
  if (skontoBps === undefined) return "—";
  const pct = skontoBps / 100;
  return `${skontoBps} BP (${pct.toLocaleString("de-DE", { minimumFractionDigits: pct % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} %)`;
}

export type DunningEmailFooterData = DunningEmailFooterReadResponse["data"];

/** Lesbare DE-Texte zu stabilen `impressumGaps`-Codes (API). */
export function impressumGapLabelDe(code: string): string {
  switch (code) {
    case "REGISTER_PAIR_INCOMPLETE":
      return "Handelsregister: nur Gericht oder nur Nummer — beides gemeinsam ausfüllen oder beides leer lassen.";
    case "LEGAL_REPRESENTATIVE_MISSING":
      return "Vertretungsberechtigte/r: für die Heuristik „erweitert“ erforderlich (rechtsformspezifisch mit StB/PL prüfen).";
    case "VAT_ID_MISSING":
      return "USt-IdNr. (DE): für die Heuristik „erweitert“ erforderlich — Pflicht im Geschäftsverkehr gesondert klären.";
    case "VAT_ID_FORMAT_INVALID":
      return "USt-IdNr. (DE): erwartetes Muster DE + 9 Ziffern (grobe Prüfung, keine Vollvalidierung).";
    default:
      return `Hinweis (${code})`;
  }
}

export function impressumComplianceTierTitleDe(tier: DunningEmailFooterData["impressumComplianceTier"]): string {
  return tier === "EXTENDED" ? "Impressum-Heuristik: erweitert" : "Impressum-Heuristik: Mindeststufe";
}

export function impressumComplianceTierExplanationDe(data: DunningEmailFooterData): string {
  if (data.impressumComplianceTier === "EXTENDED") {
    return "Alle im Produkt hinterlegten Mindest- und Heuristik-Checks sind erfüllt. Das ersetzt keine fachliche Freigabe des Impressums (Rechtsform, Geschäftsbriefrecht).";
  }
  if (!data.readyForEmailFooter) {
    return "Die sechs technischen Pflichtfelder für den Footer sind noch nicht vollständig (siehe fehlende Felder in der JSON-Antwort). Zusätzliche Hinweise können unten stehen.";
  }
  return "Die technischen Mindestfelder sind gesetzt, es bleiben jedoch Heuristik-Hinweise (siehe Liste). Kein Ersatz für StB/DSB-Freigabe.";
}
