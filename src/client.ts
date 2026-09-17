/**
 * The mxRaven control-plane admin client.
 */

import { AuthClient } from "./auth/client.js";
import { apiExceptionFrom } from "./errors.js";
import { paginate } from "./internal/paginate.js";
import { fromWire, toWire } from "./internal/serde.js";
import type { Paged } from "./pagination.js";
import { defaultRateLimitConfig, type RateLimitConfig } from "./rate-limit.js";
import { Response } from "./response.js";
import { Workspace } from "./workspace.js";

/**
 * The subset of the global `fetch` signature the SDK uses.
 *
 * Injecting a transport lets runtimes and tests supply their own implementation.
 *
 * @public
 */
export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Awaited<ReturnType<typeof globalThis.fetch>>>;

type FetchResponse = Awaited<ReturnType<FetchLike>>;

/**
 * Options for an {@link AdminClient}.
 *
 * @public
 */
export interface AdminClientOptions {
  /** The control-plane base URL. Defaults to `https://api.mxraven.email`. */
  readonly baseUrl?: string;
  /** A ZITADEL-issued bearer access token. Omit for public operations only. */
  readonly token?: string;
  /** The API version prefix applied to every request path. Defaults to `v2`. */
  readonly apiVersion?: string;
  /** Client-wide rate-limit behaviour. Defaults to {@link defaultRateLimitConfig}. */
  readonly rateLimit?: RateLimitConfig;
  /** The `fetch` implementation to use. Defaults to the global `fetch`. */
  readonly fetch?: FetchLike;
  /** The request timeout in milliseconds. Defaults to 60000. */
  readonly timeoutMs?: number;
}

/**
 * Per-call options for a request.
 *
 * @public
 */
export interface RequestOptions {
  /** Cancels the request and any in-flight rate-limit backoff. */
  readonly signal?: AbortSignal;
}

/**
 * Query parameter values accepted by the low-level request methods.
 *
 * @public
 */
export type QueryValues = Readonly<Record<string, string | number | boolean | undefined>>;

const DEFAULT_TIMEOUT_MS = 60_000;

/** Normalizes an API version, falling back to the default when blank. @internal */
function normalizeApiVersion(value: string | undefined): string {
  if (value === undefined) {
    return AdminClient.defaultApiVersion;
  }
  const normalized = value.replace(/^\/+/, "").replace(/\/+$/, "");
  return normalized === "" ? AdminClient.defaultApiVersion : normalized;
}

/** Validates the rate-limit configuration, throwing on non-sensical values. @internal */
function assertRateLimit(config: RateLimitConfig): void {
  if (!Number.isInteger(config.maxRetries) || config.maxRetries < 0) {
    throw new Error("admin: rateLimit.maxRetries must not be negative");
  }
  if (!Number.isFinite(config.defaultBackoffMs) || config.defaultBackoffMs < 0) {
    throw new Error("admin: rateLimit.defaultBackoffMs must not be negative");
  }
  if (!Number.isFinite(config.maxBackoffMs) || config.maxBackoffMs < 0) {
    throw new Error("admin: rateLimit.maxBackoffMs must not be negative");
  }
}

/**
 * Parses a `Retry-After` header into milliseconds.
 *
 * Accepts both delta-seconds and an HTTP date. Returns `undefined` when the
 * value is missing or unusable.
 *
 * @param value - The raw header value.
 * @returns The delay in milliseconds, or `undefined`.
 *
 * @internal
 */
export function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  if (/^-?\d+$/.test(trimmed)) {
    const seconds = Number.parseInt(trimmed, 10);
    return seconds < 0 ? 0 : seconds * 1_000;
  }
  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }
  const delay = timestamp - Date.now();
  return delay < 0 ? 0 : delay;
}

/** Waits for a delay, rejecting when the caller's signal aborts. @internal */
function sleep(delayMs: number, signal: AbortSignal | undefined): Promise<void> {
  if (delayMs <= 0) {
    return signal?.aborted === true
      ? Promise.reject(signal.reason ?? new Error("admin: aborted"))
      : Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = (): void => {
      cleanup();
      reject(signal?.reason ?? new Error("admin: aborted"));
    };
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);
    if (signal?.aborted === true) {
      onAbort();
      return;
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Encodes query values into a URL suffix, or an empty string when there is none. @internal */
function encodeQuery(query: QueryValues | undefined): string {
  if (query === undefined) {
    return "";
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.append(key, String(value));
    }
  }
  const encoded = params.toString();
  return encoded === "" ? "" : `?${encoded}`;
}

/**
 * Parses a response body as JSON, returning `undefined` for an empty body.
 *
 * @internal
 */
function parseJson(text: string): unknown {
  if (text.trim() === "") {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("admin: decode response body", { cause: error });
  }
}

/**
 * Client for the mxRaven control-plane v2 REST API.
 *
 * Construct one with a ZITADEL-issued bearer access token, then reach resource
 * families through a {@link Workspace}. Public operations, such as the tenant
 * login context, work with a blank token.
 *
 * The client is safe for concurrent use. Every network operation accepts an
 * `AbortSignal` so callers can cancel it.
 *
 * @example
 * ```ts
 * const admin = new AdminClient({ token: process.env.MXRAVEN_TOKEN });
 * for await (const domain of admin.workspace("my-workspace").domains().list()) {
 *   console.log(domain.domainName, domain.status);
 * }
 * ```
 *
 * @public
 */
export class AdminClient {
  /** The default mxRaven control-plane base URL. */
  static readonly defaultBaseUrl = "https://api.mxraven.email";

  /** The default control-plane API version prefix. */
  static readonly defaultApiVersion = "v2";

  /** The control-plane base URL, without a trailing slash. */
  readonly baseUrl: string;

  /** The API version prefix applied to every request path. */
  readonly apiVersion: string;

  /** The client-wide rate-limit behaviour. */
  readonly rateLimit: RateLimitConfig;

  readonly #token: string;
  readonly #fetch: FetchLike;
  readonly #timeoutMs: number;

  /**
   * @param options - The base URL, token, API version, rate limit, and transport.
   * @throws `Error` When an option is invalid.
   *
   * @public
   */
  constructor(options: AdminClientOptions = {}) {
    const baseUrl = (options.baseUrl ?? AdminClient.defaultBaseUrl).trim().replace(/\/+$/, "");
    if (baseUrl === "") {
      throw new Error("admin: base URL is required");
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error(`admin: invalid timeoutMs ${timeoutMs}`);
    }

    const rateLimit = options.rateLimit ?? defaultRateLimitConfig;
    assertRateLimit(rateLimit);

    this.baseUrl = baseUrl;
    this.#token = options.token ?? "";
    this.apiVersion = normalizeApiVersion(options.apiVersion);
    this.rateLimit = rateLimit;
    this.#timeoutMs = timeoutMs;
    this.#fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  }

  /** The bearer token in use, or an empty string. @public */
  get token(): string {
    return this.#token;
  }

  /**
   * Binds a tenant. The returned {@link Workspace} exposes every tenant-scoped
   * resource family without repeating the slug.
   *
   * @param tenantSlug - The tenant slug to bind.
   * @returns A workspace bound to the given tenant.
   *
   * @public
   */
  workspace(tenantSlug: string): Workspace {
    return new Workspace({ client: this, slug: tenantSlug });
  }

  /**
   * The public tenant-context family. Works with a blank token.
   *
   * @returns A client for the public authentication family.
   *
   * @public
   */
  auth(): AuthClient {
    return new AuthClient({ client: this });
  }

  /**
   * Issues a GET request.
   *
   * @param path - A client-relative path; the API version is prepended.
   * @param query - Optional query parameters.
   * @param options - Optional cancellation signal.
   * @returns The decoded response.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  get(path: string, query?: QueryValues, options?: RequestOptions): Promise<Response> {
    return this.request("GET", path, query, undefined, options);
  }

  /**
   * Issues a POST request with a JSON body.
   *
   * @param path - A client-relative path; the API version is prepended.
   * @param body - The request body, serialized as JSON.
   * @param options - Optional cancellation signal.
   * @returns The decoded response.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  post(path: string, body: unknown, options?: RequestOptions): Promise<Response> {
    return this.request("POST", path, undefined, body, options);
  }

  /**
   * Issues a PUT request with a JSON body.
   *
   * @param path - A client-relative path; the API version is prepended.
   * @param body - The request body, serialized as JSON.
   * @param options - Optional cancellation signal.
   * @returns The decoded response.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  put(path: string, body: unknown, options?: RequestOptions): Promise<Response> {
    return this.request("PUT", path, undefined, body, options);
  }

  /**
   * Issues a DELETE request.
   *
   * @param path - A client-relative path; the API version is prepended.
   * @param options - Optional cancellation signal.
   * @returns The decoded response.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  delete(path: string, options?: RequestOptions): Promise<Response> {
    return this.request("DELETE", path, undefined, undefined, options);
  }

  /**
   * Sends a request to the control plane.
   *
   * A non-success status is decoded as an RFC 9457 problem and thrown as an
   * `ApiException`. `GET` and `DELETE` requests are retried on `429` according to
   * {@link AdminClient.rateLimit}; `POST` and `PUT` are not.
   *
   * @param method - The HTTP method.
   * @param path - A client-relative path; the API version is prepended.
   * @param query - Optional query parameters.
   * @param body - The request body, serialized as JSON, or `undefined` for none.
   * @param options - Optional cancellation signal.
   * @returns The decoded response.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async request(
    method: string,
    path: string,
    query?: QueryValues,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<Response> {
    const resolvedPath = this.#resolvePath(path);
    const url = `${this.baseUrl}${resolvedPath}${encodeQuery(query)}`;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.#token.trim() !== "") {
      headers.Authorization = `Bearer ${this.#token}`;
    }
    let payload: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(toWire(body));
    }

    const retryable = method.toUpperCase() === "GET" || method.toUpperCase() === "DELETE";
    let attempt = 0;
    for (;;) {
      const response = await this.#send(url, method, headers, payload, options);
      if (
        response.status === 429 &&
        retryable &&
        this.rateLimit.enabled &&
        attempt < this.rateLimit.maxRetries
      ) {
        attempt += 1;
        await sleep(this.#retryDelayMs(response.headers.get("Retry-After")), options.signal);
        continue;
      }

      const text = await response.text();
      const decoded = parseJson(text);
      const wire = decoded === undefined ? null : fromWire(decoded);
      if (response.status >= 400) {
        throw apiExceptionFrom({
          status: response.status,
          rawBody: text,
          body: wire,
          retryAfterMs: parseRetryAfter(response.headers.get("Retry-After")),
        });
      }
      return new Response({
        status: response.status,
        headers: response.headers,
        body: wire,
        rawBody: decoded ?? null,
      });
    }
  }

  /**
   * Issues a GET and wraps the response in a lazily auto-paginating
   * {@link Paged}. Subsequent pages are fetched by re-issuing the same request
   * with the next `page_token`, only as the async iterator advances.
   *
   * @typeParam T - The element type.
   * @param path - A client-relative path; the API version is prepended.
   * @param query - Optional query parameters.
   * @param options - Optional cancellation signal.
   * @returns A lazily paginating collection over the response items.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  paged<T>(path: string, query?: QueryValues, options?: RequestOptions): Promise<Paged<T>> {
    return paginate<T>(this, path, query, options);
  }

  /** Prepends the configured API version to a client-relative path. */
  #resolvePath(path: string): string {
    const prefix = `/${this.apiVersion}`;
    if (path === "" || path === "/") {
      return prefix;
    }
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return path;
    }
    return prefix + (path.startsWith("/") ? path : `/${path}`);
  }

  /** Computes the backoff delay for a rate-limited response. */
  #retryDelayMs(retryAfterHeader: string | null): number {
    const parsed = parseRetryAfter(retryAfterHeader);
    let delay = parsed ?? this.rateLimit.defaultBackoffMs;
    if (delay < 0) {
      delay = 0;
    }
    if (delay > this.rateLimit.maxBackoffMs) {
      delay = this.rateLimit.maxBackoffMs;
    }
    return delay;
  }

  /** Performs one `fetch`, applying the timeout and the caller's signal. */
  async #send(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: string | undefined,
    options: RequestOptions,
  ): Promise<FetchResponse> {
    if (options.signal?.aborted === true) {
      throw options.signal.reason ?? new Error("admin: aborted");
    }
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new Error("admin: request timed out")),
      this.#timeoutMs,
    );

    const signal = options.signal;
    const onAbort = (): void => controller.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      return await this.#fetch(url, { method, headers, body, signal: controller.signal });
    } catch (error) {
      if (signal?.aborted === true) {
        throw signal.reason ?? error;
      }
      throw new Error(`admin: ${method} ${url}`, { cause: error });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }
}
