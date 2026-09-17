/**
 * Public tenant authentication-context operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type { TenantLoginContext } from "../models/tenant.js";

/** Construction options for an {@link AuthClient}. @public */
export interface AuthClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
}

/**
 * Public authentication-context operations under `/v2/auth`.
 *
 * These calls are unauthenticated and work with a blank token.
 *
 * @public
 */
export class AuthClient {
  readonly #client: AdminClient;

  /**
   * @param options - The underlying admin client.
   *
   * @public
   */
  constructor(options: AuthClientOptions) {
    this.#client = options.client;
  }

  /**
   * Resolves the public login context for a tenant.
   *
   * Unknown, unavailable, suspended, deleted, and unprovisioned tenants all
   * return the same not-found problem. The tenant path segment is URL-encoded.
   *
   * @param tenantSlug - The tenant slug to resolve.
   * @param options - Optional cancellation signal.
   * @returns The resolved tenant login context.
   * @throws `NotFoundException` When the tenant cannot be resolved.
   *
   * @public
   */
  async loginContext(tenantSlug: string, options?: RequestOptions): Promise<TenantLoginContext> {
    const path = `/auth/tenants/${encodeURIComponent(tenantSlug)}/login-context`;
    return (await this.#client.get(path, undefined, options)).as<TenantLoginContext>();
  }
}
