import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { Listener } from "./entity.js";

const BASE = "https://api.test";
const listenerJson =
  '{"id":"l1","tenant_id":"t1","display_name":"Outbound","listener_type":"submission",' +
  '"stream_type":"transactional","rspamd_scanning_enabled":false,"script_body_access":false}';
const mtaJson =
  '{"id":"l2","tenant_id":"t1","display_name":"Inbound","listener_type":"mta",' +
  '"stream_type":"transactional","rspamd_scanning_enabled":true,"script_body_access":true,' +
  '"active_script_revision_id":"r2"}';
const keyJson = '{"id":"k1","tenant_id":"t1","listener_id":"l1","username":"mxr_tx_abc"}';
const issuedKeyJson = keyJson.replace("}", ',"secret":"s3cr3t"}');
const policyJson =
  '{"listener_id":"l1","grants":[{"domain_id":"d1","domain_name":"example.com",' +
  '"domain_status":"verified","subdomain_scope":"exact"}]}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("ListenersClient", () => {
  it("rejects invalid create requests before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: listenerJson }));
    const listeners = makeClient(stub.fetch).workspace("acme").listeners();

    await expect(
      listeners.create({
        displayName: "x",
        listenerType: "submission",
        streamType: "system",
      }),
    ).rejects.toThrow("'system' cannot be used");

    await expect(
      listeners.create({
        displayName: "x",
        listenerType: "submission",
        streamType: "transactional",
        rspamdScanningEnabled: true,
      }),
    ).rejects.toThrow("only valid for mta listeners");

    expect(stub.calls).toHaveLength(0);
  });

  it("creates with a snake_case body", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: listenerJson }));
    const created = await makeClient(stub.fetch).workspace("acme").listeners().create({
      displayName: "Outbound",
      listenerType: "submission",
      streamType: "transactional",
    });
    expect(created).toBeInstanceOf(Listener);
    expect(created.activeScriptRevisionId).toBeUndefined();
    expect(created.scriptBodyAccess).toBe(false);
    expect(stub.calls[0]?.body).toBe(
      '{"display_name":"Outbound","listener_type":"submission","stream_type":"transactional"}',
    );
  });

  it("lists with filters and lists MTA listeners", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${listenerJson}]` }));
    const listeners = makeClient(stub.fetch).workspace("acme").listeners();
    await listeners.list({
      search: "out",
      listenerType: "submission",
      streamType: "transactional",
      rspamdScanningEnabled: false,
      pageSize: 50,
    });

    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("out");
    expect(params.get("listener_type")).toBe("submission");
    expect(params.get("stream_type")).toBe("transactional");
    expect(params.get("rspamd_scanning_enabled")).toBe("false");
    expect(params.get("page_size")).toBe("50");

    const mtaStub = createFetchStub(() => ({ status: 200, body: `[${mtaJson}]` }));
    const mta = await makeClient(mtaStub.fetch).workspace("acme").listeners().listMtaListeners();
    expect(mta).toHaveLength(1);
    expect(mta[0]?.listenerType).toBe("mta");
    expect(mta[0]?.activeScriptRevisionId).toBe("r2");
    expect(queryOf(mtaStub.calls[0]).get("listener_type")).toBe("mta");
  });

  it("resolves child collection paths", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("/api-keys")) {
        return { status: 200, body: `[${keyJson}]` };
      }
      if (request.url.includes("/sending-domain-policy")) {
        return { status: 200, body: policyJson };
      }
      if (request.url.includes("/script")) {
        return {
          status: 200,
          body:
            '{"listener_id":"l1","listener_type":"submission","body_access":false,' +
            '"published":{"id":"r1","listener_id":"l1","revision":1,"status":"published",' +
            '"publishable":true,"source":"return {}\\n","source_sha256":"' +
            "a".repeat(64) +
            '","schema_version":"mxraven/mail/v1","dependencies":' +
            '{"forward":[],"relay":[],"storage":[],"endpoint":[],"template":[],"pool":[],"sets":[]},' +
            '"diagnostics":[],"created_by":"me","created_at":"2026-01-01T00:00:00Z"}}',
        };
      }
      return { status: 200, body: listenerJson };
    });
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1");

    await listener
      .routingScript()
      .get()
      .then((script) => expect(script.published?.revision).toBe(1));
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/listeners/l1/script");

    await listener
      .apiKeys()
      .list()
      .then((p) => p.toArray());
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/listeners/l1/api-keys");

    const policy = await listener.sendingDomainPolicy().get();
    expect(pathOf(stub.calls[3])).toBe("/v2/tenants/acme/listeners/l1/sending-domain-policy");
    expect(policy.grants[0]?.subdomainScope).toBe("exact");
  });

  it("guards mtaRateLimit to MTA listeners", async () => {
    const stub = createFetchStub((request) =>
      request.url.includes("/listeners/l2")
        ? { status: 200, body: mtaJson }
        : { status: 200, body: listenerJson },
    );
    const submission = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");
    expect(() => submission.mtaRateLimit()).toThrow("only available for MTA listeners");

    const mta = await makeClient(stub.fetch).workspace("acme").listeners().get("l2");
    await mta.mtaRateLimit().get();
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/listeners/l2/mta-rate-limit-override");
  });

  it("issues API keys with a one-time secret", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("/api-keys")) {
        return request.method === "POST"
          ? { status: 201, body: issuedKeyJson }
          : { status: 200, body: `[${keyJson}]` };
      }
      return { status: 200, body: listenerJson };
    });
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");

    const issued = await listener.apiKeys().create();
    expect(issued.secret).toBe("s3cr3t");

    const keys = await listener
      .apiKeys()
      .list()
      .then((p) => p.toArray());
    expect(keys[0]?.username).toBe("mxr_tx_abc");
  });

  it("replaces the sending-domain policy from a grant array", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: policyJson }));
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");
    await listener
      .sendingDomainPolicy()
      .update([{ domainId: "d1", subdomainScope: "include_subdomains" }]);
    expect(stub.calls[1]?.body).toBe(
      '{"grants":[{"domain_id":"d1","subdomain_scope":"include_subdomains"}]}',
    );
  });

  it("reads and updates listener notification settings", async () => {
    const notificationsJson =
      '{"enabled":true,"subject":"mxraven.client.events","consumer":"listener-l1-events"}';
    const stub = createFetchStub((request) => {
      if (request.url.includes("/notifications")) {
        return {
          status: 200,
          body:
            request.method === "PUT"
              ? '{"enabled":false,"subject":"mxraven.client.events","consumer":"listener-l1-events"}'
              : notificationsJson,
        };
      }
      return { status: 200, body: listenerJson };
    });
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");

    const setting = await listener.notificationSetting();
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/listeners/l1/notifications");
    expect(setting.enabled).toBe(true);
    expect(setting.subject).toBe("mxraven.client.events");
    expect(setting.consumer).toBe("listener-l1-events");

    const updated = await listener.updateNotifications(false);
    expect(stub.calls[2]?.method).toBe("PUT");
    expect(stub.calls[2]?.body).toBe('{"enabled":false}');
    expect(updated.enabled).toBe(false);
  });
});
