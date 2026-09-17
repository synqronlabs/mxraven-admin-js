/**
 * Base class for hydrated resource entities.
 */

import type { AdminClient } from "./client.js";

/** Construction options for an {@link Entity}. @public */
export interface EntityOptions<D> {
  /** The client used to issue requests for this entity. */
  readonly client: AdminClient;
  /** The client-relative path of this resource. */
  readonly path: string;
  /** The raw wire record backing this entity. */
  readonly data: D;
  /** Whether the entity is considered deleted. */
  readonly deleted?: boolean;
}

/**
 * Base for hydrated resource entities. An entity wraps the wire record `D` with
 * the client and path needed to act on the resource, plus local delete state.
 *
 * Reads return a snapshot; call `reload()` (where a subclass supports it) for
 * fresh state. {@link Entity.isDeleted} is local bookkeeping for deletes
 * performed through this instance — it cannot observe deletes made elsewhere.
 *
 * @typeParam D - The wire record backing this entity.
 *
 * @public
 */
export abstract class Entity<D> {
  /** The client used to issue requests for this entity. */
  protected readonly client: AdminClient;

  /** The client-relative path of this resource. */
  protected readonly path: string;

  readonly #data: D;
  #deleted: boolean;

  /**
   * @param options - The client, path, backing data, and delete state.
   *
   * @public
   */
  constructor(options: EntityOptions<D>) {
    this.client = options.client;
    this.path = options.path;
    this.#data = options.data;
    this.#deleted = options.deleted ?? false;
  }

  /**
   * The raw wire record backing this entity.
   *
   * @public
   */
  get data(): D {
    return this.#data;
  }

  /**
   * Whether this entity has been deleted through this instance.
   *
   * Local state only; not authoritative server state.
   *
   * @public
   */
  get isDeleted(): boolean {
    return this.#deleted;
  }

  /**
   * Deletes this resource.
   *
   * Idempotent per instance: once this instance has deleted the resource,
   * further calls are a local no-op.
   *
   * @returns `true` once the resource has been deleted through this instance.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async delete(): Promise<boolean> {
    if (this.#deleted) {
      return true;
    }
    await this.client.delete(this.path);
    this.#deleted = true;
    return true;
  }
}
