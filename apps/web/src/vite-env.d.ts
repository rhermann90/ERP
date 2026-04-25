/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** GitHub blob-URL ohne trailing slash — Doku-Links „Finanz (Vorbereitung)“ */
  readonly VITE_REPO_DOCS_BASE?: string;
  /** Optional: gleicher Wert wie `docs/api-contract.yaml` `info.version` zum Release — Mismatch → `console.warn` auf FIN-4-Pfaden */
  readonly VITE_EXPECTED_OPENAPI_CONTRACT_VERSION?: string;
}
