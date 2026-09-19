/**
 * The hydrated storage-integration entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import { validateStorageConfig } from "../internal/validate.js";
import type {
  StorageIntegrationData,
  UpdateStorageIntegrationRequest,
} from "../models/storage-integrations.js";

/**
 * A tenant object-storage integration.
 *
 * @public
 */
export class StorageIntegration extends Entity<StorageIntegrationData> {
  /** Integration identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable storage reference. @public */
  get storageRef(): string {
    return this.data.storageRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Whether the integration is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /** Whether credentials are stored. @public */
  get credentialsPresent(): boolean {
    return this.data.credentialsPresent;
  }

  /**
   * Re-fetches this integration.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the integration is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<StorageIntegration> {
    const data = (
      await this.client.get(this.path, undefined, options)
    ).as<StorageIntegrationData>();
    return new StorageIntegration({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces the integration configuration and credentials.
   *
   * @param request - The new configuration and credentials.
   * @param options - Optional cancellation signal.
   * @returns The updated integration.
   *
   * @public
   */
  async update(
    request: UpdateStorageIntegrationRequest,
    options?: RequestOptions,
  ): Promise<StorageIntegration> {
    validateStorageConfig(request);
    const data = (await this.client.put(this.path, request, options)).as<StorageIntegrationData>();
    return new StorageIntegration({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Activates or deactivates the integration.
   *
   * @param isActive - Whether the integration should be active.
   * @param options - Optional cancellation signal.
   * @returns The updated integration.
   *
   * @public
   */
  async setActive(isActive: boolean, options?: RequestOptions): Promise<StorageIntegration> {
    const data = (
      await this.client.put(`${this.path}/active`, { isActive }, options)
    ).as<StorageIntegrationData>();
    return new StorageIntegration({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }
}
