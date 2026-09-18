/**
 * Auto-reply template models.
 *
 * @packageDocumentation
 */

/**
 * Why an auto-reply template's sender is, or is not, ready.
 *
 * @public
 */
export const autoReplySenderReadinessStatus = {
  /** The sender is ready. */
  ready: "ready",
  /** The from address is invalid. */
  invalidFromAddress: "invalid_from_address",
  /** The sending domain does not exist. */
  domainNotFound: "domain_not_found",
  /** Sending is not enabled for the domain. */
  sendingNotEnabled: "sending_not_enabled",
  /** The domain is not verified. */
  domainNotVerified: "domain_not_verified",
  /** DKIM is not verified. */
  dkimNotVerified: "dkim_not_verified",
} as const;

/**
 * Why an auto-reply template's sender is, or is not, ready.
 *
 * @public
 */
export type AutoReplySenderReadinessStatus =
  (typeof autoReplySenderReadinessStatus)[keyof typeof autoReplySenderReadinessStatus];

/**
 * A custom header stored on an auto-reply template.
 *
 * @public
 */
export interface AutoReplyTemplateHeader {
  /** Header name. */
  readonly name: string;
  /** Header value. */
  readonly value?: string | null;
}

/**
 * Summary of a stored template body field.
 *
 * @public
 */
export interface MaskedTemplateField {
  /** Whether a value is present. */
  readonly present: boolean;
  /** Length of the stored value. */
  readonly length: number;
}

/**
 * Content summary of an auto-reply template.
 *
 * @public
 */
export interface AutoReplyTemplateContentSummary {
  /** The subject, masked. */
  readonly subject: MaskedTemplateField;
  /** The plain-text body, masked. */
  readonly textBody: MaskedTemplateField;
  /** The HTML body, masked. */
  readonly htmlBody: MaskedTemplateField;
  /** Number of custom headers. */
  readonly headerCount: number;
}

/**
 * Whether the template's sender is ready to reply.
 *
 * @public
 */
export interface AutoReplySenderReadiness {
  /** Whether the sender is ready. */
  readonly ready: boolean;
  /** The readiness status. */
  readonly status: AutoReplySenderReadinessStatus;
}

/**
 * Wire representation of an auto-reply template.
 *
 * @public
 */
export interface AutoReplyTemplateData {
  /** Template identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable template reference. */
  readonly templateRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Sender address used for replies. */
  readonly fromAddress: string;
  /** Whether the template is active. */
  readonly isActive: boolean;
  /** Content summary. */
  readonly content: AutoReplyTemplateContentSummary;
  /** Sender readiness. */
  readonly senderReadiness: AutoReplySenderReadiness;
}

/**
 * Request body for `POST /v2/tenants/{slug}/auto-reply-templates`.
 *
 * @public
 */
export interface CreateAutoReplyTemplateRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly templateRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Sender address used for replies. */
  readonly fromAddress: string;
  /** Reply subject line. */
  readonly subject: string;
  /** Optional plain-text body. */
  readonly textBody?: string | null;
  /** Optional HTML body. */
  readonly htmlBody?: string | null;
  /** Optional custom headers. */
  readonly headers?: readonly AutoReplyTemplateHeader[] | null;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/auto-reply-templates/{id}`.
 *
 * All fields are always sent; `null` bodies clear the stored value.
 *
 * @public
 */
export interface UpdateAutoReplyTemplateRequest {
  /** Human-readable name. */
  readonly displayName: string;
  /** Sender address used for replies. */
  readonly fromAddress: string;
  /** Reply subject line. */
  readonly subject: string;
  /** Plain-text body, or `null` to clear it. */
  readonly textBody: string | null;
  /** HTML body, or `null` to clear it. */
  readonly htmlBody: string | null;
  /** Custom headers; always sent. */
  readonly headers: readonly AutoReplyTemplateHeader[];
}

/**
 * Request body for `PUT /v2/tenants/{slug}/auto-reply-templates/{id}/active`.
 *
 * @public
 */
export interface SetAutoReplyTemplateActiveRequest {
  /** Whether the template is active. */
  readonly isActive: boolean;
}
