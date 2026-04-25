import Holidays from "date-holidays";
import { DomainError } from "../errors/domain-error.js";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type PaymentTermDayKind = "CALENDAR" | "BUSINESS";

/** Kalendertage ab ISO-Datum (Kalendertag, ohne Zeitzonenverschiebung der Anker-Uhrzeit). */
export function addCalendarDaysToIsoDate(isoDate: string, days: number): string {
  const m = ISO_DATE.exec(isoDate);
  if (!m) {
    throw new DomainError("VALIDATION_FAILED", "Internes Datumsformat ungueltig", 400);
  }
  const base = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const mo = String(base.getUTCMonth() + 1).padStart(2, "0");
  const da = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function isoParts(isoDate: string): { y: number; m: number; d: number } {
  const m = ISO_DATE.exec(isoDate);
  if (!m) {
    throw new DomainError("VALIDATION_FAILED", "Internes Datumsformat ungueltig", 400);
  }
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** UTC-Wochentag 0=So … 6=Sa für ein reines Kalenderdatum (UTC-Mitternacht). */
function utcWeekday(isoDate: string): number {
  const { y, m, d } = isoParts(isoDate);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isWeekendUtc(isoDate: string): boolean {
  const w = utcWeekday(isoDate);
  return w === 0 || w === 6;
}

let holidaysDeNational: Holidays | null = null;
const holidaysByState = new Map<string, Holidays>();

function getHolidays(federalStateCode: string | null): Holidays {
  if (!federalStateCode || federalStateCode.trim() === "") {
    if (!holidaysDeNational) {
      holidaysDeNational = new Holidays("DE");
    }
    return holidaysDeNational;
  }
  const key = federalStateCode.trim().toUpperCase();
  let h = holidaysByState.get(key);
  if (!h) {
    h = new Holidays("DE", key);
    holidaysByState.set(key, h);
  }
  return h;
}

/** Feiertag — prüft lokales Datum des ISO-Strings in DE. */
function isPublicHolidayDe(isoDate: string, federalStateCode: string | null): boolean {
  const { y, m, d } = isoParts(isoDate);
  const h = getHolidays(federalStateCode);
  const day = new Date(y, m - 1, d, 12, 0, 0, 0);
  const ev = h.isHoliday(day);
  return Array.isArray(ev) ? ev.length > 0 : Boolean(ev);
}

function isBusinessDayUtc(isoDate: string, federalStateCode: string | null): boolean {
  if (isWeekendUtc(isoDate)) return false;
  if (isPublicHolidayDe(isoDate, federalStateCode)) return false;
  return true;
}

/**
 * Ab `anchorIso` (yyyy-mm-dd) `businessDays` volle Werktage (Mo–Fr, DE-Feiertage national oder Bundesland) vorwärts zählen.
 * Der Anker ist exklusiv: erster gezählter Werktag ist der erste Werktag **nach** dem Anker (MVP: Anker = Rechnungsdatum).
 */
export function addBusinessDaysToIsoDate(
  anchorIso: string,
  businessDays: number,
  federalStateCode: string | null,
): string {
  if (!Number.isInteger(businessDays) || businessDays < 0) {
    throw new DomainError("VALIDATION_FAILED", "businessDays muss eine nicht-negative Ganzzahl sein", 400);
  }
  let current = anchorIso;
  let remaining = businessDays;
  while (remaining > 0) {
    current = addCalendarDaysToIsoDate(current, 1);
    if (isBusinessDayUtc(current, federalStateCode)) {
      remaining -= 1;
    }
  }
  return current;
}

/** Heutiges Kalenderdatum in `ianaTimezone` (IANA), Ausgabe yyyy-mm-dd. */
export function localTodayIsoDateInZone(ianaTimezone: string): string {
  const tz = ianaTimezone.trim() || "UTC";
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")?.value;
    const mo = parts.find((p) => p.type === "month")?.value;
    const da = parts.find((p) => p.type === "day")?.value;
    if (!y || !mo || !da) {
      throw new Error("missing parts");
    }
    return `${y}-${mo}-${da}`;
  } catch {
    throw new DomainError("VALIDATION_FAILED", `Ungueltige IANA-Zeitzone: ${tz}`, 400);
  }
}

export function deadlineAfterIssueDate(
  issueDate: string,
  daysAfterDue: number,
  dayKind: PaymentTermDayKind,
  federalStateCode: string | null,
): string {
  if (dayKind === "BUSINESS") {
    return addBusinessDaysToIsoDate(issueDate, daysAfterDue, federalStateCode);
  }
  return addCalendarDaysToIsoDate(issueDate, daysAfterDue);
}
