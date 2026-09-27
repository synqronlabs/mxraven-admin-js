import { describe, expect, it } from "vitest";

import { AdminClient, parseRetryAfter } from "./client.js";
import { RateLimitException, ValidationException } from "./errors.js";
import { createFetchStub, pathOf, queryOf } from "./internal/test-support.js";
import { defaultRateLimitConfig, disabledRateLimitConfig } from "./rate-limit.js";

const BASE = "https://api.test";

const domainJson =
  '{"id":"d1","tenant_id":"t1","domain_name":"example.com","verification_token":"tok",' +
  '"sending_enabled":true,"dkim_active_selector":"mxr1","spf_verified":false,' +
  '"dkim_verified":false,"dmarc_verified":false,"dmarc_report_address":null,' +
  '"dns_last_checked_at":null,"status":"pending"}';

const otherDomainJson =
  '{"id":"d2","tenant_id":"t1","domain_name":"other.example","verification_token":"tok2",' +
  '"sending_enabled":true,"dkim_active_selector":"mxr1","spf_verified":true,' +
  '"dkim_verified":true,"dmarc_verified":true,"status":"verified"}';

const problemJson =
  '{"type":"urn:mxraven:problem:validation_failed","title":"Validation failed",' +
  '"status":422,"code":"validation_failed","detail":"slug is invalid",' +
  '"trace_id":"0123456789abcdef0123456789abcdef",' +
  '"errors":[{"pointer":"/slug","code":"invalid_slug","detail":"bad slug"}]}';

const rateLimitedJson =
  '{"type":"urn:mxraven:problem:rate_limited","title":"Too Many Requests",' +
  '"status":429,"code":"rate_limited","detail":"the tenant operation rate limit was exceeded"}';

function makeClient(fetchImpl: ReturnType<typeof createFetchStub>["fetch"]): AdminClient {
  return new AdminClient({ baseUrl: BASE, token: "secret-token", fetch: fetchImpl });
}

describe("AdminClient", () => {
  it("sends the bearer token and parses pagination headers", async () => {
    const stub = createFetchStub(() => ({
      status: 200,
      body: `[${domainJson}]`,
      headers: { "X-Next-Page-Token": "next-token" },
    }));
    const page = await makeClient(stub.fetch).workspace("acme").domains().list();

    expect(stub.calls[0]?.headers.Authorization).toBe("Bearer secret-token");
    expect(stub.calls[0]?.method).toBe("GET");
    expect(pathOf(stub.calls[0])).toBe("/v2/tenants/acme/domains");
    expect(page.firstPage.items).toHaveLength(1);
    expect(page.firstPage.items[0]?.domainName).toBe("example.com");
    expect(page.firstPage.nextPageToken).toBe("next-token");
    expect(page.firstPage.previousPageToken).toBeUndefined();
  });

  it("fetches later pages lazily through the page token", async () => {
    const stub = createFetchStub((request) => {
      const token = new URL(request.url).searchParams.get("page_token");
      if (token === null) {
        return { status: 200, body: `[${domainJson}]`, headers: { "X-Next-Page-Token": "p2" } };
      }
      return { status: 200, body: `[${otherDomainJson}]` };
    });
    const paged = await makeClient(stub.fetch).workspace("acme").domains().list();

    expect(stub.calls).toHaveLength(1);
    const all = await paged.toArray();
    expect(all.map((domain) => domain.id)).toEqual(["d1", "d2"]);
    expect(queryOf(stub.calls[1]).get("page_token")).toBe("p2");
  });

  it("serializes requests as snake_case and omits unset optionals", async () => {
    const stub = createFetchStub(() => ({ status: 201, body: domainJson }));
    await makeClient(stub.fetch).workspace("acme").domains().create("example.com");

    expect(stub.calls[0]?.method).toBe("POST");
    const body = stub.calls[0]?.body ?? "";
    expect(body).toContain('"domain_name":"example.com"');
    expect(body).not.toContain("domainName");
    expect(body).not.toContain("dmarc_report_address");
  });

  it("sends an explicit null for required nullable fields", async () => {
    const stub = createFetchStub((request) =>
      request.method === "PUT"
        ? { status: 200, body: domainJson }
        : { status: 200, body: domainJson },
    );
    const domain = await makeClient(stub.fetch).workspace("acme").domains().get("d1");
    await domain.replace(null);

    const put = stub.calls.find((call) => call.method === "PUT");
    expect(put?.body).toBe('{"dmarc_report_address":null}');
  });

  it("parses an RFC 9457 problem into a typed exception", async () => {
    const stub = createFetchStub(() => ({ status: 422, body: problemJson }));
    const error = await makeClient(stub.fetch)
      .workspace("missing")
      .domains()
      .list()
      .then(
        () => undefined,
        (cause: unknown) => cause,
      );

    expect(error).toBeInstanceOf(ValidationException);
    if (!(error instanceof ValidationException)) {
      throw new Error("expected a ValidationException");
    }
    expect(error.status).toBe(422);
    expect(error.code).toBe("validation_failed");
    expect(error.detail).toBe("slug is invalid");
    expect(error.traceId).toBe("0123456789abcdef0123456789abcdef");
    expect(error.errors).toHaveLength(1);
    expect(error.errors[0]?.pointer).toBe("/slug");
    expect(error.errors[0]?.code).toBe("invalid_slug");
  });

  it("defaults to the production base URL and v2", () => {
    const client = new AdminClient({ token: "token" });
    expect(client.baseUrl).toBe("https://api.mxraven.email");
    expect(client.baseUrl).toBe(AdminClient.defaultBaseUrl);
    expect(client.apiVersion).toBe("v2");
    expect(client.apiVersion).toBe(AdminClient.defaultApiVersion);
  });

  it("prefixes the API version and leaves prefixed paths alone", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "{}" }));
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      apiVersion: "v3",
      fetch: stub.fetch,
    });
    await client.get("/tenants/acme");
    expect(pathOf(stub.calls[0])).toBe("/v3/tenants/acme");

    const defaulted = new AdminClient({ baseUrl: BASE, token: "t", fetch: stub.fetch });
    await defaulted.get("/v2/tenants/acme");
    await defaulted.get("tenants/acme");
    expect(pathOf(stub.calls[1])).toBe("/v2/tenants/acme");
    expect(pathOf(stub.calls[2])).toBe("/v2/tenants/acme");
  });

  it("encodes query values", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "[]" }));
    await makeClient(stub.fetch).get("/tenants/acme/domains", {
      q: "example.com",
      page_size: 50,
    });
    expect(queryOf(stub.calls[0]).get("q")).toBe("example.com");
    expect(queryOf(stub.calls[0]).get("page_size")).toBe("50");
  });

  it("omits the authorization header for a blank token", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "{}" }));
    const client = new AdminClient({ baseUrl: BASE, fetch: stub.fetch });
    await client.auth().loginContext("acme");
    expect(stub.calls[0]?.headers.Authorization).toBeUndefined();
    expect(pathOf(stub.calls[0])).toBe("/v2/auth/tenants/acme/login-context");
  });

  it("rejects an invalid configuration", () => {
    expect(() => new AdminClient({ baseUrl: "   " })).toThrow("base URL is required");
    expect(() => new AdminClient({ timeoutMs: 0 })).toThrow("timeoutMs");
    expect(
      () => new AdminClient({ rateLimit: { ...defaultRateLimitConfig, maxRetries: -1 } }),
    ).toThrow("maxRetries");
  });

  it("stops before sending when the signal is already aborted", async () => {
    const stub = createFetchStub(() => ({ status: 200, body: "{}" }));
    const controller = new AbortController();
    controller.abort(new Error("stop"));
    await expect(
      makeClient(stub.fetch).get("/x", undefined, { signal: controller.signal }),
    ).rejects.toThrow("stop");
    expect(stub.calls).toHaveLength(0);
  });
});

describe("AdminClient rate limiting", () => {
  it("retries a rate-limited GET and then succeeds", async () => {
    const stub = createFetchStub((_request, call) =>
      call === 1
        ? { status: 429, headers: { "Retry-After": "0" }, body: rateLimitedJson }
        : { status: 200, body: "{}" },
    );
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: stub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 2, defaultBackoffMs: 0 },
    });
    const response = await client.get("/limited-once");
    expect(response.status).toBe(200);
    expect(stub.calls).toHaveLength(2);
  });

  it("waits out a real backoff delay before retrying", async () => {
    const stub = createFetchStub((_request, call) =>
      call === 1 ? { status: 429, body: rateLimitedJson } : { status: 200, body: "{}" },
    );
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: stub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 1, defaultBackoffMs: 5 },
    });
    const response = await client.get("/limited-backoff");
    expect(response.status).toBe(200);
    expect(stub.calls).toHaveLength(2);
  });

  it("retries a rate-limited DELETE", async () => {
    const stub = createFetchStub((_request, call) =>
      call === 1
        ? { status: 429, headers: { "Retry-After": "0" }, body: rateLimitedJson }
        : { status: 204 },
    );
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: stub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 2, defaultBackoffMs: 0 },
    });
    const response = await client.delete("/limited-delete-once");
    expect(response.status).toBe(204);
    expect(stub.calls).toHaveLength(2);
  });

  it("throws after retries are exhausted", async () => {
    const stub = createFetchStub(() => ({
      status: 429,
      headers: { "Retry-After": "0" },
      body: rateLimitedJson,
    }));
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: stub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 1, defaultBackoffMs: 0 },
    });
    const error = await client.get("/always-exhausted").then(
      () => undefined,
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(RateLimitException);
    if (!(error instanceof RateLimitException)) {
      throw new Error("expected a RateLimitException");
    }
    expect(error.status).toBe(429);
    expect(error.code).toBe("rate_limited");
    expect(error.retryAfterMs).toBe(0);
    expect(stub.calls).toHaveLength(2);
  });

  it("surfaces a rate limit immediately when disabled", async () => {
    const stub = createFetchStub(() => ({
      status: 429,
      headers: { "Retry-After": "0" },
      body: rateLimitedJson,
    }));
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: stub.fetch,
      rateLimit: disabledRateLimitConfig,
    });
    await expect(client.get("/always-disabled")).rejects.toBeInstanceOf(RateLimitException);
    expect(stub.calls).toHaveLength(1);
  });

  it("never retries POST or PUT", async () => {
    const postStub = createFetchStub(() => ({
      status: 429,
      headers: { "Retry-After": "0" },
      body: rateLimitedJson,
    }));
    const client = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: postStub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 3, defaultBackoffMs: 0 },
    });
    await expect(client.post("/always-post", { x: 1 })).rejects.toBeInstanceOf(RateLimitException);
    expect(postStub.calls).toHaveLength(1);

    const putStub = createFetchStub(() => ({
      status: 429,
      headers: { "Retry-After": "0" },
      body: rateLimitedJson,
    }));
    const putClient = new AdminClient({
      baseUrl: BASE,
      token: "t",
      fetch: putStub.fetch,
      rateLimit: { ...defaultRateLimitConfig, maxRetries: 3, defaultBackoffMs: 0 },
    });
    await expect(putClient.put("/always-put", { x: 1 })).rejects.toBeInstanceOf(RateLimitException);
    expect(putStub.calls).toHaveLength(1);
  });

  it("parses Retry-After delta-seconds and HTTP dates", () => {
    expect(parseRetryAfter("5")).toBe(5_000);
    expect(parseRetryAfter("-3")).toBe(0);
    expect(parseRetryAfter("not-a-delay")).toBeUndefined();
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("   ")).toBeUndefined();

    const date = new Date(Date.now() + 30_000).toUTCString();
    const fromDate = parseRetryAfter(date) ?? 0;
    expect(fromDate).toBeGreaterThanOrEqual(25_000);
    expect(fromDate).toBeLessThanOrEqual(35_000);
  });
});
