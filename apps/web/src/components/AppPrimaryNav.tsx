import {
  ANGEBOTE_NACHTRAEGE_HUB_HASH,
  DOCUMENT_WORKSPACE_HASH,
  EINSTELLUNGEN_HASH,
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_PREP_HASH,
  HILFE_HASH,
  LV_AUFMASS_HUB_HASH,
  LOGIN_HASH,
  PASSWORD_RESET_HASH,
  STAMMDATEN_HASH,
} from "../lib/hash-route.js";
import { isPrimaryNavLinkVisible, type PrimaryNavKey } from "../lib/pwa-primary-nav-visibility.js";
import type { ApiUserRole } from "../lib/token-payload.js";

type Props = {
  currentPath: string;
  hasSession: boolean;
  role: ApiUserRole | null;
};

function hrefFor(key: PrimaryNavKey): string {
  switch (key) {
    case "start":
      return "#/";
    case "stammdaten":
      return STAMMDATEN_HASH;
    case "lv_aufmass":
      return LV_AUFMASS_HUB_HASH;
    case "angebote":
      return ANGEBOTE_NACHTRAEGE_HUB_HASH;
    case "finanz_prep":
      return FINANCE_PREP_HASH;
    case "finanz_grund":
      return FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH;
    case "document":
      return DOCUMENT_WORKSPACE_HASH;
    case "settings":
      return EINSTELLUNGEN_HASH;
    case "hilfe":
      return HILFE_HASH;
    case "login":
      return LOGIN_HASH;
    case "password_reset":
      return PASSWORD_RESET_HASH;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function isCurrent(path: string, key: PrimaryNavKey): boolean {
  switch (key) {
    case "start":
      return path === "/" || path === "";
    case "stammdaten":
      return path === "/stammdaten";
    case "lv_aufmass":
      return (
        path === "/lv-aufmass" ||
        path === "/lv-bearbeiten" ||
        path === "/geschaeftsprozess" ||
        path === "/aufmass-messungen"
      );
    case "angebote":
      return path === "/angebote-nachtraege" || path === "/angebote-arbeitsflaeche";
    case "finanz_prep":
      return path === "/finanz-vorbereitung" || path === "/finanz-arbeitsliste";
    case "finanz_grund":
      return path === "/finanz-grundeinstellungen";
    case "document":
      return path === "/dokument";
    case "settings":
      return path === "/einstellungen" || path === "/admin/users";
    case "hilfe":
      return path === "/hilfe";
    case "login":
      return path === "/login";
    case "password_reset":
      return path === "/password-reset";
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

const LABELS: Record<PrimaryNavKey, string> = {
  start: "Start",
  stammdaten: "Stammdaten",
  lv_aufmass: "LV & Aufmaß",
  angebote: "Angebote & Nachträge",
  finanz_prep: "Finanz",
  finanz_grund: "Mahn-Grundeinstellungen",
  document: "Dokument",
  settings: "Einstellungen",
  hilfe: "Hilfe",
  login: "Anmeldung",
  password_reset: "Passwort",
};

const NAV_ORDER: PrimaryNavKey[] = [
  "start",
  "stammdaten",
  "lv_aufmass",
  "angebote",
  "finanz_prep",
  "finanz_grund",
  "document",
  "settings",
  "hilfe",
  "login",
  "password_reset",
];

export function AppPrimaryNav(props: Props) {
  const ctx = { hasSession: props.hasSession, role: props.role };
  return (
    <nav className="shell-nav" aria-label="Hauptnavigation">
      {NAV_ORDER.map((key) => {
        if (!isPrimaryNavLinkVisible(key, ctx)) return null;
        const current = isCurrent(props.currentPath, key);
        return (
          <a
            key={key}
            href={hrefFor(key)}
            aria-current={current ? "page" : undefined}
            data-testid={`primary-nav-${key}`}
          >
            {LABELS[key]}
          </a>
        );
      })}
    </nav>
  );
}
