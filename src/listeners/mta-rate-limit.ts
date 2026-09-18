/**
 * Listener MTA rate-limit override operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import {
  assertMtaRateLimitStricter,
  type MTARateLimitOverride,
  type MTARateLimitPolicy,
  validateMtaRateLimitPolicy,
} from "../models/mta-rate-limits.js";

/** Construction options for a {@link ListenerMtaRateLimitClient}. @public */
export interface ListenerMtaRateLimitClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative override path. */
  readonly path: string;
}

/**
 * MTA rate-limit override for a single MTA listener.
 *
 * @public
 */
export class ListenerMtaRateLimitClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and override path.
   *
   * @public
   */
  constructor(options: ListenerMtaRateLimitClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Reads the effective override state.
   *
   * @param options - Optional cancellation signal.
   * @returns The override state, including inherited and effective limits.
   *
   * @public
   */
  get(options?: RequestOptions): Promise<MTARateLimitOverride> {
    return this.#client
      .get(this.#path, undefined, options)
      .then((response) => response.as<MTARateLimitOverride>());
  }

  /**
   * Sets the listener override.
   *
   * The current inherited limits are fetched first so the policy can be rejected
   * locally when it is looser than what it replaces.
   *
   * @param policy - The override policy.
   * @param options - Optional cancellation signal.
   * @returns The updated override state.
   *
   * @public
   */
  async put(policy: MTARateLimitPolicy, options?: RequestOptions): Promise<MTARateLimitOverride> {
    validateMtaRateLimitPolicy(policy);
    const current = await this.get(options);
    assertMtaRateLimitStricter(policy, current.inherited);
    return (await this.#client.put(this.#path, policy, options)).as<MTARateLimitOverride>();
  }

  /**
   * Removes the listener override so it inherits again.
   *
   * @param options - Optional cancellation signal.
   *
   * @public
   */
  async delete(options?: RequestOptions): Promise<void> {
    await this.#client.delete(this.#path, options);
  }
}
