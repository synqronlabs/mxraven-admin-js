/**
 * Inbound-route models.
 *
 * @packageDocumentation
 */

import type { DnsInstructionRecord } from "./domains.js";

/**
 * Verification status of an inbound route.
 *
 * @public
 */
export const inboundRouteVerificationStatus = {
  /** Awaiting DNS verification. */
  pending: "pending",
  /** Verified. */
  verified: "verified",
  /** Suspended. */
  suspended: "suspended",
} as const;

/**
 * Verification status of an inbound route.
 *
 * @public
 */
export type InboundRouteVerificationStatus =
  (typeof inboundRouteVerificationStatus)[keyof typeof inboundRouteVerificationStatus];

/**
 * Wire representation of an inbound route.
 *
 * @public
 */
export interface InboundRouteData {
  /** Route identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** The MTA listener that receives the mail. */
  readonly mtaListenerId: string;
  /** The routed recipient domain. */
  readonly domainName: string;
  /** Whether the route is verified. */
  readonly isVerified: boolean;
  /** Verification status. */
  readonly verificationStatus: InboundRouteVerificationStatus;
  /** Whether the TXT record is verified. */
  readonly txtVerified: boolean;
  /** Whether the MX record is verified. */
  readonly mxVerified: boolean;
  /** Timestamp of the last DNS check. */
  readonly dnsLastCheckedAt?: string | null;
  /** DNS ownership verification token. */
  readonly verificationToken: string;
  /** DNS records the customer must create. */
  readonly requiredCustomerRecords?: readonly DnsInstructionRecord[];
}

/**
 * Request body for `POST /v2/tenants/{slug}/inbound-routes`.
 *
 * @public
 */
export interface CreateInboundRouteRequest {
  /** The MTA listener that receives the mail. */
  readonly mtaListenerId: string;
  /** The routed recipient domain. */
  readonly domainName: string;
  /** When `true`, onboard an unclaimed inbound-only domain before creating the route. */
  readonly onboardDomainIfMissing?: boolean;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/inbound-routes/{id}`.
 *
 * @public
 */
export interface UpdateInboundRouteRequest {
  /** The MTA listener that receives the mail. */
  readonly mtaListenerId: string;
  /** The routed recipient domain. */
  readonly domainName: string;
}
