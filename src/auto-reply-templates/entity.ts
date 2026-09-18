/**
 * The hydrated auto-reply template entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import {
  optionalAtMost,
  requireHeaderName,
  requireMailbox,
  requireNoLineBreaks,
  requireText,
} from "../internal/validate.js";
import type {
  AutoReplySenderReadiness,
  AutoReplyTemplateContentSummary,
  AutoReplyTemplateData,
  AutoReplyTemplateHeader,
  UpdateAutoReplyTemplateRequest,
} from "../models/auto-reply.js";

const MAX_BODY = 1_048_576;
const MAX_HEADERS = 10_000;

/** Validates the required header list. @internal */
function requireHeaders(
  headers: readonly AutoReplyTemplateHeader[] | null | undefined,
): readonly AutoReplyTemplateHeader[] {
  if (headers === null || headers === undefined) {
    throw new Error("admin: headers is required");
  }
  if (headers.length > MAX_HEADERS) {
    throw new Error(`admin: headers must contain ${MAX_HEADERS} entries or fewer`);
  }
  headers.forEach((header, index) => {
    requireHeaderName(header.name, `headers[${index}].name`);
    optionalAtMost(header.value, MAX_BODY, `headers[${index}].value`);
  });
  return headers;
}

/**
 * An auto-reply template.
 *
 * @public
 */
export class AutoReplyTemplate extends Entity<AutoReplyTemplateData> {
  /** Template identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** Immutable template reference. @public */
  get templateRef(): string {
    return this.data.templateRef;
  }

  /** Human-readable name. @public */
  get displayName(): string {
    return this.data.displayName;
  }

  /** Sender address used for replies. @public */
  get fromAddress(): string {
    return this.data.fromAddress;
  }

  /** Whether the template is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /** Content summary. @public */
  get content(): AutoReplyTemplateContentSummary {
    return this.data.content;
  }

  /** Sender readiness. @public */
  get senderReadiness(): AutoReplySenderReadiness {
    return this.data.senderReadiness;
  }

  /**
   * Re-fetches this template.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   * @throws `NotFoundException` When the template is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<AutoReplyTemplate> {
    const data = (await this.client.get(this.path, undefined, options)).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces all writable template fields.
   *
   * @param request - The new template fields; `null` bodies clear them.
   * @param options - Optional cancellation signal.
   * @returns The updated template.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async update(
    request: UpdateAutoReplyTemplateRequest,
    options?: RequestOptions,
  ): Promise<AutoReplyTemplate> {
    const hasBody =
      (request.textBody !== null && request.textBody.trim() !== "") ||
      (request.htmlBody !== null && request.htmlBody.trim() !== "");
    if (!hasBody) {
      throw new Error("admin: text_body or html_body is required");
    }
    const body: UpdateAutoReplyTemplateRequest = {
      displayName:
        optionalAtMost(requireText(request.displayName, "display_name"), 255, "display_name") ?? "",
      fromAddress: requireMailbox(request.fromAddress, "from_address"),
      subject: requireNoLineBreaks(
        optionalAtMost(requireText(request.subject, "subject"), MAX_BODY, "subject") ?? "",
        "subject",
      ),
      textBody: optionalAtMost(request.textBody, MAX_BODY, "text_body") ?? null,
      htmlBody: optionalAtMost(request.htmlBody, MAX_BODY, "html_body") ?? null,
      headers: requireHeaders(request.headers),
    };
    const data = (await this.client.put(this.path, body, options)).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Activates or deactivates the template.
   *
   * @param isActive - Whether the template should be active.
   * @param options - Optional cancellation signal.
   * @returns The updated template.
   *
   * @public
   */
  async setActive(isActive: boolean, options?: RequestOptions): Promise<AutoReplyTemplate> {
    const data = (
      await this.client.put(`${this.path}/active`, { isActive }, options)
    ).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }
}
