# Runbook — Mahnlauf-Automatisierung (Cron) — obsolet

**Stand 2026-04-25:** Der interne Endpunkt **`POST /internal/cron/dunning-automation`**, der Mandanten-Modus **AUTO** und die Umgebungsvariable **`ERP_INTERNAL_DUNNING_CRON_SECRET`** wurden **entfernt** bzw. sind **obsolet**.

**Betrieb / Monitoring:** Inventar und Checkliste — [`dunning-cron-and-monitoring-inventory.md`](./dunning-cron-and-monitoring-inventory.md); Repo-Gate `npm run check:dunning-inventory`.

Mahnlauf erfolgt nur noch **SEMI** über die öffentlichen APIs (`GET /finance/dunning-reminder-candidates`, `POST /finance/dunning-reminder-run`) mit Mandanten-Kontext — siehe **[ADR-0011](../adr/0011-fin4-semi-dunning-context.md)**.

**Historische Betriebsanweisungen** (Kubernetes CronJob, systemd, GitHub Actions, `job_hour_utc`, Mandant auf AUTO) lagen in älteren Versionen dieses Runbooks; sie sind **nicht mehr gültig**. Bei Bedarf aus der **Git-Historie** dieser Datei rekonstruieren — nicht als aktuelle Betriebsdokumentation verwenden.

## Siehe auch

- [ADR-0010 — M4 / Mahnwesen](../adr/0010-fin4-m4-dunning-email-and-templates.md) (Abschnitt 5b, Cron superseded)
- [ADR-0011 — SEMI-Kontext](../adr/0011-fin4-semi-dunning-context.md)
- Ticket [M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md](../tickets/M4-MINI-SLICE-5B-ORCHESTRATION-2026-04-24.md)
