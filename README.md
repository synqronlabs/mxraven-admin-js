# mxRaven Admin SDK (TypeScript)

[![npm](https://img.shields.io/npm/v/@mxraven/admin?label=NPM&color=007ec6&style=for-the-badge)](https://www.npmjs.com/package/@mxraven/admin)
[![CI](https://img.shields.io/github/actions/workflow/status/synqronlabs/mxraven-admin-js/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/synqronlabs/mxraven-admin-js/actions/workflows/ci.yml)
[![API reference](https://img.shields.io/badge/DOCS-API%20REFERENCE-007ec6?style=for-the-badge)](https://synqronlabs.github.io/mxraven-admin-js/)
[![license](https://img.shields.io/badge/LICENSE-APACHE%202.0-007ec6?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@mxraven/admin?label=NODE&color=fe7d37&style=for-the-badge)](https://nodejs.org)

A TypeScript SDK for the mxRaven **control-plane admin API**. It manages a
workspace end to end over the same `/v2` REST surface the customer dashboard
uses: domains, listeners, routing rules, API keys, suppressions, recipient sets,
auto-reply templates, forwarding destinations, inbound routes, relays, storage
integrations, webhook endpoints, identity providers, quotas, rate limits,
governance, mail analytics, and the public auth login context.

Full method and model documentation lives in the
[**API reference**](https://synqronlabs.github.io/mxraven-admin-js/).

> **Status:** early development. The public API is not yet stable.

## Requirements

- Node.js 20.19 or later.
- Zero runtime dependencies (uses the global `fetch`).

## Install

```sh
pnpm add @mxraven/admin
# or
npm install @mxraven/admin
# or
yarn add @mxraven/admin
```

## Module formats

The package ships dual ESM + CJS builds with type declarations for both, so
either module system works.

**ESM**

```ts
import { AdminClient } from "@mxraven/admin";
```

**CommonJS**

```js
const { AdminClient } = require("@mxraven/admin");
```

TypeScript consumers get types automatically (`dist/index.d.ts` for ESM,
`dist/index.d.cts` for CJS).

## Quick start (ESM)

```ts
import { AdminClient, domainStatus } from "@mxraven/admin";

const token = process.env.MXRAVEN_TOKEN;
if (token === undefined || token === "") {
  throw new Error("MXRAVEN_TOKEN is required");
}

const admin = new AdminClient({ token });
const ws = admin.workspace("my-workspace");

// Workspace identity and provisioning state.
const tenant = await ws.tenant();
console.log(tenant.slug, tenant.status, tenant.provisioningState);

// List domains. Pagination is hidden behind an async iterator.
for await (const domain of await ws.domains().list()) {
  console.log(domain.domainName, domain.status, domain.dkimVerified);
}

// Onboard a sending domain and operate on the hydrated entity.
const created = await ws.domains().create("example.com");
if (!created.dkimVerified) {
  await created.replace("dmarc@example.com");
}
```

---

## Authentication and client configuration

The control plane authenticates every request with a bearer token (JWT or opaque
access token) issued by ZITADEL, sent as `Authorization: Bearer <token>`. Public
operations such as `admin.auth().loginContext(...)` work with a blank token.

```ts
import { AdminClient, defaultRateLimitConfig } from "@mxraven/admin";

const admin = new AdminClient({
  baseUrl: "https://api.mxraven.email", // default
  token, // omit for public operations only
  apiVersion: "v2", // default
  timeoutMs: 60_000, // default
  rateLimit: { ...defaultRateLimitConfig, maxRetries: 5, maxBackoffMs: 120_000 },
  fetch: customFetch, // optional transport override
});
```

| Option       | Type              | Default                     | Notes                                   |
| ------------ | ----------------- | --------------------------- | --------------------------------------- |
| `baseUrl`    | `string`          | `https://api.mxraven.email` | Trailing slashes are stripped.          |
| `token`      | `string`          | `""`                        | Bearer token; blank for public calls.   |
| `apiVersion` | `string`          | `v2`                        | Prefixed to every client-relative path. |
| `rateLimit`  | `RateLimitConfig` | `defaultRateLimitConfig`    | Retry behaviour for `429`.              |
| `fetch`      | `FetchLike`       | `globalThis.fetch`          | Transport override.                     |
| `timeoutMs`  | `number`          | `60000`                     | Per-request timeout.                    |

Read-only accessors: `admin.baseUrl`, `admin.apiVersion`, `admin.rateLimit`,
`admin.token`.

### API version

Every client-relative path is prefixed with the configured API version in one
place. Paths that already carry the prefix are left untouched.

```ts
const admin = new AdminClient({ baseUrl, token, apiVersion: "v3" });
// "/tenants/acme/domains" -> /v3/tenants/acme/domains
```

### Rate limiting

When the control plane returns `429`, the client waits for `Retry-After`
(delta-seconds or an HTTP date) and retries **GET** and **DELETE** up to a
bounded number of attempts. `POST` and `PUT` are never retried automatically.

```ts
import { AdminClient, disabledRateLimitConfig } from "@mxraven/admin";

const admin = new AdminClient({ token, rateLimit: disabledRateLimitConfig });
```

If retries are exhausted, a `RateLimitException` is thrown with `retryAfterMs`
set.

### Cancellation

Every network operation accepts an `AbortSignal` as `options.signal`, the
TypeScript equivalent of a context.

```ts
const controller = new AbortController();
const paged = await ws.domains().list({ signal: controller.signal });
```

---

## Client structure

`AdminClient` is the connection plus the public `auth()` family.
`admin.workspace(slug)` binds a tenant and exposes every tenant-scoped
collection.

| Owner         | Accessor                    | Manages                                        |
| ------------- | --------------------------- | ---------------------------------------------- |
| `Workspace`   | `tenant()`                  | Workspace identity and provisioning state      |
| `Workspace`   | `domains()`                 | Sending-domain onboarding and DNS verification |
| `Workspace`   | `listeners()`               | Submission and MTA listeners                   |
| `Workspace`   | `suppressions()`            | Tenant recipient suppressions                  |
| `Workspace`   | `recipientSets()`           | Reusable recipient collections and members     |
| `Workspace`   | `autoReplyTemplates()`      | Auto-reply templates                           |
| `Workspace`   | `smtpForwardDestinations()` | Verified SMTP forwarding destinations          |
| `Workspace`   | `inboundRoutes()`           | Recipient-domain routing to MTA listeners      |
| `Workspace`   | `smtpRelays()`              | Tenant SMTP relay integrations                 |
| `Workspace`   | `storageIntegrations()`     | Tenant object-storage integrations             |
| `Workspace`   | `webhookEndpoints()`        | Webhook endpoints, secrets, and deliveries     |
| `Workspace`   | `identityProviders()`       | Tenant external identity providers             |
| `Workspace`   | `quotas()`                  | Effective tenant quotas and usage              |
| `Workspace`   | `mtaRateLimits()`           | Tenant MTA rate-limit override                 |
| `Workspace`   | `governance()`              | Audit log, dedicated IP pools, resource search |
| `Workspace`   | `mailAnalytics()`           | Mail activity and delivery aggregates          |
| `AdminClient` | `auth()`                    | Public tenant login context                    |

A workspace is a lightweight binding; `admin.workspace("a")` and
`admin.workspace("b")` let you work across tenants from one client.

```ts
const ws = admin.workspace("my-workspace");
ws.slug; // "my-workspace"
```

---

## Core concepts

### Hydrated entities

Reads and creations return an **entity**, not a bare record. The entity wraps the
wire record with the client and path needed to act on the resource, so you can
read it and operate on it directly.

```ts
const domain = await ws.domains().create("example.com");

domain.domainName; // delegated data accessor
domain.data; // raw wire record (DomainData)
domain.isDeleted; // local bookkeeping
await domain.reload(); // refresh the snapshot
await domain.replace("dmarc@example.com");
for await (const grant of await domain.listenerGrants()) {
  console.log(grant.listenerDisplayName);
}
```

Every entity exposes three things:

- **data** - every field of the underlying record, as a `readonly` getter, plus
  `data` for the raw record.
- **operations** - `reload()`, mutations (`replace`, `update`, `setActive`,
  `rotateSecret`, `sendVerification`, …), and `delete()`.
- **children** - strictly-owned collections and singletons:
  `listener.routingRules()`, `listener.apiKeys()`,
  `listener.sendingDomainPolicy()`, `listener.mtaRateLimit()`,
  `set.members()`, `endpoint.deliveries()`, `domain.listenerGrants()`.

`delete()` is idempotent per instance; `isDeleted` is local bookkeeping for
deletes performed through that instance.

### Pagination

List operations return a `Paged<T>`, an async iterable that fetches pages
lazily. It works with `for await ... of` and collection helpers, so you can map,
filter, or stop early without managing cursors.

```ts
const paged = await ws.domains().list();

for await (const domain of paged) {
  console.log(domain.domainName);
}

const firstTen = await paged.take(10);
const names = await paged.map((domain) => domain.domainName).toArray();
const verified = await paged.filter((domain) => domain.dkimVerified).toArray();
```

#### Manual page control

When you need to drive pagination yourself, pages can fetch their neighbours.

```ts
const paged = await ws.domains().list();

let page = paged.firstPage;
while (page.nextPageToken !== undefined) {
  page = await page.nextPage(); // or page.previousPage()
  console.log(`page of ${page.items.length}`);
}

for await (const each of paged.pages()) {
  // one iteration per page
}
```

`paged.page(cursor)` fetches an arbitrary cursor. Cursors are opaque; never
parse, construct, or persist them.

### Typed filters

Filterable list endpoints accept a single options object with enums for every
closed value set. Unset filters are omitted.

```ts
import { domainStatus } from "@mxraven/admin";

const verified = await ws.domains().list({
  search: "example.com",
  status: domainStatus.verified,
  dkimVerified: true,
  pageSize: 50,
});
```

`search` requires at least 3 characters; shorter values are rejected locally
with a clear message. `pageSize` must be between 1 and 500.

### Errors

Non-success responses are decoded from the RFC 9457 `application/problem+json`
body and thrown as an `ApiException` or one of its status-specific subclasses.
Branch on `code`, which is stable.

```ts
import { ConflictException, NotFoundException, ValidationException } from "@mxraven/admin";

try {
  await ws.domains().create("example.com");
} catch (error) {
  if (error instanceof NotFoundException) {
    // 404
  } else if (error instanceof ConflictException) {
    // 409
  } else if (error instanceof ValidationException) {
    for (const issue of error.errors) {
      console.error(issue.pointer, issue.code);
    }
  }
}
```

| Exception                   | Status | Notes                              |
| --------------------------- | ------ | ---------------------------------- |
| `BadRequestException`       | `400`  | Malformed request                  |
| `AuthenticationException`   | `401`  | Missing, invalid, or expired token |
| `PermissionDeniedException` | `403`  | Missing scope or tenant access     |
| `NotFoundException`         | `404`  | Not found or not visible           |
| `ConflictException`         | `409`  | Conflicts with current state       |
| `ValidationException`       | `422`  | Semantic rejection; see `errors`   |
| `RateLimitException`        | `429`  | Retried per config, then thrown    |
| `ServerException`           | `5xx`  | Control-plane failure              |
| `ApiException`              | any    | Base class for all API errors      |

Every exception carries `status`, `code`, `title`, `detail`, `traceId`,
`errors`, `problem`, and `retryable`.

### Serialization

- Wire fields are `snake_case`; models are `camelCase` and map automatically.
- Timestamps are ISO-8601 strings.
- Unset optional request fields are omitted; `null` is preserved so it can clear
  a nullable field.
- Create-only secrets are returned once and never on reads:
  `IssuedAPIKey.secret` and `IssuedWebhookEndpoint.signingSecret`. Store them
  immediately.
- Contract enums are `as const` objects with a derived union
  (`domainStatus.verified`, `listenerType.mta`, …).

### Terminal action payloads

`defaultTerminalActionPayload` and its update equivalents are built with typed
factories on `terminalActionPayload`, or passed raw via `of`.

| Action              | Factory                                                 |
| ------------------- | ------------------------------------------------------- |
| `DELIVER`           | `terminalActionPayload.deliver()` / `.empty()`          |
| `DELIVER_DEDICATED` | `terminalActionPayload.deliverDedicated(poolId)`        |
| `SMARTHOST_RELAY`   | `terminalActionPayload.smartHostRelay(relayRef)`        |
| `RELAY`             | `terminalActionPayload.relay(relayRef)`                 |
| `AUTO_REPLY`        | `terminalActionPayload.autoReply(templateRef)`          |
| `DROP`              | `terminalActionPayload.drop()` / `.drop(auditReason)`   |
| `REJECT`            | `terminalActionPayload.reject(smtp, enhanced, message)` |

### Routing rule actions

`CreateRoutingRuleRequest` / `ReplaceRoutingRuleRequest` take a
`RoutingRuleAction` built with `routingRuleAction.*`.

| Action              | Factory                                                   | Listener   |
| ------------------- | --------------------------------------------------------- | ---------- |
| `DELIVER_DEDICATED` | `routingRuleAction.deliverDedicated(poolId)`              | submission |
| `DELIVER`           | `routingRuleAction.deliver()`                             | submission |
| `SMARTHOST_RELAY`   | `routingRuleAction.smartHostRelay(relayRef)`              | submission |
| `DROP`              | `routingRuleAction.drop()` / `.drop(auditReason)`         | both       |
| `REJECT`            | `routingRuleAction.reject(smtp, enhanced, message)`       | both       |
| `MODIFY_HEADER`     | `routingRuleAction.modifyHeader(operations)`              | submission |
| `ADD_RECIPIENT`     | `routingRuleAction.addRecipient(recipients)`              | submission |
| `NOTIFY_WEBHOOK`    | `routingRuleAction.notifyWebhook(webhookRef)`             | both       |
| `RELAY`             | `routingRuleAction.relay(relayRef)`                       | mta        |
| `AUTO_REPLY`        | `routingRuleAction.autoReply(templateRef)`                | mta        |
| `DELIVER_WEBHOOK`   | `routingRuleAction.deliverWebhook(webhookRef)`            | mta        |
| `SMTP_FORWARD`      | `routingRuleAction.smtpForward(destinationRef)`           | mta        |
| `S3_STORE`          | `routingRuleAction.s3Store(storageRef, prefix, template)` | mta        |

`modifyHeaderOperation.append(header, value)`, `.set(header, value)`, and
`.remove(header)` build header operations.

---

## Examples

Common usage for each resource family. This is intentionally not the full API
surface - every method, option, and model is documented in the
[API reference](https://synqronlabs.github.io/mxraven-admin-js/) (or run
`pnpm run docs` to build it locally). Every method accepts `options.signal` for
cancellation.

### Workspace

```ts
const tenant = await ws.tenant();
console.log(tenant.slug, tenant.status, tenant.provisioningState);
```

### Domains - `ws.domains()`

```ts
const domains = ws.domains();

for await (const domain of await domains.list({ status: domainStatus.verified })) {
  console.log(domain.domainName, domain.status);
}

const domain = await domains.create("example.com", "dmarc@example.com");
await domain.replace("dmarc@example.com");

for await (const grant of await domain.listenerGrants()) {
  console.log(grant.listenerDisplayName);
}

await domain.delete();
```

### Listeners - `ws.listeners()`

```ts
const listeners = ws.listeners();

const listener = await listeners.create({
  displayName: "Outbound",
  listenerType: "submission",
  streamType: "transactional",
  defaultTerminalActionType: "DELIVER",
  defaultTerminalActionPayload: terminalActionPayload.deliver(),
});

await listener.rename("Outbound primary");
await listener.updateRspamdScanning(true);

for await (const mta of await listeners.listMtaListeners()) {
  console.log(mta.displayName);
}
```

### Routing rules - `listener.routingRules()`

```ts
const rules = listener.routingRules();

const rule = await rules.create({
  priority: 1,
  expressionText: "from == 'billing@example.com'",
  action: routingRuleAction.smtpForward("billing-dest"),
});

await rule.setActive(false);
await rule.reorder(10);
```

### API keys - `listener.apiKeys()`

```ts
const issued = await listener.apiKeys().create();
console.log(issued.username, issued.secret); // the secret is returned once

for await (const key of await listener.apiKeys().list()) {
  await key.delete();
}
```

### Sending-domain policy - `listener.sendingDomainPolicy()`

```ts
await listener
  .sendingDomainPolicy()
  .update([{ domainId: domain.id, subdomainScope: "include_subdomains" }]);

const policy = await listener.sendingDomainPolicy().get();
console.log(policy.grants);
```

### Listener MTA rate limit - `listener.mtaRateLimit()`

MTA listeners only; throws locally on a submission listener.

```ts
const rateLimit = listener.mtaRateLimit();
const current = await rateLimit.get();

await rateLimit.put({
  messageRatePerMinute: Math.floor(current.inherited.messageRatePerMinute / 2),
  recipientRatePerMinute: Math.floor(current.inherited.recipientRatePerMinute / 2),
  taskRatePerMinute: Math.floor(current.inherited.taskRatePerMinute / 2),
  burst: Math.max(1, Math.floor(current.inherited.burst / 2)),
  maxConcurrency: Math.max(1, Math.floor(current.inherited.maxConcurrency / 2)),
});

await rateLimit.delete();
```

### Suppressions - `ws.suppressions()`

```ts
const suppressions = ws.suppressions();

await suppressions.create({
  emailAddress: "bounce@example.com",
  reason: suppressionReason.bounce,
});

for await (const suppression of await suppressions.list({ search: "example.com" })) {
  console.log(suppression.emailAddress, suppression.reason);
}
```

### Recipient sets - `ws.recipientSets()`

```ts
const set = await ws.recipientSets().create({ setRef: "vip", displayName: "VIP" });

await set.members().add("vip@example.com");
await set.members().batchAdd(["a@example.com", "b@example.com"]);

for await (const member of await set.members().list()) {
  console.log(member.emailAddress, member.addedAt);
}
```

### Auto-reply templates - `ws.autoReplyTemplates()`

```ts
const template = await ws.autoReplyTemplates().create({
  templateRef: "out-of-office",
  displayName: "Out of office",
  fromAddress: "noreply@example.com",
  subject: "We received your message",
  textBody: "We will get back to you shortly.",
});

await template.setActive(true);
```

### SMTP forward destinations - `ws.smtpForwardDestinations()`

```ts
const destination = await ws.smtpForwardDestinations().create({
  destinationRef: "billing",
  displayName: "Billing",
  emailAddress: "billing@example.com",
});

await destination.sendVerification();
```

### Inbound routes - `ws.inboundRoutes()`

```ts
const route = await ws.inboundRoutes().create({
  mtaListenerId: listener.id,
  domainName: "inbound.example.com",
});

await route.update({ mtaListenerId: listener.id, domainName: "inbound2.example.com" });
```

### SMTP relays - `ws.smtpRelays()`

```ts
await ws.smtpRelays().create({
  relayRef: "primary",
  displayName: "Primary relay",
  host: "smtp.example.com",
  port: 587,
  username: "user",
  password: "secret",
});

for await (const relay of await ws.smtpRelays().list()) {
  console.log(relay.relayRef, relay.isActive);
}
```

### Storage integrations - `ws.storageIntegrations()`

```ts
await ws.storageIntegrations().create({
  storageRef: "archive",
  displayName: "Archive",
  accessKey: "key",
  secretKey: "secret",
  bucketName: "bucket",
  region: "us-east-1",
  endpointUrl: "", // empty selects the AWS default
});
```

### Webhook endpoints - `ws.webhookEndpoints()`

```ts
const endpoint = await ws.webhookEndpoints().create({
  webhookRef: "billing-events",
  displayName: "Billing events",
  targetUrl: "https://example.com/hooks",
});
console.log(endpoint.signingSecret); // returned once

for await (const delivery of await endpoint.deliveries().list()) {
  console.log(delivery.outcome, delivery.statusCode);
}

const rotated = await endpoint.rotateSecret();
console.log(rotated.signingSecret);
```

### Identity providers - `ws.identityProviders()`

`createOAuth`, `createJwt`, `createSaml`, `createLdap`, `createGoogle`,
`createAzureAd`, `createGitHub`, `createGitHubEnterpriseServer`,
`createGitLab`, `createGitLabSelfHosted`, and `createApple` are available
alongside the OIDC `create`.

```ts
const provider = await ws.identityProviders().createOAuth({
  idpRef: "corporate-sso",
  name: "Corporate SSO",
  clientId: "client-id",
  clientSecret: "client-secret",
  authorizationEndpoint: "https://idp.example.com/authorize",
  tokenEndpoint: "https://idp.example.com/token",
  userEndpoint: "https://idp.example.com/userinfo",
});

await provider.setAutoGrant(true);

const provisioning = await ws.identityProviders().getProvisioning();
await ws.identityProviders().updateProvisioning({ roles: provisioning.roles });
```

### Quotas - `ws.quotas()`

```ts
const quota = await ws.quotas().get();
console.log(quota.effective.maxDomains, quota.usage.domains, quota.overLimit);
```

### MTA rate limits - `ws.mtaRateLimits()`

```ts
const before = await ws.mtaRateLimits().get();

await ws.mtaRateLimits().put({
  messageRatePerMinute: Math.floor(before.inherited.messageRatePerMinute / 2),
  recipientRatePerMinute: Math.floor(before.inherited.recipientRatePerMinute / 2),
  taskRatePerMinute: Math.floor(before.inherited.taskRatePerMinute / 2),
  burst: Math.max(1, Math.floor(before.inherited.burst / 2)),
  maxConcurrency: Math.max(1, Math.floor(before.inherited.maxConcurrency / 2)),
});

await ws.mtaRateLimits().delete();
```

### Governance - `ws.governance()`

```ts
for await (const entry of await ws.governance().listAuditLog({ pageSize: 100 })) {
  console.log(entry.action, entry.actorKind, entry.status);
}

const hits = await (
  await ws.governance().search({ query: "example.com", types: ["domain", "listener"] })
).toArray();
```

### Mail analytics - `ws.mailAnalytics()`

Intervals are validated locally: UTC-only, `startAt < endAt`, at most 31 days,
and aligned to hour or day boundaries.

```ts
import { mailAnalyticsDimension, mailAnalyticsMetric } from "@mxraven/admin";

const series = await ws.mailAnalytics().series({
  startAt: "2026-09-01T00:00:00Z",
  endAt: "2026-09-02T00:00:00Z",
  metric: mailAnalyticsMetric.dataBytes,
  dimension: mailAnalyticsDimension.stream,
  limit: 10,
});
```

### Auth - `admin.auth()`

```ts
const context = await admin.auth().loginContext("my-workspace");
console.log(context.workspaceRef, context.displayName);
```

## Low-level request API

For endpoints not yet wrapped by a typed client, `AdminClient` exposes raw
request methods. Paths are client-relative and get the API version prefix
automatically.

| Method                                         | Description          |
| ---------------------------------------------- | -------------------- |
| `get(path, query?, options?)`                  | GET                  |
| `post(path, body, options?)`                   | POST                 |
| `put(path, body, options?)`                    | PUT                  |
| `delete(path, options?)`                       | DELETE               |
| `request(method, path, query, body, options?)` | Full control         |
| `paged(path, query?, options?)`                | Lazily paginated GET |

`Response` exposes `status`, `headers`, `body`, `rawBody`, `header(name)`,
`as<T>()`, `asRaw<T>()`, `listOf<T>()`, and `pageOf<T>()`.

```ts
const response = await admin.get("/tenants/my-workspace/domains");
const body = response.body;
```

---

## Models

Typed request and response models are exported from the package root. Notable
groups:

- **Tenancy:** `Tenant`, `TenantStatus`, `TenantProvisioningState`,
  `TenantLoginContext`.
- **Domains:** `Domain`, `DomainData`, `DomainStatus`, `DnsInstructionRecord`,
  `DnsRecordType`, `DomainListenerGrant`, `CreateDomainRequest`,
  `ReplaceDomainRequest`.
- **Listeners:** `Listener`, `ListenerData`, `ListenerType`, `StreamType`,
  `TerminalActionType`, `TerminalActionPayload`, `CreateListenerRequest`,
  `UpdateListenerRequest`, `UpdateListenerDefaultTerminalActionRequest`,
  `UpdateListenerRspamdScanningRequest`.
- **Routing:** `RoutingRule`, `RoutingRuleAction`, `RoutingRuleActionKind`,
  `RoutingRulePayload`, `ModifyHeaderOperation`, `ModifyHeaderOp`,
  `CreateRoutingRuleRequest`, `ReplaceRoutingRuleRequest`,
  `SetRoutingRuleActiveRequest`, `ReorderRoutingRuleRequest`.
- **API keys and policy:** `APIKey`, `APIKeyData`, `IssuedAPIKey`,
  `SendingDomainPolicy`, `SendingDomainPolicyGrant`,
  `SendingDomainPolicyGrantRequest`, `SendingDomainSubdomainScope`,
  `ReplaceSendingDomainPolicyRequest`.
- **Suppressions and recipient sets:** `TenantSuppression`, `SuppressionReason`,
  `RecipientSet`, `RecipientSetMember`, `RecipientSetMemberRequest`,
  `RecipientSetMembersBatchRequest`, `RecipientSetBatchResult`,
  `CreateRecipientSetRequest`, `UpdateRecipientSetRequest`.
- **Auto-reply:** `AutoReplyTemplate`, `AutoReplyTemplateHeader`,
  `AutoReplySenderReadiness`, `AutoReplySenderReadinessStatus`,
  `CreateAutoReplyTemplateRequest`, `UpdateAutoReplyTemplateRequest`,
  `SetAutoReplyTemplateActiveRequest`, `MaskedTemplateField`.
- **Forwarding, routes, relays, storage:** `SmtpForwardDestination`,
  `SmtpForwardDestinationConfirmation`,
  `SmtpForwardDestinationVerificationMethod`,
  `SmtpForwardDestinationVerificationStatus`, `InboundRoute`,
  `InboundRouteVerificationStatus`, `SmtpRelay`, `StorageIntegration`,
  `SetIntegrationActiveRequest`.
- **Webhooks:** `WebhookEndpoint`, `WebhookDelivery`, `WebhookDeliveryKind`,
  `IssuedWebhookEndpoint`, `CreateWebhookEndpointRequest`,
  `UpdateWebhookEndpointRequest`.
- **Identity:** `TenantIdentityProvider`, `IdentityProviderType`,
  `IdentityProviderLifecycleStatus`, `IdentityProvisioning`,
  `IdentityAccessClaim`, `ProviderOptions`, `LdapAttributes`, and the
  `CreateTenant*IdentityProviderRequest` family.
- **Governance:** `AuditLog`, `AuditActorKind`, `AuditStatus`,
  `TenantResourceSearchResult`, `TenantSearchResourceType`,
  `TenantDedicatedIPPool`.
- **Mail analytics:** the `MailAnalytics*` family (metrics, dimensions, buckets,
  breakdowns, series, lifecycle, latency, and task-size statistics).
- **Shared:** `Problem`, `ProblemError`, `Page`, `Paged`, `Response`,
  `ListOptions`, `MIN_SEARCH_LENGTH`, and the error classes.

Timestamps are ISO-8601 strings. Contract enums are `as const` objects with a
derived union.

---

## Development

Requires Node.js 20.19 or later and pnpm.

```sh
pnpm install     # install dependencies
pnpm run build   # dual ESM + CJS build with declarations (tsdown)
pnpm run test    # vitest
pnpm run lint    # oxlint (includes TSDoc validation)
pnpm run format  # oxfmt
pnpm run docs    # typedoc (Markdown) into docs/
```

`pnpm run check` runs formatting, lint, typecheck, test, and build in sequence.

## Releases

Releases are managed with Changesets and published from GitHub Actions with npm
provenance.

## License

Apache-2.0. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
