/**
 * Sending-domain scope and policy models.
 *
 * @packageDocumentation
 */

import type { DomainStatus } from "./domains.js";

/**
 * Subdomain scope of a sending-domain grant.
 *
 * @public
 */
export const sendingDomainSubdomainScope = {
  /** Applies to the exact domain only. */
  exact: "exact",
  /** Applies to the domain and its subdomains. */
  includeSubdomains: "include_subdomains",
} as const;

/**
 * Subdomain scope of a sending-domain grant.
 *
 * @public
 */
export type SendingDomainSubdomainScope =
  (typeof sendingDomainSubdomainScope)[keyof typeof sendingDomainSubdomainScope];

/**
 * Wire representation of a sending-domain policy.
 *
 * Runtime sending requires each granted domain to be `verified`.
 *
 * @public
 */
export interface SendingDomainPolicy {
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** The effective grants. */
  readonly grants: readonly SendingDomainPolicyGrant[];
}

/**
 * A granted sending domain.
 *
 * @public
 */
export interface SendingDomainPolicyGrant {
  /** Granted domain identifier. */
  readonly domainId: string;
  /** Granted domain name. */
  readonly domainName: string;
  /** The domain lifecycle status. */
  readonly domainStatus: DomainStatus;
  /** The subdomain scope of the grant. */
  readonly subdomainScope: SendingDomainSubdomainScope;
}

/**
 * A grant to submit when replacing the policy.
 *
 * @public
 */
export interface SendingDomainPolicyGrantRequest {
  /** Granted domain identifier. */
  readonly domainId: string;
  /** The subdomain scope of the grant. */
  readonly subdomainScope: SendingDomainSubdomainScope;
}

/**
 * Request body for `PUT .../sending-domain-policy`.
 *
 * @public
 */
export interface ReplaceSendingDomainPolicyRequest {
  /** The complete replacement grant set. */
  readonly grants: readonly SendingDomainPolicyGrantRequest[];
}
