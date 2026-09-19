/**
 * Tenant quota operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { fromWire, isRecord } from "../internal/serde.js";
import type { TenantQuota } from "../models/quotas.js";

/** Rebuilds a tenant quota, preserving the free-form over-limit map keys. @internal */
function decodeTenantQuota(raw: unknown): TenantQuota {
  if (!isRecord(raw)) {
    throw new Error("admin: decode tenant quota");
  }
  const { over_limit: overLimitWire, ...rest } = raw;
  const decoded = fromWire(rest) as Omit<TenantQuota, "overLimit">;
  const overLimit: Record<string, boolean> = {};
  if (isRecord(overLimitWire)) {
    for (const [key, value] of Object.entries(overLimitWire)) {
      if (typeof value === "boolean") {
        overLimit[key] = value;
      }
    }
  }
  return { ...decoded, overLimit };
}

/** Construction options for a {@link QuotasClient}. @public */
export interface QuotasClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose quota state is read. */
  readonly tenantSlug: string;
}

/**
 * Tenant quota operations.
 *
 * @public
 */
export class QuotasClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: QuotasClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Reads the effective tenant quota state, usage, and over-limit flags.
   *
   * @param options - Optional cancellation signal.
   * @returns The effective quota state.
   * @throws `NotFoundException` When the tenant is not visible.
   *
   * @public
   */
  async get(options?: RequestOptions): Promise<TenantQuota> {
    const path = `/tenants/${this.#tenantSlug}/quotas`;
    const response = await this.#client.get(path, undefined, options);
    return decodeTenantQuota(response.asRaw<unknown>());
  }
}
