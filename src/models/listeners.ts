/**
 * Listener, notification-setting, and scanning models.
 *
 * @packageDocumentation
 */

/**
 * Listener kind.
 *
 * @public
 */
export const listenerType = {
  /** Submission listener. */
  submission: "submission",
  /** MTA listener. */
  mta: "mta",
} as const;

/**
 * Listener kind.
 *
 * @public
 */
export type ListenerType = (typeof listenerType)[keyof typeof listenerType];

/**
 * Mail stream a listener serves.
 *
 * @public
 */
export const streamType = {
  /** Transactional mail stream. */
  transactional: "transactional",
  /** Marketing mail stream. */
  marketing: "marketing",
  /** System mail stream. */
  system: "system",
} as const;

/**
 * Mail stream a listener serves.
 *
 * @public
 */
export type StreamType = (typeof streamType)[keyof typeof streamType];

/**
 * Wire representation of a listener.
 *
 * @public
 */
export interface ListenerData {
  /** Listener identifier. */
  readonly id: string;
  /** Owning tenant identifier. */
  readonly tenantId: string;
  /** Human-readable name. */
  readonly displayName: string;
  /** Listener kind. */
  readonly listenerType: ListenerType;
  /** The mail stream the listener serves. */
  readonly streamType: StreamType;
  /** Whether rspamd scanning is enabled. */
  readonly rspamdScanningEnabled: boolean;
  /** The published routing script revision, when the listener has a script. */
  readonly activeScriptRevisionId?: string | null;
  /** MTA only. Whether the routing script may read the text/plain body. */
  readonly scriptBodyAccess: boolean;
}

/**
 * Request body for `POST /v2/tenants/{slug}/listeners`.
 *
 * @public
 */
export interface CreateListenerRequest {
  /** Human-readable name. */
  readonly displayName: string;
  /** Listener kind. */
  readonly listenerType: ListenerType;
  /** The mail stream the listener serves; `system` is not allowed. */
  readonly streamType: StreamType;
  /** Whether rspamd scanning is enabled; only valid for MTA listeners. */
  readonly rspamdScanningEnabled?: boolean;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/listeners/{id}`.
 *
 * @public
 */
export interface UpdateListenerRequest {
  /** The new human-readable name. */
  readonly displayName: string;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/listeners/{id}/rspamd-scanning`.
 *
 * @public
 */
export interface UpdateListenerRspamdScanningRequest {
  /** Whether rspamd scanning is enabled. */
  readonly enabled: boolean;
}

/**
 * The client notification setting of a listener.
 *
 * When enabled, the listener publishes client notification events on
 * `subject`; clients bind the durable pull `consumer` to read them.
 *
 * @public
 */
export interface ListenerNotificationSetting {
  /** Whether the listener publishes client notification events. */
  readonly enabled: boolean;
  /** Subject prefix client notifications are published on. */
  readonly subject: string;
  /** Durable pull consumer clients bind to in order to read those events. */
  readonly consumer: string;
}

/**
 * Request body for `PUT /v2/tenants/{slug}/listeners/{id}/notifications`.
 *
 * @public
 */
export interface UpdateListenerNotificationsRequest {
  /** Whether the listener publishes client notification events. */
  readonly enabled: boolean;
}
