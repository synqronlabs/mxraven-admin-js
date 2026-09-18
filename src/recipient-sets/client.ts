/**
 * Tenant recipient-set and membership collections.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import {
  optionalAtMost,
  requireEmail,
  requireEmailList,
  requireRef,
} from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  CreateRecipientSetRequest,
  RecipientSetBatchResult,
  RecipientSetData,
  RecipientSetMemberData,
  RecipientSetMembersBatchRequest,
} from "../models/recipient-sets.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { RecipientSet, RecipientSetMember } from "./entity.js";

/** Construction options for a {@link RecipientSetsClient}. @public */
export interface RecipientSetsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose recipient sets are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link RecipientSetsClient.list}.
 *
 * @public
 */
export interface ListRecipientSetsOptions extends ListOptions {
  /** Case-insensitive search across the set. Requires at least 3 characters. */
  readonly search?: string;
}

/**
 * Tenant recipient-set collection.
 *
 * @public
 */
export class RecipientSetsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: RecipientSetsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists recipient sets with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of recipient sets.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListRecipientSetsOptions = {}): Promise<Paged<RecipientSet>> {
    const base = this.#path();
    const query = listQuery(options, { q: normalizeSearch(options.search) });
    const paged = await this.#client.paged<RecipientSetData>(base, query, options);
    return paged.map(
      (data) =>
        new RecipientSet({
          client: this.#client,
          path: `${base}/${encodeURIComponent(data.setRef)}`,
          data,
        }),
    );
  }

  /**
   * Gets a recipient set by its immutable reference.
   *
   * @param setRef - The recipient-set reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated recipient set.
   * @throws `NotFoundException` When the set is not visible.
   *
   * @public
   */
  async getByRef(setRef: string, options?: RequestOptions): Promise<RecipientSet> {
    const base = this.#path();
    const path = `${base}/${encodeURIComponent(setRef)}`;
    const data = (await this.#client.get(path, undefined, options)).as<RecipientSetData>();
    return new RecipientSet({ client: this.#client, path, data });
  }

  /**
   * Creates a recipient set.
   *
   * @param request - The set reference and optional name/description.
   * @param options - Optional cancellation signal.
   * @returns The created recipient set.
   * @throws `Error` When the set reference is invalid.
   * @throws `ConflictException` When the reference already exists.
   *
   * @public
   */
  async create(
    request: CreateRecipientSetRequest,
    options?: RequestOptions,
  ): Promise<RecipientSet> {
    const body: CreateRecipientSetRequest = {
      setRef: requireRef(request.setRef, "set_ref"),
      displayName: optionalAtMost(request.displayName, 255, "display_name"),
      description: optionalAtMost(request.description, 4096, "description"),
    };
    const base = this.#path();
    const data = (await this.#client.post(base, body, options)).as<RecipientSetData>();
    return new RecipientSet({
      client: this.#client,
      path: `${base}/${encodeURIComponent(data.setRef)}`,
      data,
    });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/recipient-sets`;
  }
}

/** Construction options for a {@link RecipientSetMembersClient}. @public */
export interface RecipientSetMembersClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative membership path. */
  readonly path: string;
}

/**
 * Options for {@link RecipientSetMembersClient.list}.
 *
 * @public
 */
export interface ListRecipientSetMembersOptions extends ListOptions {
  /** Case-insensitive search across the member address. Requires at least 3 characters. */
  readonly search?: string;
  /** Inclusive ISO-8601 lower bound on the added timestamp. */
  readonly addedFrom?: string;
  /** Exclusive ISO-8601 upper bound on the added timestamp. */
  readonly addedTo?: string;
}

/**
 * Membership of a single recipient set.
 *
 * @public
 */
export class RecipientSetMembersClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and membership path.
   *
   * @public
   */
  constructor(options: RecipientSetMembersClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Lists members with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of members.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListRecipientSetMembersOptions = {}): Promise<Paged<RecipientSetMember>> {
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      added_from: options.addedFrom,
      added_to: options.addedTo,
    });
    const paged = await this.#client.paged<RecipientSetMemberData>(this.#path, query, options);
    return paged.map(
      (data) =>
        new RecipientSetMember({
          client: this.#client,
          path: this.#memberPath(data.emailAddress),
          data,
        }),
    );
  }

  /**
   * Adds one member.
   *
   * @param emailAddress - The member's email address.
   * @param options - Optional cancellation signal.
   * @returns The added member.
   * @throws `Error` When the address is not a valid email address.
   *
   * @public
   */
  async add(emailAddress: string, options?: RequestOptions): Promise<RecipientSetMember> {
    const body = { emailAddress: requireEmail(emailAddress, "email_address") };
    const data = (await this.#client.post(this.#path, body, options)).as<RecipientSetMemberData>();
    return new RecipientSetMember({
      client: this.#client,
      path: this.#memberPath(data.emailAddress),
      data,
    });
  }

  /**
   * Removes one member.
   *
   * @param emailAddress - The member's email address.
   * @param options - Optional cancellation signal.
   *
   * @public
   */
  async delete(emailAddress: string, options?: RequestOptions): Promise<void> {
    await this.#client.delete(this.#memberPath(emailAddress), options);
  }

  /**
   * Adds several members in one batch.
   *
   * @param emailAddresses - The addresses to add, at most 1000.
   * @param options - Optional cancellation signal.
   * @returns Per-operation outcome counts.
   * @throws `Error` When the list is empty, too large, or contains an invalid address.
   *
   * @public
   */
  async batchAdd(
    emailAddresses: readonly string[],
    options?: RequestOptions,
  ): Promise<RecipientSetBatchResult> {
    const body: RecipientSetMembersBatchRequest = {
      emailAddresses: requireEmailList(emailAddresses, "email_addresses", 1000),
    };
    return (
      await this.#client.post(`${this.#path}:batch-add`, body, options)
    ).as<RecipientSetBatchResult>();
  }

  /**
   * Removes several members in one batch.
   *
   * @param emailAddresses - The addresses to remove, at most 1000.
   * @param options - Optional cancellation signal.
   * @returns Per-operation outcome counts.
   * @throws `Error` When the list is empty, too large, or contains an invalid address.
   *
   * @public
   */
  async batchDelete(
    emailAddresses: readonly string[],
    options?: RequestOptions,
  ): Promise<RecipientSetBatchResult> {
    const body: RecipientSetMembersBatchRequest = {
      emailAddresses: requireEmailList(emailAddresses, "email_addresses", 1000),
    };
    return (
      await this.#client.post(`${this.#path}:batch-delete`, body, options)
    ).as<RecipientSetBatchResult>();
  }

  #memberPath(emailAddress: string): string {
    return `${this.#path}/${encodeURIComponent(emailAddress)}`;
  }
}
