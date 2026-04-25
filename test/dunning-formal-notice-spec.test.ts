import { describe, expect, it } from "vitest";
import {
  FORMAL_DUNNING_NOTICE_DOCUMENT_CLUSTERS,
  type FormalDunningNoticeDocumentClusterId,
} from "../src/domain/dunning-formal-notice-spec.js";

describe("dunning-formal-notice-spec (B5 anchor)", () => {
  it("exports stable cluster ids for PDF generator hooks", () => {
    expect(FORMAL_DUNNING_NOTICE_DOCUMENT_CLUSTERS).toHaveLength(7);
    expect(FORMAL_DUNNING_NOTICE_DOCUMENT_CLUSTERS).toContain("creditorIdentity");
    const _typeCheck: FormalDunningNoticeDocumentClusterId = "invoiceReference";
    expect(_typeCheck).toBe("invoiceReference");
  });
});
