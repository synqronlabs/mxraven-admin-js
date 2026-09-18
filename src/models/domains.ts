/**
 * Domain onboarding and DNS verification models.
 *
 * @packageDocumentation
 */

import type { ListenerType, StreamType } from "./listeners.js";
import type { SendingDomainSubdomainScope } from "./sending-domain.js";

/**
 * Lifecycle status of a tenant domain.
 *
 * @public
 */
export const domainStatus = {
  /** The domain is awaiting DNS verification. */
  pending: "pending",
  /** The domain is verified. */
  verified: "verified",
  /** The domain is suspended. */
  suspended: "suspended",
} as const;

/**
 * Lifecycle status of a tenant domain.
 *
 * @public
 */
export type DomainStatus = (typeof domainStatus)[keyof typeof domainStatus];

/**
 * DNS record type.
 *
 * @public
 */
export const dnsRecordType = {
  /** Canonical-name alias record. */
  cname: "CNAME",
  /** Free-form text record. */
  txt: "TXT",
  /** Mail-exchange record. */
  mx: "MX",
} as const;

/**
 * DNS record type.
 *
 * @public
 */
export type DnsRecordType = (typeof dnsRecordType)[keyof typeof dnsRecordType];

/**
 * One customer-facing DNS instruction required to onboard a domain.
 *
 * @public
 */
export interface DnsInstructionRecord {
  /** Optional human-readable purpose. */
  readonly purpose?: string | null;
  /** Record host/name. */
  readonly name: string;
  /** The record type. */
  readonly type: DnsRecordType;
  /** Record value/target. */
  readonly value: string;
  /** Optional MX priority. */
  readonly priority?: number | null;
  /** Whether the record is currently verified. */
  readonly verified?: boolean | null;
}

/**
 * A listener authorized to send from a domain.
 *
 * @public
 */
export interface DomainListenerGrant {
  /** Identifier of the granted listener. */
  readonly listenerId: string;
  /** Human-readable listener name. */
  readonly listenerDisplayName: string;
  /** Always `submission` in v2. */
  readonly listenerType: ListenerType;
  /** The mail stream the listener serves. */
  readonly streamType: StreamType;
  /** The domain lifecycle status. */
  readonly domainStatus: DomainStatus;
  /** The subdomain scope of the grant. */
  readonly subdomainScope: SendingDomainSubdomainScope;
}

/**
 * Wire representation of a tenant domain and its DNS verification state.
 *
 * Prefer the `Domain` entity, which exposes this data plus the domain's
 * operations.
 *
 * @public
 */
export interface DomainData {
  /** Domain identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Domain name. */
  readonly domainName: string;
  /** DNS ownership verification token. */
  readonly verificationToken: string;
  /** Whether outbound sending is enabled. */
  readonly sendingEnabled: boolean;
  /** Active DKIM selector. */
  readonly dkimActiveSelector: string;
  /** Whether SPF is verified. */
  readonly spfVerified: boolean;
  /** Whether DKIM is verified. */
  readonly dkimVerified: boolean;
  /** Whether DMARC is verified. */
  readonly dmarcVerified: boolean;
  /** Optional DMARC aggregate report mailbox. */
  readonly dmarcReportAddress?: string | null;
  /** Timestamp of the last DNS check. */
  readonly dnsLastCheckedAt?: string | null;
  /** Lifecycle status. */
  readonly status: DomainStatus;
  /** DNS records the customer must create. */
  readonly requiredCustomerRecords?: readonly DnsInstructionRecord[];
}

/**
 * Request body for `POST /v2/tenants/{slug}/domains`.
 *
 * @public
 */
export interface CreateDomainRequest {
  /** Domain to onboard for outbound sending. */
  readonly domainName: string;
  /** Optional DMARC aggregate report mailbox. */
  readonly dmarcReportAddress?: string | null;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/domains/{domain_id}`.
 *
 * This is a full replacement of the writable domain configuration; pass `null`
 * for `dmarcReportAddress` to clear it.
 *
 * @public
 */
export interface ReplaceDomainRequest {
  /** DMARC report address, or `null` to clear it. */
  readonly dmarcReportAddress: string | null;
}
