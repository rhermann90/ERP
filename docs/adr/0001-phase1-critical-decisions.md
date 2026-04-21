# ADR 0001 - Phase 1 Critical Decisions

## ADR-1 Angebotslebenszyklus und Korrekturpfade (Systembeschreibung v1.2)
- Kontext: Geschäftskritische Daten dürfen nicht destruktiv überschrieben werden; gleichzeitig soll das Angebot bis zur verbindlichen Annahme anpassbar bleiben.
- Entscheidung: In `ENTWURF`, `IN_FREIGABE`, `FREIGEGEBEN` und `VERSENDET` (solange **keine** verbindliche **Annahme** vorliegt) sind inhaltliche Anpassungen der Angebotsversion zulässig — technisch als **neue** Angebotsversion (`OFFER_CREATE_VERSION`), nicht als Überschreibung. Ab `ANGENOMMEN` ist die angenommene Version fixiert; weitere Leistungs-/Preisänderungen **ausschließlich über Nachtrag** (Referenz auf Basis-Angebotsversion). Blockade: `FOLLOWUP_DOCUMENT_REQUIRED` (409).
- Trade-off: Klare Prozessschranke erst bei Annahme statt bereits bei Versand; erhöht Flexibilität vor Vertragsabschluss, erfordert klare Audit- und Versionsdisziplin sowie rechtliche Bewertung von Versand/Bindung pro Mandant.

## ADR-2 Audit Read API (Least Privilege + DSGVO)
- Kontext: Auditdaten sind sensibel und mandantengebunden.
- Entscheidung: `GET /audit-events` verlangt `x-tenant-id` + serverseitiges Tenant-Filtering + Rollenprüfung (`ADMIN`, `BUCHHALTUNG`, `GESCHAEFTSFUEHRUNG`) + Pagination.
- Trade-off: Eingeschränkter Zugriff reduziert Bedienkomfort, erhöht aber Datenschutz und Missbrauchsschutz.

## ADR-3 Export-Preflight INVOICE fail-closed
- Kontext: Fehlerhafte Exporte dürfen keine rechtsverbindlichen Dokumente erzeugen.
- Entscheidung: Für `INVOICE` werden Existenz, Status, Pflichtfelder und Unveränderbarkeitszustand geprüft. Bei Fehlern wird `EXPORT_PREFLIGHT_FAILED` geworfen (422).
- Trade-off: Strenger Preflight erzeugt mehr Ablehnungen im Vorfeld, verhindert aber rechtlich riskante Exporte.

## ADR-4 Header-ID Härtung
- Kontext: Schwache Headervalidierung ermöglicht Inkonsistenzen und Security-Risiken.
- Entscheidung: `x-tenant-id` und `x-user-id` müssen UUID sein.
- Trade-off: Alte oder fehlerhafte Clients brechen früher, dafür stabile Identität und bessere Auditqualität.

## ADR-5 Composition Root und Seed-Trennung
- Kontext: Seed-Logik im App-Building verschleiert Zuständigkeiten und erschwert Tests.
- Entscheidung: Seed in `src/composition/seed.ts` ausgelagert; `buildApp({ seedDemoData })` steuert Initialisierung explizit.
- Trade-off: Eine Datei mehr, dafür klarere Architekturgrenzen und bessere Testbarkeit.

## ADR-6 Verifizierbare AuthN/AuthZ fuer kritische Endpunkte
- Kontext: Header-basierte Identität ohne Signatur ist nicht vertrauenswürdig.
- Entscheidung: Kritische Endpunkte validieren einen signierten Bearer-Token (HMAC, exp-Claim, Role, Tenant). Optionaler `x-tenant-id` darf nur zur Scope-Präzisierung dienen und muss mit Token-Tenant matchen.
- Trade-off: Token-Verifikation erhöht Implementierungsaufwand, reduziert aber Identitäts- und Tenant-Spoofing-Risiko.

## ADR-7 Traceability-Konsistenz statt Link-Existenz
- Kontext: Nur Link-Existenz reicht nicht für fachliche Nachvollziehbarkeit.
- Entscheidung: Vor Rechnungs-Export wird die Kette auf Feldkonsistenz geprüft (Rechnung/Link/Angebot inkl. Projekt/Kunde/LV/Aufmaß-Kontext).
- Trade-off: Strengere Validierung kann mehr Blocker erzeugen, verhindert aber inkonsistente rechtsrelevante Exporte.

## ADR-8 Fail-closed Exportmatrix
- Kontext: Unterschiedliche Formate haben unterschiedliche fachliche Voraussetzungen.
- Entscheidung: Entity/Format-Matrix (`INVOICE -> XRECHNUNG`, `OFFER_VERSION -> GAEB`) plus Pflichtfeldchecks; Verstöße führen zu `EXPORT_PREFLIGHT_FAILED`.
- Trade-off: Weniger Flexibilität bei Sonderfällen, dafür klar prüfbare Compliance-Grenzen.

## ADR-9 AllowedActions als Backend-Source-of-Truth
- Kontext: UI-seitige Ableitung von Statusaktionen führt zu Regelduplikation und Drift-Risiko.
- Entscheidung: `GET /documents/{id}/allowed-actions` liefert erlaubte Aktionen pro Dokument abhängig von Tenant, Rolle und Dokumentstatus.
- Trade-off: Zusätzliche Abfrage/Cache-Strategie im Frontend, dafür konsistente Regeln und weniger Rechts-/Prozessfehler.

## ADR-10 Zentrale Policy OFFER_CREATE_VERSION (keine SoT-Drift)
- Kontext: `AuthorizationService` und `OfferService` dürfen nicht widersprüchliche Regeln für dieselbe Aktion haben (Umgehbarkeit der allowed-actions-Matrix).
- Entscheidung: Erlaubte Status für `OFFER_CREATE_VERSION` sind ausschließlich in `src/domain/offer-create-version-policy.ts` definiert; `OfferService.createVersion`, `AuthorizationService.assertOfferCreateVersionForOffer` und `allowedOfferActionsByStatus` nutzen dieselbe Policy. `POST /offers/version` ruft vor dem Domain-Service `assertOfferCreateVersionForOffer` auf.
- Trade-off: Zusätzliche Datei und Import-Kette; dafür eine Änderungsstelle und auditierbare Übereinstimmung mit v1.2.

## ADR-11 Nachtragsangebot Minimal-API (v1.2 Folgeprozess)
- Kontext: Nach `ANGENOMMEN` muss ein positiver Folgeprozess existieren (nicht nur Blockade von `POST /offers/version`).
- Entscheidung: Einführung von `POST /offers/{offerId}/supplements` als Minimal-API mit Referenz auf `baseOfferVersionId`; erlaubt nur bei angenommener Basisversion, mandantenhart und auditiert (`SUPPLEMENT_VERSION`).
- Trade-off: Schmale Phase-1-Implementierung ohne vollständige Nachtragslebenszyklus-/Abrechnungswirkung; dafür v1.2-konformer Einstiegspfad nach Annahme.

## ADR-12 SoT: OFFER_CREATE_SUPPLEMENT in allowed-actions
- Kontext: UI und API dürfen den Nachtrag nach Annahme nicht auseinanderlaufen; Senior-Review verlangt deckungsgleiche SoT.
- Entscheidung: `actionId` **OFFER_CREATE_SUPPLEMENT** erscheint in `GET /documents/{id}/allowed-actions?entityType=OFFER_VERSION` genau wenn Status `ANGENOMMEN` und Rolle in {ADMIN, VERTRIEB_BAULEITUNG, GESCHAEFTSFUEHRUNG}. `assertCanCreateSupplement` prüft dieselbe Rollenmatrix (`OFFER_STATUS_ACTION_BY_ROLE`). Kein neues `entityType=OFFER` in diesem Schritt.
- Trade-off: Zusätzliche Einträge in der Aktionsmatrix; dafür keine versteckte Ausführbarkeit von `POST /offers/.../supplements` ohne SoT-Eintrag.
