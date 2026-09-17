/**
 * Tenant identity and provisioning models.
 *
 * @packageDocumentation
 */

/**
 * Tenant lifecycle status.
 *
 * @public
 */
export const tenantStatus = {
  /** The tenant is active. */
  active: "active",
  /** The tenant is suspended. */
  suspended: "suspended",
} as const;

/**
 * Tenant lifecycle status.
 *
 * @public
 */
export type TenantStatus = (typeof tenantStatus)[keyof typeof tenantStatus];

/**
 * Tenant identity-provisioning state.
 *
 * @public
 */
export const tenantProvisioningState = {
  /** Provisioning has not started. */
  pending: "pending",
  /** Provisioning is in progress. */
  provisioning: "provisioning",
  /** Provisioning completed successfully. */
  ready: "ready",
  /** Provisioning failed. */
  failed: "failed",
  /** The tenant is being deleted. */
  deleting: "deleting",
  /** The tenant is deleted. */
  deleted: "deleted",
} as const;

/**
 * Tenant identity-provisioning state.
 *
 * @public
 */
export type TenantProvisioningState =
  (typeof tenantProvisioningState)[keyof typeof tenantProvisioningState];

/**
 * A tenant and its identity-provisioning state.
 *
 * @public
 */
export interface Tenant {
  /** Unique tenant identifier. */
  readonly id: string;
  /** URL-friendly tenant slug. */
  readonly slug: string;
  /** Tenant lifecycle status. */
  readonly status: TenantStatus;
  /** Timestamp when the tenant was suspended, when suspended. */
  readonly suspendedAt?: string | null;
  /** Actor that suspended the tenant, when suspended. */
  readonly suspendedBy?: string | null;
  /** Reason the tenant was suspended, when suspended. */
  readonly suspensionReason?: string | null;
  /** Identity-provisioning state. */
  readonly provisioningState: TenantProvisioningState;
  /** Zitadel organization identifier. */
  readonly zitadelOrganizationId?: string | null;
  /** Zitadel default user identifier. */
  readonly zitadelDefaultUserId?: string | null;
  /** Desired identity-provisioning generation. */
  readonly desiredGeneration: number;
  /** Applied identity-provisioning generation. */
  readonly appliedGeneration: number;
  /** Timestamp of the last successful sync. */
  readonly lastSyncedAt?: string | null;
  /** Timestamp of the next scheduled reconcile. */
  readonly nextReconcileAt?: string | null;
  /** Timestamp of the last reconcile attempt. */
  readonly lastReconcileAttemptAt?: string | null;
  /** Trigger of the last reconcile attempt. */
  readonly lastReconcileTrigger?: string | null;
}

/**
 * Public login context for a tenant.
 *
 * @public
 */
export interface TenantLoginContext {
  /** Slug of the tenant. */
  readonly tenantSlug: string;
  /** Reference of the tenant workspace. */
  readonly workspaceRef: string;
  /** Human-readable tenant name. */
  readonly displayName: string;
  /** Zitadel organization identifier. */
  readonly zitadelOrganizationId?: string | null;
}
