/**
 * The hydrated recipient-set and member entities.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import { optionalAtMost } from "../internal/validate.js";
import type {
  RecipientSetData,
  RecipientSetMemberData,
  UpdateRecipientSetRequest,
} from "../models/recipient-sets.js";
import { RecipientSetMembersClient } from "./client.js";

/**
 * A reusable collection of recipients.
 *
 * @public
 */
export class RecipientSet extends Entity<RecipientSetData> {
  /** Recipient-set identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable recipient-set reference. @public */
  get setRef(): string {
    return this.data.setRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Optional description. @public */
  get description(): string | null | undefined {
    return this.data.description;
  }

  /** Creation timestamp. @public */
  get createdAt(): string {
    return this.data.createdAt;
  }

  /** Last-update timestamp. @public */
  get updatedAt(): string {
    return this.data.updatedAt;
  }

  /**
   * Re-fetches this recipient set.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the set is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<RecipientSet> {
    const data = (await this.client.get(this.path, undefined, options)).as<RecipientSetData>();
    return new RecipientSet({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces the name and description.
   *
   * @param request - The new values; `null` clears a field.
   * @param options - Optional cancellation signal.
   * @returns The updated recipient set.
   *
   * @public
   */
  async update(
    request: UpdateRecipientSetRequest,
    options?: RequestOptions,
  ): Promise<RecipientSet> {
    const body: UpdateRecipientSetRequest = {
      displayName: optionalAtMost(request.displayName, 255, "display_name") ?? null,
      description: optionalAtMost(request.description, 4096, "description") ?? null,
    };
    const data = (await this.client.put(this.path, body, options)).as<RecipientSetData>();
    return new RecipientSet({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Accesses this set's membership.
   *
   * @returns A client for member operations.
   *
   * @public
   */
  members(): RecipientSetMembersClient {
    return new RecipientSetMembersClient({ client: this.client, path: `${this.path}/members` });
  }
}

/**
 * A member of a recipient set.
 *
 * @public
 */
export class RecipientSetMember extends Entity<RecipientSetMemberData> {
  /** The member's email address. @public */
  get emailAddress(): string {
    return this.data.emailAddress;
  }

  /** When the member was added. @public */
  get addedAt(): string {
    return this.data.addedAt;
  }
}
