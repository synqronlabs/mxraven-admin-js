/**
 * Client-wide control-plane rate-limit behaviour.
 */

/**
 * Client-wide control-plane rate-limit behaviour.
 *
 * The v2 control plane signals limits with a `429` response and a `Retry-After`
 * header (delta-seconds or an HTTP date). When {@link RateLimitConfig.enabled}
 * is set, the client waits for that delay and transparently retries `GET` and
 * `DELETE` requests up to {@link RateLimitConfig.maxRetries} times before
 * surfacing a `RateLimitException`. `POST` and `PUT` are never retried
 * automatically, so they cannot be applied twice or amplify load.
 *
 * @example
 * ```ts
 * const admin = new AdminClient({
 *   token,
 *   rateLimit: { ...defaultRateLimitConfig, maxRetries: 5, maxBackoffMs: 120_000 },
 * });
 * ```
 *
 * @public
 */
export interface RateLimitConfig {
  /** Whether `429` responses are retried. */
  readonly enabled: boolean;
  /** Maximum retries after the initial attempt. */
  readonly maxRetries: number;
  /** Delay used when a `429` has no usable `Retry-After`, in milliseconds. */
  readonly defaultBackoffMs: number;
  /** Upper bound applied to any server-provided `Retry-After`, in milliseconds. */
  readonly maxBackoffMs: number;
}

/**
 * Retry on `429` up to 3 times, honouring `Retry-After`.
 *
 * @public
 */
export const defaultRateLimitConfig: RateLimitConfig = Object.freeze({
  enabled: true,
  maxRetries: 3,
  defaultBackoffMs: 1_000,
  maxBackoffMs: 60_000,
});

/**
 * Surface `429` immediately without retrying.
 *
 * @public
 */
export const disabledRateLimitConfig: RateLimitConfig = Object.freeze({
  enabled: false,
  maxRetries: 0,
  defaultBackoffMs: 0,
  maxBackoffMs: 0,
});
