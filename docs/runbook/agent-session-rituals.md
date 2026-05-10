# Agenten-Session — Rituale und Pflichtverweise

Ergänzung zu [`AGENTS.md`](../../AGENTS.md). Hier: längere Pflichten und Ticket-Verweise, damit `AGENTS.md` schlank bleibt.

**Cursor / Fact-Forcing Gate:** Blockiert ein Hook (`[Fact-Forcing Gate]`) `Write`/`StrReplace`, zuerst den Retry-Workflow in [`agent-gateguard-workflow.md`](./agent-gateguard-workflow.md) befolgen — Shell-Schreiben nicht als Standard; Team-Empfehlung und Risiko-Tabelle dort.

**Tickets und Gates (z. B. FIN-2, QA §5a):** stehen in `docs/tickets/` und `docs/contracts/`; bei merge-kritischen Themen README und PR-Vorlage beachten. **QA/Review vor Merge:** Querschnitt in [`ci-and-persistence-tests.md`](./ci-and-persistence-tests.md) (Abschnitt „QA und Review vor Merge auf `main`“).

**P1-4 (B5 / Audit-Code):** Tickets [`B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md`](../tickets/B5-SPEC-DELIVERY-BOUNDARY-WAVE3.md) und [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md) dokumentieren **Risiken und empfohlene** Vorgehensweise — sie sind **kein** Merge-Blocker durch wartende Freigabe; vor **Mandanten-Produktivität** empfohlen, Auswirkungen erneut zu bewerten (Risiko/Schwere nach Organisation).

**Agent nach finanz-relevantem Merge auf `main`:** Nächste freie Zeile in [`P1-3-DOCS-MILESTONE-WAVE3.md`](../tickets/P1-3-DOCS-MILESTONE-WAVE3.md) ausfüllen (Merge-Datum UTC, PR-URL) — siehe Abschnitt **„Pflege (Agent)“** dort. **Review-Protokoll** (Tabelle in [`FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md`](../tickets/FOLLOWUP-AUDIT-DB-PERSIST-FAIL-HARD.md)): **keine erfundenen URLs** durch den Agenten — echte Links nur von Menschen mit Zugriff auf das externe Protokoll. Koordinations-Tabelle in [`PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md`](../tickets/PL-WAVE3-M4-NEXT-BRANCH-RECORD-2026-04-26.md) *(Dateiname historisch)*: der Agent **pflegt manuelle Fremd-Protokoll-Zellen nicht** und **erfindet** keine URLs. **Verbindlich** für den Agenten: `verify:ci` (und bei Bedarf `verify:ci:local-db`), grüne Merge-Checks wie dokumentiert, P1-3 bei qualifiziertem Merge, übrige Ticket-/Codemap-Pflege ohne fingierte Nachweise.
