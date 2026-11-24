/**
 * Connected-application installation and consent models.
 *
 * @packageDocumentation
 */

import { countCodePoints, requireText, requireUuid } from "../internal/validate.js";

/**
 * The lifecycle state of a connected-application registration.
 *
 * @public
 */
export const connectedAppStatus = {
  /** The application may be installed and used. */
  active: "active",
  /** The application is suspended and cannot be used. */
  suspended: "suspended",
} as const;

/**
 * The lifecycle state of a connected-application registration.
 *
 * @public
 */
export type ConnectedAppStatus = (typeof connectedAppStatus)[keyof typeof connectedAppStatus];

/**
 * How a connected application authenticates.
 *
 * @public
 */
export const connectedAppClientKind = {
  /** A native client that shows the user a code. */
  device: "device",
  /** A public browser client using authorization code with PKCE. */
  web: "web",
} as const;

/**
 * How a connected application authenticates.
 *
 * @public
 */
export type ConnectedAppClientKind =
  (typeof connectedAppClientKind)[keyof typeof connectedAppClientKind];

/**
 * The lifecycle state of a connected-application installation.
 *
 * @public
 */
export const connectedAppInstallationStatus = {
  /** The installation is waiting for its first use. */
  pending: "pending",
  /** The installation is live. */
  active: "active",
  /** The installation was revoked; the grant is retained as history. */
  revoked: "revoked",
} as const;

/**
 * The lifecycle state of a connected-application installation.
 *
 * @public
 */
export type ConnectedAppInstallationStatus =
  (typeof connectedAppInstallationStatus)[keyof typeof connectedAppInstallationStatus];

/**
 * The principal that approved an installation.
 *
 * @public
 */
export interface ConnectedAppGrantor {
  /** The identity-provider issuer. */
  readonly issuer: string;
  /** The subject identifier at that issuer. */
  readonly subject: string;
  /** The approver's email address. */
  readonly email: string;
}

/**
 * One grantable connected-application permission.
 *
 * @public
 */
export interface ConnectedAppScope {
  /** The scope name. */
  readonly scope: string;
  /** The customer-facing explanation shown before approval. */
  readonly description: string;
}

/**
 * An application installation approved for a workspace.
 *
 * @public
 */
export interface ConnectedAppInstallation {
  /** Installation identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** The application registration identifier. */
  readonly appId: string;
  /** The identity-provider client identifier the application authenticates with. */
  readonly clientId?: string;
  /** The application's display name. */
  readonly displayName: string;
  /** The application's homepage URL. */
  readonly homepageUrl?: string;
  /** The permissions granted to the installation. */
  readonly grantedScopes: readonly string[];
  /** The installation state. */
  readonly status: ConnectedAppInstallationStatus;
  /** The principal that approved the installation. */
  readonly grantedBy: ConnectedAppGrantor;
  /** When the installation was approved. */
  readonly grantedAt: string;
  /** When the installation was last used, or `null`. */
  readonly lastUsedAt?: string | null;
}

/**
 * Request body for `POST /v2/tenants/{slug}/connected-apps`.
 *
 * Approval is idempotent per application and workspace: approving again
 * replaces the live installation in place.
 *
 * @public
 */
export interface CreateConnectedAppInstallationRequest {
  /** The application registration identifier. */
  readonly appId: string;
  /** The permissions to grant; a subset of both the application's and approver's scopes. */
  readonly grantedScopes: readonly string[];
}

/**
 * A pending device authorization, resolved from the code the user was shown.
 *
 * @public
 */
export interface ConnectedAppDeviceAuthorization {
  /** The code the user will confirm after approving. */
  readonly userCode: string;
  /** The application registration identifier. */
  readonly appId: string;
  /** The identity-provider client identifier. */
  readonly clientId: string;
  /** The application's display name. */
  readonly displayName: string;
  /** The application's description. */
  readonly description?: string;
  /** The application's homepage URL. */
  readonly homepageUrl?: string;
  /** The registration's scope ceiling, which is exactly what approval grants. */
  readonly requestedScopes: readonly ConnectedAppScope[];
}

/**
 * A browser authorization request validated for consent.
 *
 * @public
 */
export interface ConnectedAppAuthorizationRequest {
  /** The application registration identifier. */
  readonly appId: string;
  /** The identity-provider client identifier. */
  readonly clientId: string;
  /** The exact registered callback the approval will hand off to. */
  readonly redirectUri: string;
  /** The application's display name. */
  readonly displayName: string;
  /** The application's description. */
  readonly description?: string;
  /** The application's homepage URL. */
  readonly homepageUrl?: string;
  /** The registration's scope ceiling, which is exactly what approval grants. */
  readonly requestedScopes: readonly ConnectedAppScope[];
}

/**
 * Validates a granted-scope list.
 *
 * @param scopes - The scopes to grant.
 * @returns The scopes unchanged.
 * @throws `Error` When the list is empty, too long, or contains an invalid entry.
 *
 * @internal
 */
export function validateGrantedScopes(scopes: readonly string[]): readonly string[] {
  if (scopes.length === 0) {
    throw new Error("admin: granted_scopes must not be empty");
  }
  if (scopes.length > 200) {
    throw new Error("admin: granted_scopes must contain 200 entries or fewer");
  }
  return scopes.map((scope, index) => {
    const value = requireText(scope, `granted_scopes[${index}]`);
    if (countCodePoints(value) > 100) {
      throw new Error(`admin: granted_scopes[${index}] must be 100 characters or fewer`);
    }
    return value;
  });
}

/**
 * Validates a connected-application installation request.
 *
 * @param request - The installation request.
 * @returns A normalized copy of the request.
 * @throws `Error` When the application id or scopes are invalid.
 *
 * @internal
 */
export function validateInstallationRequest(
  request: CreateConnectedAppInstallationRequest,
): CreateConnectedAppInstallationRequest {
  return {
    appId: requireUuid(request.appId, "app_id"),
    grantedScopes: validateGrantedScopes(request.grantedScopes),
  };
}
