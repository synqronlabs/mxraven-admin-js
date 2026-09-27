import { describe, expect, it } from "vitest";

import { compactQuery, MIN_SEARCH_LENGTH, normalizePageSize, normalizeSearch } from "./query.js";

describe("query helpers", () => {
  it("exposes the minimum search length", () => {
    expect(MIN_SEARCH_LENGTH).toBe(3);
  });

  it("ignores blank search values and rejects short ones", () => {
    expect(normalizeSearch(undefined)).toBeUndefined();
    expect(normalizeSearch("")).toBeUndefined();
    expect(normalizeSearch("   ")).toBeUndefined();
    expect(() => normalizeSearch("ra")).toThrow("at least 3 characters");
    expect(normalizeSearch("  example.com  ")).toBe("example.com");
  });

  it("validates page size", () => {
    expect(normalizePageSize(undefined)).toBeUndefined();
    expect(() => normalizePageSize(0)).toThrow("between 1 and 500");
    expect(() => normalizePageSize(501)).toThrow("between 1 and 500");
    expect(normalizePageSize(50)).toBe(50);
  });

  it("compacts unset entries but keeps false and 0", () => {
    expect(compactQuery({ a: undefined, b: null, c: false, d: 0, e: "x" })).toEqual({
      c: false,
      d: 0,
      e: "x",
    });
  });
});
