import { describe, expect, it } from "vitest";

import { AdminClient } from "../client.js";
import { createFetchStub, pathOf } from "../internal/test-support.js";
import { AutoReplyTemplate } from "./entity.js";

const BASE = "https://api.test";
const templateJson =
  '{"id":"art1","tenant_id":"t1","template_ref":"welcome","display_name":"Welcome",' +
  '"from_address":"noreply@example.com","is_active":false,' +
  '"content":{"subject":{"present":true,"length":2},"text_body":{"present":true,"length":4},' +
  '"html_body":{"present":false,"length":0},"header_count":0},' +
  '"sender_readiness":{"ready":true,"status":"ready"}}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "t", fetch: fetchImpl });
}

describe("AutoReplyTemplatesClient", () => {
  it("validates the request before sending", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: templateJson }));
    const client = makeClient(stub.fetch).workspace("acme").autoReplyTemplates();

    await expect(
      client.create({
        templateRef: "welcome",
        displayName: "Welcome",
        fromAddress: "noreply@example.com",
        subject: "Hi",
      }),
    ).rejects.toThrow("text_body or html_body is required");

    await expect(
      client.create({
        templateRef: "bad ref",
        displayName: "Welcome",
        fromAddress: "noreply@example.com",
        subject: "Hi",
        textBody: "Hi",
      }),
    ).rejects.toThrow("template_ref");

    await expect(
      client.create({
        templateRef: "welcome",
        displayName: "Welcome",
        fromAddress: "not-a-mailbox",
        subject: "Hi",
        textBody: "Hi",
      }),
    ).rejects.toThrow("valid mailbox");

    await expect(
      client.create({
        templateRef: "welcome",
        displayName: "Welcome",
        fromAddress: "noreply@example.com",
        subject: "line\r\nbreak",
        textBody: "Hi",
      }),
    ).rejects.toThrow("line breaks");

    expect(stub.calls).toHaveLength(0);
  });

  it("creates and gets by ref, rebinding to the id path", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: templateJson }));
    await makeClient(stub.fetch)
      .workspace("acme")
      .autoReplyTemplates()
      .create({
        templateRef: "welcome",
        displayName: "Welcome",
        fromAddress: "noreply@example.com",
        subject: "Hi",
        textBody: "Hello",
        headers: [{ name: "X-Test", value: "1" }],
      });
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/auto-reply-templates");
    expect(stub.calls[0]?.body).toBe(
      '{"template_ref":"welcome","display_name":"Welcome","from_address":"noreply@example.com",' +
        '"subject":"Hi","text_body":"Hello","headers":[{"name":"X-Test","value":"1"}]}',
    );

    const byRef = await makeClient(stub.fetch)
      .workspace("acme")
      .autoReplyTemplates()
      .getByRef("welcome");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme/auto-reply-templates/ref/welcome");
    expect(byRef.id).toBe("art1");
  });

  it("updates, activates, and reads the entity", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: templateJson }));
    const template = await makeClient(stub.fetch)
      .workspace("acme")
      .autoReplyTemplates()
      .get("art1");
    expect(template).toBeInstanceOf(AutoReplyTemplate);
    expect(template.senderReadiness.ready).toBe(true);

    await template.update({
      displayName: "Welcome",
      fromAddress: "noreply@example.com",
      subject: "Hi",
      textBody: "Hello",
      htmlBody: null,
      headers: [],
    });
    expect(stub.calls[1]?.body).toBe(
      '{"display_name":"Welcome","from_address":"noreply@example.com","subject":"Hi",' +
        '"text_body":"Hello","html_body":null,"headers":[]}',
    );

    await template.setActive(true);
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme/auto-reply-templates/art1/active");
    expect(stub.calls[2]?.body).toBe('{"is_active":true}');
  });
});
