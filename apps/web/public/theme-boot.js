/**
 * Frühe Theme-Auflösung vor dem React-Bundle (FOUC).
 * Muss mit applyThemePreference in apps/web/src/lib/theme.ts übereinstimmen.
 */
(function () {
  try {
    var K = "erp-theme";
    var P = "erp-dark-palette-last";
    var t = localStorage.getItem(K);
    var pal = localStorage.getItem(P);
    var d = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var h = document.documentElement;
    function setLight() {
      h.setAttribute("data-theme", "light");
      h.removeAttribute("data-dark-palette");
    }
    function setDark(x) {
      h.setAttribute("data-theme", "dark");
      h.setAttribute("data-dark-palette", x);
    }
    if (t === "light") {
      setLight();
      return;
    }
    if (t === "warm-dark") {
      setDark("warm");
      return;
    }
    if (t === "dark") {
      setDark("cool");
      return;
    }
    if (t === "system" || t === null) {
      if (d) setDark(pal === "warm" || pal === "cool" ? pal : "cool");
      else setLight();
      return;
    }
    setLight();
  } catch (e) {
    /* ignore */
  }
})();
