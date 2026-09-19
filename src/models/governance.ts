/**
 * Governance and audit-log models.
 *
 * @packageDocumentation
 */

import type { StreamType } from "./listeners.js";

/**
 * The kind of actor that produced an audit entry.
 *
 * @public
 */
export const auditActorKind = {
  /** A human user. */
  human: "human",
  /** A machine credential. */
  machine: "machine",
  /** The system itself. */
  system: "system",
} as const;

/**
 * The kind of actor that produced an audit entry.
 *
 * @public
 */
export type AuditActorKind = (typeof auditActorKind)[keyof typeof auditActorKind];

/**
 * The outcome of an audited action.
 *
 * @public
 */
export const auditStatus = {
  /** The action succeeded. */
  success: "success",
  /** The action failed. */
  failure: "failure",
} as const;

/**
 * The outcome of an audited action.
 *
 * @public
 */
export type AuditStatus = (typeof auditStatus)[keyof typeof auditStatus];

/**
 * A searchable tenant resource type.
 *
 * @public
 */
export const tenantSearchResourceType = {
  /** Domain. */
  domain: "domain",
  /** Inbound route. */
  inboundRoute: "inbound_route",
  /** Listener. */
  listener: "listener",
  /** Routing rule. */
  routingRule: "routing_rule",
  /** API key. */
  apiKey: "api_key",
  /** SMTP relay. */
  smtpRelay: "smtp_relay",
  /** Storage integration. */
  storageIntegration: "storage_integration",
  /** Webhook endpoint. */
  webhookEndpoint: "webhook_endpoint",
  /** Identity provider. */
  identityProvider: "identity_provider",
  /** Auto-reply template. */
  autoReplyTemplate: "auto_reply_template",
  /** Recipient set. */
  recipientSet: "recipient_set",
  /** Suppression. */
  suppression: "suppression",
} as const;

/**
 * A searchable tenant resource type.
 *
 * @public
 */
export type TenantSearchResourceType =
  (typeof tenantSearchResourceType)[keyof typeof tenantSearchResourceType];

/**
 * Wire representation of an audit-log entry.
 *
 * @public
 */
export interface AuditLog {
  /** Entry identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** The actor identifier. */
  readonly actorId?: string | null;
  /** The actor kind. */
  readonly actorKind: AuditActorKind;
  /** The action name. */
  readonly action: string;
  /** The affected resource type. */
  readonly resourceType: string;
  /** The affected resource identifier. */
  readonly resourceId?: string | null;
  /** The action outcome. */
  readonly status: AuditStatus;
  /** Free-form action details. */
  readonly details: Readonly<Record<string, unknown>>;
  /** Creation timestamp. */
  readonly createdAt: string;
}

/**
 * Wire representation of a resource-search hit.
 *
 * @public
 */
export interface TenantResourceSearchResult {
  /** The resource type. */
  readonly resourceType: TenantSearchResourceType;
  /** The resource identifier. */
  readonly resourceId: string;
  /** The parent resource identifier, when applicable. */
  readonly parentResourceId?: string | null;
  /** A human-readable label. */
  readonly label: string;
  /** A stable reference. */
  readonly reference: string;
  /** A human-readable description. */
  readonly description?: string | null;
}

/**
 * A tenant dedicated IP pool.
 *
 * @public
 */
export interface TenantDedicatedIPPool {
  /** Pool identifier. */
  readonly id: string;
  /** Human-readable pool name. */
  readonly name: string;
  /** The mail stream the pool serves. */
  readonly streamType: StreamType;
}
