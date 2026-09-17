/**
 * Query construction helpers for the typed list options.
 */

import type { QueryValues } from "./client.js";

/**
 * The minimum length the control plane accepts for a search term.
 *
 * @public
 */
export const MIN_SEARCH_LENGTH = 3;

/**
 * Trims and validates a search term.
 *
 * A blank term is ignored; a non-blank term shorter than
 * {@link MIN_SEARCH_LENGTH} is rejected locally, because the control plane
 * answers such queries with an opaque `400`.
 *
 * @param value - The raw search term.
 * @returns The trimmed term, or `undefined` when it is blank.
 * @throws `Error` When the trimmed term is shorter than {@link MIN_SEARCH_LENGTH}.
 *
 * @internal
 */
export function normalizeSearch(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }
  if (trimmed.length < MIN_SEARCH_LENGTH) {
    throw new Error(`admin: search must be at least ${MIN_SEARCH_LENGTH} characters`);
  }
  return trimmed;
}

/**
 * Validates a page size, which the control plane bounds to `1..500`.
 *
 * @param value - The requested page size.
 * @returns The page size, or `undefined` when unset.
 * @throws `Error` When the page size is outside `1..500`.
 *
 * @internal
 */
export function normalizePageSize(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error("admin: pageSize must be between 1 and 500");
  }
  return value;
}

/**
 * Drops unset entries from a query object.
 *
 * `false` and `0` are preserved; only `undefined` and `null` are removed.
 *
 * @param entries - The candidate query entries.
 * @returns The compacted query values.
 *
 * @internal
 */
export function compactQuery(
  entries: Record<string, string | number | boolean | undefined | null>,
): QueryValues {
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Builds a list query from the shared pagination options and family filters.
 *
 * @param options - The pagination and signal options.
 * @param filters - The family-specific, wire-named filters.
 * @returns The compacted query values.
 *
 * @internal
 */
export function listQuery(
  options: { readonly pageSize?: number; readonly pageToken?: string },
  filters: Record<string, string | number | boolean | undefined | null> = {},
): QueryValues {
  return compactQuery({
    ...filters,
    page_size: normalizePageSize(options.pageSize),
    page_token: options.pageToken,
  });
}
