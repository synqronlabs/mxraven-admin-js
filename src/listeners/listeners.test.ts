import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";
import { terminalActionPayload } from "../models/listeners.js";
import { modifyHeaderOperation, routingRuleAction } from "../models/routing-rules.js";
import { Listener } from "./entity.js";
import { RoutingRule } from "./routing-rules.js";

const BASE = "https://api.test";
const listenerJson =
  '{"id":"l1","tenant_id":"t1","display_name":"Outbound","listener_type":"submission",' +
  '"stream_type":"transactional","default_terminal_action_type":"DELIVER",' +
  '"default_terminal_action_payload":{},"rspamd_scanning_enabled":false}';
const mtaJson =
  '{"id":"l2","tenant_id":"t1","display_name":"Inbound","listener_type":"mta",' +
  '"stream_type":"transactional","default_terminal_action_type":"DROP",' +
  '"default_terminal_action_payload":{},"rspamd_scanning_enabled":true}';
const ruleJson =
  '{"id":"rule1","listener_id":"l1","priority":10,"expression_text":"from == \'a@b.com\'",' +
  '"action":{"action_type":"SMTP_FORWARD","action_payload":{"destination_ref":"billing-dest"}},' +
  '"is_active":true}';
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
        defaultTerminalActionType: "DELIVER",
      }),
    ).rejects.toThrow("'system' cannot be used");

    await expect(
      listeners.create({
        displayName: "x",
        listenerType: "submission",
        streamType: "transactional",
        defaultTerminalActionType: "RELAY",
      }),
    ).rejects.toThrow("not valid for listener_type submission");

    await expect(
      listeners.create({
        displayName: "x",
        listenerType: "submission",
        streamType: "transactional",
        defaultTerminalActionType: "DELIVER",
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
      defaultTerminalActionType: "DELIVER",
    });
    expect(created).toBeInstanceOf(Listener);
    expect(stub.calls[0]?.body).toBe(
      '{"display_name":"Outbound","listener_type":"submission","stream_type":"transactional",' +
        '"default_terminal_action_type":"DELIVER"}',
    );
  });

  it("lists with filters and lists MTA listeners", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${listenerJson}]` }));
    const listeners = makeClient(stub.fetch).workspace("acme").listeners();
    await listeners.list({
      search: "out",
      listenerType: "submission",
      streamType: "transactional",
      defaultTerminalActionType: "DELIVER",
      rspamdScanningEnabled: false,
      pageSize: 50,
    });

    const params = queryOf(stub.calls[0]);
    expect(params.get("q")).toBe("out");
    expect(params.get("listener_type")).toBe("submission");
    expect(params.get("stream_type")).toBe("transactional");
    expect(params.get("default_terminal_action_type")).toBe("DELIVER");
    expect(params.get("rspamd_scanning_enabled")).toBe("false");
    expect(params.get("page_size")).toBe("50");

    const mtaStub = createFetchStub(() => ({ status: 200, body: `[${mtaJson}]` }));
    const mta = await makeClient(mtaStub.fetch).workspace("acme").listeners().listMtaListeners();
    expect(mta).toHaveLength(1);
    expect(mta[0]?.listenerType).toBe("mta");
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
      if (request.url.includes("/rules")) {
        return { status: 200, body: `[${ruleJson}]` };
      }
      return { status: 200, body: listenerJson };
    });
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1");

    await listener
      .routingRules()
      .list()
      .then((p) => p.toArray());
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/listeners/l1/rules");

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
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/listeners/l1/api-keys");

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
});

describe("Routing rules", () => {
  it("validates create requests", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: ruleJson }));
    const rules = makeClient(stub.fetch)
      .workspace("acme")
      .listeners()
      .get("l1")
      .then((l) => l.routingRules());
    const client = await rules;

    await expect(
      client.create({ priority: 0, expressionText: "x", action: routingRuleAction.deliver() }),
    ).rejects.toThrow("priority must be greater than 0");
    await expect(
      client.create({ priority: 1, expressionText: "", action: routingRuleAction.deliver() }),
    ).rejects.toThrow("expression_text is required");
    expect(stub.calls).toHaveLength(1);
  });

  it("serializes the polymorphic action and navigates the entity", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: ruleJson }));
    const listener = await makeClient(stub.fetch).workspace("acme").listeners().get("l1");
    const rule = await listener.routingRules().create({
      priority: 10,
      expressionText: "from == 'a@b.com'",
      action: routingRuleAction.smtpForward("billing-dest"),
    });
    expect(rule).toBeInstanceOf(RoutingRule);
    expect(JSON.parse(stub.calls[1]?.body ?? "{}")).toEqual({
      priority: 10,
      expression_text: "from == 'a@b.com'",
      action: { action_type: "SMTP_FORWARD", action_payload: { destination_ref: "billing-dest" } },
    });

    await rule.replace({
      expressionText: "to == 'x@y.com'",
      action: routingRuleAction.deliver(),
    });
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/listeners/l1/rules/rule1");

    await rule.setActive(false);
    expect(pathOf(stub.calls[3])).toBe("/v2/tenants/acme/listeners/l1/rules/rule1/active");
    expect(stub.calls[3]?.body).toBe('{"is_active":false}');

    await rule.reorder(5);
    expect(pathOf(stub.calls[4])).toBe("/v2/tenants/acme/listeners/l1/rules/rule1/priority");
    expect(stub.calls[4]?.body).toBe('{"priority":5}');
  });
});

describe("Listener action payloads", () => {
  it("builds and validates terminal-action payloads", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    expect(terminalActionPayload.deliverDedicated(uuid)).toEqual({ poolId: uuid });
    expect(() => terminalActionPayload.deliverDedicated("nope")).toThrow("valid UUID");
    expect(terminalActionPayload.relay("primary")).toEqual({ relayRef: "primary" });
    expect(terminalActionPayload.drop("  ")).toEqual({});
    expect(terminalActionPayload.drop("why")).toEqual({ auditReason: "why" });
    expect(terminalActionPayload.reject(550, "5.1.1", "no")).toEqual({
      smtpStatusCode: 550,
      enhancedStatusCode: "5.1.1",
      message: "no",
    });
    expect(() => terminalActionPayload.reject(400, "5.1.1", "x")).toThrow("5xx");
    expect(() => terminalActionPayload.reject(550, "5.1", "x")).toThrow("class.subject.detail");
  });

  it("builds and validates routing-rule actions", () => {
    expect(routingRuleAction.addRecipient(["a@b.com"]).actionPayload).toEqual({
      recipients: ["a@b.com"],
    });
    expect(() => routingRuleAction.addRecipient([])).toThrow("must not be empty");
    expect(
      routingRuleAction.modifyHeader([modifyHeaderOperation.remove("X-Test")]).actionPayload,
    ).toEqual({
      operations: [{ op: "remove", header: "X-Test" }],
    });
    expect(
      routingRuleAction.modifyHeader([modifyHeaderOperation.append("X-Test", "1")]).actionPayload,
    ).toEqual({ operations: [{ op: "append", header: "X-Test", value: "1" }] });
    expect(routingRuleAction.s3Store("archive", "mail/", undefined).actionPayload).toEqual({
      storageRef: "archive",
      objectKeyPrefix: "mail/",
    });
    expect(() => routingRuleAction.s3Store("archive", "/mail/")).toThrow("bucket-relative");
    expect(() => routingRuleAction.s3Store("archive", "mail/", "key")).toThrow("only one of");
    expect(() => routingRuleAction.s3Store("archive")).toThrow("required");
    expect(() => routingRuleAction.reject(550, "5.1.1", "x")).not.toThrow();
    expect(() => routingRuleAction.reject(550, "4.1.1", "x")).toThrow("5.subject.detail");
  });
});
