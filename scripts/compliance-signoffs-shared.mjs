/**
 * Shared validation + parsing for compliance checklist sign-off ledger.
 * @see Checklisten/compliance-signoffs.schema.md
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
/** Technical ledger with `<!-- compliance-line: … -->` markers; printable text lives in `compliance-rechnung-finanz.md`. */
export const CHECKLIST_PATH = join(ROOT, "Checklisten/compliance-rechnung-finanz.ledger.md");
/** Narrative UTF-8 Markdown + gleicher Marker-Block wie Ledger (Dual-Apply aus `compliance-signoffs.json`). */
export const FILLED_MARKDOWN_PATH = join(ROOT, "Checklisten/compliance-rechnung-finanz-filled.md");
export const LEDGER_PATH = join(ROOT, "Checklisten/compliance-signoffs.json");

/** Alle Markdown-Dateien, deren `<!-- compliance-line -->`-Checkboxen aus JSON aktualisiert werden. */
export function ledgerMarkdownApplyTargets() {
  return [CHECKLIST_PATH, FILLED_MARKDOWN_PATH];
}

/** Global suffix allowlist (must match checklist convention). */
export const SUFFIX_ALLOWLIST = ["PL", "StB", "DSB", "PL+DSB", "StB+DSB", "StB+DSB+PL"];

/**
 * Per lineId: permitted suffix values (aligned with printable checklist „Ausfüllen“ hints).
 * Jeder `compliance-line`-Marker in der Ledger-Datei braucht hier einen Eintrag — sonst bricht `validate-compliance-signoffs`.
 */
export const LINE_ALLOWED_SUFFIXES = {
  "chk-a01": ["PL", "StB", "DSB", "StB+DSB", "PL+DSB"],
  "chk-a02": ["PL", "StB"],
  "chk-a03": ["StB+DSB", "DSB", "StB"],
  "chk-a04": ["StB", "DSB", "StB+DSB"],
  "chk-a05": ["PL"],
  "chk-a06": ["PL"],
  "chk-a07": ["PL", "StB", "DSB"],
  "chk-a08": ["PL"],
  "chk-a09": ["PL", "StB", "DSB", "StB+DSB"],
  "chk-b01": ["StB"],
  "chk-b02": ["StB"],
  "chk-b03": ["StB"],
  "chk-b04": ["StB"],
  "chk-b05": ["StB"],
  "chk-b06": ["StB"],
  "chk-b07": ["StB", "PL"],
  "chk-b08": ["StB"],
  "chk-b09": ["PL"],
  "chk-b10": ["StB"],
  "chk-b11": ["StB"],
  "chk-c01": ["StB", "PL"],
  "chk-c02": ["StB", "PL"],
  "chk-c03": ["StB", "PL"],
  "chk-c04": ["StB", "PL"],
  "chk-c05": ["StB+DSB+PL"],
  "chk-c06": ["StB"],
  "chk-c07": ["StB"],
  "chk-c08": ["StB", "PL", "DSB", "StB+DSB"],
  "chk-c09": ["StB", "PL"],
  "chk-d01": ["StB", "PL"],
  "chk-d02": ["StB", "PL"],
  "chk-d03": ["StB", "PL"],
  "chk-d04": ["StB", "PL"],
  "chk-d05": ["StB", "PL"],
  "chk-d06": ["StB", "PL"],
  "chk-e01": ["DSB", "StB", "StB+DSB"],
  "chk-e02": ["DSB"],
  "chk-e03": ["DSB", "PL", "PL+DSB"],
  "chk-e04": ["StB", "DSB", "StB+DSB"],
  "chk-e05": ["DSB", "PL"],
  "chk-e06": ["DSB", "PL", "PL+DSB"],
  "chk-e07": ["DSB", "PL"],
  "chk-e08": ["StB", "DSB", "StB+DSB"],
  "chk-e09": ["StB", "DSB", "StB+DSB"],
  "chk-e10": ["StB", "DSB", "StB+DSB"],
  "chk-f01": ["PL"],
  "chk-f02": ["DSB", "PL", "PL+DSB"],
  "chk-f03": ["StB+DSB+PL"],
  "chk-g01": ["PL"],
  "chk-g02": ["StB"],
  "chk-g03": ["DSB"],
  "chk-g04": ["PL", "StB", "DSB", "StB+DSB+PL"],
  "chk-g05": ["PL"],
  "chk-g06": ["PL", "StB"],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COMMENT_LINE_ID = /<!--\s*compliance-line:\s*([a-z0-9-]+)\s*-->/;

/** @returns {Map<string, number>} lineId -> 0-based index of bullet line */
export function extractLineIdToBulletIndex(lines) {
  const map = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(COMMENT_LINE_ID);
    if (!m) continue;
    const lineId = m[1];
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    if (j >= lines.length || !lines[j].trimStart().startsWith("- ")) {
      throw new Error(`compliance-line "${lineId}": expected markdown bullet "- " on next non-empty line after comment`);
    }
    if (map.has(lineId)) {
      throw new Error(`duplicate compliance-line marker: "${lineId}"`);
    }
    map.set(lineId, j);
  }
  return map;
}

function parseIsoDate(iso) {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error(`invalid calendar date: "${iso}"`);
  }
}

/**
 * @param {unknown} raw - parsed JSON root
 * @param {Map<string, number>} lineIdToIndex
 */
export function validateLedgerPayload(raw, lineIdToIndex) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("ledger root must be an object");
  }
  const signoffs = raw.signoffs;
  if (!Array.isArray(signoffs)) {
    throw new Error('ledger must contain array "signoffs"');
  }

  const seenSuffixPerLine = new Map();
  const normalized = [];

  for (let i = 0; i < signoffs.length; i++) {
    const entry = signoffs[i];
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`signoffs[${i}] must be an object`);
    }
    const { lineId, suffix, isoDate, evidenceRef } = entry;
    const approvalId = entry.approvalId ?? entry.token;

    if (typeof lineId !== "string" || !/^[a-z0-9-]+$/.test(lineId)) {
      throw new Error(`signoffs[${i}].lineId must match ^[a-z0-9-]+$`);
    }
    if (!lineIdToIndex.has(lineId)) {
      throw new Error(`signoffs[${i}]: unknown lineId "${lineId}" (no matching <!-- compliance-line --> in checklist)`);
    }
    if (typeof suffix !== "string" || !SUFFIX_ALLOWLIST.includes(suffix)) {
      throw new Error(`signoffs[${i}]: suffix "${suffix}" not in allowlist: ${SUFFIX_ALLOWLIST.join(", ")}`);
    }
    const allowed = LINE_ALLOWED_SUFFIXES[lineId];
    if (!allowed || !allowed.includes(suffix)) {
      throw new Error(
        `signoffs[${i}]: suffix "${suffix}" not permitted for lineId "${lineId}" (allowed: ${allowed ? allowed.join(", ") : "none — extend LINE_ALLOWED_SUFFIXES"})`,
      );
    }
    if (typeof isoDate !== "string" || !ISO_DATE.test(isoDate)) {
      throw new Error(`signoffs[${i}]: isoDate must be YYYY-MM-DD`);
    }
    parseIsoDate(isoDate);
    if (typeof evidenceRef !== "string" || evidenceRef.trim().length < 2) {
      throw new Error(`signoffs[${i}]: evidenceRef must be a non-empty string (min 2 chars)`);
    }
    if (approvalId !== undefined && typeof approvalId !== "string") {
      throw new Error(`signoffs[${i}]: approvalId/token must be string if present`);
    }

    const key = `${lineId}\0${suffix}`;
    const prev = seenSuffixPerLine.get(key);
    if (prev !== undefined && prev !== isoDate) {
      throw new Error(`conflicting entries for lineId "${lineId}" suffix "${suffix}": dates "${prev}" vs "${isoDate}"`);
    }
    seenSuffixPerLine.set(key, isoDate);

    normalized.push({
      lineId,
      suffix,
      isoDate,
      evidenceRef: evidenceRef.trim(),
      ...(approvalId !== undefined && approvalId !== "" ? { approvalId: String(approvalId) } : {}),
    });
  }

  return { signoffs: normalized };
}

export function loadLedger(path = LEDGER_PATH) {
  if (!existsSync(path)) {
    throw new Error(`ledger file not found: ${path}`);
  }
  const text = readFileSync(path, "utf8");
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`ledger JSON parse error: ${e.message}`);
  }
}

export function loadChecklist(path = CHECKLIST_PATH) {
  return readFileSync(path, "utf8");
}

export function formatSuffixBlock(isoDate, suffix) {
  return ` — **${isoDate} · ${suffix}**`;
}

const CB = /^(\s*-\s*)\[\s*([ xX])\s*\]\s*(.*)$/;

/** One dated suffix block as appended by apply (see formatSuffixBlock). Matched from line end repeatedly. */
const SUFFIX_TAIL_BLOCK = /\s+— \*\*\d{4}-\d{2}-\d{2} · [^*]+\*\*$/u;

/**
 * Comparable checklist description (ignores [ ] vs [x] and any trailing ` — **YYYY-MM-DD · suffix**` blocks).
 * @param {string} line - single markdown line with checkbox bullet
 */
export function normalizeComplianceBulletLine(line) {
  const m = line.match(CB);
  if (!m) {
    throw new Error(`expected markdown checkbox bullet, got: ${line.slice(0, 80)}…`);
  }
  let rest = m[3];
  while (SUFFIX_TAIL_BLOCK.test(rest)) {
    rest = rest.replace(SUFFIX_TAIL_BLOCK, "");
  }
  return rest.trimEnd();
}

/**
 * Set checkbox to [x] and append suffix blocks from signoffs for that line (idempotent).
 */
export function applyBlocksToBulletLine(line, blocks) {
  const m = line.match(CB);
  if (!m) {
    throw new Error(`expected markdown checkbox bullet, got: ${line.slice(0, 80)}…`);
  }
  const indent = m[1];
  const rest = m[3];
  let out = `${indent}[x] ${rest}`;
  for (const { isoDate, suffix } of blocks) {
    const block = formatSuffixBlock(isoDate, suffix);
    if (!out.includes(block)) {
      out += block;
    }
  }
  return out;
}
