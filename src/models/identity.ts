/**
 * Tenant identity-provider models.
 *
 * @packageDocumentation
 */

/**
 * Identity-provider kind.
 *
 * @public
 */
export const identityProviderType = {
  /** OpenID Connect. */
  oidc: "oidc",
  /** Generic OAuth. */
  oauth: "oauth",
  /** JWT. */
  jwt: "jwt",
  /** SAML. */
  saml: "saml",
  /** LDAP. */
  ldap: "ldap",
  /** Google. */
  google: "google",
  /** Microsoft Entra ID. */
  azureAd: "azure_ad",
  /** GitHub. */
  github: "github",
  /** GitHub Enterprise Server. */
  githubEnterpriseServer: "github_enterprise_server",
  /** GitLab. */
  gitlab: "gitlab",
  /** Self-hosted GitLab. */
  gitlabSelfHosted: "gitlab_self_hosted",
  /** Apple. */
  apple: "apple",
} as const;

/**
 * Identity-provider kind.
 *
 * @public
 */
export type IdentityProviderType = (typeof identityProviderType)[keyof typeof identityProviderType];

/**
 * Lifecycle status of an identity provider.
 *
 * @public
 */
export const identityProviderLifecycleStatus = {
  /** Creation is pending. */
  pendingCreate: "pending_create",
  /** Ready. */
  ready: "ready",
  /** Deletion is pending. */
  pendingDelete: "pending_delete",
  /** Creation failed. */
  createFailed: "create_failed",
  /** Deletion failed. */
  deleteFailed: "delete_failed",
} as const;

/**
 * Lifecycle status of an identity provider.
 *
 * @public
 */
export type IdentityProviderLifecycleStatus =
  (typeof identityProviderLifecycleStatus)[keyof typeof identityProviderLifecycleStatus];

/**
 * Automatic account-linking strategy.
 *
 * @public
 */
export const idpAutoLinking = {
  /** Unspecified. */
  unspecified: "unspecified",
  /** Link by username. */
  username: "username",
  /** Link by email. */
  email: "email",
} as const;

/**
 * Automatic account-linking strategy.
 *
 * @public
 */
export type IdpAutoLinking = (typeof idpAutoLinking)[keyof typeof idpAutoLinking];

/**
 * SAML binding.
 *
 * @public
 */
export const samlBinding = {
  /** Unspecified. */
  unspecified: "unspecified",
  /** HTTP redirect binding. */
  redirect: "redirect",
  /** HTTP POST binding. */
  post: "post",
  /** SAML artifact binding. */
  artifact: "artifact",
} as const;

/**
 * SAML binding.
 *
 * @public
 */
export type SamlBinding = (typeof samlBinding)[keyof typeof samlBinding];

/**
 * SAML NameID format.
 *
 * @public
 */
export const samlNameIdFormat = {
  /** Unspecified. */
  unspecified: "unspecified",
  /** Persistent. */
  persistent: "persistent",
  /** Transient. */
  transient: "transient",
  /** Email address. */
  email: "email",
} as const;

/**
 * SAML NameID format.
 *
 * @public
 */
export type SamlNameIdFormat = (typeof samlNameIdFormat)[keyof typeof samlNameIdFormat];

/**
 * SAML signature algorithm.
 *
 * @public
 */
export const samlSignatureAlgorithm = {
  /** Unspecified. */
  unspecified: "unspecified",
  /** RSA-SHA1. */
  rsaSha1: "rsa_sha1",
  /** RSA-SHA256. */
  rsaSha256: "rsa_sha256",
  /** RSA-SHA512. */
  rsaSha512: "rsa_sha512",
} as const;

/**
 * SAML signature algorithm.
 *
 * @public
 */
export type SamlSignatureAlgorithm =
  (typeof samlSignatureAlgorithm)[keyof typeof samlSignatureAlgorithm];

/**
 * Microsoft Entra ID tenant type.
 *
 * @public
 */
export const azureAdTenantType = {
  /** Common. */
  common: "common",
  /** Organisations. */
  organisations: "organisations",
  /** Consumers. */
  consumers: "consumers",
} as const;

/**
 * Microsoft Entra ID tenant type.
 *
 * @public
 */
export type AzureAdTenantType = (typeof azureAdTenantType)[keyof typeof azureAdTenantType];

/**
 * Provider behaviour options common to several provider kinds.
 *
 * @public
 */
export interface ProviderOptions {
  /** Whether account linking is allowed. */
  readonly isLinkingAllowed?: boolean;
  /** Whether account creation is allowed. */
  readonly isCreationAllowed?: boolean;
  /** Whether automatic account creation is enabled. */
  readonly isAutoCreation?: boolean;
  /** Whether automatic account update is enabled. */
  readonly isAutoUpdate?: boolean;
  /** The automatic linking strategy. */
  readonly autoLinking?: IdpAutoLinking;
}

/**
 * LDAP attribute mappings.
 *
 * @public
 */
export interface LdapAttributes {
  /** Id attribute. */
  readonly idAttribute?: string;
  /** First-name attribute. */
  readonly firstNameAttribute?: string;
  /** Last-name attribute. */
  readonly lastNameAttribute?: string;
  /** Display-name attribute. */
  readonly displayNameAttribute?: string;
  /** Nickname attribute. */
  readonly nickNameAttribute?: string;
  /** Preferred-username attribute. */
  readonly preferredUsernameAttribute?: string;
  /** Email attribute. */
  readonly emailAttribute?: string;
  /** Email-verified attribute. */
  readonly emailVerifiedAttribute?: string;
  /** Phone attribute. */
  readonly phoneAttribute?: string;
  /** Phone-verified attribute. */
  readonly phoneVerifiedAttribute?: string;
  /** Preferred-language attribute. */
  readonly preferredLanguageAttribute?: string;
  /** Avatar-URL attribute. */
  readonly avatarUrlAttribute?: string;
  /** Profile attribute. */
  readonly profileAttribute?: string;
}

/**
 * Wire representation of a tenant identity provider.
 *
 * @public
 */
export interface TenantIdentityProviderData {
  /** Identity-provider identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Provider kind. */
  readonly providerType: IdentityProviderType;
  /** The ZITADEL provider identifier. */
  readonly zitadelProviderId?: string | null;
  /** The OIDC/JWT issuer. */
  readonly issuer?: string | null;
  /** The OAuth client id. */
  readonly clientId?: string | null;
  /** The configured scopes. */
  readonly scopes?: readonly string[] | null;
  /** Free-form provider configuration. */
  readonly providerConfig?: Readonly<Record<string, unknown>> | null;
  /** Whether roles are auto-granted. */
  readonly autoGrantRoles: boolean;
  /** Whether the provider is active. */
  readonly isActive: boolean;
  /** Lifecycle status. */
  readonly lifecycleStatus: IdentityProviderLifecycleStatus;
}

/**
 * Identity-provisioning settings.
 *
 * @public
 */
export interface IdentityProvisioning {
  /** The configured roles. */
  readonly roles: readonly string[];
}

/**
 * Result of claiming identity access.
 *
 * @public
 */
export interface IdentityAccessClaim {
  /** Whether access was granted. */
  readonly granted: boolean;
}

/**
 * Request body for `PUT .../identity-provisioning`.
 *
 * @public
 */
export interface UpdateIdentityProvisioningRequest {
  /** The roles, at most 64. */
  readonly roles: readonly string[];
}

/**
 * Request body for `PUT .../identity-providers/{idp_id}/auto-grant`.
 *
 * @public
 */
export interface UpdateIdentityProviderAutoGrantRequest {
  /** Whether roles should be auto-granted. */
  readonly enabled: boolean;
}

/**
 * Request body for the OIDC `POST .../identity-providers`.
 *
 * @public
 */
export interface CreateTenantIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Provider kind. */
  readonly providerType?: IdentityProviderType;
  /** The issuer. */
  readonly issuer: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Whether to map the id token. */
  readonly isIdTokenMapping?: boolean;
  /** Whether to use PKCE. */
  readonly usePkce?: boolean;
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/oauth`.
 *
 * @public
 */
export interface CreateTenantOAuthIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The authorization endpoint. */
  readonly authorizationEndpoint: string;
  /** The token endpoint. */
  readonly tokenEndpoint: string;
  /** The user-info endpoint. */
  readonly userEndpoint: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** The id attribute. */
  readonly idAttribute?: string;
  /** Whether to use PKCE. */
  readonly usePkce?: boolean;
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/jwt`.
 *
 * @public
 */
export interface CreateTenantJwtIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The issuer. */
  readonly issuer: string;
  /** The JWT endpoint. */
  readonly jwtEndpoint: string;
  /** The keys endpoint. */
  readonly keysEndpoint: string;
  /** The header name. */
  readonly headerName?: string;
  /** The audience. */
  readonly audience?: string;
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/saml`.
 *
 * @public
 */
export interface CreateTenantSamlIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The metadata URL. */
  readonly metadataUrl?: string;
  /** The metadata XML. */
  readonly metadataXml?: string;
  /** The SAML binding. */
  readonly binding?: SamlBinding;
  /** Whether requests are signed. */
  readonly withSignedRequest?: boolean;
  /** The NameID format. */
  readonly nameIdFormat?: SamlNameIdFormat;
  /** The transient mapping attribute name. */
  readonly transientMappingAttributeName?: string;
  /** Whether federated logout is enabled. */
  readonly federatedLogoutEnabled?: boolean;
  /** The signature algorithm. */
  readonly signatureAlgorithm?: SamlSignatureAlgorithm;
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/ldap`.
 *
 * @public
 */
export interface CreateTenantLdapIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** LDAP servers, at most 50. */
  readonly servers: readonly string[];
  /** Whether to use StartTLS. */
  readonly startTls?: boolean;
  /** The base DN. */
  readonly baseDn?: string;
  /** The bind DN. */
  readonly bindDn?: string;
  /** The bind password. */
  readonly bindPassword?: string;
  /** The user base. */
  readonly userBase?: string;
  /** The user object classes, at most 100. */
  readonly userObjectClasses?: readonly string[];
  /** The user filters, at most 100. */
  readonly userFilters?: readonly string[];
  /** The timeout. */
  readonly timeout?: string;
  /** Attribute mappings. */
  readonly attributes?: LdapAttributes;
  /** The root CA certificate. */
  readonly rootCa?: string;
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/google`.
 *
 * @public
 */
export interface CreateTenantGoogleIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/azure-ad`.
 *
 * @public
 */
export interface CreateTenantAzureAdIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The Microsoft tenant id. */
  readonly tenantId?: string;
  /** The Microsoft tenant type. */
  readonly tenantType?: AzureAdTenantType;
  /** Whether email is verified. */
  readonly emailVerified?: boolean;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/github`.
 *
 * @public
 */
export interface CreateTenantGitHubIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/github-enterprise-server`.
 *
 * @public
 */
export interface CreateTenantGitHubEnterpriseServerIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The authorization endpoint. */
  readonly authorizationEndpoint: string;
  /** The token endpoint. */
  readonly tokenEndpoint: string;
  /** The user-info endpoint. */
  readonly userEndpoint: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/gitlab`.
 *
 * @public
 */
export interface CreateTenantGitLabIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/gitlab-self-hosted`.
 *
 * @public
 */
export interface CreateTenantGitLabSelfHostedIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The issuer. */
  readonly issuer: string;
  /** The client id. */
  readonly clientId: string;
  /** The client secret. */
  readonly clientSecret: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}

/**
 * Request body for `POST .../identity-providers/apple`.
 *
 * @public
 */
export interface CreateTenantAppleIdentityProviderRequest {
  /** Immutable idp reference. */
  readonly idpRef: string;
  /** Human-readable name. */
  readonly name: string;
  /** The client id. */
  readonly clientId: string;
  /** The Apple team id. */
  readonly teamId: string;
  /** The Apple key id. */
  readonly keyId: string;
  /** The Apple private key. */
  readonly privateKey: string;
  /** The scopes, at most 100. */
  readonly scopes?: readonly string[];
  /** Provider behaviour options. */
  readonly providerOptions?: ProviderOptions;
}
