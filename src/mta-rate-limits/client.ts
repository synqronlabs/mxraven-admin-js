/**
 * Tenant MTA rate-limit override operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import {
  assertMtaRateLimitStricter,
  type MTARateLimitOverride,
  type MTARateLimitPolicy,
  validateMtaRateLimitPolicy,
} from "../models/mta-rate-limits.js";

/** Construction options for an {@link MtaRateLimitsClient}. @public */
export interface MtaRateLimitsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose override is managed. */
  readonly tenantSlug: string;
}

/**
 * Tenant-level MTA rate-limit override operations.
 *
 * Listener-level overrides live on `Listener.mtaRateLimit()`.
 *
 * @public
 */
export class MtaRateLimitsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: MtaRateLimitsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Reads the effective tenant MTA rate-limit state.
   *
   * @param options - Optional cancellation signal.
   * @returns The override state, including inherited and effective limits.
   * @throws `NotFoundException` When the tenant is not visible.
   *
   * @public
   */
  get(options?: RequestOptions): Promise<MTARateLimitOverride> {
    return this.#client
      .get(this.#path(), undefined, options)
      .then((response) => response.as<MTARateLimitOverride>());
  }

  /**
   * Sets the tenant override.
   *
   * The current inherited limits are fetched first so the policy can be rejected
   * locally when it is looser than what it replaces.
   *
   * @param policy - The override policy; must be no looser than the inherited limits.
   * @param options - Optional cancellation signal.
   * @returns The updated override state.
   * @throws `Error` When the policy is invalid or looser than the inherited limits.
   *
   * @public
   */
  async put(policy: MTARateLimitPolicy, options?: RequestOptions): Promise<MTARateLimitOverride> {
    validateMtaRateLimitPolicy(policy);
    const current = await this.get(options);
    assertMtaRateLimitStricter(policy, current.inherited);
    return (await this.#client.put(this.#path(), policy, options)).as<MTARateLimitOverride>();
  }

  /**
   * Removes the tenant override so the tenant inherits again.
   *
   * @param options - Optional cancellation signal.
   *
   * @public
   */
  async delete(options?: RequestOptions): Promise<void> {
    await this.#client.delete(this.#path(), options);
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/mta-rate-limit-override`;
  }
}
