import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { SmtpForwardDestination } from "./entity.js";

const BASE = "https://api.test";
const destinationJson =
  '{"id":"f1","tenant_id":"t1","destination_ref":"forwarding","display_name":"Forward",' +
  '"email_address":"f@example.com","verification_status":"pending","delivery_status":"queued",' +
  '"created_at":"2026-01-01T00:00:00Z","updated_at":"2026-01-01T00:00:00Z"}';
const confirmationJson = '{"verified":true}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("SmtpForwardDestinationsClient", () => {
  it("validates create fields", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: destinationJson }));
    const client = makeClient(stub.fetch).workspace("acme").smtpForwardDestinations();
    await expect(
      client.create({ destinationRef: "bad ref", displayName: "F", emailAddress: "f@example.com" }),
    ).rejects.toThrow("destination_ref");
    await expect(
      client.create({ destinationRef: "forwarding", displayName: "F", emailAddress: "nope" }),
    ).rejects.toThrow("valid mailbox");
    expect(stub.calls).toHaveLength(0);
  });

  it("creates and reads a destination", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: destinationJson }));
    const created = await makeClient(stub.fetch)
      .workspace("acme")
      .smtpForwardDestinations()
      .create({
        destinationRef: "forwarding",
        displayName: "Forward",
        emailAddress: "f@example.com",
      });
    expect(created).toBeInstanceOf(SmtpForwardDestination);
    expect(stub.calls[0]?.body).toBe(
      '{"destination_ref":"forwarding","display_name":"Forward","email_address":"f@example.com"}',
    );

    const byRef = await makeClient(stub.fetch)
      .workspace("acme")
      .smtpForwardDestinations()
      .getByRef("forwarding");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/smtp-forward-destinations/ref/forwarding");
    expect(byRef.id).toBe("f1");
  });

  it("confirms with a token at the account-level path", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: confirmationJson }));
    const client = makeClient(stub.fetch).workspace("acme").smtpForwardDestinations();

    const result = await client.confirm({ token: "x".repeat(40) });
    expect(result.verified).toBe(true);
    expect(pathOf(stub.calls[0])).toBe("/v2/smtp-forward-destination-verifications/confirm");

    await expect(client.confirm({ token: "short" })).rejects.toThrow("between 40 and 128");
  });

  it("sends a verification email", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: destinationJson }));
    const destination = await makeClient(stub.fetch)
      .workspace("acme")
      .smtpForwardDestinations()
      .get("f1");
    await destination.sendVerification();
    expect(pathOf(stub.calls[1])).toBe(
      "/v2/tenants/acme/smtp-forward-destinations/f1/send-verification",
    );
    expect(stub.calls[1]?.method).toBe("POST");
  });
});
