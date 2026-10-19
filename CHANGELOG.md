# @mxraven/admin

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
