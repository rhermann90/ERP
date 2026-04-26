import { useState } from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
  type ThemePreference,
} from "../lib/theme.js";

export function ThemePreferenceControl() {
  const [value, setValue] = useState<ThemePreference>(() => getStoredThemePreference());

  return (
    <div className="theme-pref-wrap">
      <label className="theme-pref-label">
        <span className="theme-pref-caption">Darstellung</span>
        <select
          className="theme-pref-select"
          value={value}
          onChange={(e) => {
            const p = e.target.value as ThemePreference;
            setValue(p);
            setStoredThemePreference(p);
            applyThemePreference(p);
          }}
          title="Bei „System“ folgt die App dem Gerät. Im dunklen Systemmodus gilt die zuletzt gewählte Dunkel-Variante (warm oder neutral)."
          aria-label="Farbschema: Hell, Dunkel warm, Dunkel neutral oder Systemeinstellung"
        >
          <option value="system">System</option>
          <option value="light">Hell</option>
          <option value="warm-dark">Dunkel (warm)</option>
          <option value="dark">Dunkel (neutral)</option>
        </select>
      </label>
    </div>
  );
}
