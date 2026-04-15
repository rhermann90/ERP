# Decision Log - Phase 1 Frontend Harmonization

## 1) Rollen-/Status-Harmonisierung
- Entscheidung: **Mapping-Tabelle** (`frontendRole -> backendRole`) statt erzwungene 1:1 UI-Rollen.
- Begründung/Trade-off:
  - Pro: Frontend bleibt sprachlich/domänennah, Backend bleibt technisch stabil.
  - Pro: Kein Backend-Scope nötig, nur deterministische Mapping-Layer.
  - Contra: Zusätzliche Pflege einer Mapping-Tabelle.
- Verbindliche Abbildung:
  - `SUPER_ADMIN -> ADMIN`
  - `ACCOUNTING -> BUCHHALTUNG`
  - `MANAGEMENT -> GESCHAEFTSFUEHRUNG`
  - `SALES -> VERTRIEB`
  - `READ_ONLY -> VIEWER`

## 2) allowedActions SoT
- Entscheidung: UI führt **keine** kritische Aktion ohne `allowedActions` aus.
- Verbindliche Regel:
  - Action-Buttons nur bei enthaltenem `actionId`.
  - Kein lokales Ableiten zusätzlicher Status-Transitionen.
  - Bei 409/403: Entity + `allowedActions` neu laden.

## 3) Row/Bulk Open Point
- Entscheidung: **Phase-2-Auflage (nicht kritisch für Phase-1 Gate)**.
- Testbare QA-Regel:
  - P0 darf in Phase 1 **nur** dokumentbasierte `allowedActions` prüfen.
  - Fehlende Row/Bulk-Endpunkte sind **kein P0-Fail**, sondern P2-Auflage.

## 4) Error-Envelope Harmonisierung (final QA-P1-001)
- **Backend-Iststand (verbindlich):** Jede Fehlerantwort aus `handleError` liefert `code`, `message`, `correlationId`, `retryable`, `blocking` sowie optional `details` (siehe `docs/api-contract.yaml` Schema `Error` und `docs/contracts/error-codes.json` → `backendEnvelope`).
- **Frontend-Regel:** **Passthrough** — die Felder `correlationId`, `retryable`, `blocking` werden vom Response-Body übernommen, keine erzwungene Neuberechnung bei konformen Antworten.
- **Fallback (nur temporär):** Nur wenn ein Proxy/Client-Stack das Envelope beschädigt oder Felder fehlen: `correlationId` aus `x-request-id` oder Client-UUID; `retryable`/`blocking` aus der Code-Tabelle in `error-codes.json`. Als technische Schuld kennzeichnen und entfernen, sobald Backend-Garantie überall gilt.

## 5) Version-Conflict-Strategie
- Entscheidung: In Phase 1 kein dediziertes `VERSION_CONFLICT`-Protokoll vorhanden.
- Verbindliche UI-Reaktion:
  - Bei 409: Hard refresh des Dokuments + `allowedActions` Re-Evaluierung.
  - Feingranulare Feld-Merge-Strategie ist Phase-2-Auflage.
