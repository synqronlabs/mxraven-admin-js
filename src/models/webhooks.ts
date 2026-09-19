/**
 * Webhook endpoint and delivery models.
 *
 * @packageDocumentation
 */

/**
 * The kind of webhook delivery.
 *
 * @public
 */
export const webhookDeliveryKind = {
  /** A message delivery webhook. */
  deliverWebhook: "deliver_webhook",
  /** A notification webhook. */
  notifyWebhook: "notify_webhook",
} as const;

/**
 * The kind of webhook delivery.
 *
 * @public
 */
export type WebhookDeliveryKind = (typeof webhookDeliveryKind)[keyof typeof webhookDeliveryKind];

/**
 * Wire representation of a webhook endpoint.
 *
 * @public
 */
export interface WebhookEndpointData {
  /** Endpoint identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable webhook reference. */
  readonly webhookRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** The HTTPS target URL. */
  readonly targetUrl: string;
  /** The signing key identifier. */
  readonly signingKid: string;
  /** Whether a signing secret is stored. */
  readonly hasSigningSecret: boolean;
  /** Whether the endpoint is active. */
  readonly isActive: boolean;
  /** Creation timestamp. */
  readonly createdAt: string;
  /** Last-update timestamp. */
  readonly updatedAt: string;
}

/**
 * A webhook endpoint returned with its one-time signing secret.
 *
 * The secret is returned only on creation and rotation. Store it immediately;
 * it is never returned by reads.
 *
 * @public
 */
export interface IssuedWebhookEndpoint extends WebhookEndpointData {
  /** The one-time plaintext signing secret. */
  readonly signingSecret: string;
}

/**
 * Wire representation of a webhook delivery attempt.
 *
 * Request content, response bodies, and raw upstream errors are not exposed.
 *
 * @public
 */
export interface WebhookDelivery {
  /** Delivery identifier. */
  readonly id: string;
  /** The originating task identifier. */
  readonly taskId: string;
  /** The listener that produced the task. */
  readonly listenerId: string;
  /** The kind of delivery. */
  readonly deliveryKind: WebhookDeliveryKind;
  /** The delivery outcome. */
  readonly outcome: string;
  /** The one-based attempt number. */
  readonly attempt: number;
  /** The upstream HTTP status code, when available. */
  readonly statusCode?: number | null;
  /** The target URL host. */
  readonly targetUrlHost: string;
  /** The signing key identifier. */
  readonly signingKid: string;
  /** When the delivery occurred. */
  readonly occurredAt: string;
}

/**
 * Request body for `POST /v2/tenants/{slug}/webhook-endpoints`.
 *
 * @public
 */
export interface CreateWebhookEndpointRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly webhookRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** The absolute HTTPS target URL. */
  readonly targetUrl: string;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/webhook-endpoints/{id}`.
 *
 * @public
 */
export interface UpdateWebhookEndpointRequest {
  /** Human-readable name. */
  readonly displayName: string;
  /** The absolute HTTPS target URL. */
  readonly targetUrl: string;
}
