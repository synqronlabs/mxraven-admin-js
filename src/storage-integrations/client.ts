/**
 * Tenant storage-integration collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { requireRef, validateStorageConfig } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  CreateStorageIntegrationRequest,
  StorageIntegrationData,
} from "../models/storage-integrations.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";
import { StorageIntegration } from "./entity.js";

/** Construction options for a {@link StorageIntegrationsClient}. @public */
export interface StorageIntegrationsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose integrations are accessed. */
  readonly tenantSlug: string;
}

/**
 * Tenant storage-integration collection.
 *
 * @public
 */
export class StorageIntegrationsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: StorageIntegrationsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists storage integrations.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of integrations.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListOptions = {}): Promise<Paged<StorageIntegration>> {
    const base = this.#path();
    const paged = await this.#client.paged<StorageIntegrationData>(
      base,
      listQuery(options),
      options,
    );
    return paged.map(
      (data) => new StorageIntegration({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a storage integration by identifier.
   *
   * @param integrationId - The integration identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated integration.
   * @throws `NotFoundException` When the integration is not visible.
   *
   * @public
   */
  async get(integrationId: string, options?: RequestOptions): Promise<StorageIntegration> {
    const path = `${this.#path()}/${encodeURIComponent(integrationId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<StorageIntegrationData>();
    return new StorageIntegration({ client: this.#client, path, data });
  }

  /**
   * Gets a storage integration by its immutable reference.
   *
   * @param storageRef - The storage reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated integration.
   * @throws `NotFoundException` When the integration is not visible.
   *
   * @public
   */
  async getByRef(storageRef: string, options?: RequestOptions): Promise<StorageIntegration> {
    const base = this.#path();
    const data = (
      await this.#client.get(`${base}/ref/${encodeURIComponent(storageRef)}`, undefined, options)
    ).as<StorageIntegrationData>();
    return new StorageIntegration({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Creates a storage integration.
   *
   * @param request - The reference, configuration, and credentials.
   * @param options - Optional cancellation signal.
   * @returns The created integration.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(
    request: CreateStorageIntegrationRequest,
    options?: RequestOptions,
  ): Promise<StorageIntegration> {
    requireRef(request.storageRef, "storage_ref");
    validateStorageConfig(request);
    const base = this.#path();
    const data = (await this.#client.post(base, request, options)).as<StorageIntegrationData>();
    return new StorageIntegration({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/storage-integrations`;
  }
}
