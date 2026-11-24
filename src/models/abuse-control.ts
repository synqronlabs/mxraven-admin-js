/**
 * Workspace reputation, outbound-pause, and abuse-finding models.
 *
 * @packageDocumentation
 */

/**
 * The redacted origin of an active outbound pause.
 *
 * @public
 */
export const tenantOutboundPauseSource = {
  /** mxRaven paused sending automatically after deliverability findings. */
  automatic: "automatic",
  /** A platform operator paused sending. */
  platform: "platform",
} as const;

/**
 * The redacted origin of an active outbound pause.
 *
 * @public
 */
export type TenantOutboundPauseSource =
  (typeof tenantOutboundPauseSource)[keyof typeof tenantOutboundPauseSource];

/**
 * Read-only workspace reputation state.
 *
 * A workspace with no recorded history defaults to a score of `100`.
 *
 * @public
 */
export interface TenantReputation {
  /** The workspace identifier. */
  readonly tenantId: string;
  /** The reputation score, from `0` to `100`. */
  readonly score: number;
  /** Consecutive negative signals currently counted. */
  readonly consecutiveNegativeCount: number;
  /** Successful deliveries recorded. */
  readonly successfulDeliveryCount: number;
  /** Successful deliveries since the last negative signal. */
  readonly successesSinceNegative: number;
  /** Negative feedback signals recorded. */
  readonly negativeFeedbackCount: number;
  /** When the last positive signal arrived, or `null`. */
  readonly lastPositiveAt?: string | null;
  /** When the last negative signal arrived, or `null`. */
  readonly lastNegativeAt?: string | null;
  /** When the reputation state was last updated, or `null`. */
  readonly updatedAt?: string | null;
}

/**
 * Read-only workspace outbound-pause state.
 *
 * Operator identities and internal reasons are not exposed.
 *
 * @public
 */
export interface TenantOutboundPause {
  /** The workspace identifier. */
  readonly tenantId: string;
  /** Whether outbound sending is paused. */
  readonly outboundPaused: boolean;
  /** The redacted pause origin, omitted when sending is not paused. */
  readonly source?: TenantOutboundPauseSource;
  /** When the pause started, or `null`. */
  readonly pausedAt?: string | null;
  /** When the pause state was last updated, or `null`. */
  readonly updatedAt?: string | null;
}

/**
 * A redacted, read-only abuse finding summary.
 *
 * Internal evidence, dedupe keys, source event identifiers, and operator
 * identities are not exposed.
 *
 * @public
 */
export interface TenantAbuseFindingSummary {
  /** Finding identifier. */
  readonly id: string;
  /** Finding kind. */
  readonly kind: string;
  /** Finding severity. */
  readonly severity: string;
  /** Finding status. */
  readonly status: string;
  /** The recommended action, or `null`. */
  readonly recommendedAction?: string | null;
  /** When the finding was first seen. */
  readonly firstSeenAt: string;
  /** When the finding was last seen. */
  readonly lastSeenAt: string;
  /** When the finding was resolved, or `null`. */
  readonly resolvedAt?: string | null;
  /** When the finding was last updated. */
  readonly updatedAt: string;
}
