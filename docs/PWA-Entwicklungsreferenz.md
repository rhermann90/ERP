# PWA — Entwicklungsreferenz (Zielbild MVP und Umsetzungsstand)

**Version:** 1.0  
**Stand:** 2026-05-07  
**Status:** Operative Referenz für Arbeit an der Endnutzer-PWA (`apps/web`): **verbindliches MVP-Zielbild** (kurz, mit Verweis auf die Domänenspezifikation) und **expliziter Ist-Stand** zur Nachverfolgbarkeit.

## Geltung und Rangfolge

| Ebene | Dokument | Rolle |
|-------|-----------|--------|
| **Domäne** | [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md) (Teil I §1–§17, §8 Finanz, §15/§16) | Maßgeblich für **Fachlogik**, Lebenszyklen, Invarianten (Mandant, Versionierung, Traceability, System-/Bearbeitungstext). |
| **PWA** | **Dieses Dokument** | Maßgeblich für **MVP-Umfang der PWA**, **Umsetzungsstatus** und Verweise auf Nachweise (OpenAPI, Pläne, Tests). |
| **Konflikt** | — | Bei Widerspruch zwischen UI-Wunsch und Domäne gilt die **ERP-Systembeschreibung**. |

**§18** der ERP-Systembeschreibung (**Erweiterte Domänenmodule**) ist **nicht Bestandteil des MVP**; hier nur als **vorbereitetes Post-MVP-Zielbild** erfasst (siehe unten).

**Pflege:** Bei merge-relevanten PWA-/Finanz-Inkrementen Matrix-Zeilen anpassen oder in der PR-Beschreibung bestätigen, dass der Eintrag unverändert gültig bleibt — konsistent zu [`docs/plans/workflow-code-first-ohne-qualitaetsverlust.md`](./plans/workflow-code-first-ohne-qualitaetsverlust.md).

---

## Legende Umsetzungsstatus

| Status | Bedeutung |
|--------|-----------|
| **Implementiert** | Für den beschriebenen Pfad produktiv nutzbar im Sinne der Spez; Backend-SoT und Verträge sind angebunden (kein reiner Stub). |
| **Teilweise** | Kern vorhanden; Lücken in UX, Rolle oder Nebenpfaden — siehe Spalte „Nachweis / Hinweis“. |
| **Geplant** | MVP-relevant, noch nicht oder nur Platzhalter. |
| **Außerhalb MVP (§18)** | Nach ERP Teil V / §18 vorgesehen; keine MVP-Lieferverpflichtung. |
| **Vorbereitet (§18)** | Nur Zielbild und Architektur-Anknüpfung dokumentiert; keine Umsetzungspflicht im MVP. |

---

## MVP vs. Post-MVP (Teil V Wellen)

Aus [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md) **Teil V — PWA-Roadmap** (Wellen W1–W6):

| Welle | Inhalt (Kurz) | MVP-PWA |
|-------|----------------|---------|
| **W1** | Stammdaten Kunde / Projekt / Objekt (§18.1) | **Teilweise** — `#/stammdaten`: XRechnung Buyer/Seller + FIN-1 + **CRM-Stamm** (Baustelle, **CRM-Kunde**, Projekt, Kontakte; Postgres-API); **Pilot-Projekt-Label** per `patchCrmProject` im Hub (Schreibrolle wie FIN-1); Memory-Demo: Hinweis statt CRM-Daten — siehe [`pwa-backend-coverage-matrix.md`](./plans/pwa-backend-coverage-matrix.md), ADR [`0019`](./adr/0019-w1-stammdaten-project-customer-object-option-c.md). |
| **W2** | Kerngeschäft: Angebot → Aufmass → Rechnung; §5.4 / §8.6 nachvollziehbar | **MVP** — Pilot-Wizard, Shell, Finanz-Vorbereitung (konservativ: nicht jedes Teilziel „Implementiert“). |
| **W3** | DMS light, Suche (§18.4, §18.8) | **Außerhalb MVP** |
| **W4** | Mobile / Feld (§18.3) | **Außerhalb MVP** |
| **W5** | Material, Kalkulation (§18.2, §18.5) | **Außerhalb MVP** |
| **W6** | Reporting, Benachrichtigungen, Kommunikation, Zeiterfassung (§18.9–§18.13) | **Außerhalb MVP** |

---

## Hauptmatrix: Thema — ERP — Ist — Nachweis

Zielbild-Spalte verweist auf die **normative** Domäne; **Ist** bezieht sich auf die PWA und ihre Backend-Anbindung (konservative erste Baseline).

| Thema | ERP-Verweis (Zielbild) | Ist (PWA) | Nachweis / Hinweis |
|-------|-------------------------|-----------|---------------------|
| Mandantentrennung, keine Client-SoT für Berechtigung | §2, §11 | **Implementiert** | [`apps/web/README.md`](../apps/web/README.md); [`docs/contracts/ui-action-executor-coverage.md`](./contracts/ui-action-executor-coverage.md) |
| Traceability-Kette sichtbar / drilldown wo vorgesehen | §4, §5, §8 | **Teilweise** | Rechnungs-Shell: [`docs/CODEMAPS/overview.md`](./CODEMAPS/overview.md) (PWA); LV/Aufmass/Angebot über Wizard + Shell |
| Systemtext vs. Bearbeitungstext (keine Vermischung in UI) | §6, §9 | **Teilweise** | Backend durchsetzt; PWA rendert Plain Text — keine zweite Textnorm im Client |
| Auth / Session / Token-Policy | §11, Teil II | **Implementiert** | [`apps/web/README.md`](../apps/web/README.md) (Security); Login `#/login` |
| Globale Navigation & IA | §11.1, Teil V | **Teilweise** | [`docs/plans/pwa-information-architecture.md`](./plans/pwa-information-architecture.md); `AppPrimaryNav`, Hubs; Pilot-Routen `#/aufmass-messungen`, `#/angebote-arbeitsflaeche`, `#/finanz-arbeitsliste`, `#/admin/users` (ADMIN) |
| Dokument-Arbeitsbereich `#/dokument` (SoT, Shell) | §5, §8, §11 | **Implementiert** | [`apps/web/README.md`](../apps/web/README.md); `executeActionWithSotGuard` |
| LV Lesepfad §9 | §9 | **Teilweise** | `#/lv-bearbeiten`, Shell GET; SoT-Formulare für Text/Knotenposition (`LvEntityTextSotPanel`); tiefe Bearbeitung weiter Experte — [`pwa-backend-coverage-matrix.md`](./plans/pwa-backend-coverage-matrix.md) |
| Aufmass | §5.3–§5.4 | **Teilweise** | Wizard + Shell + Pilot **`#/aufmass-messungen`** (Liste/Detail); §5.4/§8.6 Differenzbuchung: Backend offen — Ticket [`DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md`](./tickets/DOM-8-6-DIFFERENZBUCHUNG-BACKEND-PWA.md) |
| Angebot / Nachtrag | §5.2, §7 | **Teilweise** | Wizard, Shell, Pilot **`#/angebote-arbeitsflaeche`** (SoT-Arbeitsfläche) |
| Rechnung Entwurf / Lesen / Buchung | §8.2, §8.4, FIN-2 | **Teilweise** | **Finanz-Vorbereitung** + Shell; volle 8.4-Tiefe siehe Tickets/ADR |
| Zahlungseingang FIN-3 | §8.7–§8.9 | **Implementiert** (SoT-Pfad) | [`apps/web/README.md`](../apps/web/README.md); `RECORD_PAYMENT_INTAKE` + Idempotency-Key |
| Mahnwesen FIN-4 | §8.10 | **Teilweise** | Lesepfade + Tabs + Pilot **`#/finanz-arbeitsliste`** (Kandidaten); Batch/E-Mail siehe Mandanten-Automation OFF — [`apps/web/README.md`](../apps/web/README.md) |
| Steuerprofil / FIN-5 §8.16 | §8.16 | **Teilweise** | Finanz-UI + Shell-Lesepfade; Expertenanteile möglich |
| XRechnung Parteien / Export | §14, §8 | **Teilweise** | `EXPORT_INVOICE`, `POST /exports`; Shell — [`action-contracts.json`](./contracts/action-contracts.json) |
| Audit-Events UI | §12 | **Teilweise** | Shell / Tab Fortgeschritten — eher **Experte** |
| DSGVO-minimierte Darstellung (Zahlung/Logs) | §13, §8.14 | **Teilweise** | Backend FIN-6; PWA zeigt strukturierte Daten nur nach Vertrag — [`fin6-logging-privacy-814.md`](./contracts/fin6-logging-privacy-814.md) |
| Mandanten-PWA-Anzeige / Expertenmodus | Teil II, V | **Teilweise** | `GET/PATCH /tenant/pwa-display-settings`; `VITE_PWA_EXPERT_UI` — [`apps/web/README.md`](../apps/web/README.md) |
| Pilot Geschäftsprozess LV → Rechnung | §5, §8 | **Teilweise** | `#/geschaeftsprozess` — Pilot, nicht Vollprodukt-Oberfläche |
| Admin Nutzerverwaltung UI | §11 | **Teilweise** | Backend `GET/POST/PATCH /users`; PWA **`#/admin/users`** (Rolle ADMIN); Policy/Expertenanteile siehe Matrix |

Detailliertere **Backend↔PWA-Abdeckung** (Produkt vs. Shell vs. Experte): [`docs/plans/pwa-backend-coverage-matrix.md`](./plans/pwa-backend-coverage-matrix.md).

---

## Technischer Kontext PWA (kompakt)

Auszug aus ERP **Teil II** — für Details weiterhin [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md) und [`README.md`](../README.md).

| Aspekt | Kurz |
|--------|------|
| **PWA-Pfad** | `apps/web` (Vite, Hash-Routing) |
| **API** | `VITE_API_BASE_URL`; Vertrag [`docs/api-contract.yaml`](./api-contract.yaml) |
| **Auth** | Bearer; Mandant `X-Tenant-Id`; keine Token in `localStorage` (Darstellung nur Theme-Keys) |
| **Offline** | Precache / Installation möglich; **keine** Offline-Schreibbuchung (vgl. ERP §16 / FIN-6 roadmap) |

---

## Quality Gate und Compliance (Verweis)

- ERP [**§15**](./ERP-Systembeschreibung.md): **Software-Quality-Gate** (Spez, Tests, CI) vs. **Mandanten-Konformitätsnachweis** (Checkliste, Matrix) — siehe dort **Zwei-Ebenen-Modell**.
- Mandanten-Go: [`Checklisten/compliance-rechnung-finanz.md`](../Checklisten/compliance-rechnung-finanz.md); Spez↔Nachweis: [`docs/contracts/compliance-spec-traceability.md`](./contracts/compliance-spec-traceability.md).
- Merge-Evidence: [`docs/contracts/qa-fin-0-gate-readiness.md`](./contracts/qa-fin-0-gate-readiness.md).

---

## §18 — Erweiterte Domänenmodule (nur vorbereitet / Post-MVP)

**Geltung:** Abschnitt **18** der [`docs/ERP-Systembeschreibung.md`](./ERP-Systembeschreibung.md) beschreibt die **vollständige Produktvision** (Gerüstbau-CRM/ERP-Zielbild). Für die **MVP-PWA** gilt: **keine** Pflicht zur Umsetzung der §18-Themen; Reihenfolge und Architektur nach ERP **Teil IV** und **Teil V**.

| Unterabschnitt | Stichwort | Status für MVP-PWA |
|----------------|-----------|---------------------|
| **18.1** | Objekt/Baustelle, Projekt, Kontakte | **Vorbereitet (§18)** — Zielbild in ERP; W1 nur teilweise abgedeckt |
| **18.2** | Material, Lager, Disposition | **Außerhalb MVP (§18)** |
| **18.3** | Mobile Baustelle, Offline | **Außerhalb MVP (§18)** |
| **18.4** | DMS | **Außerhalb MVP (§18)** |
| **18.5** | Kalkulation / Nachkalkulation | **Außerhalb MVP (§18)** |
| **18.6** | Domain Events | **Vorbereitet (§18)** |
| **18.7** | Hintergrundjobs / Queues | **Teilweise** technisch im Backend für Export/Mahn u. ä.; keine §18-Vollspezifikation als MVP-Abschluss |
| **18.8** | Suche | **Außerhalb MVP (§18)** |
| **18.9–18.13** | Benachrichtigungen, Reporting, Kommunikation, Zeiterfassung | **Außerhalb MVP (§18)** |
| **18.11** | Mandanten-Branding | **Vorbereitet (§18)** — Theming vorhanden; Briefpapier-/CI-Tiefe nicht MVP-härtend |
| **18.14** | Security-Ausbau (MFA, …) | **Außerhalb MVP (§18)** — Ist: Bearer laut Teil II |
| **18.15–18.16** | Compliance-Verweis, Soft Delete | **Vorbereitet (§18)** — maßgeblich §8/§12/§13 und Checkliste |

---

## Weitere Programme und UX-Normen

- [`docs/plans/pwa-ux-patterns-end-user.md`](./plans/pwa-ux-patterns-end-user.md)
- [`docs/plans/pwa-domain-increment-roadmap.md`](./plans/pwa-domain-increment-roadmap.md)
- [`docs/plans/pwa-qa-quality-bar.md`](./plans/pwa-qa-quality-bar.md)
- UI-Link-Hub: [`docs/referenz-ui-ux.md`](./referenz-ui-ux.md)
