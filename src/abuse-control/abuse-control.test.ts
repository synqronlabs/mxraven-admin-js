import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";

const BASE = "https://api.test";
const reputationJson =
  '{"tenant_id":"t1","score":87,"consecutive_negative_count":1,' +
  '"successful_delivery_count":120,"successes_since_negative":4,' +
  '"negative_feedback_count":2,"last_positive_at":null,' +
  '"last_negative_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-02T00:00:00Z"}';
const pauseJson =
  '{"tenant_id":"t1","outbound_paused":true,"source":"automatic",' +
  '"paused_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-02T00:00:00Z"}';
const findingJson =
  '{"id":"f1","kind":"spam_complaint","severity":"high","status":"open",' +
  '"recommended_action":"Review the sending list","first_seen_at":"2026-01-01T00:00:00Z",' +
  '"last_seen_at":"2026-01-02T00:00:00Z","resolved_at":null,' +
  '"updated_at":"2026-01-02T00:00:00Z"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("AbuseControlClient", () => {
  it("reads workspace reputation", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: reputationJson }));
    const reputation = await makeClient(stub.fetch).workspace("acme").abuseControl().reputation();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/reputation");
    expect(reputation.score).toBe(87);
    expect(reputation.consecutiveNegativeCount).toBe(1);
    expect(reputation.lastPositiveAt).toBeNull();
  });

  it("reads the outbound-pause state", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: pauseJson }));
    const pause = await makeClient(stub.fetch).workspace("acme").abuseControl().outboundPause();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/outbound-pause");
    expect(pause.outboundPaused).toBe(true);
    expect(pause.source).toBe("automatic");
  });

  it("lists deliverability findings with pagination", async () => {
    const stub = createFetchStub(() => ({
      status: 200,
      body: `[${findingJson}]`,
      headers: { "X-Next-Page-Token": "next" },
    }));
    const page = await makeClient(stub.fetch)
      .workspace("acme")
      .abuseControl()
      .listDeliverabilityFindings({ pageSize: 10 });

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/abuse-findings");
    expect(queryOf(stub.calls[0]).get("page_size")).toBe("10");
    expect(page.firstPage.nextPageToken).toBe("next");
    expect(page.firstPage.items[0]?.severity).toBe("high");
    expect(page.firstPage.items[0]?.recommendedAction).toBe("Review the sending list");
  });
});
