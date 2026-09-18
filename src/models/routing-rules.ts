/**
 * Routing-rule and action models.
 *
 * @packageDocumentation
 */

import {
  countCodePoints,
  optionalAtMost,
  requireAtMost,
  requireHeaderName,
  requireMailboxAddress,
  requireRef,
  requireText,
  requireUuid,
} from "../internal/validate.js";

/**
 * The kind of routing-rule action.
 *
 * Wire values are uppercase.
 *
 * @public
 */
export const routingRuleActionKind = {
  /** Deliver through a dedicated IP pool. */
  deliverDedicated: "DELIVER_DEDICATED",
  /** Deliver through the shared path. */
  deliver: "DELIVER",
  /** Relay through a smart host. */
  smartHostRelay: "SMARTHOST_RELAY",
  /** Drop the message. */
  drop: "DROP",
  /** Reject the message. */
  reject: "REJECT",
  /** Modify message headers. */
  modifyHeader: "MODIFY_HEADER",
  /** Add recipients. */
  addRecipient: "ADD_RECIPIENT",
  /** Notify a webhook. */
  notifyWebhook: "NOTIFY_WEBHOOK",
  /** Deliver to a webhook. */
  deliverWebhook: "DELIVER_WEBHOOK",
  /** Forward over SMTP. */
  smtpForward: "SMTP_FORWARD",
  /** Relay through a configured relay. */
  relay: "RELAY",
  /** Store in S3-compatible object storage. */
  s3Store: "S3_STORE",
  /** Reply with an auto-reply template. */
  autoReply: "AUTO_REPLY",
} as const;

/**
 * The kind of routing-rule action.
 *
 * @public
 */
export type RoutingRuleActionKind =
  (typeof routingRuleActionKind)[keyof typeof routingRuleActionKind];

/**
 * Header operation kind.
 *
 * @public
 */
export const modifyHeaderOp = {
  /** Append a header. */
  append: "append",
  /** Set a header. */
  set: "set",
  /** Remove a header. */
  remove: "remove",
} as const;

/**
 * Header operation kind.
 *
 * @public
 */
export type ModifyHeaderOp = (typeof modifyHeaderOp)[keyof typeof modifyHeaderOp];

/**
 * One header modification.
 *
 * @public
 */
export interface ModifyHeaderOperation {
  /** The operation kind. */
  readonly op: ModifyHeaderOp;
  /** The header name. */
  readonly header: string;
  /** The header value; omitted for `remove`. */
  readonly value?: string;
}

/**
 * Factory functions for {@link ModifyHeaderOperation}.
 *
 * @public
 */
export const modifyHeaderOperation = {
  /**
   * Appends a header.
   *
   * @param header - The header name.
   * @param value - The header value.
   * @returns The operation.
   */
  append(header: string, value: string): ModifyHeaderOperation {
    return { op: modifyHeaderOp.append, header, value };
  },

  /**
   * Sets a header.
   *
   * @param header - The header name.
   * @param value - The header value.
   * @returns The operation.
   */
  set(header: string, value: string): ModifyHeaderOperation {
    return { op: modifyHeaderOp.set, header, value };
  },

  /**
   * Removes a header.
   *
   * @param header - The header name.
   * @returns The operation.
   */
  remove(header: string): ModifyHeaderOperation {
    return { op: modifyHeaderOp.remove, header };
  },
} as const;

/**
 * The payload of a routing-rule action.
 *
 * All fields are optional; which ones apply depends on the action kind. The
 * factory functions on {@link routingRuleAction} validate and build these
 * shapes.
 *
 * @public
 */
export interface RoutingRulePayload {
  /** Dedicated IP pool id, for `DELIVER_DEDICATED`. */
  readonly poolId?: string;
  /** Relay reference, for `SMARTHOST_RELAY` and `RELAY`. */
  readonly relayRef?: string;
  /** Template reference, for `AUTO_REPLY`. */
  readonly templateRef?: string;
  /** Webhook reference, for `NOTIFY_WEBHOOK` and `DELIVER_WEBHOOK`. */
  readonly webhookRef?: string;
  /** Destination reference, for `SMTP_FORWARD`. */
  readonly destinationRef?: string;
  /** Storage reference, for `S3_STORE`. */
  readonly storageRef?: string;
  /** Object-key prefix, for `S3_STORE`. */
  readonly objectKeyPrefix?: string;
  /** Object-key template, for `S3_STORE`. */
  readonly objectKeyTemplate?: string;
  /** Audit reason, for `DROP` and `REJECT`. */
  readonly auditReason?: string;
  /** SMTP status code, for `REJECT`. */
  readonly smtpStatusCode?: number;
  /** Enhanced status code, for `REJECT`. */
  readonly enhancedStatusCode?: string;
  /** Rejection message, for `REJECT`. */
  readonly message?: string;
  /** Added recipients, for `ADD_RECIPIENT`. */
  readonly recipients?: readonly string[];
  /** Header operations, for `MODIFY_HEADER`. */
  readonly operations?: readonly ModifyHeaderOperation[];
}

/**
 * A routing-rule action.
 *
 * @public
 */
export interface RoutingRuleAction {
  /** The action kind. */
  readonly actionType: RoutingRuleActionKind;
  /** The action payload. */
  readonly actionPayload: RoutingRulePayload;
}

const ENHANCED_STATUS_REJECT_PATTERN = /^5\.\d+\.\d+$/;

/** Validates a header-operation list. @internal */
function validateOperations(
  operations: readonly ModifyHeaderOperation[] | null | undefined,
): readonly ModifyHeaderOperation[] {
  if (operations === null || operations === undefined || operations.length === 0) {
    throw new Error("admin: operations must not be empty");
  }
  if (operations.length > 100) {
    throw new Error("admin: operations must contain 100 entries or fewer");
  }
  return operations.map((operation, index) => {
    requireHeaderName(operation.header, `operation[${index}]: header`);
    if (operation.op === modifyHeaderOp.remove) {
      if (operation.value !== undefined && operation.value.trim() !== "") {
        throw new Error(`admin: operation[${index}]: value must be omitted for op remove`);
      }
      return { op: operation.op, header: operation.header };
    }
    const value = requireAtMost(
      requireText(operation.value, `operation[${index}]: value`),
      998,
      `operation[${index}]: value`,
    );
    return { op: operation.op, header: operation.header, value };
  });
}

/** Validates an added-recipient list. @internal */
function validateRecipients(recipients: readonly string[] | null | undefined): readonly string[] {
  if (recipients === null || recipients === undefined || recipients.length === 0) {
    throw new Error("admin: recipients must not be empty");
  }
  if (recipients.length > 100) {
    throw new Error("admin: recipients must contain 100 entries or fewer");
  }
  return recipients.map((recipient, index) =>
    requireMailboxAddress(recipient, `recipients[${index}]`),
  );
}

/**
 * Factory functions for {@link RoutingRuleAction}.
 *
 * @public
 */
export const routingRuleAction = {
  /**
   * Wraps a raw action.
   *
   * @param actionType - The action kind.
   * @param actionPayload - The action payload.
   * @returns The action.
   */
  of(actionType: RoutingRuleActionKind, actionPayload: RoutingRulePayload): RoutingRuleAction {
    return { actionType, actionPayload };
  },

  /**
   * Builds a `DELIVER_DEDICATED` action.
   *
   * @param poolId - The dedicated IP pool id.
   * @returns The action.
   */
  deliverDedicated(poolId: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.deliverDedicated,
      actionPayload: { poolId: requireUuid(poolId, "pool_id") },
    };
  },

  /**
   * Builds a `DELIVER` action.
   *
   * @returns The action.
   */
  deliver(): RoutingRuleAction {
    return { actionType: routingRuleActionKind.deliver, actionPayload: {} };
  },

  /**
   * Builds a `SMARTHOST_RELAY` action.
   *
   * @param relayRef - The relay reference.
   * @returns The action.
   */
  smartHostRelay(relayRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.smartHostRelay,
      actionPayload: { relayRef: requireRef(relayRef, "relay_ref") },
    };
  },

  /**
   * Builds a `RELAY` action.
   *
   * @param relayRef - The relay reference.
   * @returns The action.
   */
  relay(relayRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.relay,
      actionPayload: { relayRef: requireRef(relayRef, "relay_ref") },
    };
  },

  /**
   * Builds an `AUTO_REPLY` action.
   *
   * @param templateRef - The template reference.
   * @returns The action.
   */
  autoReply(templateRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.autoReply,
      actionPayload: { templateRef: requireRef(templateRef, "template_ref") },
    };
  },

  /**
   * Builds a `NOTIFY_WEBHOOK` action.
   *
   * @param webhookRef - The webhook reference.
   * @returns The action.
   */
  notifyWebhook(webhookRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.notifyWebhook,
      actionPayload: { webhookRef: requireRef(webhookRef, "webhook_ref") },
    };
  },

  /**
   * Builds a `DELIVER_WEBHOOK` action.
   *
   * @param webhookRef - The webhook reference.
   * @returns The action.
   */
  deliverWebhook(webhookRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.deliverWebhook,
      actionPayload: { webhookRef: requireRef(webhookRef, "webhook_ref") },
    };
  },

  /**
   * Builds an `SMTP_FORWARD` action.
   *
   * @param destinationRef - The destination reference.
   * @returns The action.
   */
  smtpForward(destinationRef: string): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.smtpForward,
      actionPayload: { destinationRef: requireRef(destinationRef, "destination_ref") },
    };
  },

  /**
   * Builds a `DROP` action.
   *
   * @param auditReason - An optional audit reason.
   * @returns The action.
   */
  drop(auditReason?: string): RoutingRuleAction {
    const reason = optionalAtMost(auditReason, 1024, "audit_reason");
    return {
      actionType: routingRuleActionKind.drop,
      actionPayload: reason === undefined ? {} : { auditReason: reason },
    };
  },

  /**
   * Builds a `REJECT` action.
   *
   * @param smtpStatusCode - The SMTP status code, in the 5xx range.
   * @param enhancedStatusCode - The enhanced status code, `5.subject.detail`.
   * @param message - The rejection message.
   * @param auditReason - An optional audit reason.
   * @returns The action.
   */
  reject(
    smtpStatusCode: number,
    enhancedStatusCode: string,
    message: string,
    auditReason?: string,
  ): RoutingRuleAction {
    if (!Number.isInteger(smtpStatusCode) || smtpStatusCode < 500 || smtpStatusCode > 599) {
      throw new Error("admin: smtp_status_code must be in the 5xx range");
    }
    const enhanced = requireText(enhancedStatusCode, "enhanced_status_code").trim();
    if (!ENHANCED_STATUS_REJECT_PATTERN.test(enhanced)) {
      throw new Error("admin: enhanced_status_code must match 5.subject.detail");
    }
    const payload: RoutingRulePayload = {
      smtpStatusCode,
      enhancedStatusCode: enhanced,
      message: requireAtMost(requireText(message, "message"), 1024, "message"),
    };
    const reason = optionalAtMost(auditReason, 1024, "audit_reason");
    return {
      actionType: routingRuleActionKind.reject,
      actionPayload: reason === undefined ? payload : { ...payload, auditReason: reason },
    };
  },

  /**
   * Builds a `MODIFY_HEADER` action.
   *
   * @param operations - The header operations, 1–100.
   * @returns The action.
   */
  modifyHeader(operations: readonly ModifyHeaderOperation[]): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.modifyHeader,
      actionPayload: { operations: validateOperations(operations) },
    };
  },

  /**
   * Builds an `ADD_RECIPIENT` action.
   *
   * @param recipients - The recipients to add, 1–100.
   * @returns The action.
   */
  addRecipient(recipients: readonly string[]): RoutingRuleAction {
    return {
      actionType: routingRuleActionKind.addRecipient,
      actionPayload: { recipients: validateRecipients(recipients) },
    };
  },

  /**
   * Builds an `S3_STORE` action.
   *
   * @param storageRef - The storage reference.
   * @param objectKeyPrefix - An object-key prefix ending in `/`, or `undefined`.
   * @param objectKeyTemplate - An object-key template, or `undefined`.
   * @returns The action.
   */
  s3Store(
    storageRef: string,
    objectKeyPrefix?: string,
    objectKeyTemplate?: string,
  ): RoutingRuleAction {
    const ref = requireAtMost(requireText(storageRef, "storage_ref"), 100, "storage_ref");
    const prefix = objectKeyPrefix?.trim();
    const template = objectKeyTemplate?.trim();
    const hasPrefix = prefix !== undefined && prefix !== "";
    const hasTemplate = template !== undefined && template !== "";
    if (hasPrefix && hasTemplate) {
      throw new Error("admin: only one of object_key_prefix or object_key_template may be set");
    }
    if (!hasPrefix && !hasTemplate) {
      throw new Error("admin: object_key_prefix or object_key_template is required");
    }
    if (hasPrefix && prefix !== undefined) {
      if (prefix.startsWith("/")) {
        throw new Error("admin: object_key_prefix must be bucket-relative");
      }
      if (!prefix.endsWith("/")) {
        throw new Error("admin: object_key_prefix must end with /");
      }
      return {
        actionType: routingRuleActionKind.s3Store,
        actionPayload: { storageRef: ref, objectKeyPrefix: prefix },
      };
    }
    return {
      actionType: routingRuleActionKind.s3Store,
      actionPayload: { storageRef: ref, objectKeyTemplate: template },
    };
  },
} as const;

/**
 * Wire representation of a routing rule.
 *
 * @public
 */
export interface RoutingRuleData {
  /** Rule identifier. */
  readonly id: string;
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** Evaluation priority; lower runs first. */
  readonly priority: number;
  /** The match expression. */
  readonly expressionText: string;
  /** The action taken on a match. */
  readonly action: RoutingRuleAction;
  /** Whether the rule is active. */
  readonly isActive: boolean;
}

/**
 * Request body for `POST .../rules`.
 *
 * @public
 */
export interface CreateRoutingRuleRequest {
  /** Evaluation priority; must be at least 1. */
  readonly priority: number;
  /** The match expression. */
  readonly expressionText: string;
  /** The action taken on a match. */
  readonly action: RoutingRuleAction;
}

/**
 * Request body for `PUT .../rules/{id}`.
 *
 * @public
 */
export interface ReplaceRoutingRuleRequest {
  /** The new match expression. */
  readonly expressionText: string;
  /** The new action. */
  readonly action: RoutingRuleAction;
}

/**
 * Request body for `PUT .../rules/{id}/active`.
 *
 * @public
 */
export interface SetRoutingRuleActiveRequest {
  /** Whether the rule is active. */
  readonly isActive: boolean;
}

/**
 * Request body for `PUT .../rules/{id}/priority`.
 *
 * @public
 */
export interface ReorderRoutingRuleRequest {
  /** The new priority. */
  readonly priority: number;
}

/**
 * Validates a routing-rule expression.
 *
 * @param expressionText - The expression.
 * @returns The expression.
 * @throws `Error` When the expression is blank or too long.
 *
 * @internal
 */
export function validateExpression(expressionText: string): string {
  const expression = requireText(expressionText, "expression_text");
  if (countCodePoints(expression) > 4096) {
    throw new Error("admin: expression_text must be 4096 characters or fewer");
  }
  return expression;
}
