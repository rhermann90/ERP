# Qualitätsleiste — E2E, A11y, Verify (PWA-/Produkt-Inkremente)

**Zweck:** Mindeststandard für neue **kritische Nutzer-Journeys**, wenn die PWA von Shell/Expertenmodus Richtung **Produkt** geht — ergänzend zu [`roadmap-fertige-app.md`](./roadmap-fertige-app.md) Phase A.

---

## 1. Automatisierte Verify-Schicht

| Befehl | Wann |
|--------|------|
| `npm run verify:ci` | Jeder Merge mit Backend/Web/Contract-Touch ([`AGENTS.md`](../../AGENTS.md)) |
| `npm run verify:pre-merge` | Vor Merge auf `main` (inkl. Playwright Smoke) |
| `npm run verify:ci:local-db` | Bei Persistenz-/OpenAPI-/Finanz-Schema-Änderungen |

Referenz: [`docs/runbook/ci-and-persistence-tests.md`](../runbook/ci-and-persistence-tests.md).

---

## 2. End-to-End (Playwright)

- **Bestehende Smoke-Suite:** [`e2e/login-finance-smoke.spec.ts`](../../e2e/login-finance-smoke.spec.ts), [`e2e/app-shell-smoke.spec.ts`](../../e2e/app-shell-smoke.spec.ts).
- **Neue Journeys:** für jedes Inkrement mit **geschäftskritischem** Happy Path einen kurzen Smoke hinzufügen (Login → Domäne → eine sichere Leseprüfung oder eine erlaubte SoT-Aktion im Test-Mandanten).
- **Stabile Selektoren:** bestehende `data-testid` aus Shell/Home/Finanz bevorzugen — keine fragilen CSS-XPath für Kernpfade.

---

## 3. Barrierefreiheit (A11y)

- **Leitplanken:** [`.cursor/rules/erp-web-ui.mdc`](../../.cursor/rules/erp-web-ui.mdc), [`docs/ui-ux-style-guide.md`](../ui-ux-style-guide.md).
- **Pflicht für neue Produkt-Screens:** sinnvolle Überschriftenreihenfolge, Fokus bei Fehlern/Dialogen, Formulare mit zugeordneten Labels; Tabellen mit Kopfzeilen wo tabellarische Daten dominieren.

---

## 4. Performance / Netzwerk (PWA)

- Keine unnötigen Parallel-Stürme auf `allowed-actions` — pro Dokument/Entität batching und bestehende Cache-Muster respektieren.
- Neue Screens: Ladezustände explizit („Lädt…“), keine doppelten identischen Requests ohne Grund.

---

## Definition of Done (pro kritischem Inkrement)

1. `verify:ci` grün (bzw. `verify:pre-merge` wenn Main-Merge).
2. Wo Journey kritisch: neuer oder erweiterter E2E-Smoke mit deterministischem Assert.
3. UX-Patterns aus [`pwa-ux-patterns-end-user.md`](./pwa-ux-patterns-end-user.md) eingehalten.
4. Bei Doc-/Codemap-Pflicht: [`docs/CODEMAPS/overview.md`](../CODEMAPS/overview.md) und [`pwa-backend-coverage-matrix.md`](./pwa-backend-coverage-matrix.md) angepasst.
