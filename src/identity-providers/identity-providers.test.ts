import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { TenantIdentityProvider } from "./entity.js";

const BASE = "https://api.test";
const providerJson =
  '{"id":"idp1","tenant_id":"t1","idp_ref":"corp","display_name":"Corp SSO",' +
  '"provider_type":"oidc","zitadel_provider_id":"z1","issuer":"https://idp.example.com",' +
  '"client_id":"cid","scopes":["openid"],' +
  '"provider_config":{"client_secret_set":true,"custom_key":"v"},' +
  '"auto_grant_roles":false,"is_active":true,"lifecycle_status":"ready"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("IdentityProvidersClient", () => {
  it("lists providers and preserves provider-config keys", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: `[${providerJson}]` }));
    const paged = await makeClient(stub.fetch)
      .workspace("acme")
      .identityProviders()
      .list({ pageSize: 5 });
    const all = await paged.toArray();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/identity-providers");
    expect(all[0]).toBeInstanceOf(TenantIdentityProvider);
    expect(all[0]?.providerType).toBe("oidc");
    expect(all[0]?.providerConfig).toEqual({ client_secret_set: true, custom_key: "v" });
    expect(Object.keys(all[0]?.providerConfig ?? {})).not.toContain("clientSecretSet");
  });

  it("validates OIDC create fields before sending", () => {
    const stub = createFetchStub(() => ({ status: 201, body: providerJson }));
    const idps = makeClient(stub.fetch).workspace("acme").identityProviders();
    expect(() =>
      idps.create({
        idpRef: "corp",
        displayName: "Corp",
        issuer: "https://idp.example.com",
        clientId: "cid",
        clientSecret: "",
      }),
    ).toThrow("client_secret is required");
    expect(() =>
      idps.create({
        idpRef: "bad ref",
        displayName: "Corp",
        issuer: "https://idp.example.com",
        clientId: "cid",
        clientSecret: "s",
      }),
    ).toThrow("idp_ref");
    expect(stub.calls).toHaveLength(0);
  });

  it("posts OIDC and OAuth creates to their paths", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: providerJson }));

    await makeClient(stub.fetch).workspace("acme").identityProviders().create({
      idpRef: "corp",
      displayName: "Corp",
      issuer: "https://idp.example.com",
      clientId: "cid",
      clientSecret: "secret",
    });
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/identity-providers");

    const idps = makeClient(stub.fetch).workspace("acme").identityProviders();
    expect(() =>
      idps.createOAuth({
        idpRef: "oauth",
        name: "OAuth",
        clientId: "cid",
        clientSecret: "secret",
        authorizationEndpoint: "https://idp.example.com/authorize",
        tokenEndpoint: "",
        userEndpoint: "https://idp.example.com/user",
      }),
    ).toThrow("token_endpoint is required");

    await makeClient(stub.fetch).workspace("acme").identityProviders().createOAuth({
      idpRef: "oauth",
      name: "OAuth",
      clientId: "cid",
      clientSecret: "secret",
      authorizationEndpoint: "https://idp.example.com/authorize",
      tokenEndpoint: "https://idp.example.com/token",
      userEndpoint: "https://idp.example.com/user",
    });
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/identity-providers/oauth");
  });

  it("reads provisioning, claims access, and sets auto-grant", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("/identity-provisioning")) {
        return { status: 200, body: '{"roles":["admin"]}' };
      }
      if (request.url.includes("/claim-access")) {
        return { status: 200, body: '{"granted":true}' };
      }
      return { status: 200, body: providerJson };
    });
    const idps = makeClient(stub.fetch).workspace("acme").identityProviders();

    expect((await idps.getProvisioning()).roles).toEqual(["admin"]);
    expect((await idps.claimAccess()).granted).toBe(true);
    expect(() => idps.updateProvisioning({ roles: Array.from({ length: 65 }, () => "r") })).toThrow(
      "64 entries or fewer",
    );

    const updated = await idps.setAutoGrant("idp1", true);
    expect(updated).toBeInstanceOf(TenantIdentityProvider);
    const grantCall = stub.calls.find((call) => call.url.includes("/auto-grant"));
    expect(grantCall?.body).toBe('{"enabled":true}');
  });

  it("reloads and sets auto-grant on the entity", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: providerJson }));
    const client = makeClient(stub.fetch);
    const idp = await client.workspace("acme").identityProviders().get("idp1");
    expect(idp.providerConfig).toEqual({ client_secret_set: true, custom_key: "v" });

    await idp.setAutoGrant(true);
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/identity-providers/idp1/auto-grant");

    const list = await client.workspace("acme").identityProviders().list();
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/identity-providers");
    await list.toArray();
  });
});
