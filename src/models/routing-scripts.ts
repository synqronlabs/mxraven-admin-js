/**
 * Routing-script, revision, and simulation models.
 *
 * @packageDocumentation
 */

import { requireAtMost, requireHeaderName, requireText } from "../internal/validate.js";
import type { ListenerType } from "./listeners.js";

/** The largest Lua source the control plane accepts, in code points. */
const MAX_SOURCE_LENGTH = 131_072;

/**
 * The lifecycle state of a script revision.
 *
 * @public
 */
export const scriptRevisionStatus = {
  /** Saved but not live. */
  draft: "draft",
  /** The listener's live revision. */
  published: "published",
  /** Was live and can be rolled back to. */
  superseded: "superseded",
} as const;

/**
 * The lifecycle state of a script revision.
 *
 * @public
 */
export type ScriptRevisionStatus = (typeof scriptRevisionStatus)[keyof typeof scriptRevisionStatus];

/**
 * The severity of a save-time script diagnostic.
 *
 * @public
 */
export const scriptDiagnosticSeverity = {
  /** The revision cannot be published until this is fixed. */
  error: "error",
  /** The revision can be published, but the finding is worth reviewing. */
  warning: "warning",
} as const;

/**
 * The severity of a save-time script diagnostic.
 *
 * @public
 */
export type ScriptDiagnosticSeverity =
  (typeof scriptDiagnosticSeverity)[keyof typeof scriptDiagnosticSeverity];

/**
 * The effect a simulated script asked the control plane to perform.
 *
 * @public
 */
export const scriptIntentKind = {
  /** Set a message header. */
  headerSet: "header.set",
  /** Append a message header. */
  headerAppend: "header.append",
  /** Remove a message header. */
  headerRemove: "header.remove",
  /** Add a recipient. */
  recipientsAdd: "recipients.add",
  /** Archive the message in object storage. */
  archiveS3: "archive.s3",
  /** Forward over SMTP. */
  forwardSmtp: "forward.smtp",
  /** Deliver through the shared pool. */
  deliverShared: "deliver.shared",
  /** Deliver through a dedicated pool. */
  deliverDedicated: "deliver.dedicated",
  /** Deliver through a smart host. */
  deliverSmarthost: "deliver.smarthost",
  /** Relay over SMTP. */
  relaySmtp: "relay.smtp",
  /** Reply with an auto-reply template. */
  reply: "reply",
  /** Drop the message. */
  drop: "drop",
  /** Reject the message. */
  reject: "reject",
  /** Defer the message. */
  defer: "defer",
} as const;

/**
 * The effect a simulated script asked the control plane to perform.
 *
 * @public
 */
export type ScriptIntentKind = (typeof scriptIntentKind)[keyof typeof scriptIntentKind];

/**
 * A reason a simulated script faulted.
 *
 * @public
 */
export const scriptFaultReason = {
  /** The script raised a Lua error. */
  runtimeError: "runtime_error",
  /** The script exceeded its execution deadline. */
  deadlineExceeded: "deadline_exceeded",
  /** The script exceeded its memory limit. */
  memoryExhausted: "memory_exhausted",
  /** The script staged an effect that failed validation. */
  invalidEffect: "invalid_effect",
  /** The script exceeded the routing budget. */
  routingBudgetExhausted: "routing_budget_exhausted",
  /** The listener was quarantined after repeated faults. */
  quarantined: "quarantined",
} as const;

/**
 * A reason a simulated script faulted.
 *
 * @public
 */
export type ScriptFaultReason = (typeof scriptFaultReason)[keyof typeof scriptFaultReason];

/**
 * A revision's resolved dependencies.
 *
 * These are the only resource names the revision's effects may use, resolved and
 * ownership-checked when the revision was saved.
 *
 * @public
 */
export interface ScriptDependencies {
  /** Forwarding-destination references. */
  readonly forward: readonly string[];
  /** Relay references. */
  readonly relay: readonly string[];
  /** Storage-integration references. */
  readonly storage: readonly string[];
  /** HTTP endpoint references. */
  readonly endpoint: readonly string[];
  /** Auto-reply template references. */
  readonly template: readonly string[];
  /** Dedicated IP pool references. */
  readonly pool: readonly string[];
  /** Recipient-set names. */
  readonly sets: readonly string[];
}

/**
 * One save-time finding with an editor location.
 *
 * @public
 */
export interface ScriptDiagnostic {
  /** Whether the finding blocks publication. */
  readonly severity: ScriptDiagnosticSeverity;
  /** The source line, or `0` when unknown. */
  readonly line: number;
  /** The source column, or `0` when only the line is known. */
  readonly column: number;
  /** The human-readable finding. */
  readonly message: string;
  /** An optional hint for fixing it. */
  readonly hint?: string;
}

/**
 * A revision in list results, without its source or diagnostics.
 *
 * @public
 */
export interface ScriptRevisionSummary {
  /** Revision identifier. */
  readonly id: string;
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** The one-based revision number. */
  readonly revision: number;
  /** The lifecycle state. */
  readonly status: ScriptRevisionStatus;
  /** Whether the revision compiled and validated without errors. */
  readonly publishable: boolean;
  /** SHA-256 of the source, as lowercase hex. */
  readonly sourceSha256: string;
  /** The fact schema the revision is pinned to. */
  readonly schemaVersion: string;
  /** The principal that saved the revision. */
  readonly createdBy: string;
  /** When the revision was saved. */
  readonly createdAt: string;
  /** The principal that published the revision, when it has been published. */
  readonly publishedBy?: string;
  /** When the revision was published, when it has been published. */
  readonly publishedAt?: string;
}

/**
 * A script revision with its source, dependencies, and save-time diagnostics.
 *
 * @public
 */
export interface ScriptRevision extends ScriptRevisionSummary {
  /** The Lua 5.4 source. */
  readonly source: string;
  /** The resolved dependencies. */
  readonly dependencies: ScriptDependencies;
  /** Save-time findings, including errors that block publication. */
  readonly diagnostics: readonly ScriptDiagnostic[];
}

/**
 * A listener's routing script.
 *
 * A listener without a published revision uses its listener-type default:
 * submission listeners deliver through the shared pool, and MTA listeners drop
 * after acceptance.
 *
 * @public
 */
export interface ListenerScript {
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** The listener kind. */
  readonly listenerType: ListenerType;
  /** MTA only. Whether `mail.body:text()` may read the spooled body. */
  readonly bodyAccess: boolean;
  /** The live revision, when one exists. */
  readonly published?: ScriptRevision;
}

/**
 * Request body for `POST .../script/revisions`.
 *
 * @public
 */
export interface CreateScriptRevisionRequest {
  /** Lua 5.4 source defining `handle(mail, mx)`. */
  readonly source: string;
}

/**
 * Request body for `POST .../script/rollback`.
 *
 * @public
 */
export interface RollbackListenerScriptRequest {
  /** A previously published, now superseded revision to make live again. */
  readonly revision: number;
}

/**
 * Request body for `PUT .../script/body-access`.
 *
 * @public
 */
export interface UpdateListenerScriptBodyAccessRequest {
  /** Whether the script may read the text/plain body. */
  readonly enabled: boolean;
}

/**
 * The published revision's source and dependency manifest.
 *
 * @public
 */
export interface ExportedListenerScript {
  /** Owning listener identifier. */
  readonly listenerId: string;
  /** The published revision number. */
  readonly revision: number;
  /** The Lua source. */
  readonly source: string;
  /** The resolved dependencies. */
  readonly dependencies: ScriptDependencies;
}

/**
 * One header in a simulated message fixture.
 *
 * @public
 */
export interface SimulationHeader {
  /** The header name. */
  readonly name: string;
  /** The header value. */
  readonly value: string;
}

/**
 * One synthesized attachment's metadata.
 *
 * Its content is never needed: only what `mail.body:attachments()` reports.
 *
 * @public
 */
export interface SimulationAttachment {
  /** The attachment filename. */
  readonly filename?: string;
  /** The attachment content type. */
  readonly contentType?: string;
  /** The attachment size in bytes. */
  readonly sizeBytes?: number;
  /** Whether the attachment is inline. */
  readonly inline?: boolean;
}

/**
 * A synthesized message for a simulated run.
 *
 * Omitted fields take neutral defaults. Authentication and verdict overrides
 * apply to MTA listeners only.
 *
 * @public
 */
export interface SimulationFixture {
  /** The envelope sender. */
  readonly mailFrom?: string;
  /** The envelope recipients. */
  readonly rcptTo?: readonly string[];
  /** The message headers. */
  readonly headers?: readonly SimulationHeader[];
  /** The remote client address. */
  readonly remoteAddr?: string;
  /** Whether the session used TLS. */
  readonly tlsActive?: boolean;
  /** The EHLO name. */
  readonly ehloName?: string;
  /** The message size in bytes. */
  readonly sizeBytes?: number;
  /**
   * The text/plain body read by `mail.body:text()`.
   *
   * When empty, `mail.body:text()` falls back to the text extracted from
   * {@link SimulationFixture.bodyHtml}.
   */
  readonly bodyText?: string;
  /**
   * The text/html body, read by `mail.body:links()` and as a text fallback.
   *
   * Applies to MTA listeners with body access.
   */
  readonly bodyHtml?: string;
  /** The attachments `mail.body:attachments()` reports, at most 32. */
  readonly attachments?: readonly SimulationAttachment[];
  /** When the message was received. */
  readonly receivedAt?: string;
  /** Overrides for `mail.auth`, using the fact field names. */
  readonly auth?: Readonly<Record<string, unknown>>;
  /** Overrides for `mail.verdicts`, using the fact field names. */
  readonly verdicts?: Readonly<Record<string, unknown>>;
}

/**
 * The canned response an `mx.http` call receives during a simulation.
 *
 * The simulator never performs a real request.
 *
 * @public
 */
export interface SimulationHttpStub {
  /** The endpoint reference the stub answers for. */
  readonly endpoint: string;
  /** The HTTP status to return. */
  readonly status?: number;
  /** The response body to return. */
  readonly body?: string;
  /** The response headers to return. */
  readonly headers?: Readonly<Record<string, string>>;
  /** A transport failure to simulate instead of a response. */
  readonly error?: string;
}

/**
 * Request body for `POST .../script/revisions/{revision}/simulate`.
 *
 * @public
 */
export interface SimulateScriptRevisionRequest {
  /** The synthesized message to run the script against. */
  readonly fixture?: SimulationFixture;
  /** Canned HTTP responses, at most two. */
  readonly httpStubs?: readonly SimulationHttpStub[];
  /** Recipient-set stand-ins, mapping set name to member addresses. */
  readonly recipientSets?: Readonly<Record<string, readonly string[]>>;
}

/**
 * One validated effect staged by a simulated script.
 *
 * Only the fields its kind uses are present.
 *
 * @public
 */
export interface ScriptIntent {
  /** The effect kind. */
  readonly kind: ScriptIntentKind;
  /** The header name, for header effects. */
  readonly header?: string;
  /** The header value, for header effects. */
  readonly value?: string;
  /** The recipient address, for `recipients.add`. */
  readonly address?: string;
  /** The resource reference, for effects that use one. */
  readonly ref?: string;
  /** The dedicated IP pool reference, for `deliver.dedicated`. */
  readonly pool?: string;
  /** The object key, for `archive.s3`. */
  readonly key?: string;
  /** The template reference, for `reply`. */
  readonly template?: string;
  /** The SMTP status code, for `reject` and `defer`. */
  readonly code?: number;
  /** The enhanced status code, for `reject` and `defer`. */
  readonly enhanced?: string;
  /** The response text, for `reply`, `reject`, and `defer`. */
  readonly text?: string;
  /** The audit reason, for `drop` and `reject`. */
  readonly reason?: string;
}

/**
 * An effect a simulated script staged but the control plane would not apply.
 *
 * @public
 */
export interface ScriptSkippedIntent {
  /** The staged effect. */
  readonly intent: ScriptIntent;
  /** Why it would be skipped. */
  readonly reason: string;
}

/**
 * A fault raised while simulating a revision.
 *
 * @public
 */
export interface ScriptFault {
  /** Why the script faulted. */
  readonly reason: ScriptFaultReason;
  /** A human-readable message. */
  readonly message: string;
  /** The source line, when known. */
  readonly line?: number;
}

/**
 * One `mx.http` call made during a simulation.
 *
 * @public
 */
export interface ScriptHttpCall {
  /** The endpoint reference. */
  readonly endpoint: string;
  /** The simulated HTTP status. */
  readonly status: number;
  /** The simulated duration in milliseconds. */
  readonly durationMs: number;
  /** The request size in bytes. */
  readonly requestBytes: number;
  /** The response size in bytes. */
  readonly responseBytes: number;
  /** A simulated transport error, when the call failed. */
  readonly error?: string;
}

/**
 * One host-call trace entry from a simulation.
 *
 * @public
 */
export interface ScriptTraceEntry {
  /** The traced operation. */
  readonly op: string;
  /** Optional detail for the operation. */
  readonly detail?: string;
}

/**
 * The result of simulating a revision.
 *
 * @public
 */
export interface ScriptSimulationResult {
  /** The simulated revision number. */
  readonly revision: number;
  /** The terminal effect the script staged. */
  readonly terminal: ScriptIntent;
  /**
   * Whether the listener-type default applied because the script staged no
   * terminal, or because a submission script faulted.
   *
   * An MTA script fault defers instead, so this is `false` there.
   */
  readonly defaultApplied: boolean;
  /** Every validated effect, in staging order. */
  readonly intents: readonly ScriptIntent[];
  /** Effects that would be skipped, with the reason. */
  readonly skipped: readonly ScriptSkippedIntent[];
  /** Lines the script logged. */
  readonly log: readonly string[];
  /** The fault that ended the run, when it faulted. */
  readonly fault?: ScriptFault;
  /** `mx.http` calls, answered from the supplied stubs. */
  readonly httpCalls: readonly ScriptHttpCall[];
  /** The host-call trace. */
  readonly trace: readonly ScriptTraceEntry[];
  /** The simulated run duration in microseconds. */
  readonly durationUs: number;
}

/**
 * Validates Lua routing-script source.
 *
 * @param source - The Lua 5.4 source.
 * @returns The source unchanged.
 * @throws `Error` When the source is blank or too long.
 *
 * @internal
 */
export function validateScriptSource(source: string): string {
  const value = requireText(source, "source");
  return requireAtMost(value, MAX_SOURCE_LENGTH, "source");
}

/**
 * Validates a revision number.
 *
 * @param revision - The revision number.
 * @returns The revision number.
 * @throws `Error` When it is not a positive integer.
 *
 * @internal
 */
export function validateRevision(revision: number): number {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new Error("admin: revision must be a positive integer");
  }
  return revision;
}

/**
 * Validates a simulation request before sending.
 *
 * @param request - The simulation request.
 * @throws `Error` When a fixture or stub field fails local validation.
 *
 * @internal
 */
export function validateSimulationRequest(request: SimulateScriptRevisionRequest): void {
  const fixture = request.fixture;
  if (fixture !== undefined) {
    for (const [index, header] of (fixture.headers ?? []).entries()) {
      requireHeaderName(header.name, `fixture.headers[${index}]: name`);
      requireAtMost(header.value, 998, `fixture.headers[${index}]: value`);
      if (header.value.includes("\r") || header.value.includes("\n")) {
        throw new Error(`admin: fixture.headers[${index}]: value must not contain line breaks`);
      }
    }
    if (fixture.rcptTo !== undefined && fixture.rcptTo.length > 100) {
      throw new Error("admin: fixture.rcpt_to must contain 100 entries or fewer");
    }
    if (fixture.headers !== undefined && fixture.headers.length > 200) {
      throw new Error("admin: fixture.headers must contain 200 entries or fewer");
    }
    requireAtMost(fixture.bodyText ?? "", 65_536, "fixture.body_text");
    requireAtMost(fixture.bodyHtml ?? "", 262_144, "fixture.body_html");
    const attachments = fixture.attachments ?? [];
    if (attachments.length > 32) {
      throw new Error("admin: fixture.attachments must contain 32 entries or fewer");
    }
    for (const [index, attachment] of attachments.entries()) {
      requireAtMost(attachment.filename ?? "", 255, `fixture.attachments[${index}]: filename`);
      requireAtMost(
        attachment.contentType ?? "",
        255,
        `fixture.attachments[${index}]: content_type`,
      );
      if (
        attachment.sizeBytes !== undefined &&
        (!Number.isInteger(attachment.sizeBytes) || attachment.sizeBytes < 0)
      ) {
        throw new Error(
          `admin: fixture.attachments[${index}]: size_bytes must be a non-negative integer`,
        );
      }
    }
  }
  const stubs = request.httpStubs ?? [];
  if (stubs.length > 2) {
    throw new Error("admin: http_stubs must contain 2 entries or fewer");
  }
  for (const [index, stub] of stubs.entries()) {
    requireAtMost(
      requireText(stub.endpoint, `http_stubs[${index}]: endpoint`),
      100,
      `http_stubs[${index}]: endpoint`,
    );
    if (stub.status !== undefined && (stub.status < 100 || stub.status > 599)) {
      throw new Error(`admin: http_stubs[${index}]: status must be between 100 and 599`);
    }
  }
}
