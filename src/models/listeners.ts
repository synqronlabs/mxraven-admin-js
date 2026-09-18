/**
 * Listener and terminal-action models.
 *
 * @packageDocumentation
 */

import { requireRef, requireText, requireUuid } from "../internal/validate.js";

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
 * Default terminal action of a listener.
 *
 * Wire values are uppercase, unlike most other enums.
 *
 * @public
 */
export const terminalActionType = {
  /** Deliver through a dedicated IP pool. */
  deliverDedicated: "DELIVER_DEDICATED",
  /** Deliver through the shared path. */
  deliver: "DELIVER",
  /** Relay through a smart host. */
  smartHostRelay: "SMARTHOST_RELAY",
  /** Relay through a configured relay. */
  relay: "RELAY",
  /** Reply with an auto-reply template. */
  autoReply: "AUTO_REPLY",
  /** Drop the message. */
  drop: "DROP",
  /** Reject the message. */
  reject: "REJECT",
} as const;

/**
 * Default terminal action of a listener.
 *
 * @public
 */
export type TerminalActionType = (typeof terminalActionType)[keyof typeof terminalActionType];

/**
 * The payload of a terminal action.
 *
 * All fields are optional; which ones apply depends on the action type. The
 * factory functions on {@link terminalActionPayload} validate and build these
 * shapes.
 *
 * @public
 */
export interface TerminalActionPayload {
  /** Dedicated IP pool id, for `DELIVER_DEDICATED`. */
  readonly poolId?: string;
  /** Relay reference, for `SMARTHOST_RELAY` and `RELAY`. */
  readonly relayRef?: string;
  /** Auto-reply template reference, for `AUTO_REPLY`. */
  readonly templateRef?: string;
  /** Audit reason, for `DROP` and `REJECT`. */
  readonly auditReason?: string;
  /** SMTP status code, for `REJECT`. */
  readonly smtpStatusCode?: number;
  /** Enhanced status code, for `REJECT`. */
  readonly enhancedStatusCode?: string;
  /** Rejection message, for `REJECT`. */
  readonly message?: string;
}

const ENHANCED_STATUS_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Factory and escape-hatch functions for {@link TerminalActionPayload}.
 *
 * @public
 */
export const terminalActionPayload = {
  /**
   * Wraps a raw payload, for shapes not covered by the typed factories.
   *
   * @param values - The payload.
   * @returns The payload unchanged.
   */
  of(values: TerminalActionPayload): TerminalActionPayload {
    return values;
  },

  /**
   * An empty payload, for actions that take none.
   *
   * @returns An empty payload.
   */
  empty(): TerminalActionPayload {
    return {};
  },

  /**
   * The shared-path delivery payload, which is empty.
   *
   * @returns An empty payload.
   */
  deliver(): TerminalActionPayload {
    return {};
  },

  /**
   * Builds a `DELIVER_DEDICATED` payload.
   *
   * @param poolId - The dedicated IP pool id.
   * @returns The payload.
   * @throws `Error` When the pool id is not a UUID.
   */
  deliverDedicated(poolId: string): TerminalActionPayload {
    return { poolId: requireUuid(poolId, "pool_id") };
  },

  /**
   * Builds a `SMARTHOST_RELAY` payload.
   *
   * @param relayRef - The relay reference.
   * @returns The payload.
   */
  smartHostRelay(relayRef: string): TerminalActionPayload {
    return { relayRef: requireRef(relayRef, "relay_ref") };
  },

  /**
   * Builds a `RELAY` payload.
   *
   * @param relayRef - The relay reference.
   * @returns The payload.
   */
  relay(relayRef: string): TerminalActionPayload {
    return { relayRef: requireRef(relayRef, "relay_ref") };
  },

  /**
   * Builds an `AUTO_REPLY` payload.
   *
   * @param templateRef - The template reference.
   * @returns The payload.
   */
  autoReply(templateRef: string): TerminalActionPayload {
    return { templateRef: requireRef(templateRef, "template_ref") };
  },

  /**
   * Builds a `DROP` payload.
   *
   * @param auditReason - An optional audit reason.
   * @returns The payload.
   */
  drop(auditReason?: string): TerminalActionPayload {
    const reason = auditReason?.trim();
    return reason === undefined || reason === "" ? {} : { auditReason: reason };
  },

  /**
   * Builds a `REJECT` payload.
   *
   * @param smtpStatusCode - The SMTP status code, in the 5xx range.
   * @param enhancedStatusCode - The enhanced status code, in `class.subject.detail` form.
   * @param message - The rejection message.
   * @param auditReason - An optional audit reason.
   * @returns The payload.
   * @throws `Error` When a field fails validation.
   */
  reject(
    smtpStatusCode: number,
    enhancedStatusCode: string,
    message: string,
    auditReason?: string,
  ): TerminalActionPayload {
    if (!Number.isInteger(smtpStatusCode) || smtpStatusCode < 500 || smtpStatusCode > 599) {
      throw new Error("admin: smtp_status_code must be in the 5xx range");
    }
    const enhanced = requireText(enhancedStatusCode, "enhanced_status_code").trim();
    if (!ENHANCED_STATUS_PATTERN.test(enhanced)) {
      throw new Error("admin: enhanced_status_code must use class.subject.detail format");
    }
    const payload: TerminalActionPayload = {
      smtpStatusCode,
      enhancedStatusCode: enhanced,
      message: requireText(message, "message"),
    };
    const reason = auditReason?.trim();
    return reason === undefined || reason === "" ? payload : { ...payload, auditReason: reason };
  },
} as const;

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
  /** The default terminal action type. */
  readonly defaultTerminalActionType: TerminalActionType;
  /** The default terminal action payload. */
  readonly defaultTerminalActionPayload: TerminalActionPayload;
  /** Whether rspamd scanning is enabled. */
  readonly rspamdScanningEnabled: boolean;
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
  /** The default terminal action type. */
  readonly defaultTerminalActionType: TerminalActionType;
  /** The default terminal action payload. */
  readonly defaultTerminalActionPayload?: TerminalActionPayload;
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
 * Request body for
 * `PUT /v2/tenants/{slug}/listeners/{id}/default-terminal-action`.
 *
 * @public
 */
export interface UpdateListenerDefaultTerminalActionRequest {
  /** The new default terminal action type. */
  readonly actionType: TerminalActionType;
  /** The new default terminal action payload. */
  readonly actionPayload?: TerminalActionPayload;
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
