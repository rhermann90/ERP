/**
 * ADR-0003: Persistenz-Modus. Kein stiller Produktionsbetrieb ohne DATABASE_URL.
 */

export type RepositoryMode = "memory" | "postgres";

export type ResolveRepositoryModeInput = {
  /** Tests und explizite Demos: immer In-Memory. */
  repositoryMode?: RepositoryMode;
};

export function resolveRepositoryMode(input?: ResolveRepositoryModeInput): RepositoryMode {
  if (input?.repositoryMode === "memory") return "memory";
  if (input?.repositoryMode === "postgres") return "postgres";
  if (process.env.NODE_ENV === "test") return "memory";
  /**
   * `ERP_REPOSITORY=memory` nur ohne DB-URL: sonst würde eine alte .env-Zeile
   * (Beispiel aus .env.example) jeden Shell-`export DATABASE_URL` überschreiben.
   * Explizit nur In-Memory trotz URL: URL aus der Umgebung entfernen oder `buildApp({ repositoryMode: "memory" })`.
   */
  if (process.env.ERP_REPOSITORY === "memory" && !process.env.DATABASE_URL?.trim()) return "memory";

  const deploymentRequiresDb =
    process.env.NODE_ENV === "production" || process.env.ERP_DEPLOYMENT === "integration";

  if (deploymentRequiresDb) return "postgres";

  if (process.env.DATABASE_URL?.trim()) return "postgres";

  return "memory";
}

/** Fail-closed vor App-Start, wenn Produktion/Integration DB erwartet. */
export function assertFailClosedProductionDatabase(): void {
  const deploymentRequiresDb =
    process.env.NODE_ENV === "production" || process.env.ERP_DEPLOYMENT === "integration";
  if (!deploymentRequiresDb) return;
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "[erp] Refusing to start: DATABASE_URL required when NODE_ENV=production or ERP_DEPLOYMENT=integration (ADR-0003).",
    );
    process.exit(1);
  }
}

export function assertDatabaseUrlForPostgresMode(mode: RepositoryMode): void {
  if (mode !== "postgres") return;
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is required for postgres repository mode. Use ERP_REPOSITORY=memory to force in-memory, or set DATABASE_URL.",
    );
  }
}
