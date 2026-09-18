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

  /** Why the address is suppressed. @public */
  get reason(): SuppressionReason {
    return this.data.reason;
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
