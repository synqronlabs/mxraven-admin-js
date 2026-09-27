import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { mailAnalyticsDimension, mailAnalyticsMetric } from "../models/mail-analytics.js";

const BASE = "https://api.test";
const overviewJson =
  '{"start_at":"2026-09-01T01:00:00Z","end_at":"2026-09-02T01:00:00Z",' +
  '"bucket_granularity":"hour","queried_at":"2026-09-02T01:00:01Z",' +
  '"eventual_consistency_notice":"","summary":{"egress_tasks":5},' +
  '"time_series":[],"listener_breakdown":{"limit":10,"total_egress_tasks":5,"items":[],"other_egress_tasks":0}}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

const validInterval = { startAt: "2026-09-01T01:00:00Z", endAt: "2026-09-02T01:00:00Z" };

describe("MailAnalyticsClient interval validation", () => {
  const client = () =>
    makeClient(createFetchStub(() => ({ status: 200, body: overviewJson })).fetch)
      .workspace("acme")
      .mailAnalytics();

  it("accepts aligned intervals", () => {
    expect(() => client().overview(validInterval)).not.toThrow();
    expect(() =>
      client().overview({ startAt: "2026-09-01T00:00:00Z", endAt: "2026-09-05T00:00:00Z" }),
    ).not.toThrow();
  });

  it("rejects unaligned, non-UTC, reversed, and oversized intervals", () => {
    expect(() =>
      client().overview({ startAt: "2026-09-01T01:00:01Z", endAt: "2026-09-02T01:00:00Z" }),
    ).toThrow("align to UTC hour boundaries");
    expect(() =>
      client().overview({
        startAt: "2026-09-01T01:00:00+01:00",
        endAt: "2026-09-02T01:00:00+01:00",
      }),
    ).toThrow("must use UTC");
    expect(() =>
      client().overview({ startAt: "2026-09-02T01:00:00Z", endAt: "2026-09-01T01:00:00Z" }),
    ).toThrow("start_at must be before end_at");
    expect(() =>
      client().overview({ startAt: "2026-09-01T00:00:00Z", endAt: "2026-10-03T00:00:00Z" }),
    ).toThrow("may not exceed 31 days");
    expect(() =>
      client().overview({ startAt: "2026-09-01T01:00:00Z", endAt: "2026-09-05T00:00:00Z" }),
    ).toThrow("align to UTC day boundaries");
  });

  it("validates lifecycle cohorts and observation horizons", () => {
    expect(() =>
      client().lifecycle({
        startAt: "2026-09-01T00:00:00Z",
        endAt: "2026-09-04T00:00:00Z",
        observationEndAt: "2026-09-05T00:00:00Z",
      }),
    ).not.toThrow();
    expect(() =>
      client().lifecycle({
        startAt: "2026-09-01T00:00:00Z",
        endAt: "2026-09-04T00:00:00Z",
        observationEndAt: "2026-09-03T00:00:00Z",
      }),
    ).toThrow("must not precede the cohort end");
    expect(() =>
      client().lifecycle({
        startAt: "2026-09-01T00:00:00Z",
        endAt: "2026-09-09T00:00:00Z",
        observationEndAt: "2026-09-09T00:00:00Z",
      }),
    ).toThrow("cohort may not exceed 7 days");
    expect(() =>
      client().lifecycle({
        startAt: "2026-09-01T00:00:00Z",
        endAt: "2026-09-04T00:00:00Z",
        observationEndAt: "2026-09-10T00:00:00Z",
      }),
    ).toThrow("horizon may not exceed 8 days");
  });

  it("validates the optional limit", () => {
    const options = {
      ...validInterval,
      metric: mailAnalyticsMetric.egressTasks,
      dimension: mailAnalyticsDimension.stream,
    };
    expect(() => client().breakdown({ ...options, limit: 0 })).toThrow("between 1 and 20");
    expect(() => client().breakdown({ ...options, limit: 21 })).toThrow("between 1 and 20");
    expect(() => client().breakdown({ ...options, limit: 20 })).not.toThrow();
  });

  it("sends the operation, interval, metric, dimension, and limit", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "{}" }));
    const analytics = makeClient(stub.fetch).workspace("acme").mailAnalytics();

    await analytics.breakdown({
      ...validInterval,
      metric: mailAnalyticsMetric.dataBytes,
      dimension: mailAnalyticsDimension.recipientDomain,
      limit: 5,
    });

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/mail-analytics/breakdown");
    const params = queryOf(stub.calls[0]);
    expect(params.get("start_at")).toBe(validInterval.startAt);
    expect(params.get("end_at")).toBe(validInterval.endAt);
    expect(params.get("metric")).toBe("data_bytes");
    expect(params.get("dimension")).toBe("recipient_domain");
    expect(params.get("limit")).toBe("5");
  });
});
