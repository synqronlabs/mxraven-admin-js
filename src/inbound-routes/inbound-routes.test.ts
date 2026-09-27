import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { InboundRoute } from "./entity.js";

const BASE = "https://api.test";
const routeJson =
  '{"id":"r1","tenant_id":"t1","mta_listener_id":"l1","domain_name":"inbound.example",' +
  '"is_verified":false,"verification_status":"pending","txt_verified":false,' +
  '"mx_verified":false,"dns_last_checked_at":null,"verification_token":"tok",' +
  '"required_customer_records":[{"name":"_mxr.inbound.example","type":"TXT","value":"tok"}]}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("InboundRoutesClient", () => {
  it("lists with typed filters", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${routeJson}]` }));
    const paged = await makeClient(stub.fetch).workspace("acme").inboundRoutes().list({
      search: "inbound",
      mtaListenerId: "l1",
      domainName: "inbound.example",
      verified: false,
      pageSize: 10,
    });
    const all = await paged.toArray();

    expect(all[0]).toBeInstanceOf(InboundRoute);
    expect(all[0]?.requiredCustomerRecords[0]?.type).toBe("TXT");
    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("inbound");
    expect(params.get("mta_listener_id")).toBe("l1");
    expect(params.get("domain_name")).toBe("inbound.example");
    expect(params.get("is_verified")).toBe("false");
    expect(params.get("page_size")).toBe("10");
  });

  it("creates and gets a route", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: routeJson }));
    await makeClient(stub.fetch).workspace("acme").inboundRoutes().create({
      mtaListenerId: "l1",
      domainName: "inbound.example",
      onboardDomainIfMissing: true,
    });
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/inbound-routes");
    expect(stub.calls[0]?.body).toBe(
      '{"mta_listener_id":"l1","domain_name":"inbound.example","onboard_domain_if_missing":true}',
    );

    await makeClient(stub.fetch).workspace("acme").inboundRoutes().get("r1");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/inbound-routes/r1");
  });

  it("updates and reloads the entity", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: routeJson }));
    const route = await makeClient(stub.fetch).workspace("acme").inboundRoutes().get("r1");
    await route.update({ mtaListenerId: "l2", domainName: "other.example" });
    expect(stub.calls[1]?.method).toBe("PUT");
    expect(stub.calls[1]?.body).toBe('{"mta_listener_id":"l2","domain_name":"other.example"}');
    expect(await route.reload()).toBeInstanceOf(InboundRoute);
  });
});
