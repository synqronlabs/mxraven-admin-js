/**
 * Local validation helpers shared by request models.
 *
 * The control plane validates everything, but rejecting obviously invalid input
 * locally gives callers a clear message instead of an opaque `400`/`422`.
 *
 * @internal
 */

const REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAILBOX_PATTERN = /^[^\s<>@]+@[^\s<>@.]+(?:\.[^\s<>@.]+)+$/;
const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Requires a UUID. @internal */
export function requireUuid(value: string | null | undefined, field: string): string {
  const required = requireText(value, field);
  if (!UUID_PATTERN.test(required)) {
    throw new Error(`admin: ${field} must be a valid UUID`);
  }
  return required;
}

/** Requires a mailbox of 3–320 characters using strict local/domain rules. @internal */
export function requireMailboxAddress(value: string | null | undefined, field: string): string {
  const required = requireText(value, field);
  const length = countCodePoints(required);
  if (length < 3 || length > 320) {
    throw new Error(`admin: ${field} must be a valid mailbox`);
  }
  if (!MAILBOX_PATTERN.test(required)) {
    throw new Error(`admin: ${field} must be a valid mailbox`);
  }
  return required;
}

/** Counts Unicode code points, matching the control plane's length contract. @internal */
export function countCodePoints(value: string): number {
  return [...value].length;
}

/** Requires a non-blank string. @internal */
export function requireText(value: string | null | undefined, field: string): string {
  if (value === null || value === undefined || value.trim() === "") {
    throw new Error(`admin: ${field} is required`);
  }
  return value;
}

/** Requires a string no longer than `max` code points. @internal */
export function requireAtMost(value: string, max: number, field: string): string {
  if (countCodePoints(value) > max) {
    throw new Error(`admin: ${field} must be ${max} characters or fewer`);
  }
  return value;
}

/** Bounds an optional string, ignoring `null`/`undefined`. @internal */
export function optionalAtMost(
  value: string | null | undefined,
  max: number,
  field: string,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  return requireAtMost(value, max, field);
}

/** Requires a reference: non-blank, at most 100 code points, and a safe pattern. @internal */
export function requireRef(value: string | null | undefined, field: string): string {
  const required = requireAtMost(requireText(value, field), 100, field);
  if (!REFERENCE_PATTERN.test(required)) {
    throw new Error(
      `admin: ${field} must start with a letter or digit and may contain letters, digits, dots, underscores, or hyphens`,
    );
  }
  return required;
}

/** Requires a mailbox-shaped string: contains `@` and no line breaks. @internal */
export function requireMailbox(value: string | null | undefined, field: string): string {
  const required = requireAtMost(requireText(value, field), 320, field);
  if (!required.includes("@") || required.includes("\r") || required.includes("\n")) {
    throw new Error(`admin: ${field} must be a valid mailbox`);
  }
  return required;
}

/** Requires a syntactically valid email address. @internal */
export function requireEmail(value: string | null | undefined, field: string): string {
  const required = requireAtMost(requireText(value, field), 255, field);
  if (!EMAIL_PATTERN.test(required)) {
    throw new Error(`admin: ${field} must be a valid email address`);
  }
  return required;
}

/** Rejects line breaks in a header value. @internal */
export function requireNoLineBreaks(value: string, field: string): string {
  if (value.includes("\r") || value.includes("\n")) {
    throw new Error(`admin: ${field} must not contain line breaks`);
  }
  return value;
}

/** Validates a header name against RFC 5322 field-name rules. @internal */
export function requireHeaderName(value: string | null | undefined, field: string): string {
  const required = requireAtMost(requireText(value, field), 255, field);
  for (const character of required) {
    const code = character.codePointAt(0) ?? 0;
    if (code <= 32 || code >= 127 || character === ":") {
      throw new Error(`admin: ${field} is invalid`);
    }
  }
  return required;
}

/** Validates an SMTP relay connection. @internal */
export function validateSmtpConnection(input: {
  readonly displayName: string;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
}): void {
  requireAtMost(requireText(input.displayName, "display_name"), 255, "display_name");
  requireAtMost(requireText(input.host, "host"), 253, "host");
  if (!Number.isInteger(input.port) || input.port < 1 || input.port > 65535) {
    throw new Error("admin: port must be between 1 and 65535");
  }
  requireAtMost(requireText(input.username, "username"), 4096, "username");
  requireAtMost(requireText(input.password, "password"), 4096, "password");
}

/** Validates an object-storage integration configuration. @internal */
export function validateStorageConfig(input: {
  readonly displayName: string;
  readonly accessKey: string;
  readonly secretKey: string;
  readonly bucketName: string;
  readonly region: string;
  readonly endpointUrl: string;
}): void {
  requireAtMost(requireText(input.displayName, "display_name"), 255, "display_name");
  requireAtMost(requireText(input.accessKey, "access_key"), 4096, "access_key");
  requireAtMost(requireText(input.secretKey, "secret_key"), 4096, "secret_key");
  requireAtMost(requireText(input.bucketName, "bucket_name"), 255, "bucket_name");
  requireAtMost(requireText(input.region, "region"), 255, "region");
  if (input.endpointUrl === null || input.endpointUrl === undefined) {
    throw new Error("admin: endpoint_url is required; use an empty string for AWS");
  }
  const trimmed = input.endpointUrl.trim();
  if (trimmed.length > 2048) {
    throw new Error("admin: endpoint_url must be 2048 characters or fewer");
  }
  if (trimmed !== "") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      throw new Error("admin: endpoint_url must use http or https");
    }
    if (trimmed.includes("?") || trimmed.includes("#")) {
      throw new Error("admin: endpoint_url must not include a query or fragment");
    }
  }
}

/** Validates an absolute HTTPS webhook target URL. @internal */
export function validateTargetUrl(value: string | null | undefined): string {
  const required = requireText(value, "target_url");
  const trimmed = required.trim();
  if (trimmed.length > 2048) {
    throw new Error("admin: target_url must be 2048 characters or fewer");
  }
  if (!trimmed.startsWith("https://")) {
    throw new Error("admin: target_url must use https");
  }
  const rest = trimmed.slice("https://".length);
  const host = rest.includes("/") ? rest.slice(0, rest.indexOf("/")) : rest;
  if (host.trim() === "" || host.includes(" ")) {
    throw new Error("admin: target_url host is required");
  }
  return trimmed;
}

/** Validates the writable webhook endpoint fields. @internal */
export function validateWebhookFields(displayName: string, targetUrl: string): void {
  requireAtMost(requireText(displayName, "display_name"), 255, "display_name");
  validateTargetUrl(targetUrl);
}

/** Validates a non-empty list of email addresses. @internal */
export function requireEmailList(
  values: readonly string[] | null | undefined,
  field: string,
  maxEntries: number,
): readonly string[] {
  if (values === null || values === undefined || values.length === 0) {
    throw new Error(`admin: ${field} must not be empty`);
  }
  if (values.length > maxEntries) {
    throw new Error(`admin: ${field} must contain ${maxEntries} entries or fewer`);
  }
  return values.map((value, index) => requireEmail(value, `${field}[${index}]`));
}
