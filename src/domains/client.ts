/**
 * Tenant domain collection.
 */

import type { AdminClient, QueryValues, RequestOptions } from "../client.js";
import type { ListOptions } from "../list.js";
import type { CreateDomainRequest, DomainData, DomainStatus } from "../models/domains.js";
import type { Paged } from "../pagination.js";
import { compactQuery, normalizePageSize, normalizeSearch } from "../query.js";
import { Domain } from "./entity.js";

/** Construction options for a {@link DomainsClient}. @public */
export interface DomainsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose domains are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link DomainsClient.list}.
 *
 * Every filter is optional. Filters are combined with AND; results are ordered
 * by case-insensitive domain name.
 *
 * @public
 */
export interface ListDomainsOptions extends ListOptions {
  /** Case-insensitive search across the domain name. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single lifecycle status. */
  readonly status?: DomainStatus;
  /** Restrict to a required SPF verification state. */
  readonly spfVerified?: boolean;
  /** Restrict to a required DKIM verification state. */
  readonly dkimVerified?: boolean;
  /** Restrict to a required DMARC verification state. */
  readonly dmarcVerified?: boolean;
  /** Restrict to a required sending-enabled state. */
  readonly sendingEnabled?: boolean;
}

/** Builds the wire query for a domain list. @internal */
function domainQuery(options: ListDomainsOptions): QueryValues {
  return compactQuery({
    q: normalizeSearch(options.search),
    status: options.status,
    spf_verified: options.spfVerified,
    dkim_verified: options.dkimVerified,
    dmarc_verified: options.dmarcVerified,
    sending_enabled: options.sendingEnabled,
    page_size: normalizePageSize(options.pageSize),
    page_token: options.pageToken,
  });
}

/**
 * Tenant domain collection.
 *
 * Every read and creation returns a hydrated {@link Domain} entity whose
 * operations (`replace`, `delete`, `listenerGrants`) act on that domain.
 *
 * @example
 * ```ts
 * const paged = await ws.domains().list({ status: domainStatus.verified });
 * for await (const domain of paged) {
 *   console.log(domain.domainName);
 * }
 * ```
 *
 * @public
 */
export class DomainsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: DomainsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists domains with optional typed filters.
   *
   * The first page is fetched eagerly; remaining pages are fetched lazily as the
   * collection is iterated.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of domains.
   * @throws `Error` When a filter is invalid, such as a search term shorter than 3 characters.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListDomainsOptions = {}): Promise<Paged<Domain>> {
    const path = this.#path();
    const paged = await this.#client.paged<DomainData>(path, domainQuery(options), options);
    return paged.map(
      (data) => new Domain({ client: this.#client, path: `${path}/${data.id}`, data }),
    );
  }

  /**
   * Gets a domain by its identifier.
   *
   * @param domainId - The domain identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated domain.
   * @throws `NotFoundException` When the domain is not visible.
   *
   * @public
   */
  async get(domainId: string, options?: RequestOptions): Promise<Domain> {
    const path = `${this.#path()}/${encodeURIComponent(domainId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<DomainData>();
    return new Domain({ client: this.#client, path, data });
  }

  /**
   * Onboards a domain for outbound sending.
   *
   * @param domainName - The domain name to onboard.
   * @param dmarcReportAddress - Optional DMARC aggregate report mailbox.
   * @param options - Optional cancellation signal.
   * @returns The created domain.
   * @throws `ConflictException` When the domain already exists.
   *
   * @public
   */
  async create(
    domainName: string,
    dmarcReportAddress?: string,
    options?: RequestOptions,
  ): Promise<Domain> {
    const path = this.#path();
    const request: CreateDomainRequest = { domainName, dmarcReportAddress };
    const data = (await this.#client.post(path, request, options)).as<DomainData>();
    return new Domain({ client: this.#client, path: `${path}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/domains`;
  }
}
