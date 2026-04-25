# Mahnwesen — Cron-Inventar und Monitoring (Betrieb)

**Stand:** Nach Entfernung von AUTO/Cron (2026-04-25, ADR-0011).

## Repo-Inventar (automatisiert)

```bash
npm run check:dunning-inventory
```

Prüft u. a., dass unter `src/` kein wieder eingeführter Pfad `internal/cron/dunning-automation` vorkommt. **Grün** = Repo-Codebasis ok; ersetzt keine Prüfung eurer Infrastruktur außerhalb des Repos.

**Produktions-Nachweis (manuell):** Vorlage [`dunning-production-infra-signoff.md`](./dunning-production-infra-signoff.md).

## Was im Produkt **nicht** mehr existiert

- Interner HTTP-Endpunkt **`POST /internal/cron/dunning-automation`**
- Umgebungsvariable **`ERP_INTERNAL_DUNNING_CRON_SECRET`** — **nicht setzen** (Hinweis mit Suchanker im Root-[`.env.example`](../../.env.example) unter dem Mahn-E-Mail-Block)
- Mandanten-Modus **AUTO** (`run_mode` nur **OFF** / **SEMI**)

Historie: `docs/runbooks/dunning-automation-cron.md`

## Checkliste Infrastruktur / Monitoring (manuell, außerhalb Git)

1. **Kubernetes / Nomad / systemd:** Jobs/Cron, die noch `…/internal/cron/dunning-automation` oder alte Deploy-Skripte aufrufen → entfernen oder auf SEMI-Prozesse umstellen (Ticket/Change).
2. **GitHub Actions / andere CI:** Kein `schedule`, der Mahn-E-Mails oder den entfernten internen Pfad triggert — im Team-Repo: Workflows unter `.github/workflows/` (hier: kein Mahn-Cron).
3. **Dependabot:** `schedule` in `.github/dependabot.yml` betrifft **Dependency-Updates**, nicht Mahnwesen — bewusst ignorieren oder in eurer Doku als „unkritisch“ vermerken.
4. **Monitoring / Alerts:** Regeln, die auf „Dunning-Cron fehlgeschlagen“ oder HTTP 5xx auf `/internal/cron/…` lauschen → bereinigen oder auf **SEMI**-KPIs umstellen (z. B. manuelle Läufe, Queue-Tiefe, falls später eingeführt).
5. **Logs:** Filter auf alte URL — sollte nach Migration **0 Treffer** liefern.

## SEMI-Betrieb

Mahnlauf nur über öffentliche APIs (`GET …/dunning-reminder-candidates`, `POST …/dunning-reminder-run`) — keine stillen Massenaktionen ohne UI/Integration.

