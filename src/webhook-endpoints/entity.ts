/**
 * The hydrated webhook-endpoint entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import { validateWebhookFields } from "../internal/validate.js";
import type {
  IssuedWebhookEndpoint,
  UpdateWebhookEndpointRequest,
  WebhookEndpointData,
} from "../models/webhooks.js";
import { WebhookDeliveriesClient } from "./client.js";

/**
 * A webhook endpoint.
 *
 * @public
 */
export class WebhookEndpoint extends Entity<WebhookEndpointData> {
  /** Endpoint identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable webhook reference. @public */
  get webhookRef(): string {
    return this.data.webhookRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** The HTTPS target URL. @public */
  get targetUrl(): string {
    return this.data.targetUrl;
  }

  /** The signing key identifier. @public */
  get signingKid(): string {
    return this.data.signingKid;
  }

  /** Whether a signing secret is stored. @public */
  get hasSigningSecret(): boolean {
    return this.data.hasSigningSecret;
  }

  /** Whether the endpoint is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /** Creation timestamp. @public */
  get createdAt(): string {
    return this.data.createdAt;
  }

  /** Last-update timestamp. @public */
  get updatedAt(): string {
    return this.data.updatedAt;
  }

  /**
   * Re-fetches this endpoint.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the endpoint is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<WebhookEndpoint> {
    const data = (await this.client.get(this.path, undefined, options)).as<WebhookEndpointData>();
    return new WebhookEndpoint({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces the endpoint name and target URL.
   *
   * @param request - The new name and target URL.
   * @param options - Optional cancellation signal.
   * @returns The updated endpoint.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async update(
    request: UpdateWebhookEndpointRequest,
    options?: RequestOptions,
  ): Promise<WebhookEndpoint> {
    validateWebhookFields(request.displayName, request.targetUrl);
    const data = (await this.client.put(this.path, request, options)).as<WebhookEndpointData>();
    return new WebhookEndpoint({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Activates or deactivates the endpoint.
   *
   * @param isActive - Whether the endpoint should be active.
   * @param options - Optional cancellation signal.
   * @returns The updated endpoint.
   *
   * @public
   */
  async setActive(isActive: boolean, options?: RequestOptions): Promise<WebhookEndpoint> {
    const data = (
      await this.client.put(`${this.path}/active`, { isActive }, options)
    ).as<WebhookEndpointData>();
    return new WebhookEndpoint({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Rotates the endpoint signing secret.
   *
   * The response carries the new one-time secret; store it immediately.
   *
   * @param options - Optional cancellation signal.
   * @returns The endpoint with its new signing secret.
   *
   * @public
   */
  async rotateSecret(options?: RequestOptions): Promise<IssuedWebhookEndpoint> {
    return (
      await this.client.post(`${this.path}/rotate-secret`, undefined, options)
    ).as<IssuedWebhookEndpoint>();
  }

  /**
   * Accesses this endpoint's delivery history.
   *
   * @returns A client for delivery operations.
   *
   * @public
   */
  deliveries(): WebhookDeliveriesClient {
    return new WebhookDeliveriesClient({ client: this.client, path: `${this.path}/deliveries` });
  }
}
