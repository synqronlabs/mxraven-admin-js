/**
 * Tenant connected-application installations and consent previews.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { requireAtMost, requireText } from "../internal/validate.js";
import type {
  ConnectedAppAuthorizationRequest,
  ConnectedAppDeviceAuthorization,
  ConnectedAppInstallation,
  ConnectedAppScope,
  CreateConnectedAppInstallationRequest,
} from "../models/connected-apps.js";
import { validateInstallationRequest } from "../models/connected-apps.js";

/** Construction options for a {@link ConnectedAppsClient}. @public */
export interface ConnectedAppsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose installations are accessed. */
  readonly tenantSlug: string;
}

/**
 * Applications connected to a workspace.
 *
 * Listing and consent previews require `connected_apps.read`; approving and
 * revoking require `connected_apps.write`. Approval additionally requires the
 * full workspace owner scope set, so an operator or auditor token cannot grant
 * access.
 *
 * @public
 */
export class ConnectedAppsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: ConnectedAppsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists live installations, newest first.
   *
   * The endpoint is not paginated.
   *
   * @param options - Optional cancellation signal.
   * @returns Every live installation.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options?: RequestOptions): Promise<ConnectedAppInstallation[]> {
    return (
      await this.#client.get(this.#path(), undefined, options)
    ).listOf<ConnectedAppInstallation>();
  }

  /**
   * Gets an installation by identifier.
   *
   * @param installationId - The installation identifier.
   * @param options - Optional cancellation signal.
   * @returns The installation.
   * @throws `NotFoundException` When the installation is not visible.
   *
   * @public
   */
  async get(installationId: string, options?: RequestOptions): Promise<ConnectedAppInstallation> {
    const path = `${this.#path()}/${encodeURIComponent(installationId)}`;
    return (await this.#client.get(path, undefined, options)).as<ConnectedAppInstallation>();
  }

  /**
   * Approves an application installation.
   *
   * The grant is a snapshot: it never widens retrospectively. Approval is
   * idempotent per application and workspace, so re-approving replaces the live
   * installation in place; a revoked installation does not conflict either.
   *
   * @param request - The application id and the scopes to grant.
   * @param options - Optional cancellation signal.
   * @returns The approved installation.
   * @throws `Error` When the application id or scopes fail local validation.
   *
   * @public
   */
  async create(
    request: CreateConnectedAppInstallationRequest,
    options?: RequestOptions,
  ): Promise<ConnectedAppInstallation> {
    const body = validateInstallationRequest(request);
    return (await this.#client.post(this.#path(), body, options)).as<ConnectedAppInstallation>();
  }

  /**
   * Revokes an installation.
   *
   * Access ends immediately; the revoked grant is retained as history.
   *
   * @param installationId - The installation identifier.
   * @param options - Optional cancellation signal.
   * @returns `true` once the installation is revoked.
   * @throws `NotFoundException` When the installation is not visible.
   *
   * @public
   */
  async revoke(installationId: string, options?: RequestOptions): Promise<boolean> {
    await this.#client.delete(`${this.#path()}/${encodeURIComponent(installationId)}`, options);
    return true;
  }

  /**
   * Previews a pending device authorization for consent.
   *
   * Nothing is approved here: the response is what a consent screen renders, and
   * the approval itself is {@link ConnectedAppsClient.create}.
   *
   * @param userCode - The code the application displayed to the user.
   * @param options - Optional cancellation signal.
   * @returns The pending request and the permissions an approval would grant.
   * @throws `Error` When the user code is blank or too long.
   *
   * @public
   */
  async deviceAuthorization(
    userCode: string,
    options?: RequestOptions,
  ): Promise<ConnectedAppDeviceAuthorization> {
    const code = requireAtMost(requireText(userCode, "user_code"), 64, "user_code");
    const path = `${this.#path()}/device-authorization/${encodeURIComponent(code)}`;
    return (await this.#client.get(path, undefined, options)).as<ConnectedAppDeviceAuthorization>();
  }

  /**
   * Previews a browser authorization request for consent.
   *
   * The redirect URI is matched exactly against the client's registered URIs.
   * Nothing is approved here and no authorization code is issued.
   *
   * @param clientId - The application's identity-provider client id.
   * @param redirectUri - The exact registered callback URI.
   * @param options - Optional cancellation signal.
   * @returns The validated request and the permissions an approval would grant.
   * @throws `Error` When the client id or redirect URI is invalid.
   *
   * @public
   */
  async authorizationRequest(
    clientId: string,
    redirectUri: string,
    options?: RequestOptions,
  ): Promise<ConnectedAppAuthorizationRequest> {
    const id = requireAtMost(requireText(clientId, "client_id"), 200, "client_id");
    const uri = requireAtMost(requireText(redirectUri, "redirect_uri"), 2048, "redirect_uri");
    const response = await this.#client.get(
      `${this.#path()}/authorization-request`,
      { client_id: id, redirect_uri: uri },
      options,
    );
    return response.as<ConnectedAppAuthorizationRequest>();
  }

  /**
   * Lists every permission a connected application can request.
   *
   * Instance-wide authority is never grantable and never listed.
   *
   * @param options - Optional cancellation signal.
   * @returns The grantable scopes in stable order.
   *
   * @public
   */
  async listScopes(options?: RequestOptions): Promise<ConnectedAppScope[]> {
    return (
      await this.#client.get("/connected-apps/scopes", undefined, options)
    ).listOf<ConnectedAppScope>();
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/connected-apps`;
  }
}
