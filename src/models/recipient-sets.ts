/**
 * Recipient-set and membership models.
 *
 * @packageDocumentation
 */

/**
 * Wire representation of a recipient set.
 *
 * @public
 */
export interface RecipientSetData {
  /** Recipient-set identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Immutable recipient-set reference. */
  readonly setRef: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Optional description. */
  readonly description?: string | null;
  /** Creation timestamp. */
  readonly createdAt: string;
  /** Last-update timestamp. */
  readonly updatedAt: string;
}

/**
 * Request body for `POST /v2/tenants/{slug}/recipient-sets`.
 *
 * @public
 */
export interface CreateRecipientSetRequest {
  /** Immutable reference; starts with a letter or digit. */
  readonly setRef: string;
  /** Optional human-readable name. */
  readonly displayName?: string;
  /** Optional description. */
  readonly description?: string;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/recipient-sets/{set_ref}`.
 *
 * Both fields are always sent; `null` clears the stored value.
 *
 * @public
 */
export interface UpdateRecipientSetRequest {
  /** The new name, or `null` to clear it. */
  readonly displayName: string | null;
  /** The new description, or `null` to clear it. */
  readonly description: string | null;
}

/**
 * Wire representation of a recipient-set member.
 *
 * @public
 */
export interface RecipientSetMemberData {
  /** The member's email address. */
  readonly emailAddress: string;
  /** When the member was added. */
  readonly addedAt: string;
}

/**
 * Request body for adding one member.
 *
 * @public
 */
export interface RecipientSetMemberRequest {
  /** The member's email address. */
  readonly emailAddress: string;
}

/**
 * Request body for a batch member operation.
 *
 * @public
 */
export interface RecipientSetMembersBatchRequest {
  /** The email addresses to add or remove, at most 1000. */
  readonly emailAddresses: readonly string[];
}

/**
 * Per-operation outcome counts for a batch member request.
 *
 * @public
 */
export interface RecipientSetBatchResult {
  /** Number of addresses requested. */
  readonly requested: number;
  /** Number of addresses after normalization. */
  readonly normalized: number;
  /** Number of addresses added. */
  readonly added: number;
  /** Number of addresses that already existed. */
  readonly existing: number;
  /** Number of addresses deleted. */
  readonly deleted: number;
  /** Number of addresses that were missing. */
  readonly missing: number;
}
