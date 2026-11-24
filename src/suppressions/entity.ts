/**
 * The hydrated tenant suppression entity.
 */

import type { RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type { SuppressionReason, TenantSuppressionData } from "../models/suppressions.js";

/**
 * A suppressed recipient address.
 *
 * @public
 */
export class TenantSuppression extends Entity<TenantSuppressionData> {
  /** The owning tenant identifier. @public */
  get tenantId(): string {
    return this.data.tenantId;
  }

  /** The suppressed recipient address. @public */
  get emailAddress(): string {
    return this.data.emailAddress;
  }

  /** The provider-canonical mailbox identity used for matching. @public */
  get canonicalEmailAddress(): string {
    return this.data.canonicalEmailAddress;
  }

  /** Why the address is suppressed, when a reason is recorded. @public */
  get reason(): SuppressionReason | undefined {
    return this.data.reason;
  }

  /** Whether mxRaven feedback system manages this suppression. @public */
  get systemManaged(): boolean {
    return this.data.systemManaged === true;
  }

  /** The opaque provenance label, or `null`. @public */
  get source(): string | null | undefined {
    return this.data.source;
  }

  /** How many feedback signals contributed. @public */
  get feedbackCount(): number | undefined {
    return this.data.feedbackCount;
  }

  /** When the suppression was added. @public */
  get addedAt(): string | undefined {
    return this.data.addedAt;
  }

  /** When the last contributing feedback arrived, or `null`. @public */
  get lastFeedbackAt(): string | null | undefined {
    return this.data.lastFeedbackAt;
  }

  /** When the suppression was last updated. @public */
  get updatedAt(): string | undefined {
    return this.data.updatedAt;
  }

  /**
   * Re-fetches this suppression and returns a fresh snapshot.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh suppression snapshot.
   * @throws `NotFoundException` When the suppression is no longer visible.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<TenantSuppression> {
    const data = (await this.client.get(this.path, undefined, options)).as<TenantSuppressionData>();
    return new TenantSuppression({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }

  /**
   * Replaces the stored suppression reason.
   *
   * @param reason - The new reason, or `null` to clear it.
   * @param options - Optional cancellation signal.
   * @returns The updated suppression.
   *
   * @public
   */
  async update(
    reason: SuppressionReason | null,
    options?: RequestOptions,
  ): Promise<TenantSuppression> {
    const data = (
      await this.client.put(this.path, { reason }, options)
    ).as<TenantSuppressionData>();
    return new TenantSuppression({
      client: this.client,
      path: this.path,
      data,
      deleted: this.isDeleted,
    });
  }
}
