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
  /**
   * The provider-canonical mailbox identity used for matching.
   *
   * Provider-equivalent addresses share one suppression and this value.
   */
  readonly canonicalEmailAddress: string;
  /** Why the address is suppressed, when a reason is recorded. */
  readonly reason?: SuppressionReason;
  /** Whether mxRaven feedback system manages the suppression. */
  readonly systemManaged?: boolean;
  /** Opaque provenance label such as `one_click_unsubscribe`. */
  readonly source?: string | null;
  /** How many feedback signals contributed to the suppression. */
  readonly feedbackCount?: number;
  /** When the suppression was added. */
  readonly addedAt?: string;
  /** When the last contributing feedback arrived. */
  readonly lastFeedbackAt?: string | null;
  /** When the suppression was last updated. */
  readonly updatedAt?: string;
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
