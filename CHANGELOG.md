# @mxraven/admin

## 3.0.0

### Major Changes

- Align the SDK with the routing-script control plane.

  Routing rules are replaced by per-listener Lua routing scripts, the listener
  default terminal action is removed, and webhook delivery history is gone.

  - Replace `RoutingRulesClient` / `RoutingRule` with `RoutingScriptsClient`, reached
    from `listener.routingScript()` or `ws.routingScripts(listenerId)`. It covers
    drafts, revision history, the simulation sandbox, publish, rollback, export,
    and MTA body access. `delete()` unpublishes a script and keeps its revision
    history.
  - Extend simulation fixtures with `bodyHtml` and `attachments` for MTA listeners
    with body access.
  - Add webhook endpoint credentials: `setCredential()` / `deleteCredential()` and
    `WebhookEndpoint.credentialHeader` for `mx.http` calls to third-party APIs. The
    credential value is write-only.
  - Remove `terminalActionType`, `terminalActionPayload`, `TerminalActionType`,
    `TerminalActionPayload`, and `UpdateListenerDefaultTerminalActionRequest`;
    `Listener` now exposes `activeScriptRevisionId` and `scriptBodyAccess`.
  - Remove `WebhookDeliveriesClient`, `WebhookDelivery`, `WebhookDeliveryKind`, and
    `webhookDeliveryKind`, along with `endpoint.deliveries()`.
  - Rename quota fields: `maxRoutingRules` to `maxScriptSourceBytes`,
    `maxRoutingRulesPerListener` to `maxScriptRevisionsPerListener`, and
    `maxWebhookEndpoints` to `maxHttpEndpoints`; usage fields follow.
  - Add `ws.connectedApps()` for installations, device and browser consent previews,
    and the grantable-scope list.
  - Add `ws.abuseControl()` for workspace reputation, outbound-pause state, and
    redacted deliverability findings.
  - Add `getContent()` / `AutoReplyTemplateContent` for the stored auto-reply
    subject, bodies, and headers, which list and get only summarise.
  - Align `TenantSuppression` with the provider-aware wire shape by adding
    `canonicalEmailAddress`, `systemManaged`, `source`, `feedbackCount`,
    `addedAt`, `lastFeedbackAt`, and `updatedAt`, and making `reason` optional.
  - Add `ws.governance().listInboundRoutingOutcomes()`, rename
    `routingRuleId` to `scriptRevisionId`, drop the `routing_rule` search type, and
    add `TenantDedicatedIPPool.ref`.
  - Document that client-notification payloads carry no `event_type`; identify them
    by stream subject (`accepted`, `attempt`, or the sampled MTA `fault` event) and,
    for attempts, `channel`.
  - The removed `rules.delete` scope is no longer part of any flow. Routing scripts
    use `rules.read`, `rules.write`, and `rules.publish`.
  - Billing and account self-service changes are account-bound (`/v2/account/...`)
    and remain out of scope, alongside platform-operator routes. The SDK covers the
    tenant-bound `/v2/tenants/{slug}/...` contract, the public auth context, and the
    instance-wide grantable connected-app scope listing.

## 2.1.0

### Minor Changes

- c2cc2e3: Add listener client notification settings and listener-scoped mail analytics:

  - `listener.notificationSetting()` and `listener.updateNotifications(enabled)`
    for the new `GET`/`PUT /v2/tenants/{slug}/listeners/{id}/notifications`
    endpoints, with the `ListenerNotificationSetting` and
    `UpdateListenerNotificationsRequest` types.
  - `ws.mailAnalytics().listenerOverview({ startAt, endAt, listenerId })` for the
    new listener overview endpoint, with the `MailAnalyticsListenerOverview`
    family of types.
  - API-key documentation now covers MTA listeners, whose keys authenticate the
    client notification channel.

### Patch Changes

- 7a5a1e1: Fix the default base URL: `https://api.mxraven.email` does not resolve. The
  client now defaults to `https://api.mxraven.com`, the production control-plane
  host.
