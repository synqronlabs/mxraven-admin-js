import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { RecipientSet } from "./entity.js";

const BASE = "https://api.test";
const setJson =
  '{"id":"rs1","tenant_id":"t1","set_ref":"vip","display_name":"VIP",' +
  '"description":null,"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}';
const memberJson = '{"email_address":"a@b.com","added_at":"2026-01-01T00:00:00Z"}';
const batchJson = '{"requested":2,"normalized":2,"added":1,"existing":1,"deleted":0,"missing":0}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("RecipientSetsClient", () => {
  it("lists sets", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${setJson}]` }));
    const paged = await makeClient(stub.fetch).workspace("acme").recipientSets().list();
    const all = await paged.toArray();
    expect(all[0]).toBeInstanceOf(RecipientSet);
    expect(all[0]?.setRef).toBe("vip");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/recipient-sets");
  });

  it("validates the set reference before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: setJson }));
    const sets = makeClient(stub.fetch).workspace("acme").recipientSets();
    await expect(sets.create({ setRef: "bad ref!" })).rejects.toThrow("set_ref");
    await expect(sets.create({ setRef: "vip", displayName: "x".repeat(256) })).rejects.toThrow(
      "display_name",
    );
    expect(stub.calls).toHaveLength(0);
  });

  it("creates and fetches by ref", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: setJson }));
    await makeClient(stub.fetch).workspace("acme").recipientSets().create({
      setRef: "vip",
      displayName: "VIP",
    });
    expect(stub.calls[0]?.body).toBe('{"set_ref":"vip","display_name":"VIP"}');

    await makeClient(stub.fetch).workspace("acme").recipientSets().getByRef("vip");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/recipient-sets/vip");
  });

  it("updates the entity with explicit nulls", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: setJson }));
    const set = await makeClient(stub.fetch).workspace("acme").recipientSets().getByRef("vip");
    await set.update({ displayName: null, description: null });
    expect(stub.calls[1]?.body).toBe('{"display_name":null,"description":null}');
  });
});

describe("RecipientSetMembersClient", () => {
  it("adds and validates members", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: memberJson }));
    const members = makeClient(stub.fetch).workspace("acme").recipientSets().getByRef("vip");
    const set = await members;
    const client = set.members();

    await client.add("a@b.com");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/recipient-sets/vip/members");
    expect(stub.calls[1]?.body).toBe('{"email_address":"a@b.com"}');

    await expect(client.add("not-an-email")).rejects.toThrow("valid email address");
  });

  it("uses the batch endpoints and validates the list", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: batchJson }));
    const set = await makeClient(stub.fetch).workspace("acme").recipientSets().getByRef("vip");
    const client = set.members();

    const result = await client.batchAdd(["a@b.com", "c@d.com"]);
    expect(result.added).toBe(1);
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/recipient-sets/vip/members:batch-add");
    expect(stub.calls[1]?.body).toBe('{"email_addresses":["a@b.com","c@d.com"]}');

    await client.batchDelete(["a@b.com"]);
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/recipient-sets/vip/members:batch-delete");

    await expect(client.batchAdd([])).rejects.toThrow("must not be empty");
  });

  it("filters the member list", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${memberJson}]` }));
    const set = await makeClient(stub.fetch).workspace("acme").recipientSets().getByRef("vip");
    await set
      .members()
      .list({ search: "a@b", addedFrom: "2026-01-01T00:00:00Z" })
      .then((p) => p.toArray());

    const params = queryOf(stub.calls[1]);
    expect(params.get("q")).toBe("a@b");
    expect(params.get("added_from")).toBe("2026-01-01T00:00:00Z");
  });
});
