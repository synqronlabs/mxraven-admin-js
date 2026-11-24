/**
 * Routing-script operations for a single listener.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { rawWire } from "../internal/serde.js";
import type { ListOptions } from "../list.js";
import type {
  ExportedListenerScript,
  ListenerScript,
  ScriptRevision,
  ScriptRevisionSummary,
  ScriptSimulationResult,
  SimulateScriptRevisionRequest,
} from "../models/routing-scripts.js";
import {
  validateRevision,
  validateScriptSource,
  validateSimulationRequest,
} from "../models/routing-scripts.js";
import type { Paged } from "../pagination.js";
import { listQuery } from "../query.js";

/** Construction options for a {@link RoutingScriptsClient}. @public */
export interface RoutingScriptsClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative listener path, such as `/tenants/acme/listeners/l1`. */
  readonly listenerPath: string;
}

/**
 * A listener's Lua routing script, its revision history, and its simulation
 * sandbox.
 *
 * Each listener has at most one published revision. A listener without a
 * published script uses its listener-type default: submission listeners deliver
 * through the shared pool, and MTA listeners drop after acceptance.
 *
 * @public
 */
export class RoutingScriptsClient {
  readonly #client: AdminClient;
  readonly #base: string;

  /**
   * @param options - The underlying admin client and listener path.
   *
   * @public
   */
  constructor(options: RoutingScriptsClientOptions) {
    this.#client = options.client;
    this.#base = `${options.listenerPath}/script`;
  }

  /**
   * Reads the listener's routing script.
   *
   * @param options - Optional cancellation signal.
   * @returns The published revision, when one exists, and the body-access setting.
   * @throws `NotFoundException` When the listener is not visible.
   *
   * @public
   */
  async get(options?: RequestOptions): Promise<ListenerScript> {
    return (await this.#client.get(this.#base, undefined, options)).as<ListenerScript>();
  }

  /**
   * Unpublishes the listener's routing script so it runs the listener-type
   * default again.
   *
   * Submission listeners deliver through the shared pool, and MTA listeners
   * drop every message they accept. The published revision becomes superseded
   * and the revision history is kept, so a rollback can restore it. The
   * operation is idempotent: a listener with no published script is returned
   * unchanged.
   *
   * @param options - Optional cancellation signal.
   * @returns The listener's routing script with no published revision.
   * @throws `NotFoundException` When the listener is not visible.
   *
   * @public
   */
  async delete(options?: RequestOptions): Promise<ListenerScript> {
    return (await this.#client.delete(this.#base, options)).as<ListenerScript>();
  }

  /**
   * Lists revisions newest first.
   *
   * @param options - Optional pagination and cancellation signal.
   * @returns A lazily paginating collection of revision summaries.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async listRevisions(options: ListOptions = {}): Promise<Paged<ScriptRevisionSummary>> {
    return this.#client.paged<ScriptRevisionSummary>(
      `${this.#base}/revisions`,
      listQuery(options),
      options,
    );
  }

  /**
   * Saves a new draft revision and validates it immediately.
   *
   * A draft is created even when it does not compile, so work is never lost.
   * Inspect `publishable` and `diagnostics` to learn whether it can be published
   * and what to fix.
   *
   * @param source - Lua 5.4 source defining `handle(mail, mx)`.
   * @param options - Optional cancellation signal.
   * @returns The saved revision.
   * @throws `Error` When the source is blank or too long.
   *
   * @public
   */
  async createRevision(source: string, options?: RequestOptions): Promise<ScriptRevision> {
    const body = { source: validateScriptSource(source) };
    return (await this.#client.post(`${this.#base}/revisions`, body, options)).as<ScriptRevision>();
  }

  /**
   * Reads one revision's source, dependencies, and save-time diagnostics.
   *
   * @param revision - The one-based revision number.
   * @param options - Optional cancellation signal.
   * @returns The revision.
   * @throws `Error` When the revision number is not a positive integer.
   * @throws `NotFoundException` When the revision is not visible.
   *
   * @public
   */
  async getRevision(revision: number, options?: RequestOptions): Promise<ScriptRevision> {
    const path = this.#revisionPath(validateRevision(revision));
    return (await this.#client.get(path, undefined, options)).as<ScriptRevision>();
  }

  /**
   * Runs a revision against a synthesized fixture in the production sandbox.
   *
   * `mx.http` calls answer from the supplied stubs instead of making real
   * requests, and recipient sets come from the request. Nothing is delivered or
   * stored.
   *
   * @param revision - The one-based revision number.
   * @param request - The fixture, HTTP stubs, and recipient-set stand-ins.
   * @param options - Optional cancellation signal.
   * @returns The terminal outcome, intents, log lines, and host-call trace.
   * @throws `Error` When a fixture or stub field fails local validation.
   *
   * @public
   */
  async simulate(
    revision: number,
    request: SimulateScriptRevisionRequest = {},
    options?: RequestOptions,
  ): Promise<ScriptSimulationResult> {
    const path = `${this.#revisionPath(validateRevision(revision))}/simulate`;
    validateSimulationRequest(request);
    return (
      await this.#client.post(path, toWireSimulationRequest(request), options)
    ).as<ScriptSimulationResult>();
  }

  /**
   * Makes a publishable draft the listener's live script.
   *
   * Dependencies are re-resolved before the active pointer moves, and runtimes
   * pick up the change within 30 seconds.
   *
   * @param revision - The one-based revision number.
   * @param options - Optional cancellation signal.
   * @returns The listener's updated routing script.
   * @throws `Error` When the revision number is not a positive integer.
   *
   * @public
   */
  async publish(revision: number, options?: RequestOptions): Promise<ListenerScript> {
    const path = `${this.#revisionPath(validateRevision(revision))}/publish`;
    return (await this.#client.post(path, undefined, options)).as<ListenerScript>();
  }

  /**
   * Points the listener back at a previously published revision.
   *
   * The revision must already have been published and later superseded. Its
   * dependencies are re-resolved before it becomes live again.
   *
   * @param revision - The one-based revision number.
   * @param options - Optional cancellation signal.
   * @returns The listener's updated routing script.
   * @throws `Error` When the revision number is not a positive integer.
   *
   * @public
   */
  async rollback(revision: number, options?: RequestOptions): Promise<ListenerScript> {
    const body = { revision: validateRevision(revision) };
    return (await this.#client.post(`${this.#base}/rollback`, body, options)).as<ListenerScript>();
  }

  /**
   * Renders the currently published revision's source and manifest.
   *
   * @param options - Optional cancellation signal.
   * @returns The exported script.
   * @throws `NotFoundException` When the listener has no published revision.
   *
   * @public
   */
  async export(options?: RequestOptions): Promise<ExportedListenerScript> {
    return (
      await this.#client.post(`${this.#base}/export`, undefined, options)
    ).as<ExportedListenerScript>();
  }

  /**
   * Opts an MTA listener's script in or out of reading the spooled text/plain
   * body with `mail.body:text()`.
   *
   * Submission listeners cannot enable body access; the control plane rejects
   * the request.
   *
   * @param enabled - Whether body access should be enabled.
   * @param options - Optional cancellation signal.
   * @returns The listener's updated routing script.
   *
   * @public
   */
  async setBodyAccess(enabled: boolean, options?: RequestOptions): Promise<ListenerScript> {
    const body = { enabled };
    return (
      await this.#client.put(`${this.#base}/body-access`, body, options)
    ).as<ListenerScript>();
  }

  #revisionPath(revision: number): string {
    return `${this.#base}/revisions/${revision}`;
  }
}

/**
 * Builds the simulation request body, preserving the keys of its free-form maps.
 *
 * Fixture auth and verdicts use fact field names, HTTP stub headers use header
 * names, and recipient-set names are data; none may be snake-cased.
 *
 * @param request - The simulation request.
 * @returns A body safe to pass to {@link AdminClient.post}.
 *
 * @internal
 */
function toWireSimulationRequest(request: SimulateScriptRevisionRequest): unknown {
  const body: Record<string, unknown> = {};
  const fixture = request.fixture;
  if (fixture !== undefined) {
    const { auth, verdicts, ...rest } = fixture;
    body.fixture = {
      ...rest,
      ...(auth === undefined ? {} : { auth: rawWire(auth) }),
      ...(verdicts === undefined ? {} : { verdicts: rawWire(verdicts) }),
    };
  }
  if (request.httpStubs !== undefined) {
    body.httpStubs = request.httpStubs.map(({ headers, ...stub }) => ({
      ...stub,
      ...(headers === undefined ? {} : { headers: rawWire(headers) }),
    }));
  }
  if (request.recipientSets !== undefined) {
    body.recipientSets = rawWire(request.recipientSets);
  }
  return body;
}
