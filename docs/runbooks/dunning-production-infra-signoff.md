# Mahnwesen — Produktions-Infrastruktur (Sign-off)

**Zweck:** Nachweis, dass **außerhalb des Git-Repos** liegende Cron-/Monitoring-/Deploy-Pfade zum Entfall von AUTO/`internal/cron` passen. Das Repo liefert nur [`dunning-cron-and-monitoring-inventory.md`](./dunning-cron-and-monitoring-inventory.md) und `npm run check:dunning-inventory` (Codebasis).

## Wann ausfüllen

- Nach **jedem** relevanten Infra-Change (Kubernetes, systemd, externe Actions, Alerting).
- Optional **quartalsweise** als wiederkehrende Kontrolle.

## Repo-Gate (automatisch)

| Prüfung | Befehl | Erwartung |
|---------|--------|-----------|
| Kein Re-Intro von `internal/cron/dunning-automation` unter `src/` | `npm run check:dunning-inventory` | Exit 0 |

## Sign-off-Tabelle (manuell, pro Umgebung)

| # | Checklistenpunkt (siehe Inventar) | Umgebung (z. B. prod / staging) | Datum | Prüfer | Ergebnis (OK / Findings) | Ticket/Link |
|---|-----------------------------------|----------------------------------|-------|--------|---------------------------|-------------|
| 1 | K8s/Nomad/systemd: keine Aufrufe des entfernten Cron-URLs | | | | | |
| 2 | GitHub Actions / andere CI: kein Mahn-Cron auf internen Pfad | | | | | |
| 3 | Dependabot-`schedule` nur Dependency-Updates (unkritisch) | | | | | |
| 4 | Monitoring/Alerts: keine toten Regeln auf `/internal/cron/…` | | | | | |
| 5 | Logs: Filter auf alte URL → 0 Treffer nach Migration | | | | | |

**Referenz:** [`dunning-cron-and-monitoring-inventory.md`](./dunning-cron-and-monitoring-inventory.md), ADR-0011, [`dunning-automation-cron.md`](./dunning-automation-cron.md).

