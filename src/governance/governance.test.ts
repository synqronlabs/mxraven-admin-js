import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { auditActorKind, auditStatus } from "../models/governance.js";

const BASE = "https://api.test";
const auditJson =
  '{"id":"a1","tenant_id":"t1","actor_id":"u1","actor_kind":"human",' +
  '"action":"domain.create","resource_type":"domain","resource_id":"d1",' +
  '"status":"success","details":{"old_status":"pending","http_status":200},' +
  '"created_at":"2026-01-01T00:00:00Z"}';
const poolJson = '[{"id":"p1","name":"Pool","stream_type":"transactional","ref":"pool-ref"}]';
const outcomeJson =
  '{"id":"o1","listener_id":"l1","message_ref":"m1","recipient_ordinal":0,' +
  '"recipient_domain":"example.com","script_revision_id":"rev1","used_listener_default":false,' +
  '"terminal_action":"REJECT","disposition":"smtp_rejected","smtp_status_code":550,' +
  '"enhanced_status_code":"5.7.1","audit_reason":"policy","created_at":"2026-01-01T00:00:00Z"}';
const searchJson =
  '[{"resource_type":"domain","resource_id":"d1","label":"example.com","reference":"example.com"}]';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("GovernanceClient", () => {
  it("filters the audit log and preserves detail keys", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${auditJson}]` }));
    const paged = await makeClient(stub.fetch).workspace("acme").governance().listAuditLog({
      search: "domain",
      actorKind: auditActorKind.human,
      status: auditStatus.success,
      createdFrom: "2026-01-01T00:00:00Z",
      pageSize: 100,
    });
    const all = await paged.toArray();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/audit-log");
    expect(all[0]?.actorKind).toBe("human");
    expect(all[0]?.details).toEqual({ old_status: "pending", http_status: 200 });
    expect(Object.keys(all[0]?.details ?? {})).not.toContain("oldStatus");

    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("domain");
    expect(params.get("actor_kind")).toBe("human");
    expect(params.get("status")).toBe("success");
    expect(params.get("created_from")).toBe("2026-01-01T00:00:00Z");
    expect(params.get("page_size")).toBe("100");
  });

  it("lists dedicated IP pools", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: poolJson }));
    const pools = await makeClient(stub.fetch)
      .workspace("acme")
      .governance()
      .listDedicatedIPPools()
      .then((p) => p.toArray());
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/dedicated-ip-pools");
    expect(pools[0]?.streamType).toBe("transactional");
    expect(pools[0]?.ref).toBe("pool-ref");
  });

  it("lists inbound routing outcomes and filters by listener", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${outcomeJson}]` }));
    const outcomes = await makeClient(stub.fetch)
      .workspace("acme")
      .governance()
      .listInboundRoutingOutcomes({ listenerId: "l1", pageSize: 25 })
      .then((p) => p.toArray());

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/inbound-routing-outcomes");
    expect(queryOf(stub.calls[0]).get("listener_id")).toBe("l1");
    expect(queryOf(stub.calls[0]).get("page_size")).toBe("25");
    expect(outcomes[0]?.scriptRevisionId).toBe("rev1");
    expect(outcomes[0]?.disposition).toBe("smtp_rejected");
  });

  it("searches resources and joins the types filter", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: searchJson }));
    const results = await makeClient(stub.fetch)
      .workspace("acme")
      .governance()
      .search({ query: "example.com", types: ["domain", "listener"] })
      .then((p) => p.toArray());

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/search");
    expect(results[0]?.resourceType).toBe("domain");
    expect(queryOf(stub.calls[0]).get("types")).toBe("domain,listener");
  });

  it("rejects a short search query", () => {
    const stub = createFetchStub(() => ({ status: 200, body: "[]" }));
    expect(() =>
      makeClient(stub.fetch).workspace("acme").governance().search({ query: "ab" }),
    ).toThrow("at least 3 characters");
    expect(stub.calls).toHaveLength(0);
  });
});
