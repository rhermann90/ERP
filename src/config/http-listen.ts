/**
 * Bind-Adresse und Port für `app.listen` (Phase A3/A6).
 * Default Host `0.0.0.0` bleibt für Container/Compose; für lokales Arbeiten im
 * unsicheren Netz z. B. `ERP_HTTP_HOST=127.0.0.1`.
 */
export function resolveListenHost(): string {
  const raw = process.env.ERP_HTTP_HOST?.trim();
  if (!raw) return "0.0.0.0";
  return raw;
}

export function resolveListenPort(): number {
  const raw = (process.env.ERP_HTTP_PORT ?? process.env.PORT ?? "3000").trim();
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid ERP_HTTP_PORT/PORT (expected 1–65535): ${raw}`);
  }
  return n;
}
