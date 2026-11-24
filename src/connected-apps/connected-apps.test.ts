import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";

const BASE = "https://api.test";
const appId = "123e4567-e89b-12d3-a456-426614174000";
const installationJson =
  '{"id":"i1","tenant_id":"t1","app_id":"' +
  appId +
  '","client_id":"client-1","display_name":"Acme","homepage_url":"https://acme.test",' +
  '"granted_scopes":["rules.read"],"status":"active",' +
  '"granted_by":{"issuer":"https://idp.test","subject":"s1","email":"owner@acme.test"},' +
  '"granted_at":"2026-01-01T00:00:00Z","last_used_at":null}';
const scopeJson = '{"scope":"rules.read","description":"Read routing scripts"}';
const deviceJson =
  '{"user_code":"ABCD-1234","app_id":"' +
  appId +
  '","client_id":"client-1","display_name":"Acme","requested_scopes":[' +
  scopeJson +
  "]}";
const authorizationJson =
  '{"app_id":"' +
  appId +
  '","client_id":"client-1","redirect_uri":"https://acme.test/cb","display_name":"Acme",' +
  '"requested_scopes":[' +
  scopeJson +
  "]}";

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("ConnectedAppsClient", () => {
  it("lists live installations, newest first", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${installationJson}]` }));
    const installations = await makeClient(stub.fetch).workspace("acme").connectedApps().list();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/connected-apps");
    expect(installations).toHaveLength(1);
    expect(installations[0]?.grantedScopes).toEqual(["rules.read"]);
    expect(installations[0]?.grantedBy.email).toBe("owner@acme.test");
    expect(installations[0]?.lastUsedAt).toBeNull();
  });

  it("gets an installation", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: installationJson }));
    const installation = await makeClient(stub.fetch).workspace("acme").connectedApps().get("i1");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/connected-apps/i1");
    expect(installation.status).toBe("active");
  });

  it("approves an installation with a snake_case body", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: installationJson }));
    const installation = await makeClient(stub.fetch)
      .workspace("acme")
      .connectedApps()
      .create({
        appId,
        grantedScopes: ["rules.read"],
      });

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/connected-apps");
    expect(stub.calls[0]?.method).toBe("POST");
    expect(stub.calls[0]?.body).toBe(`{"app_id":"${appId}","granted_scopes":["rules.read"]}`);
    expect(installation.id).toBe("i1");
  });

  it("rejects invalid approval requests before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: installationJson }));
    const client = makeClient(stub.fetch).workspace("acme").connectedApps();

    await expect(client.create({ appId: "nope", grantedScopes: ["rules.read"] })).rejects.toThrow(
      "valid UUID",
    );
    await expect(client.create({ appId, grantedScopes: [] })).rejects.toThrow("must not be empty");
    expect(stub.calls).toHaveLength(0);
  });

  it("revokes an installation", async () => {
    const stub = createFetchStub(() => ({ status: 204 }));
    const revoked = await makeClient(stub.fetch).workspace("acme").connectedApps().revoke("i1");
    expect(revoked).toBe(true);
    expect(stub.calls[0]?.method).toBe("DELETE");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/connected-apps/i1");
  });

  it("previews a device authorization", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: deviceJson }));
    const preview = await makeClient(stub.fetch)
      .workspace("acme")
      .connectedApps()
      .deviceAuthorization("ABCD-1234");

    expect(pathOf(stub.calls[0])).toBe(
      "/v2/tenants/acme/connected-apps/device-authorization/ABCD-1234",
    );
    expect(preview.userCode).toBe("ABCD-1234");
    expect(preview.requestedScopes[0]?.scope).toBe("rules.read");
  });

  it("previews a browser authorization request", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: authorizationJson }));
    const preview = await makeClient(stub.fetch)
      .workspace("acme")
      .connectedApps()
      .authorizationRequest("client-1", "https://acme.test/cb");

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/connected-apps/authorization-request");
    expect(queryOf(stub.calls[0]).get("client_id")).toBe("client-1");
    expect(queryOf(stub.calls[0]).get("redirect_uri")).toBe("https://acme.test/cb");
    expect(preview.redirectUri).toBe("https://acme.test/cb");
  });

  it("lists grantable scopes", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${scopeJson}]` }));
    const scopes = await makeClient(stub.fetch).workspace("acme").connectedApps().listScopes();
    expect(pathOf(stub.calls[0])).toBe("/v2/connected-apps/scopes");
    expect(scopes[0]?.description).toBe("Read routing scripts");
  });
});
