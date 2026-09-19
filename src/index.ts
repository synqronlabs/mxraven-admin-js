/**
 * TypeScript SDK for the mxRaven control-plane admin API.
 *
 * The admin SDK manages a workspace end to end: domains, listeners, routing
 * rules, API keys, suppressions, recipient sets, auto-reply templates,
 * forwarding destinations, inbound routes, relays, storage integrations, webhook
 * endpoints, identity providers, quotas, rate limits, governance, and mail
 * analytics, plus the public auth login context.
 *
 * It is the TypeScript counterpart of the Java SDK at
 * {@link https://github.com/synqronlabs/mxraven-java/tree/main/admin} and
 * exposes the same capabilities behind an idiomatic TypeScript API.
 *
 * @packageDocumentation
 */

export { AuthClient } from "./auth/client.js";
export type { AuthClientOptions } from "./auth/client.js";
export { AdminClient } from "./client.js";
export type { AdminClientOptions, FetchLike, QueryValues, RequestOptions } from "./client.js";
export { DomainsClient } from "./domains/client.js";
export type { DomainsClientOptions, ListDomainsOptions } from "./domains/client.js";
export { Domain } from "./domains/entity.js";
export { Entity } from "./entity.js";
export type { EntityOptions } from "./entity.js";
export {
  ApiException,
  AuthenticationException,
  BadRequestException,
  ConflictException,
  MxRavenError,
  NotFoundException,
  PermissionDeniedException,
  RateLimitException,
  ServerException,
  ValidationException,
} from "./errors.js";
export type { ApiExceptionOptions, Problem, ProblemError } from "./errors.js";
export { dnsRecordType, domainStatus } from "./models/domains.js";
export type {
  CreateDomainRequest,
  DnsInstructionRecord,
  DnsRecordType,
  DomainData,
  DomainListenerGrant,
  DomainStatus,
  ReplaceDomainRequest,
} from "./models/domains.js";
export {
  listenerType,
  streamType,
  terminalActionPayload,
  terminalActionType,
} from "./models/listeners.js";
export type {
  CreateListenerRequest,
  ListenerData,
  ListenerType,
  StreamType,
  TerminalActionPayload,
  TerminalActionType,
  UpdateListenerDefaultTerminalActionRequest,
  UpdateListenerRequest,
  UpdateListenerRspamdScanningRequest,
} from "./models/listeners.js";
export { sendingDomainSubdomainScope } from "./models/sending-domain.js";
export type {
  ReplaceSendingDomainPolicyRequest,
  SendingDomainPolicy,
  SendingDomainPolicyGrant,
  SendingDomainPolicyGrantRequest,
  SendingDomainSubdomainScope,
} from "./models/sending-domain.js";
export {
  modifyHeaderOp,
  modifyHeaderOperation,
  routingRuleAction,
  routingRuleActionKind,
} from "./models/routing-rules.js";
export type {
  CreateRoutingRuleRequest,
  ModifyHeaderOp,
  ModifyHeaderOperation,
  ReplaceRoutingRuleRequest,
  ReorderRoutingRuleRequest,
  RoutingRuleAction,
  RoutingRuleActionKind,
  RoutingRuleData,
  RoutingRulePayload,
  SetRoutingRuleActiveRequest,
} from "./models/routing-rules.js";
export type { APIKeyData, IssuedAPIKey } from "./models/api-keys.js";
export { auditActorKind, auditStatus, tenantSearchResourceType } from "./models/governance.js";
export type {
  AuditActorKind,
  AuditLog,
  AuditStatus,
  TenantDedicatedIPPool,
  TenantResourceSearchResult,
  TenantSearchResourceType,
} from "./models/governance.js";
export { GovernanceClient } from "./governance/client.js";
export type {
  GovernanceClientOptions,
  ListAuditLogOptions,
  SearchResourcesOptions,
} from "./governance/client.js";
export {
  mailAnalyticsBucketGranularity,
  mailAnalyticsDimension,
  mailAnalyticsListenerState,
  mailAnalyticsMetric,
  mailAnalyticsOutcome,
  mailAnalyticsResourceState,
  mailAnalyticsSizeBin,
  mailAnalyticsTimezone,
} from "./models/mail-analytics.js";
export type {
  MailAnalyticsAcceptedMessages,
  MailAnalyticsActivityHeatmap,
  MailAnalyticsActivityHeatmapCell,
  MailAnalyticsBreakdown,
  MailAnalyticsBreakdownItem,
  MailAnalyticsBucketGranularity,
  MailAnalyticsComparison,
  MailAnalyticsComparisonPeriod,
  MailAnalyticsCountBin,
  MailAnalyticsDimension,
  MailAnalyticsDomainFailureStatus,
  MailAnalyticsDomainLifecycle,
  MailAnalyticsDomainLifecycleItem,
  MailAnalyticsFeedback,
  MailAnalyticsLatencyBySize,
  MailAnalyticsLatencyMetric,
  MailAnalyticsLatencySet,
  MailAnalyticsLatencyStatistic,
  MailAnalyticsLifecycle,
  MailAnalyticsLifecycleCohort,
  MailAnalyticsLifecycleFunnel,
  MailAnalyticsLifecycleTimePoint,
  MailAnalyticsListenerBreakdown,
  MailAnalyticsListenerBreakdownItem,
  MailAnalyticsListenerState,
  MailAnalyticsMessageContent,
  MailAnalyticsMetric,
  MailAnalyticsMetrics,
  MailAnalyticsOutcome,
  MailAnalyticsOutcomeLatency,
  MailAnalyticsOverview,
  MailAnalyticsRate,
  MailAnalyticsRatio,
  MailAnalyticsResourceState,
  MailAnalyticsRetry,
  MailAnalyticsSeries,
  MailAnalyticsSeriesItem,
  MailAnalyticsSeriesPoint,
  MailAnalyticsSizeBin,
  MailAnalyticsSMTPResponses,
  MailAnalyticsTaskSizeBucket,
  MailAnalyticsTaskSizeStatistics,
  MailAnalyticsTerminalOutcomes,
  MailAnalyticsTimePoint,
  MailAnalyticsTimezone,
} from "./models/mail-analytics.js";
export { MailAnalyticsClient } from "./mail-analytics/client.js";
export type {
  BreakdownOptions,
  DomainLifecycleOptions,
  IntervalOptions,
  LifecycleOptions,
  MailAnalyticsClientOptions,
} from "./mail-analytics/client.js";
export {
  azureAdTenantType,
  identityProviderLifecycleStatus,
  identityProviderType,
  idpAutoLinking,
  samlBinding,
  samlNameIdFormat,
  samlSignatureAlgorithm,
} from "./models/identity.js";
export type {
  AzureAdTenantType,
  CreateTenantAppleIdentityProviderRequest,
  CreateTenantAzureAdIdentityProviderRequest,
  CreateTenantGitHubEnterpriseServerIdentityProviderRequest,
  CreateTenantGitHubIdentityProviderRequest,
  CreateTenantGitLabIdentityProviderRequest,
  CreateTenantGitLabSelfHostedIdentityProviderRequest,
  CreateTenantGoogleIdentityProviderRequest,
  CreateTenantIdentityProviderRequest,
  CreateTenantJwtIdentityProviderRequest,
  CreateTenantLdapIdentityProviderRequest,
  CreateTenantOAuthIdentityProviderRequest,
  CreateTenantSamlIdentityProviderRequest,
  IdentityAccessClaim,
  IdentityProviderLifecycleStatus,
  IdentityProviderType,
  IdentityProvisioning,
  IdpAutoLinking,
  LdapAttributes,
  ProviderOptions,
  SamlBinding,
  SamlNameIdFormat,
  SamlSignatureAlgorithm,
  TenantIdentityProviderData,
  UpdateIdentityProviderAutoGrantRequest,
  UpdateIdentityProvisioningRequest,
} from "./models/identity.js";
export { IdentityProvidersClient } from "./identity-providers/client.js";
export type {
  IdentityProvidersClientOptions,
  ListIdentityProvidersOptions,
} from "./identity-providers/client.js";
export { TenantIdentityProvider } from "./identity-providers/entity.js";
export { ApiKeysClient, APIKey } from "./listeners/api-keys.js";
export type { ApiKeysClientOptions } from "./listeners/api-keys.js";
export { ListenersClient } from "./listeners/client.js";
export type { ListenersClientOptions, ListListenersOptions } from "./listeners/client.js";
export { Listener } from "./listeners/entity.js";
export { ListenerMtaRateLimitClient } from "./listeners/mta-rate-limit.js";
export type { ListenerMtaRateLimitClientOptions } from "./listeners/mta-rate-limit.js";
export { RoutingRule, RoutingRulesClient } from "./listeners/routing-rules.js";
export type {
  ListRoutingRulesOptions,
  RoutingRulesClientOptions,
} from "./listeners/routing-rules.js";
export { SendingDomainPoliciesClient } from "./listeners/sending-domain-policy.js";
export type { SendingDomainPoliciesClientOptions } from "./listeners/sending-domain-policy.js";
export { tenantProvisioningState, tenantStatus } from "./models/tenant.js";
export type {
  Tenant,
  TenantLoginContext,
  TenantProvisioningState,
  TenantStatus,
} from "./models/tenant.js";
export { Page, Paged } from "./pagination.js";
export type { PageFetcher, PageOptions, PagedOptions } from "./pagination.js";
export { MIN_SEARCH_LENGTH } from "./query.js";
export type { ListOptions } from "./list.js";
export { defaultRateLimitConfig, disabledRateLimitConfig } from "./rate-limit.js";
export type { RateLimitConfig } from "./rate-limit.js";
export { Response } from "./response.js";
export type { ResponseOptions } from "./response.js";
export { Workspace } from "./workspace.js";
export type { WorkspaceOptions } from "./workspace.js";
export { AutoReplyTemplatesClient } from "./auto-reply-templates/client.js";
export type {
  AutoReplyTemplatesClientOptions,
  ListAutoReplyTemplatesOptions,
} from "./auto-reply-templates/client.js";
export { AutoReplyTemplate } from "./auto-reply-templates/entity.js";
export { InboundRoutesClient } from "./inbound-routes/client.js";
export type {
  InboundRoutesClientOptions,
  ListInboundRoutesOptions,
} from "./inbound-routes/client.js";
export { InboundRoute } from "./inbound-routes/entity.js";
export { autoReplySenderReadinessStatus } from "./models/auto-reply.js";
export type {
  AutoReplySenderReadiness,
  AutoReplySenderReadinessStatus,
  AutoReplyTemplateContentSummary,
  AutoReplyTemplateData,
  AutoReplyTemplateHeader,
  CreateAutoReplyTemplateRequest,
  MaskedTemplateField,
  SetAutoReplyTemplateActiveRequest,
  UpdateAutoReplyTemplateRequest,
} from "./models/auto-reply.js";
export { inboundRouteVerificationStatus } from "./models/inbound-routes.js";
export type {
  CreateInboundRouteRequest,
  InboundRouteData,
  InboundRouteVerificationStatus,
  UpdateInboundRouteRequest,
} from "./models/inbound-routes.js";
export type {
  CreateRecipientSetRequest,
  RecipientSetBatchResult,
  RecipientSetData,
  RecipientSetMemberData,
  RecipientSetMemberRequest,
  RecipientSetMembersBatchRequest,
  UpdateRecipientSetRequest,
} from "./models/recipient-sets.js";
export {
  smtpForwardDestinationVerificationMethod,
  smtpForwardDestinationVerificationStatus,
  smtpForwardVerificationDeliveryStatus,
} from "./models/smtp-forward.js";
export type {
  ConfirmSmtpForwardDestinationRequest,
  CreateSmtpForwardDestinationRequest,
  SmtpForwardDestinationConfirmation,
  SmtpForwardDestinationData,
  SmtpForwardDestinationVerificationMethod,
  SmtpForwardDestinationVerificationStatus,
  SmtpForwardVerificationDeliveryStatus,
} from "./models/smtp-forward.js";
export { suppressionReason } from "./models/suppressions.js";
export type {
  CreateTenantSuppressionRequest,
  SuppressionReason,
  TenantSuppressionData,
  UpdateTenantSuppressionRequest,
} from "./models/suppressions.js";
export { RecipientSetMembersClient, RecipientSetsClient } from "./recipient-sets/client.js";
export type {
  ListRecipientSetMembersOptions,
  ListRecipientSetsOptions,
  RecipientSetMembersClientOptions,
  RecipientSetsClientOptions,
} from "./recipient-sets/client.js";
export { RecipientSet, RecipientSetMember } from "./recipient-sets/entity.js";
export { SmtpForwardDestinationsClient } from "./smtp-forward-destinations/client.js";
export type {
  ListSmtpForwardDestinationsOptions,
  SmtpForwardDestinationsClientOptions,
} from "./smtp-forward-destinations/client.js";
export { SmtpForwardDestination } from "./smtp-forward-destinations/entity.js";
export { SuppressionsClient } from "./suppressions/client.js";
export type { ListSuppressionsOptions, SuppressionsClientOptions } from "./suppressions/client.js";
export { TenantSuppression } from "./suppressions/entity.js";
export type { SetIntegrationActiveRequest } from "./models/integrations.js";
export { mtaRateLimitScope, mtaRateLimitSource } from "./models/mta-rate-limits.js";
export type {
  MTARateLimitOverride,
  MTARateLimitPolicy,
  MtaRateLimitScope,
  MtaRateLimitSource,
} from "./models/mta-rate-limits.js";
export type {
  EffectiveTenantQuotas,
  TenantQuota,
  TenantQuotaGuardrailProfile,
  TenantQuotaUsage,
} from "./models/quotas.js";
export type {
  CreateSmtpRelayRequest,
  SmtpRelayData,
  UpdateSmtpRelayRequest,
} from "./models/smtp-relays.js";
export type {
  CreateStorageIntegrationRequest,
  StorageIntegrationData,
  UpdateStorageIntegrationRequest,
} from "./models/storage-integrations.js";
export { webhookDeliveryKind } from "./models/webhooks.js";
export type {
  CreateWebhookEndpointRequest,
  IssuedWebhookEndpoint,
  UpdateWebhookEndpointRequest,
  WebhookDelivery,
  WebhookDeliveryKind,
  WebhookEndpointData,
} from "./models/webhooks.js";
export { MtaRateLimitsClient } from "./mta-rate-limits/client.js";
export type { MtaRateLimitsClientOptions } from "./mta-rate-limits/client.js";
export { QuotasClient } from "./quotas/client.js";
export type { QuotasClientOptions } from "./quotas/client.js";
export { SmtpRelaysClient } from "./smtp-relays/client.js";
export type { SmtpRelaysClientOptions } from "./smtp-relays/client.js";
export { SmtpRelay } from "./smtp-relays/entity.js";
export { StorageIntegrationsClient } from "./storage-integrations/client.js";
export type { StorageIntegrationsClientOptions } from "./storage-integrations/client.js";
export { StorageIntegration } from "./storage-integrations/entity.js";
export { WebhookDeliveriesClient, WebhookEndpointsClient } from "./webhook-endpoints/client.js";
export type {
  WebhookDeliveriesClientOptions,
  WebhookEndpointsClientOptions,
} from "./webhook-endpoints/client.js";
export { WebhookEndpoint } from "./webhook-endpoints/entity.js";
