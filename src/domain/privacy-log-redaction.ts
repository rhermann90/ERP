/**
 * FIN-6 / §8.14 — Hilfen für **protokollisierte** Ausgaben (keine Krypto-Geheimnisse).
 * Vollständige Feldklassifikation: `docs/contracts/fin6-logging-privacy-814.md`.
 */

const MAX_REF_VISUAL = 24;

/**
 * Reduziert `externalReference` (Zahlungseingang, Roh-Verwendungszweck) für Logs/Support:
 * Länge begrenzt, kein Volltext bei langen Strings.
 */
export function redactExternalReferenceForLog(raw: string): string {
  const t = raw.trim();
  if (t.length <= MAX_REF_VISUAL) return t;
  return `${t.slice(0, 8)}…(${t.length} Zeichen)…${t.slice(-4)}`;
}
