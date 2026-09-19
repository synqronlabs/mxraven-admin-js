/**
 * Mail-analytics models.
 *
 * @packageDocumentation
 */

/**
 * Bucket granularity of an analytics time series.
 *
 * @public
 */
export const mailAnalyticsBucketGranularity = {
  /** Hourly buckets. */
  hour: "hour",
  /** Daily buckets. */
  day: "day",
} as const;

/**
 * Bucket granularity of an analytics time series.
 *
 * @public
 */
export type MailAnalyticsBucketGranularity =
  (typeof mailAnalyticsBucketGranularity)[keyof typeof mailAnalyticsBucketGranularity];

/**
 * A dimension to break analytics down by.
 *
 * @public
 */
export const mailAnalyticsDimension = {
  /** No dimension. */
  none: "none",
  /** Listener. */
  listener: "listener",
  /** Direction. */
  direction: "direction",
  /** Stream. */
  stream: "stream",
  /** Channel. */
  channel: "channel",
  /** Billable metric. */
  billableMetric: "billable_metric",
  /** Outcome. */
  outcome: "outcome",
  /** SMTP response class. */
  smtpResponseClass: "smtp_response_class",
  /** SMTP status code. */
  smtpStatusCode: "smtp_status_code",
  /** Enhanced status code. */
  enhancedStatusCode: "enhanced_status_code",
  /** Application status code. */
  applicationStatusCode: "application_status_code",
  /** Sender domain. */
  senderDomain: "sender_domain",
  /** Recipient domain. */
  recipientDomain: "recipient_domain",
  /** Feedback type. */
  feedbackType: "feedback_type",
  /** Suppression reason. */
  suppressionReason: "suppression_reason",
  /** Suppression scope. */
  suppressionScope: "suppression_scope",
  /** Suppression feedback count. */
  suppressionFeedbackCount: "suppression_feedback_count",
  /** Forwarding outcome. */
  forwardingOutcome: "forwarding_outcome",
  /** Forwarding signal. */
  forwardingSignal: "forwarding_signal",
  /** Task size. */
  taskSize: "task_size",
} as const;

/**
 * A dimension to break analytics down by.
 *
 * @public
 */
export type MailAnalyticsDimension =
  (typeof mailAnalyticsDimension)[keyof typeof mailAnalyticsDimension];

/**
 * An analytics metric.
 *
 * @public
 */
export const mailAnalyticsMetric = {
  /** Egress tasks. */
  egressTasks: "egress_tasks",
  /** Data bytes. */
  dataBytes: "data_bytes",
  /** Billable units. */
  billableUnits: "billable_units",
  /** Terminal tasks. */
  terminalTasks: "terminal_tasks",
  /** Succeeded tasks. */
  succeededTasks: "succeeded_tasks",
  /** Failed tasks. */
  failedTasks: "failed_tasks",
  /** Expired tasks. */
  expiredTasks: "expired_tasks",
  /** Deferred events. */
  deferredEvents: "deferred_events",
  /** SMTP responses. */
  smtpResponses: "smtp_responses",
  /** SMTP failure tasks. */
  smtpFailureTasks: "smtp_failure_tasks",
  /** Application statuses. */
  applicationStatuses: "application_statuses",
  /** Application failure tasks. */
  applicationFailureTasks: "application_failure_tasks",
  /** Feedback events. */
  feedbackEvents: "feedback_events",
  /** Suppressions applied. */
  suppressionsApplied: "suppressions_applied",
  /** Suppressed tasks. */
  suppressedTasks: "suppressed_tasks",
  /** Forwarding events. */
  forwardingEvents: "forwarding_events",
  /** Forwarding suppressions. */
  forwardingSuppressions: "forwarding_suppressions",
} as const;

/**
 * An analytics metric.
 *
 * @public
 */
export type MailAnalyticsMetric = (typeof mailAnalyticsMetric)[keyof typeof mailAnalyticsMetric];

/**
 * Lifecycle state of a listener in analytics.
 *
 * @public
 */
export const mailAnalyticsListenerState = {
  /** The listener currently exists. */
  current: "current",
  /** The listener was deleted or is unknown. */
  deletedOrUnknown: "deleted_or_unknown",
} as const;

/**
 * Lifecycle state of a listener in analytics.
 *
 * @public
 */
export type MailAnalyticsListenerState =
  (typeof mailAnalyticsListenerState)[keyof typeof mailAnalyticsListenerState];

/**
 * Terminal outcome of a task.
 *
 * @public
 */
export const mailAnalyticsOutcome = {
  /** Succeeded. */
  succeeded: "succeeded",
  /** Failed. */
  failed: "failed",
  /** Expired. */
  expired: "expired",
  /** Suppressed. */
  suppressed: "suppressed",
} as const;

/**
 * Terminal outcome of a task.
 *
 * @public
 */
export type MailAnalyticsOutcome = (typeof mailAnalyticsOutcome)[keyof typeof mailAnalyticsOutcome];

/**
 * Lifecycle state of a referenced resource.
 *
 * @public
 */
export const mailAnalyticsResourceState = {
  /** Not applicable to this dimension. */
  notApplicable: "not_applicable",
  /** The resource currently exists. */
  current: "current",
  /** The resource was deleted or is unknown. */
  deletedOrUnknown: "deleted_or_unknown",
} as const;

/**
 * Lifecycle state of a referenced resource.
 *
 * @public
 */
export type MailAnalyticsResourceState =
  (typeof mailAnalyticsResourceState)[keyof typeof mailAnalyticsResourceState];

/**
 * A task-size bucket.
 *
 * @public
 */
export const mailAnalyticsSizeBin = {
  /** Under 10 KiB. */
  under10Kib: "under_10_kib",
  /** 10–100 KiB. */
  from10To100Kib: "from_10_to_100_kib",
  /** 100 KiB–1 MiB. */
  from100KibTo1Mib: "from_100_kib_to_1_mib",
  /** 1–5 MiB. */
  from1To5Mib: "from_1_to_5_mib",
  /** 5–10 MiB. */
  from5To10Mib: "from_5_to_10_mib",
  /** 10–25 MiB. */
  from10To25Mib: "from_10_to_25_mib",
  /** 25–50 MiB. */
  from25To50Mib: "from_25_to_50_mib",
  /** Over 50 MiB. */
  over50Mib: "over_50_mib",
} as const;

/**
 * A task-size bucket.
 *
 * @public
 */
export type MailAnalyticsSizeBin = (typeof mailAnalyticsSizeBin)[keyof typeof mailAnalyticsSizeBin];

/**
 * The analytics timezone.
 *
 * @public
 */
export const mailAnalyticsTimezone = {
  /** Coordinated Universal Time. */
  utc: "UTC",
} as const;

/**
 * The analytics timezone.
 *
 * @public
 */
export type MailAnalyticsTimezone =
  (typeof mailAnalyticsTimezone)[keyof typeof mailAnalyticsTimezone];

/**
 * Accepted-message counts.
 *
 * @public
 */
export interface MailAnalyticsAcceptedMessages {
  /** Total accepted. */
  readonly total: number;
  /** Accepted by submission listeners. */
  readonly submission: number;
  /** Accepted by MTA listeners. */
  readonly mta: number;
}

/**
 * A latency statistic.
 *
 * Percentiles are `null` when there are no samples.
 *
 * @public
 */
export interface MailAnalyticsLatencyStatistic {
  /** Number of samples. */
  readonly sampleCount: number;
  /** 50th percentile, in milliseconds. */
  readonly p50Ms: number | null;
  /** 90th percentile, in milliseconds. */
  readonly p90Ms: number | null;
  /** 95th percentile, in milliseconds. */
  readonly p95Ms: number | null;
  /** 99th percentile, in milliseconds. */
  readonly p99Ms: number | null;
}

/**
 * A latency metric with a distribution.
 *
 * @public
 */
export interface MailAnalyticsLatencyMetric {
  /** Number of samples. */
  readonly sampleCount: number;
  /** 50th percentile, in milliseconds. */
  readonly p50Ms: number | null;
  /** 90th percentile, in milliseconds. */
  readonly p90Ms: number | null;
  /** 95th percentile, in milliseconds. */
  readonly p95Ms: number | null;
  /** 99th percentile, in milliseconds. */
  readonly p99Ms: number | null;
  /** The distribution buckets. */
  readonly distribution: readonly MailAnalyticsCountBin[];
}

/**
 * A count bucket.
 *
 * @public
 */
export interface MailAnalyticsCountBin {
  /** The bucket key. */
  readonly key: string;
  /** The bucket label. */
  readonly label: string;
  /** The bucket count. */
  readonly count: number;
}

/**
 * A rate with its numerator and denominator.
 *
 * `value` is `null` when the denominator is zero.
 *
 * @public
 */
export interface MailAnalyticsRate {
  /** Numerator. */
  readonly numerator: number;
  /** Denominator. */
  readonly denominator: number;
  /** The rate value. */
  readonly value: number | null;
}

/**
 * A ratio with its numerator and denominator.
 *
 * @public
 */
export interface MailAnalyticsRatio {
  /** Numerator. */
  readonly numerator: number;
  /** Denominator. */
  readonly denominator: number;
  /** The ratio value. */
  readonly value: number | null;
}

/**
 * Terminal task counts.
 *
 * @public
 */
export interface MailAnalyticsTerminalOutcomes {
  /** Succeeded tasks. */
  readonly succeeded: number;
  /** Failed tasks. */
  readonly failed: number;
  /** Expired tasks. */
  readonly expired: number;
  /** Suppressed tasks. */
  readonly suppressed: number;
}

/**
 * SMTP response counts.
 *
 * @public
 */
export interface MailAnalyticsSMTPResponses {
  /** Successful responses. */
  readonly successful: number;
  /** Temporary failures. */
  readonly temporaryFailure: number;
  /** Permanent failures. */
  readonly permanentFailure: number;
}

/**
 * Feedback-event counts.
 *
 * @public
 */
export interface MailAnalyticsFeedback {
  /** DSN feedback events. */
  readonly dsn: number;
  /** ARF feedback events. */
  readonly arf: number;
  /** One-click unsubscribes. */
  readonly oneClickUnsubscribe: number;
  /** Tenant training events. */
  readonly tenantTraining: number;
}

/**
 * An aggregate metric set.
 *
 * @public
 */
export interface MailAnalyticsMetrics {
  /** Accepted messages. */
  readonly acceptedMessages: MailAnalyticsAcceptedMessages;
  /** Egress tasks. */
  readonly egressTasks: number;
  /** Data bytes. */
  readonly dataBytes: number;
  /** Billable units. */
  readonly billableUnits: number;
  /** Terminal outcomes. */
  readonly terminalOutcomes: MailAnalyticsTerminalOutcomes;
  /** Delivery success rate. */
  readonly deliverySuccessRate: MailAnalyticsRate;
  /** SMTP responses. */
  readonly smtpResponses: MailAnalyticsSMTPResponses;
  /** Feedback events. */
  readonly feedback: MailAnalyticsFeedback;
  /** Suppressions applied. */
  readonly suppressionsApplied: number;
}

/**
 * A metrics time point.
 *
 * @public
 */
export interface MailAnalyticsTimePoint {
  /** Bucket start. */
  readonly bucketStart: string;
  /** Bucket end. */
  readonly bucketEnd: string;
  /** The metrics for the bucket. */
  readonly metrics: MailAnalyticsMetrics;
}

/**
 * A listener breakdown item.
 *
 * @public
 */
export interface MailAnalyticsListenerBreakdownItem {
  /** Listener identifier. */
  readonly listenerId: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Listener state. */
  readonly listenerState: MailAnalyticsListenerState;
  /** Egress tasks. */
  readonly egressTasks: number;
}

/**
 * A listener breakdown.
 *
 * @public
 */
export interface MailAnalyticsListenerBreakdown {
  /** Applied limit. */
  readonly limit: number;
  /** Total egress tasks. */
  readonly totalEgressTasks: number;
  /** The breakdown items. */
  readonly items: readonly MailAnalyticsListenerBreakdownItem[];
  /** Egress tasks in the "other" bucket. */
  readonly otherEgressTasks: number;
}

/**
 * The overview report.
 *
 * @public
 */
export interface MailAnalyticsOverview {
  /** Interval start. */
  readonly startAt: string;
  /** Interval end. */
  readonly endAt: string;
  /** Bucket granularity. */
  readonly bucketGranularity: MailAnalyticsBucketGranularity;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** The summary metrics. */
  readonly summary: MailAnalyticsMetrics;
  /** The time series. */
  readonly timeSeries: readonly MailAnalyticsTimePoint[];
  /** The listener breakdown. */
  readonly listenerBreakdown: MailAnalyticsListenerBreakdown;
}

/**
 * One comparison period.
 *
 * @public
 */
export interface MailAnalyticsComparisonPeriod {
  /** Period start. */
  readonly startAt: string;
  /** Period end. */
  readonly endAt: string;
  /** Period metrics. */
  readonly metrics: MailAnalyticsMetrics;
}

/**
 * The comparison report.
 *
 * @public
 */
export interface MailAnalyticsComparison {
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** The current period. */
  readonly current: MailAnalyticsComparisonPeriod;
  /** The preceding period. */
  readonly preceding: MailAnalyticsComparisonPeriod;
}

/**
 * An activity-heatmap cell.
 *
 * @public
 */
export interface MailAnalyticsActivityHeatmapCell {
  /** ISO weekday, Monday=1 through Sunday=7. */
  readonly isoWeekday: number;
  /** UTC hour, 0–23. */
  readonly hour: number;
  /** Egress tasks. */
  readonly egressTasks: number;
}

/**
 * The activity-heatmap report.
 *
 * @public
 */
export interface MailAnalyticsActivityHeatmap {
  /** Interval start. */
  readonly startAt: string;
  /** Interval end. */
  readonly endAt: string;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** The timezone. */
  readonly timezone: MailAnalyticsTimezone;
  /** The metric. */
  readonly metric: MailAnalyticsMetric;
  /** Exactly 168 zero-filled weekday/hour cells. */
  readonly cells: readonly MailAnalyticsActivityHeatmapCell[];
}

/**
 * A breakdown item.
 *
 * @public
 */
export interface MailAnalyticsBreakdownItem {
  /** The item key. */
  readonly key: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Resource state. */
  readonly resourceState: MailAnalyticsResourceState;
  /** The metric value. */
  readonly value: number;
}

/**
 * The breakdown report.
 *
 * @public
 */
export interface MailAnalyticsBreakdown {
  /** Interval start. */
  readonly startAt: string;
  /** Interval end. */
  readonly endAt: string;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** The metric. */
  readonly metric: MailAnalyticsMetric;
  /** The dimension. */
  readonly dimension: MailAnalyticsDimension;
  /** Applied limit. */
  readonly limit: number;
  /** Total value. */
  readonly total: number;
  /** The breakdown items. */
  readonly items: readonly MailAnalyticsBreakdownItem[];
  /** Value in the "other" bucket. */
  readonly other: number;
}

/**
 * A series point.
 *
 * @public
 */
export interface MailAnalyticsSeriesPoint {
  /** Bucket start. */
  readonly bucketStart: string;
  /** Bucket end. */
  readonly bucketEnd: string;
  /** The value. */
  readonly value: number;
}

/**
 * A series item.
 *
 * @public
 */
export interface MailAnalyticsSeriesItem {
  /** The item key. */
  readonly key: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Resource state. */
  readonly resourceState: MailAnalyticsResourceState;
  /** The item's points. */
  readonly points: readonly MailAnalyticsSeriesPoint[];
}

/**
 * The series report.
 *
 * @public
 */
export interface MailAnalyticsSeries {
  /** Interval start. */
  readonly startAt: string;
  /** Interval end. */
  readonly endAt: string;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** Bucket granularity. */
  readonly bucketGranularity: MailAnalyticsBucketGranularity;
  /** The metric. */
  readonly metric: MailAnalyticsMetric;
  /** The dimension. */
  readonly dimension: MailAnalyticsDimension;
  /** Applied limit. */
  readonly limit: number;
  /** The series. */
  readonly series: readonly MailAnalyticsSeriesItem[];
}

/**
 * The lifecycle cohort.
 *
 * @public
 */
export interface MailAnalyticsLifecycleCohort {
  /** Created tasks. */
  readonly createdTasks: number;
  /** Origin-eligible tasks. */
  readonly originEligibleTasks: number;
  /** Observation hours. */
  readonly observationHours: number;
}

/**
 * The lifecycle funnel.
 *
 * @public
 */
export interface MailAnalyticsLifecycleFunnel {
  /** Created tasks. */
  readonly createdTasks: number;
  /** Attempted tasks. */
  readonly attemptedTasks: number;
  /** Terminal tasks. */
  readonly terminalTasks: number;
}

/**
 * The retry report.
 *
 * @public
 */
export interface MailAnalyticsRetry {
  /** Attempted tasks. */
  readonly attemptedTasks: number;
  /** Tasks with multiple attempts. */
  readonly multiAttemptTasks: number;
  /** The retry rate. */
  readonly rate: MailAnalyticsRate;
  /** Final-attempt distribution. */
  readonly finalAttemptDistribution: readonly MailAnalyticsCountBin[];
}

/**
 * Latency grouped by outcome.
 *
 * @public
 */
export interface MailAnalyticsOutcomeLatency {
  /** The outcome. */
  readonly outcome: MailAnalyticsOutcome;
  /** The latency metric. */
  readonly latency: MailAnalyticsLatencyMetric;
}

/**
 * A latency set.
 *
 * @public
 */
export interface MailAnalyticsLatencySet {
  /** First-attempt latency. */
  readonly firstAttempt: MailAnalyticsLatencyMetric;
  /** Successful-delivery latency. */
  readonly successfulDelivery: MailAnalyticsLatencyMetric;
  /** Terminal-outcome latency. */
  readonly terminalOutcome: MailAnalyticsLatencyMetric;
  /** Terminal latency by outcome. */
  readonly terminalByOutcome: readonly MailAnalyticsOutcomeLatency[];
}

/**
 * A lifecycle time point.
 *
 * @public
 */
export interface MailAnalyticsLifecycleTimePoint {
  /** Bucket start. */
  readonly bucketStart: string;
  /** Bucket end. */
  readonly bucketEnd: string;
  /** Created tasks. */
  readonly createdTasks: number;
  /** The retry rate. */
  readonly retryRate: MailAnalyticsRate;
  /** First-attempt latency. */
  readonly firstAttemptLatency: MailAnalyticsLatencyStatistic;
  /** Successful-delivery latency. */
  readonly successfulDeliveryLatency: MailAnalyticsLatencyStatistic;
  /** Terminal-outcome latency. */
  readonly terminalOutcomeLatency: MailAnalyticsLatencyStatistic;
}

/**
 * Latency by task size.
 *
 * @public
 */
export interface MailAnalyticsLatencyBySize {
  /** The size bin. */
  readonly sizeBin: MailAnalyticsSizeBin;
  /** Number of samples. */
  readonly sampleCount: number;
  /** Terminal-outcome latency. */
  readonly terminalOutcomeLatency: MailAnalyticsLatencyStatistic;
}

/**
 * Message-content metrics.
 *
 * @public
 */
export interface MailAnalyticsMessageContent {
  /** Task count. */
  readonly taskCount: number;
  /** Logical message count. */
  readonly logicalMessageCount: number;
  /** Tasks per message. */
  readonly tasksPerMessage: MailAnalyticsRatio;
  /** Rendered-content task count. */
  readonly renderedContentTaskCount: number;
  /** Unique rendered-content count. */
  readonly uniqueRenderedContentCount: number;
  /** Tasks per rendered content. */
  readonly tasksPerRenderedContent: MailAnalyticsRatio;
  /** Tasks-per-message distribution. */
  readonly tasksPerMessageDistribution: readonly MailAnalyticsCountBin[];
}

/**
 * The lifecycle report.
 *
 * @public
 */
export interface MailAnalyticsLifecycle {
  /** Cohort start. */
  readonly startAt: string;
  /** Cohort end. */
  readonly endAt: string;
  /** Observation end. */
  readonly observationEndAt: string;
  /** Bucket granularity. */
  readonly bucketGranularity: MailAnalyticsBucketGranularity;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** The cohort. */
  readonly cohort: MailAnalyticsLifecycleCohort;
  /** The funnel. */
  readonly funnel: MailAnalyticsLifecycleFunnel;
  /** The retry report. */
  readonly retry: MailAnalyticsRetry;
  /** The latency set. */
  readonly latency: MailAnalyticsLatencySet;
  /** The time series. */
  readonly timeSeries: readonly MailAnalyticsLifecycleTimePoint[];
  /** Latency by size. */
  readonly latencyBySize: readonly MailAnalyticsLatencyBySize[];
  /** Message-content metrics. */
  readonly messageContent: MailAnalyticsMessageContent;
}

/**
 * A domain failure status.
 *
 * @public
 */
export interface MailAnalyticsDomainFailureStatus {
  /** The channel. */
  readonly channel: string;
  /** SMTP status code. */
  readonly smtpStatusCode: number;
  /** Enhanced status code. */
  readonly enhancedStatusCode: string;
  /** Application status code. */
  readonly applicationStatusCode: number;
  /** Count. */
  readonly count: number;
}

/**
 * A domain lifecycle item.
 *
 * @public
 */
export interface MailAnalyticsDomainLifecycleItem {
  /** The recipient domain. */
  readonly recipientDomain: string;
  /** Created tasks. */
  readonly createdTasks: number;
  /** Succeeded tasks. */
  readonly succeededTasks: number;
  /** Failed tasks. */
  readonly failedTasks: number;
  /** Expired tasks. */
  readonly expiredTasks: number;
  /** Suppressed tasks. */
  readonly suppressedTasks: number;
  /** Delivery success rate. */
  readonly deliverySuccessRate: MailAnalyticsRate;
  /** Retry rate. */
  readonly retryRate: MailAnalyticsRate;
  /** Terminal-observed rate. */
  readonly terminalObservedRate: MailAnalyticsRate;
  /** Successful-delivery latency. */
  readonly successfulDeliveryLatency: MailAnalyticsLatencyStatistic;
}

/**
 * The domain-lifecycle report.
 *
 * @public
 */
export interface MailAnalyticsDomainLifecycle {
  /** Cohort start. */
  readonly startAt: string;
  /** Cohort end. */
  readonly endAt: string;
  /** Observation end. */
  readonly observationEndAt: string;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** Applied limit. */
  readonly limit: number;
  /** Total created tasks. */
  readonly totalCreatedTasks: number;
  /** Created tasks in the "other" bucket. */
  readonly otherCreatedTasks: number;
  /** The domain items. */
  readonly items: readonly MailAnalyticsDomainLifecycleItem[];
  /** Failure statuses. */
  readonly failureStatuses: readonly MailAnalyticsDomainFailureStatus[];
}

/**
 * A task-size bucket.
 *
 * @public
 */
export interface MailAnalyticsTaskSizeBucket {
  /** Bucket start. */
  readonly bucketStart: string;
  /** Bucket end. */
  readonly bucketEnd: string;
  /** Number of samples. */
  readonly sampleCount: number;
  /** Average bytes. */
  readonly averageBytes: number;
  /** 50th percentile bytes. */
  readonly p50Bytes: number;
  /** 90th percentile bytes. */
  readonly p90Bytes: number;
  /** 95th percentile bytes. */
  readonly p95Bytes: number;
  /** 99th percentile bytes. */
  readonly p99Bytes: number;
}

/**
 * The task-size statistics report.
 *
 * @public
 */
export interface MailAnalyticsTaskSizeStatistics {
  /** Interval start. */
  readonly startAt: string;
  /** Interval end. */
  readonly endAt: string;
  /** When the query ran. */
  readonly queriedAt: string;
  /** Eventually-consistent notice. */
  readonly eventualConsistencyNotice: string;
  /** Bucket granularity. */
  readonly bucketGranularity: MailAnalyticsBucketGranularity;
  /** The task-size buckets. */
  readonly buckets: readonly MailAnalyticsTaskSizeBucket[];
}
