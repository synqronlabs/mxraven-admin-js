/**
 * A successful control-plane HTTP response.
 */

import { Page } from "./pagination.js";

/** Construction options for a {@link Response}. @public */
export interface ResponseOptions {
  /** The HTTP status code. */
  readonly status: number;
  /** The response headers. */
  readonly headers: Headers;
  /** The decoded, camel-cased JSON body, or `null` when there was none. */
  readonly body: unknown;
  /** The decoded JSON body with its original wire keys, or `null`. */
  readonly rawBody?: unknown;
}

/**
 * A successful control-plane HTTP response with its status, headers, and decoded
 * JSON body.
 *
 * Error responses never surface here; {@link AdminClient} throws an
 * `ApiException` for any non-success status. This type is the escape hatch for
 * endpoints not yet wrapped by a typed client.
 *
 * The decoding helpers (`as`, `listOf`, `pageOf`) are unchecked views of the
 * parsed JSON. They assert a shape the caller knows from the API contract; no
 * runtime validation is performed.
 *
 * @public
 */
export class Response {
  /** The HTTP status code. */
  readonly status: number;

  /** The response headers. */
  readonly headers: Headers;

  /** The decoded, camel-cased JSON body, or `null` when there was none. */
  readonly body: unknown;

  /**
   * The decoded JSON body with its original wire keys.
   *
   * This is the escape hatch for models that contain free-form maps, whose keys
   * are data and therefore are not case-converted.
   *
   * @public
   */
  readonly rawBody: unknown;

  /**
   * @param options - The status, headers, decoded body, and raw body.
   *
   * @public
   */
  constructor(options: ResponseOptions) {
    this.status = options.status;
    this.headers = options.headers;
    this.body = options.body;
    this.rawBody = options.rawBody ?? options.body;
  }

  /**
   * The first value of a response header, case-insensitive.
   *
   * @param name - The header name.
   * @returns The first header value, or `undefined` when the header is absent.
   *
   * @public
   */
  header(name: string): string | undefined {
    return this.headers.get(name) ?? undefined;
  }

  /**
   * Views the body as a single decoded object.
   *
   * @typeParam T - The expected body type.
   * @returns The body cast to `T`, or `null` when the response had no body.
   *
   * @public
   */
  as<T>(): T {
    return this.body as T;
  }

  /**
   * Views the body as a single decoded object while keeping its original wire
   * keys.
   *
   * Use this only for models that contain free-form maps.
   *
   * @typeParam T - The expected body type.
   * @returns The raw body cast to `T`, or `null` when the response had no body.
   *
   * @public
   */
  asRaw<T>(): T {
    return this.rawBody as T;
  }

  /**
   * Views the body as a list of decoded objects.
   *
   * @typeParam T - The expected element type.
   * @returns The body cast to `T[]`, or an empty array when the body was absent.
   *
   * @public
   */
  listOf<T>(): T[] {
    return Array.isArray(this.body) ? (this.body as T[]) : [];
  }

  /**
   * Builds a page from the body and the standard
   * `X-Next-Page-Token`, `X-Previous-Page-Token`, and `X-Last-Page-Token`
   * headers.
   *
   * The returned page is plain data; use `AdminClient.paged` to walk every page
   * lazily.
   *
   * @typeParam T - The expected element type.
   * @returns A page built from this response.
   *
   * @public
   */
  pageOf<T>(): Page<T> {
    return new Page<T>({
      items: this.listOf<T>(),
      nextPageToken: this.header("X-Next-Page-Token"),
      previousPageToken: this.header("X-Previous-Page-Token"),
      lastPageToken: this.header("X-Last-Page-Token"),
    });
  }
}
