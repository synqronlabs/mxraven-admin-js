import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";

const BASE = "https://api.test";
const quotaJson =
  '{"tenant_id":"t1","tenant_slug":"acme",' +
  '"guardrail_profile":{"id":"g1","profile_ref":"default","display_name":"Default","is_active":true},' +
  '"effective":{"profile_id":"g1","profile_ref":"default","profile_display_name":"Default",' +
  '"profile_is_active":true,"max_domains":10,"max_subdomains":null},' +
  '"usage":{"domains":1,"mta_listeners":2},' +
  '"over_limit":{"max_domains":false,"max_mta_listeners":true}}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("QuotasClient", () => {
  it("reads effective quotas and preserves the over-limit map keys", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: quotaJson }));
    const quota = await makeClient(stub.fetch).workspace("acme").quotas().get();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/quotas");
    expect(quota.effective.profileId).toBe("g1");
    expect(quota.usage.domains).toBe(1);
    expect(quota.overLimit).toEqual({ max_domains: false, max_mta_listeners: true });
    expect(Object.keys(quota.overLimit)).not.toContain("maxDomains");
  });
});
