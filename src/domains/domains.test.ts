import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { domainStatus } from "../models/domains.js";
import { Domain } from "./entity.js";

const BASE = "https://api.test";

const domainJson =
  '{"id":"d1","tenant_id":"t1","domain_name":"example.com","verification_token":"tok",' +
  '"sending_enabled":true,"dkim_active_selector":"mxr1","spf_verified":false,' +
  '"dkim_verified":false,"dmarc_verified":false,"dmarc_report_address":null,' +
  '"dns_last_checked_at":null,"status":"pending",' +
  '"required_customer_records":[{"purpose":"ownership","name":"_mxr.example.com",' +
  '"type":"TXT","value":"tok","verified":false}]}';

const grantJson =
  '{"listener_id":"l1","listener_display_name":"Outbound","listener_type":"submission",' +
  '"stream_type":"transactional","domain_status":"verified","subdomain_scope":"exact"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("DomainsClient", () => {
  it("creates a hydrated domain and serializes the request", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: domainJson }));
    const domain = await makeClient(stub.fetch)
      .workspace("acme")
      .domains()
      .create("example.com", "dmarc@example.com");

    expect(domain).toBeInstanceOf(Domain);
    expect(domain.id).toBe("d1");
    expect(domain.domainName).toBe("example.com");
    expect(domain.status).toBe(domainStatus.pending);
    expect(domain.requiredCustomerRecords).toHaveLength(1);
    expect(domain.requiredCustomerRecords[0]?.type).toBe("TXT");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/domains");
    expect(stub.calls[0]?.body).toContain('"dmarc_report_address":"dmarc@example.com"');
  });

  it("gets a domain by id and rebinds operations to the id path", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: domainJson }));
    const domain = await makeClient(stub.fetch).workspace("acme").domains().get("d1");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/domains/d1");

    await domain.reload();
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/domains/d1");

    await domain.replace("dmarc@example.com");
    expect(stub.calls[2]?.method).toBe("PUT");
    expect(stub.calls[2]?.body).toBe('{"dmarc_report_address":"dmarc@example.com"}');
  });

  it("lists listener grants", async () => {
    const stub = createFetchStub((request) =>
      request.url.includes("listener-grants")
        ? { status: 200, body: `[${grantJson}]` }
        : { status: 200, body: domainJson },
    );
    const domain = await makeClient(stub.fetch).workspace("acme").domains().get("d1");
    const grants = await domain.listenerGrants();
    const list = await grants.toArray();

    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/domains/d1/listener-grants");
    expect(list).toHaveLength(1);
    expect(list[0]?.listenerType).toBe("submission");
    expect(list[0]?.subdomainScope).toBe("exact");
  });

  it("deletes once and is idempotent per instance", async () => {
    const stub = createFetchStub((request) =>
      request.method === "DELETE" ? { status: 204 } : { status: 200, body: domainJson },
    );
    const domain = await makeClient(stub.fetch).workspace("acme").domains().get("d1");

    await expect(domain.delete()).resolves.toBe(true);
    expect(domain.isDeleted).toBe(true);
    await expect(domain.delete()).resolves.toBe(true);
    expect(stub.calls.filter((call) => call.method === "DELETE")).toHaveLength(1);
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/domains/d1");
  });

  it("builds typed filters from a single options object", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "[]" }));
    const paged = await makeClient(stub.fetch).workspace("acme").domains().list({
      search: "example.com",
      status: domainStatus.verified,
      dkimVerified: true,
      sendingEnabled: false,
      pageSize: 50,
    });
    await paged.toArray();

    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("example.com");
    expect(params.get("status")).toBe("verified");
    expect(params.get("dkim_verified")).toBe("true");
    expect(params.get("sending_enabled")).toBe("false");
    expect(params.get("page_size")).toBe("50");
  });

  it("rejects invalid filters before sending", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "[]" }));
    const domains = makeClient(stub.fetch).workspace("acme").domains();
    await expect(domains.list({ search: "ab" })).rejects.toThrow("at least 3 characters");
    await expect(domains.list({ pageSize: 0 })).rejects.toThrow("between 1 and 500");
    expect(stub.calls).toHaveLength(0);
  });
});

describe("Domain entity", () => {
  it("exposes the delegated data accessors", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: domainJson }));
    const domain = await makeClient(stub.fetch).workspace("acme").domains().get("d1");

    expect(domain.tenantId).toBe("t1");
    expect(domain.verificationToken).toBe("tok");
    expect(domain.sendingEnabled).toBe(true);
    expect(domain.dkimActiveSelector).toBe("mxr1");
    expect(domain.spfVerified).toBe(false);
    expect(domain.dkimVerified).toBe(false);
    expect(domain.dmarcVerified).toBe(false);
    expect(domain.dmarcReportAddress).toBeNull();
    expect(domain.dnsLastCheckedAt).toBeNull();
    expect(domain.data.id).toBe("d1");
  });
});
