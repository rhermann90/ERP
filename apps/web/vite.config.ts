import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Bewusst schmale PWA: App-Shell + statische Assets precachen.
 * Keine API-/Offline-Schreibsimulation (kein Backend-GO für Offline-Buchung).
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-icon-maskable.svg"],
      manifest: {
        name: "ERP Konstruktion",
        short_name: "ERP",
        description: "PWA-Shell für mandantensichere ERP-Prozesse (Contracts-getrieben).",
        theme_color: "#f5f5f7",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "favicon.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          { src: "pwa-icon-maskable.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
    css: false,
  },
});
