/**
 * Tenant inbound-route collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type { ListOptions } from "../list.js";
import type { CreateInboundRouteRequest, InboundRouteData } from "../models/inbound-routes.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { InboundRoute } from "./entity.js";

/** Construction options for an {@link InboundRoutesClient}. @public */
export interface InboundRoutesClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose inbound routes are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link InboundRoutesClient.list}.
 *
 * @public
 */
export interface ListInboundRoutesOptions extends ListOptions {
  /** Case-insensitive search across the route. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single MTA listener. */
  readonly mtaListenerId?: string;
  /** Restrict to a single recipient domain. */
  readonly domainName?: string;
  /** Restrict to a required verification state. */
  readonly verified?: boolean;
}

/**
 * Tenant inbound-route collection.
 *
 * @public
 */
export class InboundRoutesClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: InboundRoutesClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists inbound routes with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of inbound routes.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListInboundRoutesOptions = {}): Promise<Paged<InboundRoute>> {
    const base = this.#path();
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      mta_listener_id: options.mtaListenerId,
      domain_name: options.domainName,
      is_verified: options.verified,
    });
    const paged = await this.#client.paged<InboundRouteData>(base, query, options);
    return paged.map(
      (data) => new InboundRoute({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets an inbound route by identifier.
   *
   * @param routeId - The route identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated route.
   * @throws `NotFoundException` When the route is not visible.
   *
   * @public
   */
  async get(routeId: string, options?: RequestOptions): Promise<InboundRoute> {
    const path = `${this.#path()}/${encodeURIComponent(routeId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<InboundRouteData>();
    return new InboundRoute({ client: this.#client, path, data });
  }

  /**
   * Creates an inbound route.
   *
   * @param request - The MTA listener, recipient domain, and onboarding flag.
   * @param options - Optional cancellation signal.
   * @returns The created route.
   * @throws `ConflictException` When the route already exists.
   *
   * @public
   */
  async create(
    request: CreateInboundRouteRequest,
    options?: RequestOptions,
  ): Promise<InboundRoute> {
    const base = this.#path();
    const data = (await this.#client.post(base, request, options)).as<InboundRouteData>();
    return new InboundRoute({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/inbound-routes`;
  }
}
