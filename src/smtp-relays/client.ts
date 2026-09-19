/**
 * Tenant SMTP relay collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { requireRef, validateSmtpConnection } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type { CreateSmtpRelayRequest, SmtpRelayData } from "../models/smtp-relays.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";
import { SmtpRelay } from "./entity.js";

/** Construction options for a {@link SmtpRelaysClient}. @public */
export interface SmtpRelaysClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose relays are accessed. */
  readonly tenantSlug: string;
}

/**
 * Tenant SMTP relay collection.
 *
 * @public
 */
export class SmtpRelaysClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: SmtpRelaysClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists SMTP relays.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of relays.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListOptions = {}): Promise<Paged<SmtpRelay>> {
    const base = this.#path();
    const paged = await this.#client.paged<SmtpRelayData>(base, listQuery(options), options);
    return paged.map(
      (data) => new SmtpRelay({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a relay by identifier.
   *
   * @param relayId - The relay identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated relay.
   * @throws `NotFoundException` When the relay is not visible.
   *
   * @public
   */
  async get(relayId: string, options?: RequestOptions): Promise<SmtpRelay> {
    const path = `${this.#path()}/${encodeURIComponent(relayId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.#client, path, data });
  }

  /**
   * Gets a relay by its immutable reference.
   *
   * @param relayRef - The relay reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated relay.
   * @throws `NotFoundException` When the relay is not visible.
   *
   * @public
   */
  async getByRef(relayRef: string, options?: RequestOptions): Promise<SmtpRelay> {
    const base = this.#path();
    const data = (
      await this.#client.get(`${base}/ref/${encodeURIComponent(relayRef)}`, undefined, options)
    ).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Creates an SMTP relay.
   *
   * @param request - The relay reference, connection, and credentials.
   * @param options - Optional cancellation signal.
   * @returns The created relay.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(request: CreateSmtpRelayRequest, options?: RequestOptions): Promise<SmtpRelay> {
    requireRef(request.relayRef, "relay_ref");
    validateSmtpConnection(request);
    const base = this.#path();
    const data = (await this.#client.post(base, request, options)).as<SmtpRelayData>();
    return new SmtpRelay({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/smtp-relays`;
  }
}
