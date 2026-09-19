/**
 * Tenant webhook-endpoint collection and delivery history.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { requireRef, validateWebhookFields } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  CreateWebhookEndpointRequest,
  IssuedWebhookEndpoint,
  WebhookDelivery,
  WebhookEndpointData,
} from "../models/webhooks.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";
import { WebhookEndpoint } from "./entity.js";

/** Construction options for a {@link WebhookEndpointsClient}. @public */
export interface WebhookEndpointsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose endpoints are accessed. */
  readonly tenantSlug: string;
}

/**
 * Tenant webhook-endpoint collection.
 *
 * @public
 */
export class WebhookEndpointsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: WebhookEndpointsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists webhook endpoints.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of endpoints.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListOptions = {}): Promise<Paged<WebhookEndpoint>> {
    const base = this.#path();
    const paged = await this.#client.paged<WebhookEndpointData>(base, listQuery(options), options);
    return paged.map(
      (data) => new WebhookEndpoint({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a webhook endpoint by identifier.
   *
   * @param endpointId - The endpoint identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated endpoint.
   * @throws `NotFoundException` When the endpoint is not visible.
   *
   * @public
   */
  async get(endpointId: string, options?: RequestOptions): Promise<WebhookEndpoint> {
    const path = `${this.#path()}/${encodeURIComponent(endpointId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<WebhookEndpointData>();
    return new WebhookEndpoint({ client: this.#client, path, data });
  }

  /**
   * Gets a webhook endpoint by its immutable reference.
   *
   * @param webhookRef - The webhook reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated endpoint.
   * @throws `NotFoundException` When the endpoint is not visible.
   *
   * @public
   */
  async getByRef(webhookRef: string, options?: RequestOptions): Promise<WebhookEndpoint> {
    const base = this.#path();
    const data = (
      await this.#client.get(`${base}/ref/${encodeURIComponent(webhookRef)}`, undefined, options)
    ).as<WebhookEndpointData>();
    return new WebhookEndpoint({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Creates a webhook endpoint.
   *
   * The response carries the one-time signing secret; store it immediately.
   *
   * @param request - The reference, name, and target URL.
   * @param options - Optional cancellation signal.
   * @returns The issued endpoint, including its signing secret.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(
    request: CreateWebhookEndpointRequest,
    options?: RequestOptions,
  ): Promise<IssuedWebhookEndpoint> {
    requireRef(request.webhookRef, "webhook_ref");
    validateWebhookFields(request.displayName, request.targetUrl);
    return (await this.#client.post(this.#path(), request, options)).as<IssuedWebhookEndpoint>();
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/webhook-endpoints`;
  }
}

/** Construction options for a {@link WebhookDeliveriesClient}. @public */
export interface WebhookDeliveriesClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative deliveries path. */
  readonly path: string;
}

/**
 * Delivery history for a single webhook endpoint.
 *
 * @public
 */
export class WebhookDeliveriesClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and deliveries path.
   *
   * @public
   */
  constructor(options: WebhookDeliveriesClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Lists delivery attempts.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of deliveries.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListOptions = {}): Promise<Paged<WebhookDelivery>> {
    return this.#client.paged<WebhookDelivery>(this.#path, listQuery(options), options);
  }
}
