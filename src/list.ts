/**
 * Shared options for list endpoints.
 */

import type { RequestOptions } from "./client.js";

/**
 * Options common to every list endpoint.
 *
 * List endpoints accept a single options object with the filters they support,
 * rather than a nested fluent builder. Unsupported or unset filters are simply
 * omitted.
 *
 * @public
 */
export interface ListOptions extends RequestOptions {
  /** The maximum number of items to request per page, between 1 and 500. */
  readonly pageSize?: number;
  /** An opaque cursor to continue from a previously returned page. */
  readonly pageToken?: string;
}
