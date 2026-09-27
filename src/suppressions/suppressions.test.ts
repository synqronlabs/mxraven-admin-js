import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { suppressionReason } from "../models/suppressions.js";
import { TenantSuppression } from "./entity.js";

const BASE = "https://api.test";
const suppressionJson = '{"tenant_id":"t1","email_address":"bounce@example.com","reason":"bounce"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("SuppressionsClient", () => {
  it("lists with typed filters", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${suppressionJson}]` }));
    const paged = await makeClient(stub.fetch)
      .workspace("acme")
      .suppressions()
      .list({ search: "bounce", reason: suppressionReason.bounce, pageSize: 25 });
    const all = await paged.toArray();

    expect(all[0]).toBeInstanceOf(TenantSuppression);
    expect(all[0]?.emailAddress).toBe("bounce@example.com");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/suppressions");
    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("bounce");
    expect(params.get("reason")).toBe("bounce");
    expect(params.get("page_size")).toBe("25");
  });

  it("rejects an invalid search term before sending", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "[]" }));
    await expect(
      makeClient(stub.fetch).workspace("acme").suppressions().list({ search: "ab" }),
    ).rejects.toThrow("at least 3 characters");
    expect(stub.calls).toHaveLength(0);
  });

  it("gets a suppression by encoded address", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: suppressionJson }));
    await makeClient(stub.fetch).workspace("acme").suppressions().get("a+b@example.com");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/suppressions/a%2Bb%40example.com");
  });

  it("creates a suppression with a snake_case body", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: suppressionJson }));
    await makeClient(stub.fetch).workspace("acme").suppressions().create({
      emailAddress: "bounce@example.com",
      reason: suppressionReason.bounce,
    });
    expect(stub.calls[0]?.method).toBe("POST");
    expect(stub.calls[0]?.body).toBe('{"email_address":"bounce@example.com","reason":"bounce"}');
  });

  it("updates and reloads the hydrated entity", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: suppressionJson }));
    const suppression = await makeClient(stub.fetch)
      .workspace("acme")
      .suppressions()
      .get("bounce@example.com");

    await suppression.update(null);
    expect(stub.calls[1]?.method).toBe("PUT");
    expect(stub.calls[1]?.body).toBe('{"reason":null}');

    await suppression.reload();
    expect(stub.calls[2]?.method).toBe("GET");
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/suppressions/bounce%40example.com");
  });
});
