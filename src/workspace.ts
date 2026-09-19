/**
 * A tenant-bound view of the control plane.
 */

import { AutoReplyTemplatesClient } from "./auto-reply-templates/client.js";
import type { AdminClient, RequestOptions } from "./client.js";
import { DomainsClient } from "./domains/client.js";
import { GovernanceClient } from "./governance/client.js";
import { IdentityProvidersClient } from "./identity-providers/client.js";
import { InboundRoutesClient } from "./inbound-routes/client.js";
import { ListenersClient } from "./listeners/client.js";
import { MailAnalyticsClient } from "./mail-analytics/client.js";
import type { Tenant } from "./models/tenant.js";
import { MtaRateLimitsClient } from "./mta-rate-limits/client.js";
import { QuotasClient } from "./quotas/client.js";
import { RecipientSetsClient } from "./recipient-sets/client.js";
import { SmtpForwardDestinationsClient } from "./smtp-forward-destinations/client.js";
import { SmtpRelaysClient } from "./smtp-relays/client.js";
import { StorageIntegrationsClient } from "./storage-integrations/client.js";
import { SuppressionsClient } from "./suppressions/client.js";
import { WebhookEndpointsClient } from "./webhook-endpoints/client.js";

/** Construction options for a {@link Workspace}. @public */
export interface WorkspaceOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug this workspace is bound to. */
  readonly slug: string;
}

/**
 * A tenant-bound view of the control plane.
 *
 * Obtain one from `AdminClient.workspace` and reach every tenant-scoped resource
 * family from it, without repeating the tenant slug on every call. A workspace
 * is a lightweight binding: creating one per request is cheap.
 *
 * @example
 * ```ts
 * const ws = admin.workspace("my-workspace");
 * const tenant = await ws.tenant();
 * for await (const domain of ws.domains().list()) {
 *   console.log(domain.domainName);
 * }
 * ```
 *
 * @public
 */
export class Workspace {
  /** The tenant slug this workspace is bound to. */
  readonly slug: string;

  readonly #client: AdminClient;

  /**
   * @param options - The underlying admin client and the tenant slug.
   *
   * @public
   */
  constructor(options: WorkspaceOptions) {
    this.#client = options.client;
    this.slug = options.slug;
  }

  /**
   * Fetches this workspace's identity and provisioning state.
   *
   * @param options - Optional cancellation signal.
   * @returns The tenant record.
   * @throws `NotFoundException` When the tenant is not visible.
   *
   * @public
   */
  async tenant(options?: RequestOptions): Promise<Tenant> {
    const path = `/tenants/${encodeURIComponent(this.slug)}`;
    return (await this.#client.get(path, undefined, options)).as<Tenant>();
  }

  /**
   * Accesses the domain resource family.
   *
   * @returns A client for domain operations in this workspace.
   *
   * @public
   */
  domains(): DomainsClient {
    return new DomainsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the inbound-route resource family.
   *
   * @returns A client for inbound-route operations in this workspace.
   *
   * @public
   */
  inboundRoutes(): InboundRoutesClient {
    return new InboundRoutesClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the listener resource family.
   *
   * @returns A client for listener operations in this workspace.
   *
   * @public
   */
  listeners(): ListenersClient {
    return new ListenersClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the identity-provider resource family.
   *
   * @returns A client for identity-provider operations in this workspace.
   *
   * @public
   */
  identityProviders(): IdentityProvidersClient {
    return new IdentityProvidersClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the governance resource family.
   *
   * @returns A client for governance operations in this workspace.
   *
   * @public
   */
  governance(): GovernanceClient {
    return new GovernanceClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the mail-analytics resource family.
   *
   * @returns A client for mail-analytics operations in this workspace.
   *
   * @public
   */
  mailAnalytics(): MailAnalyticsClient {
    return new MailAnalyticsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the recipient-set resource family.
   *
   * @returns A client for recipient-set operations in this workspace.
   *
   * @public
   */
  recipientSets(): RecipientSetsClient {
    return new RecipientSetsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the auto-reply-template resource family.
   *
   * @returns A client for auto-reply-template operations in this workspace.
   *
   * @public
   */
  autoReplyTemplates(): AutoReplyTemplatesClient {
    return new AutoReplyTemplatesClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the SMTP forward-destination resource family.
   *
   * @returns A client for SMTP forward-destination operations in this workspace.
   *
   * @public
   */
  smtpForwardDestinations(): SmtpForwardDestinationsClient {
    return new SmtpForwardDestinationsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the suppression resource family.
   *
   * @returns A client for suppression operations in this workspace.
   *
   * @public
   */
  suppressions(): SuppressionsClient {
    return new SuppressionsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the SMTP relay resource family.
   *
   * @returns A client for SMTP relay operations in this workspace.
   *
   * @public
   */
  smtpRelays(): SmtpRelaysClient {
    return new SmtpRelaysClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the storage-integration resource family.
   *
   * @returns A client for storage-integration operations in this workspace.
   *
   * @public
   */
  storageIntegrations(): StorageIntegrationsClient {
    return new StorageIntegrationsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the webhook-endpoint resource family.
   *
   * @returns A client for webhook-endpoint operations in this workspace.
   *
   * @public
   */
  webhookEndpoints(): WebhookEndpointsClient {
    return new WebhookEndpointsClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the tenant quota family.
   *
   * @returns A client for quota operations in this workspace.
   *
   * @public
   */
  quotas(): QuotasClient {
    return new QuotasClient({ client: this.#client, tenantSlug: this.slug });
  }

  /**
   * Accesses the tenant MTA rate-limit family.
   *
   * @returns A client for MTA rate-limit operations in this workspace.
   *
   * @public
   */
  mtaRateLimits(): MtaRateLimitsClient {
    return new MtaRateLimitsClient({ client: this.#client, tenantSlug: this.slug });
  }
}
