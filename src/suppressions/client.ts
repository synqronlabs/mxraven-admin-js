/**
 * Tenant suppression collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type { ListOptions } from "../list.js";
import type {
  CreateTenantSuppressionRequest,
  SuppressionReason,
  TenantSuppressionData,
} from "../models/suppressions.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { TenantSuppression } from "./entity.js";

/** Construction options for a {@link SuppressionsClient}. @public */
export interface SuppressionsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose suppressions are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link SuppressionsClient.list}.
 *
 * @public
 */
export interface ListSuppressionsOptions extends ListOptions {
  /** Case-insensitive search across the suppressed address. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single suppression reason. */
  readonly reason?: SuppressionReason;
}

/**
 * Tenant suppression collection.
 *
 * @public
 */
export class SuppressionsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: SuppressionsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists suppressions with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of suppressions.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListSuppressionsOptions = {}): Promise<Paged<TenantSuppression>> {
    const path = this.#path();
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      reason: options.reason,
    });
    const paged = await this.#client.paged<TenantSuppressionData>(path, query, options);
    return paged.map(
      (data) =>
        new TenantSuppression({
          client: this.#client,
          path: `${path}/${encodeURIComponent(data.emailAddress)}`,
          data,
        }),
    );
  }

  /**
   * Gets a suppression by recipient address.
   *
   * @param emailAddress - The suppressed address.
   * @param options - Optional cancellation signal.
   * @returns The hydrated suppression.
   * @throws `NotFoundException` When the suppression is not visible.
   *
   * @public
   */
  async get(emailAddress: string, options?: RequestOptions): Promise<TenantSuppression> {
    const path = `${this.#path()}/${encodeURIComponent(emailAddress)}`;
    const data = (await this.#client.get(path, undefined, options)).as<TenantSuppressionData>();
    return new TenantSuppression({ client: this.#client, path, data });
  }

  /**
   * Creates a suppression.
   *
   * @param request - The address to suppress and, optionally, the reason.
   * @param options - Optional cancellation signal.
   * @returns The created suppression.
   * @throws `ConflictException` When the address is already suppressed.
   *
   * @public
   */
  async create(
    request: CreateTenantSuppressionRequest,
    options?: RequestOptions,
  ): Promise<TenantSuppression> {
    const path = this.#path();
    const data = (await this.#client.post(path, request, options)).as<TenantSuppressionData>();
    return new TenantSuppression({
      client: this.#client,
      path: `${path}/${encodeURIComponent(data.emailAddress)}`,
      data,
    });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/suppressions`;
  }
}
