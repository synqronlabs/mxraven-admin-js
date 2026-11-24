/**
 * The hydrated listener entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type {
  ListenerData,
  ListenerNotificationSetting,
  ListenerType,
  StreamType,
  UpdateListenerRequest,
} from "../models/listeners.js";
import { RoutingScriptsClient } from "../routing-scripts/client.js";
import { ApiKeysClient } from "./api-keys.js";
import { ListenerMtaRateLimitClient } from "./mta-rate-limit.js";
import { SendingDomainPoliciesClient } from "./sending-domain-policy.js";

/**
 * A submission or MTA listener.
 *
 * @public
 */
export class Listener extends Entity<ListenerData> {
  /** Listener identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Listener kind. @public */
  get listenerType(): ListenerType {
    return this.data.listenerType;
  }

  /** The mail stream the listener serves. @public */
  get streamType(): StreamType {
    return this.data.streamType;
  }

  /** Whether rspamd scanning is enabled. @public */
  get rspamdScanningEnabled(): boolean {
    return this.data.rspamdScanningEnabled;
  }

  /** The published routing script revision, when one exists. @public */
  get activeScriptRevisionId(): string | undefined {
    return this.data.activeScriptRevisionId ?? undefined;
  }

  /** MTA only. Whether the routing script may read the text/plain body. @public */
  get scriptBodyAccess(): boolean {
    return this.data.scriptBodyAccess;
  }

  /**
   * Re-fetches this listener.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the listener is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<Listener> {
    const data = (await this.client.get(this.path, undefined, options)).as<ListenerData>();
    return new Listener({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Renames the listener.
   *
   * @param displayName - The new name.
   * @param options - Optional cancellation signal.
   * @returns The updated listener.
   *
   * @public
   */
  async rename(displayName: string, options?: RequestOptions): Promise<Listener> {
    return this.update({ displayName }, options);
  }

  /**
   * Replaces the writable listener fields.
   *
   * @param request - The new name.
   * @param options - Optional cancellation signal.
   * @returns The updated listener.
   *
   * @public
   */
  async update(request: UpdateListenerRequest, options?: RequestOptions): Promise<Listener> {
    const data = (await this.client.put(this.path, request, options)).as<ListenerData>();
    return new Listener({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Enables or disables rspamd scanning.
   *
   * @param enabled - Whether scanning should be enabled.
   * @param options - Optional cancellation signal.
   * @returns The updated listener.
   *
   * @public
   */
  async updateRspamdScanning(enabled: boolean, options?: RequestOptions): Promise<Listener> {
    const data = (
      await this.client.put(`${this.path}/rspamd-scanning`, { enabled }, options)
    ).as<ListenerData>();
    return new Listener({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Reads the listener's client notification setting.
   *
   * @param options - Optional cancellation signal.
   * @returns The notification setting.
   *
   * @public
   */
  async notificationSetting(options?: RequestOptions): Promise<ListenerNotificationSetting> {
    return (
      await this.client.get(`${this.path}/notifications`, undefined, options)
    ).as<ListenerNotificationSetting>();
  }

  /**
   * Enables or disables client notification publishing.
   *
   * Enabling creates the listener's durable consumer and starts event
   * publishing; disabling stops publishing and retains the consumer.
   *
   * @param enabled - Whether the listener should publish client notifications.
   * @param options - Optional cancellation signal.
   * @returns The updated notification setting.
   *
   * @public
   */
  async updateNotifications(
    enabled: boolean,
    options?: RequestOptions,
  ): Promise<ListenerNotificationSetting> {
    return (
      await this.client.put(`${this.path}/notifications`, { enabled }, options)
    ).as<ListenerNotificationSetting>();
  }

  /**
   * Accesses this listener's routing script and its revisions.
   *
   * @returns A client for routing-script operations.
   *
   * @public
   */
  routingScript(): RoutingScriptsClient {
    return new RoutingScriptsClient({
      client: this.client,
      listenerPath: this.path,
    });
  }

  /**
   * Accesses this listener's API keys.
   *
   * @returns A client for API-key operations.
   *
   * @public
   */
  apiKeys(): ApiKeysClient {
    return new ApiKeysClient({ client: this.client, path: `${this.path}/api-keys` });
  }

  /**
   * Accesses this listener's sending-domain policy.
   *
   * @returns A client for sending-domain policy operations.
   *
   * @public
   */
  sendingDomainPolicy(): SendingDomainPoliciesClient {
    return new SendingDomainPoliciesClient({
      client: this.client,
      path: `${this.path}/sending-domain-policy`,
    });
  }

  /**
   * Accesses this listener's MTA rate-limit override.
   *
   * @returns A client for MTA rate-limit operations.
   * @throws `Error` When this listener is not an MTA listener.
   *
   * @public
   */
  mtaRateLimit(): ListenerMtaRateLimitClient {
    if (this.data.listenerType !== "mta") {
      throw new Error(
        `admin: mtaRateLimit is only available for MTA listeners (this listener is ${this.data.listenerType})`,
      );
    }
    return new ListenerMtaRateLimitClient({
      client: this.client,
      path: `${this.path}/mta-rate-limit-override`,
    });
  }
}
