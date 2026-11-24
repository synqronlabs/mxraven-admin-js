/**
 * Workspace reputation, outbound pause, and abuse findings.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type { ListOptions } from "../list.js";
import type {
  TenantAbuseFindingSummary,
  TenantOutboundPause,
  TenantReputation,
} from "../models/abuse-control.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";

/** Construction options for an {@link AbuseControlClient}. @public */
export interface AbuseControlClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose deliverability state is accessed. */
  readonly tenantSlug: string;
}

/**
 * Read-only workspace reputation, outbound-pause, and abuse-finding state.
 *
 * These operations need `tenant.read`; internal evidence and operator
 * identities are redacted by the control plane.
 *
 * @public
 */
export class AbuseControlClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: AbuseControlClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Reads the workspace reputation state.
   *
   * @param options - Optional cancellation signal.
   * @returns The reputation state; a workspace without history scores `100`.
   * @throws `NotFoundException` When the tenant is not visible.
   *
   * @public
   */
  async reputation(options?: RequestOptions): Promise<TenantReputation> {
    return (
      await this.#client.get(this.#tenantPath("/reputation"), undefined, options)
    ).as<TenantReputation>();
  }

  /**
   * Reads the workspace outbound-pause state.
   *
   * @param options - Optional cancellation signal.
   * @returns Whether sending is paused and the redacted origin.
   * @throws `NotFoundException` When the tenant is not visible.
   *
   * @public
   */
  async outboundPause(options?: RequestOptions): Promise<TenantOutboundPause> {
    return (
      await this.#client.get(this.#tenantPath("/outbound-pause"), undefined, options)
    ).as<TenantOutboundPause>();
  }

  /**
   * Lists redacted abuse-finding summaries, newest first.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of finding summaries.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  listDeliverabilityFindings(options: ListOptions = {}): Promise<Paged<TenantAbuseFindingSummary>> {
    return this.#client.paged<TenantAbuseFindingSummary>(
      this.#tenantPath("/abuse-findings"),
      listQuery(options),
      options,
    );
  }

  #tenantPath(suffix: string): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}${suffix}`;
  }
}
