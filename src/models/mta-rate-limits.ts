/**
 * MTA rate-limit models.
 *
 * @packageDocumentation
 */

/**
 * Scope at which an MTA rate-limit override applies.
 *
 * @public
 */
export const mtaRateLimitScope = {
  /** Global scope. */
  global: "global",
  /** Tenant scope. */
  tenant: "tenant",
  /** Listener scope. */
  listener: "listener",
} as const;

/**
 * Scope at which an MTA rate-limit override applies.
 *
 * @public
 */
export type MtaRateLimitScope = (typeof mtaRateLimitScope)[keyof typeof mtaRateLimitScope];

/**
 * Source of the effective MTA rate limits.
 *
 * @public
 */
export const mtaRateLimitSource = {
  /** Built-in defaults. */
  default: "default",
  /** Global scope. */
  global: "global",
  /** Guardrail profile. */
  guardrail: "guardrail",
  /** Tenant override. */
  tenant: "tenant",
  /** Listener override. */
  listener: "listener",
} as const;

/**
 * Source of the effective MTA rate limits.
 *
 * @public
 */
export type MtaRateLimitSource = (typeof mtaRateLimitSource)[keyof typeof mtaRateLimitSource];

/**
 * A writable MTA rate-limit policy.
 *
 * @public
 */
export interface MTARateLimitPolicy {
  /** Maximum messages per minute; must be greater than 0. */
  readonly messageRatePerMinute: number;
  /** Maximum recipients per minute; must be greater than 0. */
  readonly recipientRatePerMinute: number;
  /** Maximum tasks per minute; must be greater than 0. */
  readonly taskRatePerMinute: number;
  /** Burst allowance; at least 1. */
  readonly burst: number;
  /** Maximum concurrency; at least 1. */
  readonly maxConcurrency: number;
}

/**
 * Effective MTA rate-limit override state at one scope.
 *
 * @public
 */
export interface MTARateLimitOverride {
  /** The scope this override describes. */
  readonly scope: MtaRateLimitScope;
  /** Tenant identifier, for a tenant-scoped override. */
  readonly tenantId?: string | null;
  /** Listener identifier, for a listener-scoped override. */
  readonly listenerId?: string | null;
  /** The explicit override at this scope, when one exists. */
  readonly override?: MTARateLimitPolicy | null;
  /** Limits inherited from enclosing scopes. */
  readonly inherited: MTARateLimitPolicy;
  /** Effective limits after applying the override. */
  readonly effective: MTARateLimitPolicy;
  /** Source of the effective limits. */
  readonly effectiveSource: MtaRateLimitSource;
}

/** Requires a finite number greater than zero. @internal */
function requirePositive(value: number, field: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`admin: ${field} must be greater than 0`);
  }
}

/**
 * Validates a writable MTA rate-limit policy.
 *
 * @param policy - The policy to validate.
 * @throws `Error` When a rate is not positive or a count is below 1.
 *
 * @internal
 */
export function validateMtaRateLimitPolicy(policy: MTARateLimitPolicy): void {
  requirePositive(policy.messageRatePerMinute, "message_rate_per_minute");
  requirePositive(policy.recipientRatePerMinute, "recipient_rate_per_minute");
  requirePositive(policy.taskRatePerMinute, "task_rate_per_minute");
  if (!Number.isInteger(policy.burst) || policy.burst < 1) {
    throw new Error("admin: burst must be at least 1");
  }
  if (!Number.isInteger(policy.maxConcurrency) || policy.maxConcurrency < 1) {
    throw new Error("admin: max_concurrency must be at least 1");
  }
}

/**
 * Requires a policy to be no looser than the inherited limits.
 *
 * @param policy - The candidate policy.
 * @param inherited - The limits it must not exceed, when known.
 * @throws `Error` When any rate or count exceeds the inherited limit.
 *
 * @internal
 */
export function assertMtaRateLimitStricter(
  policy: MTARateLimitPolicy,
  inherited: MTARateLimitPolicy | null | undefined,
): void {
  if (inherited === null || inherited === undefined) {
    return;
  }
  if (policy.messageRatePerMinute > inherited.messageRatePerMinute) {
    throw new Error(
      "admin: message_rate_per_minute must be less than or equal to the inherited limit",
    );
  }
  if (policy.recipientRatePerMinute > inherited.recipientRatePerMinute) {
    throw new Error(
      "admin: recipient_rate_per_minute must be less than or equal to the inherited limit",
    );
  }
  if (policy.taskRatePerMinute > inherited.taskRatePerMinute) {
    throw new Error(
      "admin: task_rate_per_minute must be less than or equal to the inherited limit",
    );
  }
  if (policy.burst > inherited.burst) {
    throw new Error("admin: burst must be less than or equal to the inherited limit");
  }
  if (policy.maxConcurrency > inherited.maxConcurrency) {
    throw new Error("admin: max_concurrency must be less than or equal to the inherited limit");
  }
}
