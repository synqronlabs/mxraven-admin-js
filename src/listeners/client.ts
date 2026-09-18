/**
 * Tenant listener collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { requireAtMost, requireText } from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  CreateListenerRequest,
  ListenerData,
  ListenerType,
  StreamType,
  TerminalActionType,
} from "../models/listeners.js";
import { terminalActionType } from "../models/listeners.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { Listener } from "./entity.js";

const VALID_ACTIONS: Record<ListenerType, readonly TerminalActionType[]> = {
  submission: [
    terminalActionType.deliverDedicated,
    terminalActionType.deliver,
    terminalActionType.smartHostRelay,
    terminalActionType.drop,
    terminalActionType.reject,
  ],
  mta: [
    terminalActionType.relay,
    terminalActionType.autoReply,
    terminalActionType.drop,
    terminalActionType.reject,
  ],
};

/** Validates a listener-creation request. @internal */
function validateCreate(request: CreateListenerRequest): void {
  requireAtMost(requireText(request.displayName, "display_name"), 255, "display_name");
  if (request.streamType === "system") {
    throw new Error("admin: stream_type 'system' cannot be used to create a listener");
  }
  if (!VALID_ACTIONS[request.listenerType].includes(request.defaultTerminalActionType)) {
    throw new Error(
      `admin: default_terminal_action_type ${request.defaultTerminalActionType} is not valid for listener_type ${request.listenerType}`,
    );
  }
  if (request.rspamdScanningEnabled === true && request.listenerType !== "mta") {
    throw new Error("admin: rspamd_scanning_enabled is only valid for mta listeners");
  }
}

/** Construction options for a {@link ListenersClient}. @public */
export interface ListenersClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose listeners are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link ListenersClient.list}.
 *
 * @public
 */
export interface ListListenersOptions extends ListOptions {
  /** Case-insensitive search across the listener. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single listener kind. */
  readonly listenerType?: ListenerType;
  /** Restrict to a single mail stream. */
  readonly streamType?: StreamType;
  /** Restrict to a single default terminal action. */
  readonly defaultTerminalActionType?: TerminalActionType;
  /** Restrict to a required rspamd-scanning state. */
  readonly rspamdScanningEnabled?: boolean;
}

/**
 * Tenant listener collection.
 *
 * @public
 */
export class ListenersClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: ListenersClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists listeners with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of listeners.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListListenersOptions = {}): Promise<Paged<Listener>> {
    const base = this.#path();
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      listener_type: options.listenerType,
      stream_type: options.streamType,
      default_terminal_action_type: options.defaultTerminalActionType,
      rspamd_scanning_enabled: options.rspamdScanningEnabled,
    });
    const paged = await this.#client.paged<ListenerData>(base, query, options);
    return paged.map(
      (data) => new Listener({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a listener by identifier.
   *
   * @param listenerId - The listener identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated listener.
   * @throws `NotFoundException` When the listener is not visible.
   *
   * @public
   */
  async get(listenerId: string, options?: RequestOptions): Promise<Listener> {
    const path = `${this.#path()}/${encodeURIComponent(listenerId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<ListenerData>();
    return new Listener({ client: this.#client, path, data });
  }

  /**
   * Creates a listener.
   *
   * @param request - The listener fields.
   * @param options - Optional cancellation signal.
   * @returns The created listener.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(request: CreateListenerRequest, options?: RequestOptions): Promise<Listener> {
    validateCreate(request);
    const base = this.#path();
    const data = (await this.#client.post(base, request, options)).as<ListenerData>();
    return new Listener({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Lists every MTA listener.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns Every matching listener.
   *
   * @public
   */
  listMtaListeners(options: ListOptions = {}): Promise<Listener[]> {
    return this.list({ ...options, listenerType: "mta" }).then((paged) => paged.toArray());
  }

  /**
   * Lists every submission listener.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns Every matching listener.
   *
   * @public
   */
  listSubmissionListeners(options: ListOptions = {}): Promise<Listener[]> {
    return this.list({ ...options, listenerType: "submission" }).then((paged) => paged.toArray());
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/listeners`;
  }
}
