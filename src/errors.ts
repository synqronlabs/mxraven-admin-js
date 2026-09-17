/**
 * Errors raised by the mxRaven control-plane admin API.
 *
 * Non-success responses are decoded from the RFC 9457
 * `application/problem+json` body and thrown as an {@link ApiException} (or one
 * of its status-specific subclasses). Branch on {@link ApiException.code}, which
 * is stable, rather than on the human-readable title or detail.
 */

/**
 * One actionable validation issue from an RFC 9457 problem response.
 *
 * @public
 */
export interface ProblemError {
  /** RFC 6901 JSON Pointer to the invalid request value, when applicable. */
  readonly pointer?: string;
  /** Stable machine-readable validation issue code. */
  readonly code?: string;
  /** Safe human-readable explanation. */
  readonly detail?: string;
}

/**
 * RFC 9457 Problem Details as returned by the v2 control plane with the
 * `application/problem+json` media type.
 *
 * @public
 */
export interface Problem {
  /** Stable URI identifying the problem category. */
  readonly type?: string;
  /** Short human-readable summary of the problem category. */
  readonly title?: string;
  /** HTTP status code returned for this occurrence. */
  readonly status?: number;
  /** Stable machine-readable mxRaven error code; branch on this. */
  readonly code?: string;
  /** Safe human-readable detail for this occurrence. */
  readonly detail?: string;
  /** URI reference identifying this occurrence, when available. */
  readonly instance?: string;
  /** Identifier suitable for support correlation. */
  readonly traceId?: string;
  /** Optional actionable validation issues. */
  readonly errors?: readonly ProblemError[];
}

/**
 * Base class for every error raised by this SDK.
 *
 * @public
 */
export class MxRavenError extends Error {
  /**
   * @param message - The human-readable error message.
   * @param options - Standard error options, including the original cause.
   *
   * @public
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MxRavenError";
  }
}

/**
 * Construction options for {@link ApiException}.
 *
 * @public
 */
export interface ApiExceptionOptions {
  /** The HTTP status code of the response. */
  readonly status: number;
  /** Stable machine-readable error code, when one was returned. */
  readonly code?: string;
  /** Short human-readable problem title, when one was returned. */
  readonly title?: string;
  /** Human-readable problem detail, or the raw body when no problem decoded. */
  readonly detail?: string;
  /** Support correlation identifier, when one was returned. */
  readonly traceId?: string;
  /** Actionable validation issues; empty when none were provided. */
  readonly errors?: readonly ProblemError[];
  /** The full decoded problem, when the body decoded as one. */
  readonly problem?: Problem;
  /** The server-requested retry delay in milliseconds, when available. */
  readonly retryAfterMs?: number;
  /** The original error, when this one wraps a transport or parsing failure. */
  readonly cause?: unknown;
}

/** Builds the exception message from the problem fields. @internal */
function buildMessage(
  status: number,
  code: string | undefined,
  detail: string | undefined,
): string {
  let message = `HTTP ${status}`;
  if (code !== undefined && code !== "") {
    message += ` ${code}`;
  }
  if (detail !== undefined && detail !== "") {
    message += `: ${detail}`;
  }
  return message;
}

/**
 * A non-successful control-plane API response.
 *
 * The full decoded {@link Problem} is available from {@link ApiException.problem}.
 * Prefer catching the status-specific subclasses (`NotFoundException`,
 * `ConflictException`, `ValidationException`, ...) over inspecting the status.
 *
 * @public
 */
export class ApiException extends MxRavenError {
  /** The HTTP status code of the response. */
  readonly status: number;

  /** Stable machine-readable error code, or `undefined` when absent. */
  readonly code: string | undefined;

  /** Short human-readable problem title, or `undefined` when absent. */
  readonly title: string | undefined;

  /** Human-readable problem detail, or the raw body when no problem decoded. */
  readonly detail: string | undefined;

  /** Support correlation identifier, or `undefined` when absent. */
  readonly traceId: string | undefined;

  /** Actionable validation issues; empty when none were provided. */
  readonly errors: readonly ProblemError[];

  /** The full decoded problem, or `undefined` when the body was not a problem. */
  readonly problem: Problem | undefined;

  /** The server-requested retry delay in milliseconds, when available. */
  readonly retryAfterMs: number | undefined;

  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: ApiExceptionOptions) {
    const problem = options.problem;
    const code = options.code ?? problem?.code;
    const detail = options.detail ?? problem?.detail;
    super(buildMessage(options.status, code, detail), { cause: options.cause });
    this.name = "ApiException";
    this.status = options.status;
    this.code = code;
    this.title = options.title ?? problem?.title;
    this.detail = detail;
    this.traceId = options.traceId ?? problem?.traceId;
    this.errors = options.errors ?? problem?.errors ?? [];
    this.problem = problem;
    this.retryAfterMs = options.retryAfterMs;
  }

  /**
   * Whether the request may succeed if retried later.
   *
   * Rate limits (`429`) and server-side failures (`5xx`) are retryable.
   *
   * @public
   */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

/** A malformed request (`400`). @public */
export class BadRequestException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 400 });
    this.name = "BadRequestException";
  }
}

/** A missing, invalid, or expired token (`401`). @public */
export class AuthenticationException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 401 });
    this.name = "AuthenticationException";
  }
}

/** A missing scope or tenant access (`403`). @public */
export class PermissionDeniedException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 403 });
    this.name = "PermissionDeniedException";
  }
}

/** A resource that was not found or not visible (`404`). @public */
export class NotFoundException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 404 });
    this.name = "NotFoundException";
  }
}

/** A request that conflicts with current state (`409`). @public */
export class ConflictException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 409 });
    this.name = "ConflictException";
  }
}

/**
 * A semantic rejection (`422`).
 *
 * Inspect {@link ApiException.errors} for per-value validation issues.
 *
 * @public
 */
export class ValidationException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 422 });
    this.name = "ValidationException";
  }
}

/** A rate limit that was retried per the client config, then surfaced (`429`). @public */
export class RateLimitException extends ApiException {
  /**
   * @param options - The decoded problem fields.
   *
   * @public
   */
  constructor(options: Omit<ApiExceptionOptions, "status"> = {}) {
    super({ ...options, status: 429 });
    this.name = "RateLimitException";
  }
}

/** A control-plane failure (`5xx`). @public */
export class ServerException extends ApiException {
  /**
   * @param options - The decoded problem fields, including the actual status.
   *
   * @public
   */
  constructor(options: ApiExceptionOptions) {
    super(options);
    this.name = "ServerException";
  }
}

/** Reports whether a decoded value looks like an RFC 9457 problem. @internal */
function isProblem(value: unknown): value is Problem {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code?: unknown }).code === "string"
  );
}

/**
 * Decodes an exception from a response. A decoded body is treated as an RFC 9457
 * problem when it is an object carrying a `code` field, and a typed subclass is
 * chosen from the status.
 *
 * @param options - The status, raw body, decoded (camel-cased) body, and retry delay.
 * @returns The exception to throw.
 *
 * @internal
 */
export function apiExceptionFrom(options: {
  readonly status: number;
  readonly rawBody: string;
  readonly body: unknown;
  readonly retryAfterMs?: number;
}): ApiException {
  const problem = isProblem(options.body) ? options.body : undefined;
  const fallback = options.rawBody.trim() === "" ? undefined : options.rawBody;
  const detail = problem?.detail ?? fallback;
  const base = { problem, detail, retryAfterMs: options.retryAfterMs };
  switch (options.status) {
    case 400:
      return new BadRequestException(base);
    case 401:
      return new AuthenticationException(base);
    case 403:
      return new PermissionDeniedException(base);
    case 404:
      return new NotFoundException(base);
    case 409:
      return new ConflictException(base);
    case 422:
      return new ValidationException(base);
    case 429:
      return new RateLimitException(base);
    default:
      return options.status >= 500
        ? new ServerException({ ...base, status: options.status })
        : new ApiException({ ...base, status: options.status });
  }
}
