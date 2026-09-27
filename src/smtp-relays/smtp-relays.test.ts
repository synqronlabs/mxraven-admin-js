import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { SmtpRelay } from "./entity.js";

const BASE = "https://api.test";
const relayJson =
  '{"id":"r1","tenant_id":"t1","relay_ref":"primary","display_name":"Primary",' +
  '"is_active":true,"credentials_present":true}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("SmtpRelaysClient", () => {
  it("validates the connection before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: relayJson }));
    const client = makeClient(stub.fetch).workspace("acme").smtpRelays();

    await expect(
      client.create({
        relayRef: "primary",
        displayName: "Primary",
        host: "smtp.example.com",
        port: 0,
        username: "u",
        password: "p",
      }),
    ).rejects.toThrow("port must be between 1 and 65535");

    await expect(
      client.create({
        relayRef: "bad ref",
        displayName: "Primary",
        host: "smtp.example.com",
        port: 587,
        username: "u",
        password: "p",
      }),
    ).rejects.toThrow("relay_ref");

    expect(stub.calls).toHaveLength(0);
  });

  it("creates and rebinds getByRef to the id path", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: relayJson }));
    await makeClient(stub.fetch).workspace("acme").smtpRelays().create({
      relayRef: "primary",
      displayName: "Primary",
      host: "smtp.example.com",
      port: 587,
      username: "u",
      password: "p",
    });
    expect(stub.calls[0]?.body).toBe(
      '{"relay_ref":"primary","display_name":"Primary","host":"smtp.example.com",' +
        '"port":587,"username":"u","password":"p"}',
    );

    const relay = await makeClient(stub.fetch).workspace("acme").smtpRelays().getByRef("primary");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/smtp-relays/ref/primary");
    expect(relay).toBeInstanceOf(SmtpRelay);
    expect(relay.id).toBe("r1");
  });

  it("updates, activates, and deletes the entity", async () => {
    const stub = createFetchStub((request) =>
      request.method === "DELETE" ? { status: 204 } : { status: 200, body: relayJson },
    );
    const relay = await makeClient(stub.fetch).workspace("acme").smtpRelays().get("r1");

    await relay.update({
      displayName: "Primary",
      host: "smtp.example.com",
      port: 587,
      username: "u",
      password: "p",
    });
    expect(stub.calls[1]?.method).toBe("PUT");

    await relay.setActive(false);
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/smtp-relays/r1/active");
    expect(stub.calls[2]?.body).toBe('{"is_active":false}');

    await relay.delete();
    expect(stub.calls[3]?.method).toBe("DELETE");
    expect(pathOf(stub.calls[3])).toBe("/v2/tenants/acme/smtp-relays/r1");
  });
});
