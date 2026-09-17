/**
 * Fetch stub shared by the client tests.
 *
 * @internal
 */

import type { FetchLike } from "../client.js";

/** A captured request. @internal */
export interface CapturedRequest {
  /** The absolute request URL. */
  readonly url: string;
  /** The HTTP method. */
  readonly method: string;
  /** The request headers. */
  readonly headers: Record<string, string>;
  /** The serialized request body, when present. */
  readonly body: string | undefined;
}

/** A canned response. @internal */
export interface StubResponse {
  /** The HTTP status. Defaults to 200. */
  readonly status?: number;
  /** The response body. */
  readonly body?: string;
  /** The response headers. */
  readonly headers?: Record<string, string>;
}

/** Produces a response for a captured request and its 1-based call index. @internal */
export type Responder = (request: CapturedRequest, call: number) => StubResponse;

/** A fetch stub and the requests it captured. @internal */
export interface FetchStub {
  /** The `fetch` implementation to inject. */
  readonly fetch: FetchLike;
  /** Captured requests, in order. */
  readonly calls: CapturedRequest[];
}

/** Creates a deterministic `fetch` stub. @internal */
export function createFetchStub(responder: Responder): FetchStub {
  const calls: CapturedRequest[] = [];
  const fetchImpl: FetchLike = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    const headers: Record<string, string> = {};
    const rawHeaders = init?.headers;
    if (rawHeaders !== undefined) {
      if (rawHeaders instanceof Headers) {
        rawHeaders.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(rawHeaders)) {
        for (const entry of rawHeaders) {
          const [key, value] = entry;
          if (key !== undefined && value !== undefined) {
            headers[key] = value;
          }
        }
      } else {
        for (const [key, value] of Object.entries(rawHeaders)) {
          if (typeof value === "string") {
            headers[key] = value;
          }
        }
      }
    }
    const request: CapturedRequest = {
      url,
      method: init?.method ?? "GET",
      headers,
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(request);
    const response = responder(request, calls.length);
    return new Response(response.body ?? null, {
      status: response.status ?? 200,
      headers: response.headers ?? {},
    });
  };
  return { fetch: fetchImpl, calls };
}

/** Extracts the pathname of a captured request. @internal */
export function pathOf(call: CapturedRequest | undefined): string {
  if (call === undefined) {
    throw new Error("no request was captured");
  }
  return new URL(call.url).pathname;
}

/** Extracts the query string of a captured request. @internal */
export function queryOf(call: CapturedRequest | undefined): URLSearchParams {
  if (call === undefined) {
    throw new Error("no request was captured");
  }
  return new URL(call.url).searchParams;
}
