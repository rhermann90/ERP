/** Kurzes Datum/Uhrzeit für FIN-1- und Stammdaten-Anzeigen (de-DE). */
export function formatDateTime(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return iso;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(d));
}
