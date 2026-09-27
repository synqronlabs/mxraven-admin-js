import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { StorageIntegration } from "./entity.js";

const BASE = "https://api.test";
const integrationJson =
  '{"id":"s1","tenant_id":"t1","storage_ref":"archive","display_name":"Archive",' +
  '"is_active":true,"credentials_present":true}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

const valid = {
  storageRef: "archive",
  displayName: "Archive",
  accessKey: "key",
  secretKey: "secret",
  bucketName: "bucket",
  region: "us-east-1",
  endpointUrl: "",
};

describe("StorageIntegrationsClient", () => {
  it("validates the endpoint URL before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: integrationJson }));
    const client = makeClient(stub.fetch).workspace("acme").storageIntegrations();

    await expect(client.create({ ...valid, endpointUrl: "ftp://x" })).rejects.toThrow(
      "must use http or https",
    );
    await expect(client.create({ ...valid, endpointUrl: "https://x?y" })).rejects.toThrow(
      "query or fragment",
    );
    await expect(client.create({ ...valid, storageRef: "bad ref" })).rejects.toThrow("storage_ref");
    expect(stub.calls).toHaveLength(0);
  });

  it("creates with an empty endpoint url for AWS", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: integrationJson }));
    const created = await makeClient(stub.fetch)
      .workspace("acme")
      .storageIntegrations()
      .create(valid);
    expect(created).toBeInstanceOf(StorageIntegration);
    expect(stub.calls[0]?.body).toBe(
      '{"storage_ref":"archive","display_name":"Archive","access_key":"key",' +
        '"secret_key":"secret","bucket_name":"bucket","region":"us-east-1","endpoint_url":""}',
    );
  });

  it("rebinds getByRef and toggles active state", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: integrationJson }));
    const integration = await makeClient(stub.fetch)
      .workspace("acme")
      .storageIntegrations()
      .getByRef("archive");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/storage-integrations/ref/archive");
    expect(integration.id).toBe("s1");

    await integration.setActive(false);
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/storage-integrations/s1/active");
    expect(stub.calls[1]?.body).toBe('{"is_active":false}');
  });
});
