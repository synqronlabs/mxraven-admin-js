/**
 * Request body shared by integration activation operations.
 *
 * @packageDocumentation
 */

/**
 * Request body for `PUT .../active` on relays, storage integrations, and
 * webhook endpoints.
 *
 * @public
 */
export interface SetIntegrationActiveRequest {
  /** Whether the integration should be active. */
  readonly isActive: boolean;
}
