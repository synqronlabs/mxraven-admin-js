/**
 * Internal cursor-pagination plumbing.
 *
 * The public {@link AdminClient.paged} uses this without a decoder. Models that
 * contain free-form maps (whose keys are data and must not be case-converted)
 * call it with an explicit per-item decoder.
 *
 * @internal
 */

import type { AdminClient, QueryValues, RequestOptions } from "../client.js";
import { Page, Paged, type PageFetcher } from "../pagination.js";
import type { Response } from "../response.js";

/** Builds a page from a response's raw body, decoding each item explicitly. */
function decodePage<T>(response: Response, decode: (item: unknown) => T): Page<T> {
  const raw = response.rawBody;
  return new Page<T>({
    items: Array.isArray(raw) ? raw.map((item) => decode(item)) : [],
    nextPageToken: response.header("X-Next-Page-Token"),
    previousPageToken: response.header("X-Previous-Page-Token"),
    lastPageToken: response.header("X-Last-Page-Token"),
  });
}

/**
 * Issues a GET and wraps the response in a lazily auto-paginating {@link Paged}.
 *
 * @typeParam T - The element type.
 * @param client - The admin client that issues the requests.
 * @param path - A client-relative path; the API version is prepended.
 * @param query - Optional query parameters.
 * @param options - Optional cancellation signal.
 * @param decode - An optional per-item decoder for map-bearing models.
 * @returns A lazily paginating collection over the response items.
 *
 * @internal
 */
export async function paginate<T>(
  client: AdminClient,
  path: string,
  query: QueryValues | undefined,
  options: RequestOptions | undefined,
  decode?: (item: unknown) => T,
): Promise<Paged<T>> {
  const toPage = (response: Response): Page<T> =>
    decode === undefined ? response.pageOf<T>() : decodePage(response, decode);
  const fetchPage: PageFetcher<T> = async (cursor) => {
    const next = await client.get(path, { ...query, page_token: cursor }, options);
    return toPage(next).withFetcher(fetchPage);
  };
  const first = await client.get(path, query, options);
  return new Paged<T>({ firstPage: toPage(first).withFetcher(fetchPage), fetchPage });
}
