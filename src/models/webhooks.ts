/**
 * Webhook endpoint models.
 *
 * @packageDocumentation
 */

import {
  countCodePoints,
  requireAtMost,
  requireHeaderName,
  requireText,
} from "../internal/validate.js";

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
  /**
   * The header that carries the endpoint's stored credential on routing-script
   * `mx.http` calls, or `undefined` when the endpoint has none.
   *
   * The credential value is write-only and never returned.
   */
  readonly credentialHeader?: string;
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
 * Request body for `PUT /v2/tenants/{slug}/webhook-endpoints/{id}/credential`.
 *
 * The value is stored in Vault and never returned.
 *
 * @public
 */
export interface SetWebhookEndpointCredentialRequest {
  /**
   * `Authorization` (the default when omitted), or an `X-` header such as
   * `X-API-Key`. The `X-MxR-` and `X-MxRaven-` prefixes are refused.
   */
  readonly header?: string;
  /** The exact header value, such as `Bearer sk-123`. No line breaks. */
  readonly value: string;
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

/**
 * Validates a webhook endpoint credential request.
 *
 * @param request - The header and credential value.
 * @returns A normalized copy of the request.
 * @throws `Error` When the header or value fails local validation.
 *
 * @internal
 */
export function validateCredentialRequest(
  request: SetWebhookEndpointCredentialRequest,
): SetWebhookEndpointCredentialRequest {
  const value = requireAtMost(requireText(request.value, "value"), 4096, "value");
  if (value.includes("\r") || value.includes("\n")) {
    throw new Error("admin: value must not contain line breaks");
  }
  if (request.header === undefined) {
    return { header: "Authorization", value };
  }
  const header = requireAtMost(requireHeaderName(request.header, "header"), 100, "header");
  if (countCodePoints(header) === 0) {
    throw new Error("admin: header is required");
  }
  const lower = header.toLowerCase();
  if (lower !== "authorization" && !lower.startsWith("x-")) {
    throw new Error("admin: header must be Authorization or an X- header");
  }
  if (lower.startsWith("x-mxr-") || lower.startsWith("x-mxraven-")) {
    throw new Error("admin: header must not use mxRaven's reserved prefixes");
  }
  return { header, value };
}
