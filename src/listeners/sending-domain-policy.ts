/**
 * Listener sending-domain policy operations.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import type {
  ReplaceSendingDomainPolicyRequest,
  SendingDomainPolicy,
  SendingDomainPolicyGrantRequest,
} from "../models/sending-domain.js";

/** Distinguishes a grant array from a replacement request. @internal */
function isGrantArray(
  value: readonly SendingDomainPolicyGrantRequest[] | ReplaceSendingDomainPolicyRequest,
): value is readonly SendingDomainPolicyGrantRequest[] {
  return Array.isArray(value);
}

/** Construction options for a {@link SendingDomainPoliciesClient}. @public */
export interface SendingDomainPoliciesClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative policy path. */
  readonly path: string;
}

/**
 * The sending-domain policy of a single listener.
 *
 * This is a singleton: `get` reads it and `update` replaces the complete grant
 * set atomically.
 *
 * @public
 */
export class SendingDomainPoliciesClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and policy path.
   *
   * @public
   */
  constructor(options: SendingDomainPoliciesClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Reads the effective policy.
   *
   * @param options - Optional cancellation signal.
   * @returns The policy.
   *
   * @public
   */
  get(options?: RequestOptions): Promise<SendingDomainPolicy> {
    return this.#client
      .get(this.#path, undefined, options)
      .then((response) => response.as<SendingDomainPolicy>());
  }

  /**
   * Replaces the complete grant set.
   *
   * @param grants - The grants, or a replacement request.
   * @param options - Optional cancellation signal.
   * @returns The updated policy.
   *
   * @public
   */
  update(
    grants: readonly SendingDomainPolicyGrantRequest[],
    options?: RequestOptions,
  ): Promise<SendingDomainPolicy>;
  update(
    request: ReplaceSendingDomainPolicyRequest,
    options?: RequestOptions,
  ): Promise<SendingDomainPolicy>;
  update(
    grantsOrRequest: readonly SendingDomainPolicyGrantRequest[] | ReplaceSendingDomainPolicyRequest,
    options?: RequestOptions,
  ): Promise<SendingDomainPolicy> {
    const body: ReplaceSendingDomainPolicyRequest = isGrantArray(grantsOrRequest)
      ? { grants: grantsOrRequest }
      : grantsOrRequest;
    return this.#client
      .put(this.#path, body, options)
      .then((response) => response.as<SendingDomainPolicy>());
  }
}
