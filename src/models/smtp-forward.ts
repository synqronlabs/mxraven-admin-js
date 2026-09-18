/**
 * SMTP forward-destination models.
 *
 * @packageDocumentation
 */

/**
 * How a forward destination is verified.
 *
 * @public
 */
export const smtpForwardDestinationVerificationMethod = {
  /** Verified by email challenge. */
  email: "email",
  /** Verified by a platform override. */
  platformOverride: "platform_override",
} as const;

/**
 * How a forward destination is verified.
 *
 * @public
 */
export type SmtpForwardDestinationVerificationMethod =
  (typeof smtpForwardDestinationVerificationMethod)[keyof typeof smtpForwardDestinationVerificationMethod];

/**
 * Verification status of a forward destination.
 *
 * @public
 */
export const smtpForwardDestinationVerificationStatus = {
  /** Awaiting verification. */
  pending: "pending",
  /** Verified. */
  verified: "verified",
} as const;

/**
 * Verification status of a forward destination.
 *
 * @public
 */
export type SmtpForwardDestinationVerificationStatus =
  (typeof smtpForwardDestinationVerificationStatus)[keyof typeof smtpForwardDestinationVerificationStatus];

/**
 * Delivery status of a forward-verification email.
 *
 * @public
 */
export const smtpForwardVerificationDeliveryStatus = {
  /** Delivery is unavailable. */
  unavailable: "unavailable",
  /** Queued for delivery. */
  queued: "queued",
  /** Currently sending. */
  sending: "sending",
  /** Scheduled for retry. */
  retry: "retry",
  /** Sent. */
  sent: "sent",
  /** Delivery failed. */
  failed: "failed",
  /** Consumed by the recipient. */
  consumed: "consumed",
  /** Superseded by a newer attempt. */
  superseded: "superseded",
} as const;

/**
 * Delivery status of a forward-verification email.
 *
 * @public
 */
export type SmtpForwardVerificationDeliveryStatus =
  (typeof smtpForwardVerificationDeliveryStatus)[keyof typeof smtpForwardVerificationDeliveryStatus];

/**
 * Wire representation of an SMTP forward destination.
 *
 * @public
 */
export interface SmtpForwardDestinationData {
  /** Destination identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable destination reference. */
  readonly destinationRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** The forwarding mailbox. */
  readonly emailAddress: string;
  /** Verification status. */
  readonly verificationStatus: SmtpForwardDestinationVerificationStatus;
  /** Verification method. */
  readonly verificationMethod?: SmtpForwardDestinationVerificationMethod | null;
  /** Verification-email delivery status. */
  readonly deliveryStatus?: SmtpForwardVerificationDeliveryStatus | null;
  /** When the destination was verified. */
  readonly verifiedAt?: string | null;
  /** When delivery was requested. */
  readonly deliveryRequestedAt?: string | null;
  /** When the verification email was sent. */
  readonly verificationEmailSentAt?: string | null;
  /** Creation timestamp. */
  readonly createdAt: string;
  /** Last-update timestamp. */
  readonly updatedAt: string;
}

/**
 * Result of confirming a forward destination.
 *
 * @public
 */
export interface SmtpForwardDestinationConfirmation {
  /** Whether the destination is now verified. */
  readonly verified: boolean;
}

/**
 * Request body for `POST /v2/tenants/{slug}/smtp-forward-destinations`.
 *
 * @public
 */
export interface CreateSmtpForwardDestinationRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly destinationRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** The forwarding mailbox. */
  readonly emailAddress: string;
}

/**
 * Request body for the public
 * `POST /v2/smtp-forward-destination-verifications/confirm`.
 *
 * @public
 */
export interface ConfirmSmtpForwardDestinationRequest {
  /** The verification token from the email. */
  readonly token: string;
}
