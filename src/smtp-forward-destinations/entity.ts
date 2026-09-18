/**
 * The hydrated SMTP forward-destination entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type {
  SmtpForwardDestinationData,
  SmtpForwardDestinationVerificationMethod,
  SmtpForwardDestinationVerificationStatus,
  SmtpForwardVerificationDeliveryStatus,
} from "../models/smtp-forward.js";

/**
 * A verified SMTP forwarding destination.
 *
 * @public
 */
export class SmtpForwardDestination extends Entity<SmtpForwardDestinationData> {
  /** Destination identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable destination reference. @public */
  get destinationRef(): string {
    return this.data.destinationRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** The forwarding mailbox. @public */
  get emailAddress(): string {
    return this.data.emailAddress;
  }

  /** Verification status. @public */
  get verificationStatus(): SmtpForwardDestinationVerificationStatus {
    return this.data.verificationStatus;
  }

  /** Verification method. @public */
  get verificationMethod(): SmtpForwardDestinationVerificationMethod | null | undefined {
    return this.data.verificationMethod;
  }

  /** Verification-email delivery status. @public */
  get deliveryStatus(): SmtpForwardVerificationDeliveryStatus | null | undefined {
    return this.data.deliveryStatus;
  }

  /** When the destination was verified. @public */
  get verifiedAt(): string | null | undefined {
    return this.data.verifiedAt;
  }

  /** When delivery was requested. @public */
  get deliveryRequestedAt(): string | null | undefined {
    return this.data.deliveryRequestedAt;
  }

  /** When the verification email was sent. @public */
  get verificationEmailSentAt(): string | null | undefined {
    return this.data.verificationEmailSentAt;
  }

  /** Creation timestamp. @public */
  get createdAt(): string {
    return this.data.createdAt;
  }

  /** Last-update timestamp. @public */
  get updatedAt(): string {
    return this.data.updatedAt;
  }

  /**
   * Re-fetches this destination.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the destination is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<SmtpForwardDestination> {
    const data = (
      await this.client.get(this.path, undefined, options)
    ).as<SmtpForwardDestinationData>();
    return new SmtpForwardDestination({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Sends (or resends) the verification email.
   *
   * @param options - Optional cancellation signal.
   * @returns The refreshed destination.
   *
   * @public
   */
  async sendVerification(options?: RequestOptions): Promise<SmtpForwardDestination> {
    const data = (
      await this.client.post(`${this.path}/send-verification`, undefined, options)
    ).as<SmtpForwardDestinationData>();
    return new SmtpForwardDestination({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }
}
