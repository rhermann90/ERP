# M4 Slice 5c — Team-Session vor Mandanten-Go (Massen-E-Mail)

**Dieses Runbook** beschreibt **Mandanten-Produktiv-Go** (Massen-E-Mail 5c), **nicht** Entwicklungs-Merge oder CI-Freigabe. Für die Entwicklungsphase: [AGENTS.md](../../AGENTS.md) Punkt 6.

**Zweck:** Zentraler **Repo-Anker** für die Entscheidung „Batch-Mahn-E-Mail produktiv ja/nein“ und den Abgleich mit Compliance — **kein** Ersatz für StB/DSB/Release-Verantwortliche und keine automatisierten Freigaben.

## Grenzen: Was Automatisierung **nicht** leistet

| Thema | Klärung |
|--------|---------|
| **Release / StB / DSB** | Freigaben, Protokolle und befüllte Checklistenpunkte verlangen **Menschen** (Release-Verantwortliche, Steuerberatung, Datenschutz). **Kein** KI-/CI-Lauf und **kein** Markdown-Eintrag im Repo ersetzt diese Nachweise. |
| **GitHub Actions** | Grüne Jobs **`backend`** und **`e2e-smoke`** am PR-Head belegen nur **technische** Integrität ([`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §5a). Sie sind **kein** Mandanten-Go und **kein** Ersatz für die [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md). |
| **Prüfen am PR (manuell)** | Nach Authentifizierung mit der GitHub-CLI z. B. `gh pr checks <PR-Nummer>` bzw. im PR die Checks „backend“ / „e2e-smoke“ öffnen — nur **lesend**; Merge und fachliche Freigabe bleiben beim Team. |

## Agenda (copy-paste)

Vollständiger Vorschlag inkl. Traktanden: [`docs/plans/nächste-schritte.md`](../plans/nächste-schritte.md) — Abschnitt **„Team-Touchpoint (ca. 15 Min, Option A)“**.

## Technische Vorbereitung (vor der Session, ersetzt kein Mandanten-Go)

Optional für das Team **vor** der Session: lokale Parität zu den GitHub-Jobs **`backend`** und **`e2e-smoke`** prüfen — Ergebnis im internen Protokoll festhalten, **nicht** als StB-/DSB-/Release-Freigabe missverstehen.

- `npm run verify:ci`
- `npm run verify:ci:local-db` (Postgres Test-DB, Host **127.0.0.1:15432** — siehe [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md))
- `npx playwright test e2e/login-finance-smoke.spec.ts`

## Vor Live-Schaltung (EXECUTE / SMTP) abarbeiten

| Thema | Artefakt |
|--------|-----------|
| Massen-E-Mail 5c (fachlich + Betrieb) | [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md) — **Teil C — C.5** (Massen-E-Mail; Ausfüllen **StB**, **DSB**, **Release-Owner** gemeinsam (Ledger-Kürzel „PL“)); ergänzend **Abschnitt 2** / FIN-4-Verweise und **Abschnitt 5** DSGVO wie dort verlinkt |
| Technische Spec | [`docs/tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md`](../tickets/M4-BATCH-DUNNING-EMAIL-SPEC.md) |
| QA-Gate / kein stiller Versand | [`docs/contracts/qa-fin-0-gate-readiness.md`](../contracts/qa-fin-0-gate-readiness.md) §0 |
| Wave-3-Kontext | [`docs/tickets/NEXT-INCREMENT-FINANCE-WAVE3.md`](../tickets/NEXT-INCREMENT-FINANCE-WAVE3.md) (Option A, Non-Goals) |

## Nachweise

Protokolle, Freigaben und befüllte Checklistenpunkte: nur **manuell** durch Release-Owner/StB/DSB — siehe **Team-Dokumentation** am Ende der [`Checklisten/compliance-rechnung-finanz.md`](../../Checklisten/compliance-rechnung-finanz.md). **Keine** Platzhalter-URLs im Repo als Ersatz für echte Nachweise ([`AGENTS.md`](../../AGENTS.md)).
