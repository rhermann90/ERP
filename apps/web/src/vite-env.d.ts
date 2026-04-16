/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** GitHub blob-URL ohne trailing slash — Doku-Links „Finanz (Vorbereitung)“ */
  readonly VITE_REPO_DOCS_BASE?: string;
}
