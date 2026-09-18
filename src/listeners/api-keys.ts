/**
 * Listener API-key collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type { ListOptions } from "../list.js";
import type { APIKeyData, IssuedAPIKey } from "../models/api-keys.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";

/** Construction options for an {@link ApiKeysClient}. @public */
export interface ApiKeysClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative API-keys path. */
  readonly path: string;
}

/**
 * API keys for a single listener.
 *
 * @public
 */
export class ApiKeysClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and API-keys path.
   *
   * @public
   */
  constructor(options: ApiKeysClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Lists API keys.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of keys.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListOptions = {}): Promise<Paged<APIKey>> {
    const paged = await this.#client.paged<APIKeyData>(this.#path, listQuery(options), options);
    return paged.map(
      (data) => new APIKey({ client: this.#client, path: `${this.#path}/${data.id}`, data }),
    );
  }

  /**
   * Issues a new API key.
   *
   * The response carries the one-time secret; it cannot be retrieved again and
   * the operation is not idempotent.
   *
   * @param options - Optional cancellation signal.
   * @returns The issued key, including its secret.
   *
   * @public
   */
  async create(options?: RequestOptions): Promise<IssuedAPIKey> {
    return (await this.#client.post(this.#path, undefined, options)).as<IssuedAPIKey>();
  }
}

/**
 * A listener API key. Only deletion is supported.
 *
 * @public
 */
export class APIKey extends Entity<APIKeyData> {
  /** Key identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Owning listener identifier. @public */
  get listenerId(): string {
    return this.data.listenerId;
  }

  /** The API-key username. @public */
  get username(): string {
    return this.data.username;
  }
}
