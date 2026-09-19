/**
 * SMTP relay models.
 *
 * @packageDocumentation
 */

/**
 * Wire representation of a tenant SMTP relay.
 *
 * @public
 */
export interface SmtpRelayData {
  /** Relay identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable relay reference. */
  readonly relayRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Whether the relay is active. */
  readonly isActive: boolean;
  /** Whether credentials are stored for the relay. */
  readonly credentialsPresent: boolean;
}

/**
 * Request body for `POST /v2/tenants/{slug}/smtp-relays`.
 *
 * @public
 */
export interface CreateSmtpRelayRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly relayRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Relay hostname. */
  readonly host: string;
  /** Relay port, between 1 and 65535. */
  readonly port: number;
  /** SMTP username. */
  readonly username: string;
  /** SMTP password. */
  readonly password: string;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/smtp-relays/{id}`.
 *
 * @public
 */
export interface UpdateSmtpRelayRequest {
  /** Human-readable name. */
  readonly displayName: string;
  /** Relay hostname. */
  readonly host: string;
  /** Relay port, between 1 and 65535. */
  readonly port: number;
  /** SMTP username. */
  readonly username: string;
  /** SMTP password. */
  readonly password: string;
}
