import { describe, expect, it } from "vitest";

import { fromWire, rawWire, toWire } from "./serde.js";

describe("serde", () => {
  it("camelizes nested wire keys", () => {
    expect(
      fromWire({
        tenant_id: "t1",
        required_customer_records: [{ record_type: "TXT", dkim_active_selector: "mxr1" }],
      }),
    ).toEqual({
      tenantId: "t1",
      requiredCustomerRecords: [{ recordType: "TXT", dkimActiveSelector: "mxr1" }],
    });
  });

  it("snake-cases nested request keys", () => {
    expect(toWire({ domainName: "example.com", nested: { dmarcReportAddress: null } })).toEqual({
      domain_name: "example.com",
      nested: { dmarc_report_address: null },
    });
  });

  it("omits undefined but preserves null", () => {
    expect(toWire({ a: undefined, b: null, c: false })).toEqual({ b: null, c: false });
  });

  it("leaves arrays and primitives untouched", () => {
    expect(fromWire([1, "x", null])).toEqual([1, "x", null]);
    expect(toWire("x")).toBe("x");
    expect(toWire(42)).toBe(42);
  });

  it("leaves free-form map keys untouched", () => {
    expect(
      toWire({ httpStubs: [{ headers: rawWire({ "X-Trace": "1", "x-lower": "2" }) }] }),
    ).toEqual({ http_stubs: [{ headers: { "X-Trace": "1", "x-lower": "2" } }] });
    expect(toWire({ recipientSets: rawWire({ "VIP Set": ["a@b.com"] }) })).toEqual({
      recipient_sets: { "VIP Set": ["a@b.com"] },
    });
  });

  it("round-trips a camelCase object", () => {
    const value = { domainName: "example.com", sendingEnabled: true, s3StorageRef: "archive" };
    expect(fromWire(toWire(value))).toEqual(value);
  });
});
