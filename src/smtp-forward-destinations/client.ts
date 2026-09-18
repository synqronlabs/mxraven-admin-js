/**
 * Tenant SMTP forward-destination collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { optionalAtMost, requireMailbox, requireRef, requireText } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  ConfirmSmtpForwardDestinationRequest,
  CreateSmtpForwardDestinationRequest,
  SmtpForwardDestinationConfirmation,
  SmtpForwardDestinationData,
} from "../models/smtp-forward.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { SmtpForwardDestination } from "./entity.js";

const CONFIRM_PATH = "/smtp-forward-destination-verifications/confirm";

/** Construction options for a {@link SmtpForwardDestinationsClient}. @public */
export interface SmtpForwardDestinationsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose destinations are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link SmtpForwardDestinationsClient.list}.
 *
 * @public
 */
export interface ListSmtpForwardDestinationsOptions extends ListOptions {
  /** Case-insensitive search across the destination. Requires at least 3 characters. */
  readonly search?: string;
}

/**
 * Tenant SMTP forward-destination collection.
 *
 * @public
 */
export class SmtpForwardDestinationsClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: SmtpForwardDestinationsClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists forward destinations with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of destinations.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(
    options: ListSmtpForwardDestinationsOptions = {},
  ): Promise<Paged<SmtpForwardDestination>> {
    const base = this.#path();
    const query = listQuery(options, { q: normalizeSearch(options.search) });
    const paged = await this.#client.paged<SmtpForwardDestinationData>(base, query, options);
    return paged.map(
      (data) =>
        new SmtpForwardDestination({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a forward destination by identifier.
   *
   * @param destinationId - The destination identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated destination.
   * @throws `NotFoundException` When the destination is not visible.
   *
   * @public
   */
  async get(destinationId: string, options?: RequestOptions): Promise<SmtpForwardDestination> {
    const path = `${this.#path()}/${encodeURIComponent(destinationId)}`;
    const data = (
      await this.#client.get(path, undefined, options)
    ).as<SmtpForwardDestinationData>();
    return new SmtpForwardDestination({ client: this.#client, path, data });
  }

  /**
   * Gets a forward destination by its immutable reference.
   *
   * @param destinationRef - The destination reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated destination.
   * @throws `NotFoundException` When the destination is not visible.
   *
   * @public
   */
  async getByRef(
    destinationRef: string,
    options?: RequestOptions,
  ): Promise<SmtpForwardDestination> {
    const base = this.#path();
    const data = (
      await this.#client.get(
        `${base}/ref/${encodeURIComponent(destinationRef)}`,
        undefined,
        options,
      )
    ).as<SmtpForwardDestinationData>();
    return new SmtpForwardDestination({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Creates a forward destination.
   *
   * @param request - The reference, name, and forwarding mailbox.
   * @param options - Optional cancellation signal.
   * @returns The created destination.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(
    request: CreateSmtpForwardDestinationRequest,
    options?: RequestOptions,
  ): Promise<SmtpForwardDestination> {
    const body: CreateSmtpForwardDestinationRequest = {
      destinationRef: requireRef(request.destinationRef, "destination_ref"),
      displayName:
        optionalAtMost(requireText(request.displayName, "display_name"), 255, "display_name") ?? "",
      emailAddress: requireMailbox(request.emailAddress, "email_address"),
    };
    const base = this.#path();
    const data = (await this.#client.post(base, body, options)).as<SmtpForwardDestinationData>();
    return new SmtpForwardDestination({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Confirms a forward destination from a verification token.
   *
   * This operation is public and is not tenant-scoped.
   *
   * @param request - The verification token.
   * @param options - Optional cancellation signal.
   * @returns The confirmation result.
   * @throws `Error` When the token length is invalid.
   *
   * @public
   */
  async confirm(
    request: ConfirmSmtpForwardDestinationRequest,
    options?: RequestOptions,
  ): Promise<SmtpForwardDestinationConfirmation> {
    const token = requireText(request.token, "token");
    if (token.length < 40 || token.length > 128) {
      throw new Error("admin: token must be between 40 and 128 characters");
    }
    return (
      await this.#client.post(CONFIRM_PATH, { token }, options)
    ).as<SmtpForwardDestinationConfirmation>();
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/smtp-forward-destinations`;
  }
}
