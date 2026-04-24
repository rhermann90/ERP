# Vite-Major-Upgrade — manuell koordinieren

## Warum kein Dependabot-Sammel-PR?

`vite`, `@vitejs/plugin-react` und `vite-plugin-pwa` hängen über **Peer-Dependencies** und **npm-Workspaces** zusammen. Ein isolierter Major-Sprung (z. B. Vite 8 ohne passendes `vite-plugin-pwa`) führt zu CI-Fehlern wie `ERR_PACKAGE_PATH_NOT_EXPORTED` (interne `vite`-Exports vs. Plugin-Version).

Diese Pakete sind in [`.github/dependabot.yml`](../../.github/dependabot.yml) aus der Gruppe **`dev-dependencies`** ausgeschlossen und sollen **in einem eigenen PR** angehoben werden.

## Checkliste (z. B. Vite 8)

1. Auf npm prüfen: **`vite-plugin-pwa`** peer `vite` enthält **`^8.0.0`** (oder gewähltes Ziel).
2. In **einem** PR: `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, ggf. `vitest`-Major — Release Notes lesen.
3. `npm ci`, `npm run build -w apps/web`, `npm run verify:ci`.
4. Nach erfolgreichem Merge: optional `exclude-patterns` in Dependabot für diese Pakete überdenken (eigene Minor-PRs wieder erlauben).

**Stand:** Produktionslinie bleibt auf Vite **6.x** und `@vitejs/plugin-react` **5.x**, bis die obige Checkliste erfüllt ist.
