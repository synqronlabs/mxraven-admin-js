import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { WebhookEndpoint } from "./entity.js";

const BASE = "https://api.test";
const endpointJson =
  '{"id":"w1","tenant_id":"t1","webhook_ref":"hooks","display_name":"Hooks",' +
  '"target_url":"https://example.com/hook","signing_kid":"k1","has_signing_secret":true,' +
  '"is_active":true,"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}';
const credentialJson = endpointJson.replace(
  '"has_signing_secret":true',
  '"has_signing_secret":true,"credential_header":"X-API-Key"',
);
const issuedJson =
  '{"id":"w1","tenant_id":"t1","webhook_ref":"hooks","display_name":"Hooks",' +
  '"target_url":"https://example.com/hook","signing_kid":"k1","has_signing_secret":true,' +
  '"is_active":true,"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z",' +
  '"signing_secret":"whsec_123"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("WebhookEndpointsClient", () => {
  it("requires an https target", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: issuedJson }));
    const client = makeClient(stub.fetch).workspace("acme").webhookEndpoints();
    await expect(
      client.create({ webhookRef: "hooks", displayName: "Hooks", targetUrl: "http://example.com" }),
    ).rejects.toThrow("must use https");
    expect(stub.calls).toHaveLength(0);
  });

  it("returns the one-time signing secret on create", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: issuedJson }));
    const issued = await makeClient(stub.fetch).workspace("acme").webhookEndpoints().create({
      webhookRef: "hooks",
      displayName: "Hooks",
      targetUrl: "https://example.com/hook",
    });
    expect(issued.signingSecret).toBe("whsec_123");
    expect(stub.calls[0]?.body).toBe(
      '{"webhook_ref":"hooks","display_name":"Hooks","target_url":"https://example.com/hook"}',
    );
  });

  it("sets and removes a credential through the client and entity", async () => {
    const stub = createFetchStub((request) =>
      request.url.includes("/credential")
        ? { status: 200, body: request.method === "DELETE" ? endpointJson : credentialJson }
        : { status: 200, body: endpointJson },
    );
    const client = makeClient(stub.fetch).workspace("acme").webhookEndpoints();

    const withCredential = await client.setCredential("w1", {
      header: "X-API-Key",
      value: "sk-123",
    });
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/webhook-endpoints/w1/credential");
    expect(stub.calls[0]?.method).toBe("PUT");
    expect(stub.calls[0]?.body).toBe('{"header":"X-API-Key","value":"sk-123"}');
    expect(withCredential.credentialHeader).toBe("X-API-Key");

    const withoutCredential = await client.deleteCredential("w1");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/webhook-endpoints/w1/credential");
    expect(stub.calls[1]?.method).toBe("DELETE");
    expect(withoutCredential.credentialHeader).toBeUndefined();

    const endpoint = await client.get("w1");
    const updated = await endpoint.setCredential({ value: "Bearer sk-456" });
    expect(pathOf(stub.calls[3])).toBe("/v2/tenants/acme/webhook-endpoints/w1/credential");
    expect(stub.calls[3]?.body).toBe('{"header":"Authorization","value":"Bearer sk-456"}');
    expect(updated.credentialHeader).toBe("X-API-Key");

    await updated.deleteCredential();
    expect(stub.calls[4]?.method).toBe("DELETE");
  });

  it("rejects invalid credentials before sending", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: credentialJson }));
    const client = makeClient(stub.fetch).workspace("acme").webhookEndpoints();

    await expect(
      client.setCredential("w1", { header: "Authorization", value: "" }),
    ).rejects.toThrow("value is required");
    await expect(
      client.setCredential("w1", { header: "X-MxRaven-Token", value: "x" }),
    ).rejects.toThrow("reserved prefixes");
    await expect(
      client.setCredential("w1", { header: "Content-Type", value: "x" }),
    ).rejects.toThrow("Authorization or an X- header");
    await expect(
      client.setCredential("w1", { header: "X-API-Key", value: "a\r\nb" }),
    ).rejects.toThrow("line breaks");
    expect(stub.calls).toHaveLength(0);
  });

  it("rotates the secret and toggles active", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("/rotate-secret")) {
        return { status: 200, body: issuedJson };
      }
      return { status: 200, body: endpointJson };
    });
    const endpoint = await makeClient(stub.fetch).workspace("acme").webhookEndpoints().get("w1");
    expect(endpoint).toBeInstanceOf(WebhookEndpoint);

    const rotated = await endpoint.rotateSecret();
    expect(rotated.signingSecret).toBe("whsec_123");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/webhook-endpoints/w1/rotate-secret");

    await endpoint.setActive(false);
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/webhook-endpoints/w1/active");
    expect(stub.calls[2]?.body).toBe('{"is_active":false}');
  });
});
