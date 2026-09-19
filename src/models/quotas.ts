/**
 * Tenant quota models.
 *
 * @packageDocumentation
 */

/**
 * Summary of the guardrail profile in effect.
 *
 * @public
 */
export interface TenantQuotaGuardrailProfile {
  /** Profile identifier. */
  readonly id: string;
  /** Profile reference. */
  readonly profileRef: string;
  /** Human-readable profile name. */
  readonly displayName: string;
  /** Whether the profile is active. */
  readonly isActive: boolean;
}

/**
 * Current resource usage against quotas.
 *
 * @public
 */
export interface TenantQuotaUsage {
  /** Submission listeners in use. */
  readonly submissionListeners: number;
  /** MTA listeners in use. */
  readonly mtaListeners: number;
  /** Domains in use. */
  readonly domains: number;
  /** Inbound routes in use. */
  readonly inboundRoutes: number;
  /** API keys in use. */
  readonly apiKeys: number;
  /** Routing rules in use. */
  readonly routingRules: number;
  /** SMTP relays in use. */
  readonly smtpRelays: number;
  /** Storage integrations in use. */
  readonly storageIntegrations: number;
  /** Webhook endpoints in use. */
  readonly webhookEndpoints: number;
  /** Auto-reply templates in use. */
  readonly autoReplyTemplates: number;
  /** Identity providers in use. */
  readonly identityProviders: number;
  /** Manual suppressions in use. */
  readonly manualTenantSuppressions: number;
  /** Recipient sets in use. */
  readonly recipientSets: number;
  /** Recipient-set members in use. */
  readonly recipientSetMembers: number;
  /** Dedicated IP leases in use. */
  readonly dedicatedIpLeases: number;
  /** Dedicated IP addresses in use. */
  readonly dedicatedIpAddresses: number;
}

/**
 * Effective quotas after merging the guardrail profile with tenant overrides.
 *
 * `null` means the quota is unlimited or not configured.
 *
 * @public
 */
export interface EffectiveTenantQuotas {
  /** Source profile identifier. */
  readonly profileId: string;
  /** Source profile reference. */
  readonly profileRef: string;
  /** Source profile name. */
  readonly profileDisplayName: string;
  /** Whether the source profile is active. */
  readonly profileIsActive: boolean;
  /** Maximum submission listeners. */
  readonly maxSubmissionListeners: number | null;
  /** Maximum MTA listeners. */
  readonly maxMtaListeners: number | null;
  /** Maximum domains. */
  readonly maxDomains: number | null;
  /** Maximum inbound routes. */
  readonly maxInboundRoutes: number | null;
  /** Maximum API keys. */
  readonly maxApiKeys: number | null;
  /** Maximum API keys per listener. */
  readonly maxApiKeysPerListener: number | null;
  /** Maximum routing rules. */
  readonly maxRoutingRules: number | null;
  /** Maximum routing rules per listener. */
  readonly maxRoutingRulesPerListener: number | null;
  /** Maximum SMTP relays. */
  readonly maxSmtpRelays: number | null;
  /** Maximum storage integrations. */
  readonly maxStorageIntegrations: number | null;
  /** Maximum webhook endpoints. */
  readonly maxWebhookEndpoints: number | null;
  /** Maximum auto-reply templates. */
  readonly maxAutoReplyTemplates: number | null;
  /** Maximum identity providers. */
  readonly maxIdentityProviders: number | null;
  /** Maximum manual suppressions. */
  readonly maxManualTenantSuppressions: number | null;
  /** Maximum recipient sets. */
  readonly maxRecipientSets: number | null;
  /** Maximum recipient-set members. */
  readonly maxRecipientSetMembers: number | null;
  /** Maximum recipient-set members per set. */
  readonly maxRecipientSetMembersPerSet: number | null;
  /** Maximum dedicated IP leases. */
  readonly maxDedicatedIpLeases: number | null;
  /** Maximum dedicated IP addresses. */
  readonly maxDedicatedIpAddresses: number | null;
  /** Submission base recipient rate per minute. */
  readonly submissionBaseRecipientRatePerMinute: number | null;
  /** Submission burst. */
  readonly submissionBurst: number | null;
  /** Submission maximum concurrency. */
  readonly submissionMaxConcurrency: number | null;
  /** Submission minimum rate multiplier. */
  readonly submissionMinRateMultiplier: number | null;
  /** MTA message rate per minute. */
  readonly mtaMessageRatePerMinute: number | null;
  /** MTA recipient rate per minute. */
  readonly mtaRecipientRatePerMinute: number | null;
  /** MTA task rate per minute. */
  readonly mtaTaskRatePerMinute: number | null;
  /** MTA burst. */
  readonly mtaBurst: number | null;
  /** MTA maximum concurrency. */
  readonly mtaMaxConcurrency: number | null;
  /** Whether MTA rspamd scanning is enabled. */
  readonly mtaRspamdScanningEnabled: boolean | null;
  /** Reputation recovery target score. */
  readonly reputationRecoveryTargetScore: number | null;
  /** Reputation spam-complaint weight. */
  readonly reputationSpamComplaintWeight: number | null;
  /** Reputation policy-violation weight. */
  readonly reputationPolicyViolationWeight: number | null;
  /** Reputation hard-bounce weight. */
  readonly reputationHardBounceWeight: number | null;
  /** Reputation unsubscribe weight. */
  readonly reputationUnsubscribeWeight: number | null;
  /** Reputation negative-streak bonus cap. */
  readonly reputationNegativeStreakBonusCap: number | null;
  /** Reputation unsubscribe window, in seconds. */
  readonly reputationUnsubscribeWindowSeconds: number | null;
  /** Reputation unsubscribe threshold. */
  readonly reputationUnsubscribeThreshold: number | null;
  /** Reputation recovery quiet period, in seconds. */
  readonly reputationRecoveryQuietPeriodSeconds: number | null;
  /** Reputation recovery successes per point. */
  readonly reputationRecoverySuccessesPerPoint: number | null;
  /** Whether abuse control is enabled. */
  readonly abuseControlEnabled: boolean | null;
  /** Whether abuse auto-pause is enabled. */
  readonly abuseAutoPauseEnabled: boolean | null;
  /** Abuse evaluation window, in seconds. */
  readonly abuseEvaluationWindowSeconds: number | null;
  /** Abuse minimum egress tasks. */
  readonly abuseMinEgressTasks: number | null;
  /** Abuse suppressed-send-rate threshold. */
  readonly abuseSuppressedSendRateThreshold: number | null;
  /** Abuse suppression-applied-rate threshold. */
  readonly abuseSuppressionAppliedRateThreshold: number | null;
  /** Abuse spam-complaint-rate threshold. */
  readonly abuseSpamComplaintRateThreshold: number | null;
  /** Abuse hard-bounce-rate threshold. */
  readonly abuseHardBounceRateThreshold: number | null;
  /** Abuse policy-violation-rate threshold. */
  readonly abusePolicyViolationRateThreshold: number | null;
  /** Abuse unsubscribe-rate threshold. */
  readonly abuseUnsubscribeRateThreshold: number | null;
  /** Abuse low-reputation-score threshold. */
  readonly abuseLowReputationScoreThreshold: number | null;
}

/**
 * Effective tenant quota state, usage, and over-limit flags.
 *
 * @public
 */
export interface TenantQuota {
  /** Tenant identifier. */
  readonly tenantId: string;
  /** Tenant slug. */
  readonly tenantSlug: string;
  /** The guardrail profile in effect. */
  readonly guardrailProfile: TenantQuotaGuardrailProfile;
  /** Effective quotas. */
  readonly effective: EffectiveTenantQuotas;
  /** Current usage. */
  readonly usage: TenantQuotaUsage;
  /** Map of quota name to whether it is over limit. */
  readonly overLimit: Readonly<Record<string, boolean>>;
}
