import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf, queryOf } from "../internal/test-support.js";

const BASE = "https://api.test";
const deps =
  '{"forward":["billing-dest"],"relay":[],"storage":[],"endpoint":[],"template":[],"pool":[],"sets":[]}';

function revisionJson(revision = 1, status = "draft"): string {
  return (
    `{"id":"rev${revision}","listener_id":"l1","revision":${revision},"status":"${status}",` +
    '"publishable":true,"source":"function handle(mail, mx) end",' +
    `"source_sha256":"${"a".repeat(64)}","schema_version":"mxraven/mail/v1",` +
    `"dependencies":${deps},"diagnostics":[],"created_by":"me",` +
    '"created_at":"2026-01-01T00:00:00Z"}'
  );
}

const scriptJson =
  '{"listener_id":"l1","listener_type":"submission","body_access":false,"published":' +
  revisionJson(1, "published") +
  "}";
const exportJson =
  '{"listener_id":"l1","revision":1,"source":"function handle(mail, mx) end",' +
  `"dependencies":${deps}}`;
const simulationJson =
  '{"revision":1,"terminal":{"kind":"deliver.shared"},"default_applied":false,' +
  '"intents":[{"kind":"header.set","header":"X-Test","value":"1"}],"skipped":[],"log":["ok"],' +
  '"http_calls":[],"trace":[{"op":"handle"}],"duration_us":42}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("RoutingScriptsClient", () => {
  it("reads the listener script from the workspace accessor", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: scriptJson }));
    const script = await makeClient(stub.fetch).workspace("acme").routingScripts("l1").get();

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script");
    expect(script.listenerId).toBe("l1");
    expect(script.bodyAccess).toBe(false);
    expect(script.published?.revision).toBe(1);
    expect(script.published?.dependencies.forward).toEqual(["billing-dest"]);
  });

  it("creates a draft with a snake_case body", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: revisionJson() }));
    const revision = await makeClient(stub.fetch)
      .workspace("acme")
      .routingScripts("l1")
      .createRevision("function handle(mail, mx) end");

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script/revisions");
    expect(stub.calls[0]?.method).toBe("POST");
    expect(stub.calls[0]?.body).toBe('{"source":"function handle(mail, mx) end"}');
    expect(revision.status).toBe("draft");
    expect(revision.publishable).toBe(true);
  });

  it("rejects blank source before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: revisionJson() }));
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");

    await expect(scripts.createRevision("   ")).rejects.toThrow("source is required");
    await expect(scripts.getRevision(0)).rejects.toThrow("positive integer");
    await expect(scripts.publish(-1)).rejects.toThrow("positive integer");
    expect(stub.calls).toHaveLength(0);
  });

  it("lists and reads revisions", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("page_token=")) {
        return { status: 200, body: "[]" };
      }
      if (request.url.includes("/revisions") && !request.url.includes("/revisions/")) {
        return {
          status: 200,
          body: `[${revisionJson()}]`,
          headers: { "X-Next-Page-Token": "next" },
        };
      }
      return { status: 200, body: revisionJson(2, "published") };
    });
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");

    const page = await scripts.listRevisions({ pageSize: 10 });
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script/revisions");
    expect(queryOf(stub.calls[0]).get("page_size")).toBe("10");
    expect(page.firstPage.nextPageToken).toBe("next");
    expect(page.firstPage.items.map((r) => r.revision)).toEqual([1]);

    const revision = await scripts.getRevision(2);
    expect(pathOf(stub.calls.at(-1))).toBe("/v2/tenants/acme/listeners/l1/script/revisions/2");
    expect(revision.status).toBe("published");
  });

  it("simulates a revision with stubs and recipient sets", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: simulationJson }));
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");
    const result = await scripts.simulate(1, {
      fixture: {
        mailFrom: "from@example.com",
        rcptTo: ["to@example.com"],
        headers: [{ name: "X-Test", value: "1" }],
        bodyHtml: "<p>Hello</p>",
        attachments: [
          { filename: "invoice.pdf", contentType: "application/pdf", sizeBytes: 10, inline: false },
        ],
      },
      httpStubs: [
        { endpoint: "billing-hook", status: 200, body: "{}", headers: { "X-Trace": "1" } },
      ],
      recipientSets: { "VIP Set": ["vip@example.com"] },
    });

    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script/revisions/1/simulate");
    expect(stub.calls[0]?.method).toBe("POST");
    expect(JSON.parse(stub.calls[0]?.body ?? "{}")).toEqual({
      fixture: {
        mail_from: "from@example.com",
        rcpt_to: ["to@example.com"],
        headers: [{ name: "X-Test", value: "1" }],
        body_html: "<p>Hello</p>",
        attachments: [
          {
            filename: "invoice.pdf",
            content_type: "application/pdf",
            size_bytes: 10,
            inline: false,
          },
        ],
      },
      http_stubs: [
        { endpoint: "billing-hook", status: 200, body: "{}", headers: { "X-Trace": "1" } },
      ],
      recipient_sets: { "VIP Set": ["vip@example.com"] },
    });
    expect(result.terminal.kind).toBe("deliver.shared");
    expect(result.intents[0]?.header).toBe("X-Test");
    expect(result.durationUs).toBe(42);
  });

  it("rejects an oversized stubs list before sending", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: simulationJson }));
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");
    await expect(
      scripts.simulate(1, {
        httpStubs: [{ endpoint: "a" }, { endpoint: "b" }, { endpoint: "c" }],
      }),
    ).rejects.toThrow("2 entries or fewer");
    expect(stub.calls).toHaveLength(0);
  });

  it("unpublishes the script", async () => {
    const stub = createFetchStub(() => ({
      status: 200,
      body: scriptJson.replace(/,"published":.*\}$/, "}"),
    }));
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");

    const script = await scripts.delete();
    expect(stub.calls[0]?.method).toBe("DELETE");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script");
    expect(script.published).toBeUndefined();
  });

  it("publishes, rolls back, exports, and toggles body access", async () => {
    const stub = createFetchStub((request) => {
      if (request.url.includes("/export")) {
        return { status: 200, body: exportJson };
      }
      if (request.url.includes("/body-access")) {
        return {
          status: 200,
          body: scriptJson.replace('"body_access":false', '"body_access":true'),
        };
      }
      return { status: 200, body: scriptJson };
    });
    const scripts = makeClient(stub.fetch).workspace("acme").routingScripts("l1");

    await scripts.publish(1);
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/listeners/l1/script/revisions/1/publish");
    expect(stub.calls[0]?.method).toBe("POST");

    await scripts.rollback(1);
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/listeners/l1/script/rollback");
    expect(stub.calls[1]?.body).toBe('{"revision":1}');

    const exported = await scripts.export();
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/listeners/l1/script/export");
    expect(exported.revision).toBe(1);

    const updated = await scripts.setBodyAccess(true);
    expect(pathOf(stub.calls[3])).toBe("/v2/tenants/acme/listeners/l1/script/body-access");
    expect(stub.calls[3]?.method).toBe("PUT");
    expect(stub.calls[3]?.body).toBe('{"enabled":true}');
    expect(updated.bodyAccess).toBe(true);
  });
});
