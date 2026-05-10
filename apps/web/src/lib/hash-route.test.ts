import { describe, expect, it, vi } from "vitest";
import {
  FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH,
  FINANCE_WORKLIST_HASH,
  MEASUREMENT_PILOT_LIST_HASH,
  OFFER_WORKSPACE_HASH,
  STAMMDATEN_HASH,
  applyMeasurementPilotVersionToLocationHash,
  applyStammdatenCustomerIdToLocationHash,
  financePrepHashWithTab,
  financeWorklistHashWithPanel,
  measurementPilotListHashWithVersionId,
  normalizeFinancePrepHashToCanon,
  offerWorkspaceHashWithVersionIds,
  readFinanceWorklistPanelFromHash,
  readMeasurementPilotVersionIdFromHash,
  readOfferWorkspaceVersionIdsFromHash,
  readStammdatenCustomerIdFromHash,
  stammdatenHashWithCustomerId,
} from "./hash-route.js";

describe("finance worklist panel hash", () => {
  it("readFinanceWorklistPanelFromHash", () => {
    expect(readFinanceWorklistPanelFromHash("/finanz-arbeitsliste", new URLSearchParams())).toBe("offen");
    expect(readFinanceWorklistPanelFromHash("/finanz-arbeitsliste", new URLSearchParams("tab=mahn"))).toBe("mahn");
    expect(readFinanceWorklistPanelFromHash("/lv-bearbeiten", new URLSearchParams("tab=mahn"))).toBe("offen");
  });

  it("financeWorklistHashWithPanel", () => {
    expect(financeWorklistHashWithPanel("offen")).toBe(FINANCE_WORKLIST_HASH);
    expect(financeWorklistHashWithPanel("mahn")).toBe(`${FINANCE_WORKLIST_HASH}?tab=mahn`);
  });
});

describe("financePrepHashWithTab", () => {
  it("nutzt dedizierten Pfad für Grundeinstellungen", () => {
    expect(financePrepHashWithTab("grundeinstellungen")).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("nutzt vorbereitung-Query für andere Tabs", () => {
    expect(financePrepHashWithTab("rechnung")).toBe("#/finanz-vorbereitung?tab=rechnung");
  });
});

describe("normalizeFinancePrepHashToCanon", () => {
  it("vereinheitlicht ?tab=grundeinstellungen auf dedizierten Pfad", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-vorbereitung?tab=grundeinstellungen";
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("lässt dedizierten Grundeinstellungen-Pfad unverändert", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(FINANCE_PREP_GRUNDEINSTELLUNGEN_HASH);
  });

  it("greift nicht bei anderen Finanz-Vorbereitung-Pfaden ein", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/finanz-vorbereitung?tab=rechnung";
    const before = window.location.hash;
    normalizeFinancePrepHashToCanon();
    expect(window.location.hash).toBe(before);
  });
});

describe("stammdatenHashWithCustomerId / readStammdatenCustomerIdFromHash", () => {
  it("baut Deep-Link mit customerId", () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    expect(stammdatenHashWithCustomerId(id)).toBe(`${STAMMDATEN_HASH}?customerId=${encodeURIComponent(id)}`);
  });

  it("liest customerId aus aktuellem Hash", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten?customerId=bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
    expect(readStammdatenCustomerIdFromHash()).toBe("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb");
  });

  it("applyStammdatenCustomerIdToLocationHash setzt Hash und löst hashchange aus", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten";
    const listener = vi.fn();
    window.addEventListener("hashchange", listener);
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    applyStammdatenCustomerIdToLocationHash(id);
    expect(window.location.hash).toBe(`#/stammdaten?customerId=${id}`);
    expect(listener).toHaveBeenCalled();
    window.removeEventListener("hashchange", listener);
  });

  it("applyStammdatenCustomerIdToLocationHash(null) entfernt customerId-Query", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/stammdaten?customerId=cccccccc-cccc-4ccc-cccc-cccccccccccc";
    applyStammdatenCustomerIdToLocationHash(null);
    expect(window.location.hash).toBe("#/stammdaten");
  });
});

describe("measurementPilotListHashWithVersionId / readMeasurementPilotVersionIdFromHash", () => {
  it("baut Deep-Link mit measurementVersionId", () => {
    const id = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
    expect(measurementPilotListHashWithVersionId(id)).toBe(
      `${MEASUREMENT_PILOT_LIST_HASH}?measurementVersionId=${encodeURIComponent(id)}`,
    );
  });

  it("liest measurementVersionId nur auf Aufmass-Pilot-Pfad", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/aufmass-messungen?measurementVersionId=eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee";
    expect(readMeasurementPilotVersionIdFromHash()).toBe("eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee");
    window.location.hash = "#/geschaeftsprozess?measurementVersionId=eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee";
    expect(readMeasurementPilotVersionIdFromHash()).toBe("");
  });

  it("applyMeasurementPilotVersionToLocationHash setzt Hash und löst hashchange aus", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/aufmass-messungen";
    const listener = vi.fn();
    window.addEventListener("hashchange", listener);
    const id = "ffffffff-ffff-4fff-ffff-ffffffffffff";
    applyMeasurementPilotVersionToLocationHash(id);
    expect(window.location.hash).toBe(`${MEASUREMENT_PILOT_LIST_HASH}?measurementVersionId=${id}`);
    expect(listener).toHaveBeenCalled();
    window.removeEventListener("hashchange", listener);
  });

  it("applyMeasurementPilotVersionToLocationHash(null) entfernt Query", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = "#/aufmass-messungen?measurementVersionId=aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    applyMeasurementPilotVersionToLocationHash(null);
    expect(window.location.hash).toBe(MEASUREMENT_PILOT_LIST_HASH);
  });
});

describe("offerWorkspaceHashWithVersionIds / readOfferWorkspaceVersionIdsFromHash", () => {
  it("baut Deep-Link mit offerVersionId und supplementVersionId", () => {
    const ov = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const sv = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
    expect(offerWorkspaceHashWithVersionIds(ov, sv)).toBe(
      `${OFFER_WORKSPACE_HASH}?offerVersionId=${encodeURIComponent(ov)}&supplementVersionId=${encodeURIComponent(sv)}`,
    );
  });

  it("liest IDs nur auf Angebots-Arbeitsflächen-Pfad", () => {
    window.history.replaceState(null, "", "/");
    window.location.hash = `#/angebote-arbeitsflaeche?offerVersionId=${encodeURIComponent("cccccccc-cccc-4ccc-cccc-cccccccccccc")}`;
    expect(readOfferWorkspaceVersionIdsFromHash().offerVersionId).toBe("cccccccc-cccc-4ccc-cccc-cccccccccccc");
    window.location.hash = "#/geschaeftsprozess?offerVersionId=dddddddd-dddd-4ddd-dddd-dddddddddddd";
    expect(readOfferWorkspaceVersionIdsFromHash().offerVersionId).toBe("");
  });
});
