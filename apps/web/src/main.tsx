import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import {
  applyThemePreference,
  getStoredThemePreference,
  installThemeColorMediaListener,
} from "./lib/theme.js";
import App from "./App.js";

applyThemePreference(getStoredThemePreference());
installThemeColorMediaListener();

registerSW({
  immediate: true,
  onOfflineReady() {
    console.info("[PWA] App-Shell offline bereit (nur statische Assets; keine Buchungs-Simulation).");
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
