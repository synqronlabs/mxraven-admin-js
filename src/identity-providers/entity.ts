/**
 * The hydrated tenant identity-provider entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import { fromWire, isRecord } from "../internal/serde.js";
import type {
  IdentityProviderLifecycleStatus,
  IdentityProviderType,
  TenantIdentityProviderData,
} from "../models/identity.js";

/**
 * Rebuilds a provider, preserving the free-form configuration keys.
 *
 * @param item - The raw decoded response.
 * @returns The decoded provider data.
 *
 * @internal
 */
export function decodeProvider(item: unknown): TenantIdentityProviderData {
  if (!isRecord(item)) {
    throw new Error("admin: decode identity provider");
  }
  const { provider_config: providerConfigWire, ...rest } = item;
  const decoded = fromWire(rest) as Omit<TenantIdentityProviderData, "providerConfig">;
  return {
    ...decoded,
    providerConfig: isRecord(providerConfigWire) ? providerConfigWire : {},
  };
}

/**
 * A tenant identity provider.
 *
 * @public
 */
export class TenantIdentityProvider extends Entity<TenantIdentityProviderData> {
  /** Identity-provider identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable idp reference. @public */
  get idpRef(): string {
    return this.data.idpRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Provider kind. @public */
  get providerType(): IdentityProviderType {
    return this.data.providerType;
  }

  /** The ZITADEL provider identifier. @public */
  get zitadelProviderId(): string | null | undefined {
    return this.data.zitadelProviderId;
  }

  /** The OIDC/JWT issuer. @public */
  get issuer(): string | null | undefined {
    return this.data.issuer;
  }

  /** The OAuth client id. @public */
  get clientId(): string | null | undefined {
    return this.data.clientId;
  }

  /** The configured scopes. @public */
  get scopes(): readonly string[] {
    return this.data.scopes ?? [];
  }

  /** Free-form provider configuration. @public */
  get providerConfig(): Readonly<Record<string, unknown>> {
    return this.data.providerConfig ?? {};
  }

  /** Whether roles are auto-granted. @public */
  get autoGrantRoles(): boolean {
    return this.data.autoGrantRoles;
  }

  /** Whether the provider is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /** Lifecycle status. @public */
  get lifecycleStatus(): IdentityProviderLifecycleStatus {
    return this.data.lifecycleStatus;
  }

  /**
   * Re-fetches this provider.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<TenantIdentityProvider> {
    const response = await this.client.get(this.path, undefined, options);
    return new TenantIdentityProvider({
      client: this.client,
      path: this.path,
      data: decodeProvider(response.asRaw<unknown>()),
      deleted: this.isDeleted,
    });
  }

  /**
   * Enables or disables auto-granting of roles.
   *
   * @param enabled - Whether roles should be auto-granted.
   * @param options - Optional cancellation signal.
   * @returns The updated provider.
   *
   * @public
   */
  async setAutoGrant(enabled: boolean, options?: RequestOptions): Promise<TenantIdentityProvider> {
    const response = await this.client.put(`${this.path}/auto-grant`, { enabled }, options);
    return new TenantIdentityProvider({
      client: this.client,
      path: this.path,
      data: decodeProvider(response.asRaw<unknown>()),
      deleted: this.isDeleted,
    });
  }
}
