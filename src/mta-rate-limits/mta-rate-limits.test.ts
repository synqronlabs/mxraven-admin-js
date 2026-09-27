import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";

const BASE = "https://api.test";
const inherited = {
  message_rate_per_minute: 60,
  recipient_rate_per_minute: 600,
  task_rate_per_minute: 600,
  burst: 50,
  max_concurrency: 10,
};
const overrideJson =
  '{"scope":"tenant","tenant_id":"t1",' +
  `"inherited":${JSON.stringify(inherited)},` +
  `"effective":${JSON.stringify(inherited)},"effective_source":"tenant"}`;

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

const stricter = {
  messageRatePerMinute: 30,
  recipientRatePerMinute: 300,
  taskRatePerMinute: 300,
  burst: 25,
  maxConcurrency: 5,
};

describe("MtaRateLimitsClient", () => {
  it("reads the effective override", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: overrideJson }));
    const override = await makeClient(stub.fetch).workspace("acme").mtaRateLimits().get();
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/mta-rate-limit-override");
    expect(override.inherited.messageRatePerMinute).toBe(60);
    expect(override.effectiveSource).toBe("tenant");
  });

  it("rejects an invalid policy before any request", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: overrideJson }));
    await expect(
      makeClient(stub.fetch)
        .workspace("acme")
        .mtaRateLimits()
        .put({ ...stricter, burst: 0 }),
    ).rejects.toThrow("burst must be at least 1");
    expect(stub.calls).toHaveLength(0);
  });

  it("fetches inherited limits and rejects a looser policy", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: overrideJson }));
    await expect(
      makeClient(stub.fetch)
        .workspace("acme")
        .mtaRateLimits()
        .put({
          ...stricter,
          messageRatePerMinute: 61,
        }),
    ).rejects.toThrow("less than or equal to the inherited limit");
    expect(stub.calls).toHaveLength(1);
    expect(stub.calls[0]?.method).toBe("GET");
  });

  it("puts a stricter policy and deletes the override", async () => {
    const stub = createFetchStub((request) =>
      request.method === "DELETE" ? { status: 204 } : { status: 200, body: overrideJson },
    );
    const client = makeClient(stub.fetch).workspace("acme").mtaRateLimits();

    const updated = await client.put(stricter);
    expect(updated.scope).toBe("tenant");
    const put = stub.calls.find((call) => call.method === "PUT");
    expect(put?.body).toBe(
      '{"message_rate_per_minute":30,"recipient_rate_per_minute":300,' +
        '"task_rate_per_minute":300,"burst":25,"max_concurrency":5}',
    );

    await client.delete();
    expect(stub.calls.at(-1)?.method).toBe("DELETE");
  });
});
