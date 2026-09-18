/**
 * Listener API-key models.
 *
 * @packageDocumentation
 */

/**
 * Wire representation of a listener API key.
 *
 * Listing never returns secret material.
 *
 * @public
 */
export interface APIKeyData {
  /** Key identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** The API-key username. */
  readonly username: string;
}

/**
 * An API key returned with its one-time secret.
 *
 * The secret is returned only by creation. Store it immediately; it cannot be
 * retrieved again.
 *
 * @public
 */
export interface IssuedAPIKey extends APIKeyData {
  /** The one-time plaintext secret. */
  readonly secret: string;
}
