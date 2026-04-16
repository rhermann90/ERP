/**
 * Optional klickbare Links zu Repo-Doku (GitHub „blob“-Ansicht).
 * Setze `VITE_REPO_DOCS_BASE` auf die URL **ohne** trailing slash, z. B.
 * `https://github.com/ORG/ERP/blob/main`
 */
export function repoDocHref(pathFromRepoRoot: string): string | undefined {
  const raw = import.meta.env.VITE_REPO_DOCS_BASE;
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const base = raw.trim().replace(/\/$/, "");
  const rel = pathFromRepoRoot.replace(/^\//, "");
  return `${base}/${rel}`;
}
