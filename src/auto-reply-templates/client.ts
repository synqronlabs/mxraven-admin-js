/**
 * Auto-reply template collection.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import {
  optionalAtMost,
  requireAtMost,
  requireHeaderName,
  requireMailbox,
  requireNoLineBreaks,
  requireRef,
  requireText,
} from "../internal/validate.js";
import type { ListOptions } from "../list.js";
import type {
  AutoReplyTemplateData,
  AutoReplyTemplateHeader,
  CreateAutoReplyTemplateRequest,
} from "../models/auto-reply.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";
import { AutoReplyTemplate } from "./entity.js";

const MAX_BODY = 1_048_576;
const MAX_HEADERS = 10_000;

/** Validates a header list. @internal */
function validateHeaders(
  headers: readonly AutoReplyTemplateHeader[] | null | undefined,
  required: boolean,
): readonly AutoReplyTemplateHeader[] | undefined {
  if (headers === null || headers === undefined) {
    if (required) {
      throw new Error("admin: headers is required");
    }
    return undefined;
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

/** Requires at least one non-blank body. @internal */
function requireBody(
  textBody: string | null | undefined,
  htmlBody: string | null | undefined,
): void {
  const hasText = textBody !== null && textBody !== undefined && textBody.trim() !== "";
  const hasHtml = htmlBody !== null && htmlBody !== undefined && htmlBody.trim() !== "";
  if (!hasText && !hasHtml) {
    throw new Error("admin: text_body or html_body is required");
  }
}

/** Construction options for an {@link AutoReplyTemplatesClient}. @public */
export interface AutoReplyTemplatesClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The tenant slug whose templates are accessed. */
  readonly tenantSlug: string;
}

/**
 * Options for {@link AutoReplyTemplatesClient.list}.
 *
 * @public
 */
export interface ListAutoReplyTemplatesOptions extends ListOptions {
  /** Case-insensitive search across the template. Requires at least 3 characters. */
  readonly search?: string;
}

/**
 * Tenant auto-reply template collection.
 *
 * @public
 */
export class AutoReplyTemplatesClient {
  readonly #client: AdminClient;
  readonly #tenantSlug: string;

  /**
   * @param options - The underlying admin client and tenant slug.
   *
   * @public
   */
  constructor(options: AutoReplyTemplatesClientOptions) {
    this.#client = options.client;
    this.#tenantSlug = options.tenantSlug;
  }

  /**
   * Lists auto-reply templates with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of templates.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListAutoReplyTemplatesOptions = {}): Promise<Paged<AutoReplyTemplate>> {
    const base = this.#path();
    const query = listQuery(options, { q: normalizeSearch(options.search) });
    const paged = await this.#client.paged<AutoReplyTemplateData>(base, query, options);
    return paged.map(
      (data) => new AutoReplyTemplate({ client: this.#client, path: `${base}/${data.id}`, data }),
    );
  }

  /**
   * Gets a template by identifier.
   *
   * @param templateId - The template identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated template.
   * @throws `NotFoundException` When the template is not visible.
   *
   * @public
   */
  async get(templateId: string, options?: RequestOptions): Promise<AutoReplyTemplate> {
    const path = `${this.#path()}/${encodeURIComponent(templateId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({ client: this.#client, path, data });
  }

  /**
   * Gets a template by its immutable reference.
   *
   * @param templateRef - The template reference.
   * @param options - Optional cancellation signal.
   * @returns The hydrated template.
   * @throws `NotFoundException` When the template is not visible.
   *
   * @public
   */
  async getByRef(templateRef: string, options?: RequestOptions): Promise<AutoReplyTemplate> {
    const base = this.#path();
    const data = (
      await this.#client.get(`${base}/ref/${encodeURIComponent(templateRef)}`, undefined, options)
    ).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  /**
   * Creates an auto-reply template.
   *
   * @param request - The template fields.
   * @param options - Optional cancellation signal.
   * @returns The created template.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(
    request: CreateAutoReplyTemplateRequest,
    options?: RequestOptions,
  ): Promise<AutoReplyTemplate> {
    const headers = validateHeaders(request.headers, false);
    requireBody(request.textBody, request.htmlBody);
    const body: CreateAutoReplyTemplateRequest = {
      templateRef: requireRef(request.templateRef, "template_ref"),
      displayName: requireAtMost(
        requireText(request.displayName, "display_name"),
        255,
        "display_name",
      ),
      fromAddress: requireMailbox(request.fromAddress, "from_address"),
      subject: requireNoLineBreaks(
        optionalAtMost(requireText(request.subject, "subject"), MAX_BODY, "subject") ?? "",
        "subject",
      ),
      textBody: optionalAtMost(request.textBody, MAX_BODY, "text_body"),
      htmlBody: optionalAtMost(request.htmlBody, MAX_BODY, "html_body"),
      headers,
    };
    const base = this.#path();
    const data = (await this.#client.post(base, body, options)).as<AutoReplyTemplateData>();
    return new AutoReplyTemplate({ client: this.#client, path: `${base}/${data.id}`, data });
  }

  #path(): string {
    return `/tenants/${encodeURIComponent(this.#tenantSlug)}/auto-reply-templates`;
  }
}
