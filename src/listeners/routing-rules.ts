/**
 * Routing-rule collection for a listener.
 */

import type { AdminClient, RequestOptions } from "../client.js";
import { Entity } from "../entity.js";
import type { ListOptions } from "../list.js";
import type {
  CreateRoutingRuleRequest,
  ReplaceRoutingRuleRequest,
  RoutingRuleAction,
  RoutingRuleActionKind,
  RoutingRuleData,
} from "../models/routing-rules.js";
import { validateExpression } from "../models/routing-rules.js";
import type { Paged } from "../pagination.js";
import { listQuery, normalizeSearch } from "../query.js";

/** Construction options for a {@link RoutingRulesClient}. @public */
export interface RoutingRulesClientOptions {
  /** The underlying admin client. */
  readonly client: AdminClient;
  /** The client-relative rules path. */
  readonly path: string;
}

/**
 * Options for {@link RoutingRulesClient.list}.
 *
 * @public
 */
export interface ListRoutingRulesOptions extends ListOptions {
  /** Case-insensitive search across the rule. Requires at least 3 characters. */
  readonly search?: string;
  /** Restrict to a single action kind. */
  readonly actionType?: RoutingRuleActionKind;
  /** Restrict to a required active state. */
  readonly active?: boolean;
}

/** Validates a routing-rule action reference. @internal */
function requireAction(action: RoutingRuleAction | null | undefined): RoutingRuleAction {
  if (action === null || action === undefined) {
    throw new Error("admin: action is required");
  }
  return action;
}

/**
 * Routing rules for a single listener.
 *
 * Rules are evaluated in ascending priority; lower runs first.
 *
 * @public
 */
export class RoutingRulesClient {
  readonly #client: AdminClient;
  readonly #path: string;

  /**
   * @param options - The underlying admin client and rules path.
   *
   * @public
   */
  constructor(options: RoutingRulesClientOptions) {
    this.#client = options.client;
    this.#path = options.path;
  }

  /**
   * Lists routing rules with optional filters.
   *
   * @param options - Optional filters, pagination, and cancellation signal.
   * @returns A lazily paginating collection of rules.
   * @throws `ApiException` When the control plane returns a non-success status.
   *
   * @public
   */
  async list(options: ListRoutingRulesOptions = {}): Promise<Paged<RoutingRule>> {
    const query = listQuery(options, {
      q: normalizeSearch(options.search),
      action_type: options.actionType,
      is_active: options.active,
    });
    const paged = await this.#client.paged<RoutingRuleData>(this.#path, query, options);
    return paged.map(
      (data) => new RoutingRule({ client: this.#client, path: `${this.#path}/${data.id}`, data }),
    );
  }

  /**
   * Gets a routing rule by identifier.
   *
   * @param ruleId - The rule identifier.
   * @param options - Optional cancellation signal.
   * @returns The hydrated rule.
   * @throws `NotFoundException` When the rule is not visible.
   *
   * @public
   */
  async get(ruleId: string, options?: RequestOptions): Promise<RoutingRule> {
    const path = `${this.#path}/${encodeURIComponent(ruleId)}`;
    const data = (await this.#client.get(path, undefined, options)).as<RoutingRuleData>();
    return new RoutingRule({ client: this.#client, path, data });
  }

  /**
   * Creates a routing rule.
   *
   * @param request - The priority, expression, and action.
   * @param options - Optional cancellation signal.
   * @returns The created rule.
   * @throws `Error` When a field fails local validation.
   *
   * @public
   */
  async create(request: CreateRoutingRuleRequest, options?: RequestOptions): Promise<RoutingRule> {
    if (!Number.isInteger(request.priority) || request.priority < 1) {
      throw new Error("admin: priority must be greater than 0");
    }
    const expressionText = validateExpression(request.expressionText);
    const action = requireAction(request.action);
    const body: CreateRoutingRuleRequest = { priority: request.priority, expressionText, action };
    const data = (await this.#client.post(this.#path, body, options)).as<RoutingRuleData>();
    return new RoutingRule({ client: this.#client, path: `${this.#path}/${data.id}`, data });
  }
}

/**
 * A routing rule.
 *
 * @public
 */
export class RoutingRule extends Entity<RoutingRuleData> {
  /** Rule identifier. @public */
  get id(): string {
    return this.data.id;
  }

  /** Owning listener identifier. @public */
  get listenerId(): string {
    return this.data.listenerId;
  }

  /** Evaluation priority; lower runs first. @public */
  get priority(): number {
    return this.data.priority;
  }

  /** The match expression. @public */
  get expressionText(): string {
    return this.data.expressionText;
  }

  /** The action taken on a match. @public */
  get action(): RoutingRuleAction {
    return this.data.action;
  }

  /** Whether the rule is active. @public */
  get isActive(): boolean {
    return this.data.isActive;
  }

  /**
   * Re-fetches this rule.
   *
   * @param options - Optional cancellation signal.
   * @returns A fresh snapshot.
   *
   * @public
   */
  async reload(options?: RequestOptions): Promise<RoutingRule> {
    const data = (await this.client.get(this.path, undefined, options)).as<RoutingRuleData>();
    return new RoutingRule({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Replaces the expression and action; the priority is unchanged.
   *
   * @param request - The new expression and action.
   * @param options - Optional cancellation signal.
   * @returns The updated rule.
   *
   * @public
   */
  async replace(
    request: ReplaceRoutingRuleRequest,
    options?: RequestOptions,
  ): Promise<RoutingRule> {
    const expressionText = validateExpression(request.expressionText);
    const action = requireAction(request.action);
    const body: ReplaceRoutingRuleRequest = { expressionText, action };
    const data = (await this.client.put(this.path, body, options)).as<RoutingRuleData>();
    return new RoutingRule({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Activates or deactivates the rule.
   *
   * @param isActive - Whether the rule should be active.
   * @param options - Optional cancellation signal.
   * @returns The updated rule.
   *
   * @public
   */
  async setActive(isActive: boolean, options?: RequestOptions): Promise<RoutingRule> {
    const data = (
      await this.client.put(`${this.path}/active`, { isActive }, options)
    ).as<RoutingRuleData>();
    return new RoutingRule({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }

  /**
   * Reorders the rule.
   *
   * @param priority - The new priority.
   * @param options - Optional cancellation signal.
   * @returns The updated rule.
   *
   * @public
   */
  async reorder(priority: number, options?: RequestOptions): Promise<RoutingRule> {
    const data = (
      await this.client.put(`${this.path}/priority`, { priority }, options)
    ).as<RoutingRuleData>();
    return new RoutingRule({ client: this.client, path: this.path, data, deleted: this.isDeleted });
  }
}
