/**
 * The hydrated inbound-route entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type { DnsInstructionRecord } from "../models/domains.js";
import type {
  InboundRouteData,
  InboundRouteVerificationStatus,
  UpdateInboundRouteRequest,
} from "../models/inbound-routes.js";

/**
 * A recipient-domain route into an MTA listener.
 *
 * @public
 */
export class InboundRoute extends Entity<InboundRouteData> {
  /** Route identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** The MTA listener that receives the mail. @public */
  get mtaListenerId(): string {
    return this.data.mtaListenerId;
  }

  /** The routed recipient domain. @public */
  get domainName(): string {
    return this.data.domainName;
  }

  /** Whether the route is verified. @public */
  get isVerified(): boolean {
    return this.data.isVerified;
  }

  /** Verification status. @public */
  get verificationStatus(): InboundRouteVerificationStatus {
    return this.data.verificationStatus;
  }

  /** Whether the TXT record is verified. @public */
  get txtVerified(): boolean {
    return this.data.txtVerified;
  }

  /** Whether the MX record is verified. @public */
  get mxVerified(): boolean {
    return this.data.mxVerified;
  }

  /** Timestamp of the last DNS check. @public */
  get dnsLastCheckedAt(): string | null | undefined {
    return this.data.dnsLastCheckedAt;
  }

  /** DNS ownership verification token. @public */
  get verificationToken(): string {
    return this.data.verificationToken;
  }

  /** DNS records the customer must create. @public */
  get requiredCustomerRecords(): readonly DnsInstructionRecord[] {
    return this.data.requiredCustomerRecords ?? [];
  }

  /**
   * Re-fetches this route.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the route is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<InboundRoute> {
    const data = (await this.client.get(this.path, undefined, options)).as<InboundRouteData>();
    return new InboundRoute({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces the route's listener and domain.
   *
   * @param request - The new MTA listener and recipient domain.
   * @param options - Optional cancellation signal.
   * @returns The updated route.
   *
   * @public
   */
  async update(
    request: UpdateInboundRouteRequest,
    options?: RequestOptions,
  ): Promise<InboundRoute> {
    const data = (await this.client.put(this.path, request, options)).as<InboundRouteData>();
    return new InboundRoute({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }
}
