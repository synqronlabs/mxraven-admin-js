/**
 * Tenant suppression models.
 *
 * @packageDocumentation
 */

/**
 * Why a recipient address is suppressed.
 *
 * @public
 */
export const suppressionReason = {
  /** The recipient unsubscribed. */
  unsubscribe: "unsubscribe",
  /** The recipient address bounced. */
  bounce: "bounce",
} as const;

/**
 * Why a recipient address is suppressed.
 *
 * @public
 */
export type SuppressionReason = (typeof suppressionReason)[keyof typeof suppressionReason];

/**
 * Wire representation of a tenant suppression.
 *
 * @public
 */
export interface TenantSuppressionData {
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** The suppressed recipient address. */
  readonly emailAddress: string;
  /** Why the address is suppressed. */
  readonly reason: SuppressionReason;
}

/**
 * Request body for `POST /v2/tenants/{slug}/suppressions`.
 *
 * @public
 */
export interface CreateTenantSuppressionRequest {
  /** The recipient address to suppress. */
  readonly emailAddress: string;
  /** Why the address is suppressed. */
  readonly reason?: SuppressionReason;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/suppressions/{email}`.
 *
 * @public
 */
export interface UpdateTenantSuppressionRequest {
  /** The new reason, or `null` to clear the stored value. */
  readonly reason: SuppressionReason | null;
}
