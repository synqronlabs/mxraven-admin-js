/**
 * Tenant mail-analytics operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type {
  MailAnalyticsActivityHeatmap,
  MailAnalyticsBreakdown,
  MailAnalyticsComparison,
  MailAnalyticsDimension,
  MailAnalyticsDomainLifecycle,
  MailAnalyticsLifecycle,
  MailAnalyticsMetric,
  MailAnalyticsOverview,
  MailAnalyticsSeries,
  MailAnalyticsTaskSizeStatistics,
} from "../models/mail-analytics.js";
import { compactQuery } from "../query.js";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const MAX_INTERVAL_MS = 31 * DAY_MS;
const HOURLY_THRESHOLD_MS = 72 * HOUR_MS;
const LIFECYCLE_MAX_COHORT_MS = 7 * DAY_MS;
const LIFECYCLE_MAX_OBSERVATION_MS = 8 * DAY_MS;

const OFFSET_SUFFIX = /(?:[zZ]|[+-]\d{2}:\d{2})$/;

/** Parses a required UTC ISO-8601 timestamp into epoch milliseconds. @internal */
function parseUtcInstant(value: string | undefined, field: string): number {
  if (value === undefined || value.trim() === "") {
    throw new Error(`admin: ${field} is required`);
  }
  const trimmed = value.trim();
  const offset = OFFSET_SUFFIX.exec(trimmed);
  if (offset === null) {
    throw new Error(`admin: ${field} must be an ISO-8601 timestamp with a UTC offset`);
  }
  const suffix = offset[0];
  if (suffix !== "Z" && suffix !== "z" && suffix !== "+00:00" && suffix !== "-00:00") {
    throw new Error(`admin: ${field} must use UTC`);
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error(`admin: ${field} must be an ISO-8601 timestamp with a UTC offset`);
  }
  return parsed;
}

/** Validates a start/end interval. @internal */
function validateInterval(startAt: string | undefined, endAt: string | undefined): void {
  const start = parseUtcInstant(startAt, "start_at");
  const end = parseUtcInstant(endAt, "end_at");
  if (start >= end) {
    throw new Error("admin: start_at must be before end_at");
  }
  const duration = end - start;
  if (duration > MAX_INTERVAL_MS) {
    throw new Error("admin: the analytics interval may not exceed 31 days");
  }
  const step = duration <= HOURLY_THRESHOLD_MS ? HOUR_MS : DAY_MS;
  if (start % step !== 0 || end % step !== 0) {
    throw new Error(
      `admin: start_at and end_at must align to UTC ${step === HOUR_MS ? "hour" : "day"} boundaries`,
    );
  }
}

/** Validates a lifecycle cohort and observation horizon. @internal */
function validateLifecycle(
  startAt: string | undefined,
  endAt: string | undefined,
  observationEndAt: string | undefined,
): void {
  validateInterval(startAt, endAt);
  const start = parseUtcInstant(startAt, "start_at");
  const end = parseUtcInstant(endAt, "end_at");
  const observationEnd = parseUtcInstant(observationEndAt, "observation_end_at");
  if (observationEnd < end) {
    throw new Error("admin: lifecycle observation end must not precede the cohort end");
  }
  if (end - start > LIFECYCLE_MAX_COHORT_MS) {
    throw new Error("admin: lifecycle cohort may not exceed 7 days");
  }
  if (observationEnd - start > LIFECYCLE_MAX_OBSERVATION_MS) {
    throw new Error("admin: lifecycle observation horizon may not exceed 8 days");
  }
}

/** Validates an optional result limit. @internal */
function validateLimit(limit: number | undefined): void {
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 20)) {
    throw new Error("admin: limit must be between 1 and 20");
  }
}

/** Construction options for a {@link MailAnalyticsClient}. @public */
export interface MailAnalyticsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose analytics are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for interval-only analytics operations.
 *
 * @public
 */
export interface IntervalOptions extends RequestOptions {
  /** Interval start, an inclusive UTC ISO-8601 timestamp. */
  readonly startAt: string;
  /** Interval end, an exclusive UTC ISO-8601 timestamp. */
  readonly endAt: string;
}

/**
 * Options for lifecycle operations.
 *
 * @public
 */
export interface LifecycleOptions extends IntervalOptions {
  /** Observation end, a UTC ISO-8601 timestamp at or after `endAt`. */
  readonly observationEndAt: string;
}

/**
 * Options for breakdown and series operations.
 *
 * @public
 */
export interface BreakdownOptions extends IntervalOptions {
  /** The metric to report. */
  readonly metric: MailAnalyticsMetric;
  /** The dimension to group by. */
  readonly dimension: MailAnalyticsDimension;
  /** An optional limit between 1 and 20. */
  readonly limit?: number;
}

/**
 * Options for the domain-lifecycle operation.
 *
 * @public
 */
export interface DomainLifecycleOptions extends LifecycleOptions {
  /** Restrict to a single recipient domain. */
  readonly recipientDomain?: string;
  /** An optional limit between 1 and 20. */
  readonly limit?: number;
}

/**
 * Tenant mail-analytics operations.
 *
 * All intervals are start-inclusive and end-exclusive, must use UTC, and must
 * align to hour or day boundaries.
 *
 * @public
 */
export class MailAnalyticsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: MailAnalyticsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Fetches the overview report.
   *
   * @param options - The interval and cancellation signal.
   * @returns The overview.
   *
   * @public
   */
  overview(options: IntervalOptions): Promise<MailAnalyticsOverview> {
    validateInterval(options.startAt, options.endAt);
    return this.#get(
      "overview",
      {
        start_at: options.startAt,
        end_at: options.endAt,
      },
      options,
    );
  }

  /**
   * Fetches the comparison report.
   *
   * @param options - The interval and cancellation signal.
   * @returns The comparison.
   *
   * @public
   */
  comparison(options: IntervalOptions): Promise<MailAnalyticsComparison> {
    validateInterval(options.startAt, options.endAt);
    return this.#get(
      "comparison",
      {
        start_at: options.startAt,
        end_at: options.endAt,
      },
      options,
    );
  }

  /**
   * Fetches the activity heatmap.
   *
   * @param options - The interval and cancellation signal.
   * @returns The heatmap.
   *
   * @public
   */
  activityHeatmap(options: IntervalOptions): Promise<MailAnalyticsActivityHeatmap> {
    validateInterval(options.startAt, options.endAt);
    return this.#get(
      "activity-heatmap",
      {
        start_at: options.startAt,
        end_at: options.endAt,
      },
      options,
    );
  }

  /**
   * Fetches task-size statistics.
   *
   * @param options - The interval and cancellation signal.
   * @returns The task-size statistics.
   *
   * @public
   */
  taskSizeStatistics(options: IntervalOptions): Promise<MailAnalyticsTaskSizeStatistics> {
    validateInterval(options.startAt, options.endAt);
    return this.#get(
      "task-size-statistics",
      {
        start_at: options.startAt,
        end_at: options.endAt,
      },
      options,
    );
  }

  /**
   * Fetches the lifecycle report.
   *
   * @param options - The cohort, observation end, and cancellation signal.
   * @returns The lifecycle report.
   *
   * @public
   */
  lifecycle(options: LifecycleOptions): Promise<MailAnalyticsLifecycle> {
    validateLifecycle(options.startAt, options.endAt, options.observationEndAt);
    return this.#get(
      "lifecycle",
      {
        start_at: options.startAt,
        end_at: options.endAt,
        observation_end_at: options.observationEndAt,
      },
      options,
    );
  }

  /**
   * Fetches a metric breakdown.
   *
   * @param options - The interval, metric, dimension, optional limit, and signal.
   * @returns The breakdown.
   *
   * @public
   */
  breakdown(options: BreakdownOptions): Promise<MailAnalyticsBreakdown> {
    validateInterval(options.startAt, options.endAt);
    validateLimit(options.limit);
    return this.#get(
      "breakdown",
      {
        start_at: options.startAt,
        end_at: options.endAt,
        metric: options.metric,
        dimension: options.dimension,
        limit: options.limit,
      },
      options,
    );
  }

  /**
   * Fetches a metric series.
   *
   * @param options - The interval, metric, dimension, optional limit, and signal.
   * @returns The series.
   *
   * @public
   */
  series(options: BreakdownOptions): Promise<MailAnalyticsSeries> {
    validateInterval(options.startAt, options.endAt);
    validateLimit(options.limit);
    return this.#get(
      "series",
      {
        start_at: options.startAt,
        end_at: options.endAt,
        metric: options.metric,
        dimension: options.dimension,
        limit: options.limit,
      },
      options,
    );
  }

  /**
   * Fetches the domain-lifecycle report.
   *
   * @param options - The cohort, observation end, optional filters, and signal.
   * @returns The domain-lifecycle report.
   *
   * @public
   */
  domainLifecycle(options: DomainLifecycleOptions): Promise<MailAnalyticsDomainLifecycle> {
    validateLifecycle(options.startAt, options.endAt, options.observationEndAt);
    validateLimit(options.limit);
    return this.#get(
      "domain-lifecycle",
      {
        start_at: options.startAt,
        end_at: options.endAt,
        observation_end_at: options.observationEndAt,
        recipient_domain: options.recipientDomain,
        limit: options.limit,
      },
      options,
    );
  }

  /** Issues a validated analytics GET. */
  #get<T>(
    operation: string,
    query: Record<string, string | number | boolean | undefined | null>,
    options: RequestOptions,
  ): Promise<T> {
    const path = `/tenants/${encodeURIComponent(this.#tenantSlug)}/mail-analytics/${operation}`;
    return this.#client
      .get(path, compactQuery(query), options)
      .then((response) => response.as<T>());
  }
}
