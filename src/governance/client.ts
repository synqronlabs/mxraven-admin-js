/**
 * Tenant governance operations.
 */

import type { AdminClient } from "../client.js";
import { paginate } from "../internal/paginate.js";
import { fromWire, isRecord } from "../internal/serde.js";
import type { ListOptions } from "../list.js";
import type {
  AuditActorKind,
  AuditLog,
  AuditStatus,
  TenantDedicatedIPPool,
  TenantResourceSearchResult,
  TenantSearchResourceType,
} from "../models/governance.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizePageSize, normalizeSearch } from "../query.js";

/** Rebuilds an audit entry, preserving the free-form details keys. @internal */
function decodeAuditLog(item: unknown): AuditLog {
  if (!isRecord(item)) {
    throw new Error("admin: decode audit log");
  }
  const { details, ...rest } = item;
  const decoded = fromWire(rest) as Omit<AuditLog, "details">;
  return { ...decoded, details: isRecord(details) ? details : {} };
}

/** Construction options for a {@link GovernanceClient}. @public */
export interface GovernanceClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose governance data is accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link GovernanceClient.listAuditLog}.
 *
 * @public
 */
export interface ListAuditLogOptions extends ListOptions {
  /** Case-insensitive search. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single actor kind. */
  readonly actorKind?: AuditActorKind;
  /** Restrict to a single actor identifier. */
  readonly actorId?: string;
  /** Restrict to a single action. */
  readonly action?: string;
  /** Restrict to a single resource type. */
  readonly resourceType?: string;
  /** Restrict to a single outcome. */
  readonly status?: AuditStatus;
  /** Inclusive ISO-8601 lower bound on the creation timestamp. */
  readonly createdFrom?: string;
  /** Exclusive ISO-8601 upper bound on the creation timestamp. */
  readonly createdTo?: string;
}

/**
 * Options for {@link GovernanceClient.search}.
 *
 * @public
 */
export interface SearchResourcesOptions extends ListOptions {
  /** The search term. Required, and at least 3 characters. */
  readonly query: string;
  /** Restrict to these resource types; empty or omitted means all types. */
  readonly types?: readonly TenantSearchResourceType[];
}

/**
 * Tenant governance operations.
 *
 * @public
 */
export class GovernanceClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: GovernanceClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists audit-log entries with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of audit entries.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async listAuditLog(options: ListAuditLogOptions = {}): Promise<Paged<AuditLog>> {
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      actor_kind: options.actorKind,
      actor_id: options.actorId,
      action: options.action,
      resource_type: options.resourceType,
      status: options.status,
      created_from: options.createdFrom,
      created_to: options.createdTo,
    });
    return paginate<AuditLog>(
      this.#client,
      this.#tenantPath("/audit-log"),
      query,
      options,
      decodeAuditLog,
    );
  }

  /**
   * Lists tenant dedicated IP pools.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of pools.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  listDedicatedIPPools(options: ListOptions = {}): Promise<Paged<TenantDedicatedIPPool>> {
    return this.#client.paged<TenantDedicatedIPPool>(
      this.#tenantPath("/dedicated-ip-pools"),
      listQuery(options),
      options,
    );
  }

  /**
   * Searches tenant resources.
   *
   * @param options - The search term, optional types, pagination, and signal.
   * @returns A lazily paginating collection of search hits.
   * @throws `Error` When the query is missing or shorter than 3 characters.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  search(options: SearchResourcesOptions): Promise<Paged<TenantResourceSearchResult>> {
    const query = normalizeSearch(options.query);
    if (query === undefined) {
      throw new Error("admin: query is required");
    }
    const types =
      options.types === undefined || options.types.length === 0
        ? undefined
        : options.types.join(",");
    return this.#client.paged<TenantResourceSearchResult>(
      this.#tenantPath("/search"),
      listQuery(options, {
        q: query,
        types,
        page_size: normalizePageSize(options.pageSize),
      }),
      options,
    );
  }

  #tenantPath(suffix: string): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}${suffix}`;
  }
}
