/**
 * Tenant identity-provider collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { paginate } from "../internal/paginate.js";
import { optionalAtMost, requireAtMost, requireRef, requireText } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  CreateTenantAppleIdentityProviderRequest,
  CreateTenantAzureAdIdentityProviderRequest,
  CreateTenantGitHubEnterpriseServerIdentityProviderRequest,
  CreateTenantGitHubIdentityProviderRequest,
  CreateTenantGitLabIdentityProviderRequest,
  CreateTenantGitLabSelfHostedIdentityProviderRequest,
  CreateTenantGoogleIdentityProviderRequest,
  CreateTenantIdentityProviderRequest,
  CreateTenantJwtIdentityProviderRequest,
  CreateTenantLdapIdentityProviderRequest,
  CreateTenantOAuthIdentityProviderRequest,
  CreateTenantSamlIdentityProviderRequest,
  IdentityAccessClaim,
  IdentityProvisioning,
  TenantIdentityProviderData,
  UpdateIdentityProvisioningRequest,
} from "../models/identity.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { decodeProvider, TenantIdentityProvider } from "./entity.js";

const MAX_SECRET = 8192;
const MAX_URL = 2048;

/** Validates that a scope list is within bounds. @internal */
function validateScopes(scopes: readonly string[] | undefined, max = 100): void {
  if (scopes !== undefined && scopes.length > max) {
    throw new Error(`admin: scopes must contain ${max} entries or fewer`);
  }
}

/** Validates a secret field. @internal */
function requireSecret(value: string | null | undefined, field: string): string {
  return requireAtMost(requireText(value, field), MAX_SECRET, field);
}

/** Validates a URL field. @internal */
function requireUrl(value: string | null | undefined, field: string): string {
  return requireAtMost(requireText(value, field), MAX_URL, field);
}

/** Validates a name field. @internal */
function requireName(value: string | null | undefined): string {
  return requireAtMost(requireText(value, "name"), 255, "name");
}

/** Construction options for an {@link IdentityProvidersClient}. @public */
export interface IdentityProvidersClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose identity providers are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link IdentityProvidersClient.list}.
 *
 * @public
 */
export interface ListIdentityProvidersOptions extends ListOptions {
  /** Case-insensitive search across the provider. Requires at least 3 characters. */
  readonly search?: string;
}

/**
 * Tenant identity-provider collection.
 *
 * @public
 */
export class IdentityProvidersClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: IdentityProvidersClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists identity providers.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of providers.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListIdentityProvidersOptions = {}): Promise<Paged<TenantIdentityProvider>> {
    const base = this.#path();
    const paged = await paginate<TenantIdentityProviderData>(
      this.#client,
      base,
      listQuery(options, { q: normalizeSearch(options.search) }),
      options,
      decodeProvider,
    );
    return paged.map(
      (data) =>
        new TenantIdentityProvider({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets an identity provider by identifier.
   *
   * @param idpId - The identity-provider identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated provider.
   * @throws `NotFoundException` When the provider is not visible.
   *
   * @public
   */
  async get(idpId: string, options?: RequestOptions): Promise<TenantIdentityProvider> {
    const path = `${this.#path()}/${encodeURIComponent(idpId)}`;
    const response = await this.#client.get(path, undefined, options);
    return new TenantIdentityProvider({
      client: this.#client,
      path,
      data: decodeProvider(response.asRaw<unknown>()),
    });
  }

  /**
   * Creates an OIDC identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  create(
    request: CreateTenantIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireAtMost(requireText(request.displayName, "display_name"), 255, "display_name");
    requireUrl(request.issuer, "issuer");
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    validateScopes(request.scopes);
    return this.#createProvider("", request, options);
  }

  /**
   * Creates a generic OAuth identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createOAuth(
    request: CreateTenantOAuthIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    requireUrl(request.authorizationEndpoint, "authorization_endpoint");
    requireUrl(request.tokenEndpoint, "token_endpoint");
    requireUrl(request.userEndpoint, "user_endpoint");
    optionalAtMost(request.idAttribute, 255, "id_attribute");
    validateScopes(request.scopes);
    return this.#createProvider("oauth", request, options);
  }

  /**
   * Creates a JWT identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createJwt(
    request: CreateTenantJwtIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireUrl(request.issuer, "issuer");
    requireUrl(request.jwtEndpoint, "jwt_endpoint");
    requireUrl(request.keysEndpoint, "keys_endpoint");
    optionalAtMost(request.headerName, 255, "header_name");
    optionalAtMost(request.audience, 255, "audience");
    return this.#createProvider("jwt", request, options);
  }

  /**
   * Creates a SAML identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createSaml(
    request: CreateTenantSamlIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    optionalAtMost(request.metadataUrl, MAX_URL, "metadata_url");
    optionalAtMost(request.metadataXml, 1_000_000, "metadata_xml");
    optionalAtMost(request.transientMappingAttributeName, 255, "transient_mapping_attribute_name");
    return this.#createProvider("saml", request, options);
  }

  /**
   * Creates an LDAP identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createLdap(
    request: CreateTenantLdapIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    if (request.servers === undefined || request.servers.length === 0) {
      throw new Error("admin: servers is required");
    }
    if (request.servers.length > 50) {
      throw new Error("admin: servers must contain 50 entries or fewer");
    }
    optionalAtMost(request.baseDn, MAX_URL, "base_dn");
    optionalAtMost(request.bindDn, MAX_URL, "bind_dn");
    optionalAtMost(request.bindPassword, MAX_SECRET, "bind_password");
    optionalAtMost(request.userBase, MAX_URL, "user_base");
    if (request.userObjectClasses !== undefined && request.userObjectClasses.length > 100) {
      throw new Error("admin: user_object_classes must contain 100 entries or fewer");
    }
    if (request.userFilters !== undefined && request.userFilters.length > 100) {
      throw new Error("admin: user_filters must contain 100 entries or fewer");
    }
    optionalAtMost(request.timeout, 32, "timeout");
    optionalAtMost(request.rootCa, 65_536, "root_ca");
    return this.#createProvider("ldap", request, options);
  }

  /**
   * Creates a Google identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createGoogle(
    request: CreateTenantGoogleIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    validateScopes(request.scopes);
    return this.#createProvider("google", request, options);
  }

  /**
   * Creates a Microsoft Entra ID identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createAzureAd(
    request: CreateTenantAzureAdIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    optionalAtMost(request.tenantId, 255, "tenant_id");
    validateScopes(request.scopes);
    return this.#createProvider("azure-ad", request, options);
  }

  /**
   * Creates a GitHub identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createGitHub(
    request: CreateTenantGitHubIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    return this.#createClientProvider("github", request, options);
  }

  /**
   * Creates a GitHub Enterprise Server identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createGitHubEnterpriseServer(
    request: CreateTenantGitHubEnterpriseServerIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    requireUrl(request.authorizationEndpoint, "authorization_endpoint");
    requireUrl(request.tokenEndpoint, "token_endpoint");
    requireUrl(request.userEndpoint, "user_endpoint");
    validateScopes(request.scopes);
    return this.#createProvider("github-enterprise-server", request, options);
  }

  /**
   * Creates a GitLab identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createGitLab(
    request: CreateTenantGitLabIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    return this.#createClientProvider("gitlab", request, options);
  }

  /**
   * Creates a self-hosted GitLab identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createGitLabSelfHosted(
    request: CreateTenantGitLabSelfHostedIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireUrl(request.issuer, "issuer");
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    validateScopes(request.scopes);
    return this.#createProvider("gitlab-self-hosted", request, options);
  }

  /**
   * Creates an Apple identity provider.
   *
   * @param request - The provider fields.
   * @param options - Optional cancellation signal.
   * @returns The created provider.
   *
   * @public
   */
  createApple(
    request: CreateTenantAppleIdentityProviderRequest,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireAtMost(requireText(request.teamId, "team_id"), 255, "team_id");
    requireAtMost(requireText(request.keyId, "key_id"), 255, "key_id");
    requireSecret(request.privateKey, "private_key");
    validateScopes(request.scopes);
    return this.#createProvider("apple", request, options);
  }

  /**
   * Reads the identity-provisioning settings.
   *
   * @param options - Optional cancellation signal.
   * @returns The provisioning settings.
   *
   * @public
   */
  getProvisioning(options?: RequestOptions): Promise<IdentityProvisioning> {
    return this.#client
      .get(this.#provisioningPath(), undefined, options)
      .then((response) => response.as<IdentityProvisioning>());
  }

  /**
   * Replaces the identity-provisioning roles.
   *
   * @param request - The roles, at most 64.
   * @param options - Optional cancellation signal.
   * @returns The updated provisioning settings.
   * @throws `Error` When more than 64 roles are supplied.
   *
   * @public
   */
  updateProvisioning(
    request: UpdateIdentityProvisioningRequest,
    options?: RequestOptions,
  ): Promise<IdentityProvisioning> {
    const roles = request.roles ?? [];
    if (roles.length > 64) {
      throw new Error("admin: roles must contain 64 entries or fewer");
    }
    return this.#client
      .put(this.#provisioningPath(), { roles }, options)
      .then((response) => response.as<IdentityProvisioning>());
  }

  /**
   * Claims identity access for the caller.
   *
   * @param options - Optional cancellation signal.
   * @returns The claim result.
   *
   * @public
   */
  claimAccess(options?: RequestOptions): Promise<IdentityAccessClaim> {
    return this.#client
      .post(
        `/tenants/${encodeURIComponent(this.#tenantSlug)}/identity/claim-access`,
        undefined,
        options,
      )
      .then((response) => response.as<IdentityAccessClaim>());
  }

  /**
   * Enables or disables auto-granting of roles for a provider.
   *
   * @param idpId - The identity-provider identifier.
   * @param enabled - Whether roles should be auto-granted.
   * @param options - Optional cancellation signal.
   * @returns The updated provider.
   *
   * @public
   */
  async setAutoGrant(
    idpId: string,
    enabled: boolean,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    const path = `${this.#path()}/${encodeURIComponent(idpId)}/auto-grant`;
    const response = await this.#client.put(path, { enabled }, options);
    return new TenantIdentityProvider({
      client: this.#client,
      path: `${this.#path()}/${encodeURIComponent(idpId)}`,
      data: decodeProvider(response.asRaw<unknown>()),
    });
  }

  /** Validates the shared client-credential fields and creates a provider. */
  #createClientProvider(
    segment: string,
    request: {
      readonly idpRef: string;
      readonly name: string;
      readonly clientId: string;
      readonly clientSecret: string;
      readonly scopes?: readonly string[];
    },
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    requireRef(request.idpRef, "idp_ref");
    requireName(request.name);
    requireAtMost(requireText(request.clientId, "client_id"), 255, "client_id");
    requireSecret(request.clientSecret, "client_secret");
    validateScopes(request.scopes);
    return this.#createProvider(segment, request, options);
  }

  /** Posts a provider request to a type segment and hydrates the result. */
  async #createProvider(
    segment: string,
    request: unknown,
    options?: RequestOptions,
  ): Promise<TenantIdentityProvider> {
    const base = this.#path();
    const path = segment === "" ? base : `${base}/${segment}`;
    const response = await this.#client.post(path, request, options);
    const data = decodeProvider(response.asRaw<unknown>());
    return new TenantIdentityProvider({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/identity-providers`;
  }

  #provisioningPath(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/identity-provisioning`;
  }
}
