/**
 * The hydrated SMTP relay entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import { validateSmtpConnection } from "../internal/validate.js";
import type { SmtpRelayData, UpdateSmtpRelayRequest } from "../models/smtp-relays.js";

/**
 * A tenant SMTP relay integration.
 *
 * @public
 */
export class SmtpRelay extends Entity<SmtpRelayData> {
  /** Relay identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable relay reference. @public */
  get relayRef(): string {
    return this.data.relayRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Whether the relay is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /** Whether credentials are stored. @public */
  get credentialsPresent(): boolean {
    return this.data.credentialsPresent;
  }

  /**
   * Re-fetches this relay.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the relay is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<SmtpRelay> {
    const data = (await this.client.get(this.path, undefined, options)).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Replaces the relay connection and credentials.
   *
   * @param request - The new connection and credentials.
   * @param options - Optional cancellation signal.
   * @returns The updated relay.
   *
   * @public
   */
  async update(request: UpdateSmtpRelayRequest, options?: RequestOptions): Promise<SmtpRelay> {
    validateSmtpConnection(request);
    const data = (await this.client.put(this.path, request, options)).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Activates or deactivates the relay.
   *
   * @param isActive - Whether the relay should be active.
   * @param options - Optional cancellation signal.
   * @returns The updated relay.
   *
   * @public
   */
  async setActive(isActive: boolean, options?: RequestOptions): Promise<SmtpRelay> {
    const data = (
      await this.client.put(`${this.path}/active`, { isActive }, options)
    ).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }
}
