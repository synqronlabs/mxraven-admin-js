/**
 * The hydrated tenant domain entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type {
  DnsInstructionRecord,
  DomainData,
  DomainListenerGrant,
  DomainStatus,
} from "../models/domains.js";
import type { Paged } from "../pagination.js";

/**
 * A tenant domain and its DNS verification state.
 *
 * A domain must be verified and then granted to a submission listener through
 * its sending-domain policy before it can send. Reads return a snapshot; call
 * {@link Domain.reload} for fresh state.
 *
 * @example
 * ```ts
 * const domain = await ws.domains().create("example.com");
 * if (!domain.dkimVerified) {
 *   await domain.replace("dmarc@example.com");
 * }
 * for await (const grant of await domain.listenerGrants()) {
 *   console.log(grant.listenerDisplayName);
 * }
 * ```
 *
 * @public
 */
export class Domain extends Entity<DomainData> {
  /** The domain identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** The owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** The domain name. @public */
  get domainName(): string {
    return this.data.domainName;
  }

  /** The DNS ownership verification token. @public */
  get verificationToken(): string {
    return this.data.verificationToken;
  }

  /** Whether outbound sending is enabled. @public */
  get sendingEnabled(): boolean {
    return this.data.sendingEnabled;
  }

  /** The active DKIM selector. @public */
  get dkimActiveSelector(): string {
    return this.data.dkimActiveSelector;
  }

  /** Whether SPF is verified. @public */
  get spfVerified(): boolean {
    return this.data.spfVerified;
  }

  /** Whether DKIM is verified. @public */
  get dkimVerified(): boolean {
    return this.data.dkimVerified;
  }

  /** Whether DMARC is verified. @public */
  get dmarcVerified(): boolean {
    return this.data.dmarcVerified;
  }

  /** The optional DMARC aggregate report mailbox. @public */
  get dmarcReportAddress(): string | null | undefined {
    return this.data.dmarcReportAddress;
  }

  /** The timestamp of the last DNS check. @public */
  get dnsLastCheckedAt(): string | null | undefined {
    return this.data.dnsLastCheckedAt;
  }

  /** The lifecycle status. @public */
  get status(): DomainStatus {
    return this.data.status;
  }

  /** The DNS records the customer must create. @public */
  get requiredCustomerRecords(): readonly DnsInstructionRecord[] {
    return this.data.requiredCustomerRecords ?? [];
  }

  /**
   * Re-fetches this domain and returns a fresh snapshot.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh domain snapshot.
   * @throws `NotFoundException` When the domain is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<Domain> {
    const data = (await this.client.get(this.path, undefined, options)).as<DomainData>();
    return new Domain({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Replaces the writable domain configuration.
   *
   * @param dmarcReportAddress - The DMARC report address, or `null` to clear it.
   * @param options - Optional cancellation signal.
   * @returns The updated domain.
   * @throws `ValidationException` When the address is invalid.
   *
   * @public
   */
  async replace(dmarcReportAddress: string | null, options?: RequestOptions): Promise<Domain> {
    const request = { dmarcReportAddress };
    const data = (await this.client.put(this.path, request, options)).as<DomainData>();
    return new Domain({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Lists the listeners authorized to send from this domain.
   *
   * @param options - Optional cancellation signal.
   * @returns A lazily paginating collection of listener grants.
   * @throws `NotFoundException` When the domain is no longer visible.
   *
   * @public
   */
  listenerGrants(options?: RequestOptions): Promise<Paged<DomainListenerGrant>> {
    return this.client.paged<DomainListenerGrant>(
      `${this.path}/listener-grants`,
      undefined,
      options,
    );
  }
}
