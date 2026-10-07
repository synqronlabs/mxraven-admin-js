# Examples

Runnable TypeScript examples for the `@mxraven/admin` SDK. They mirror the Java
SDK's examples.

Each example declares its credentials as constants at the top; replace them
before running:

```ts
const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";
```

Build the package once, then run any example with Node (20.19+, which runs
TypeScript directly):

```sh
pnpm install
pnpm run build
node examples/workspace-overview.ts
```

| Example                  | Shows                                            |
| ------------------------ | ------------------------------------------------ |
| `workspace-overview.ts`  | Tenant identity and the public login context     |
| `manage-domains.ts`      | Create, read, update, and delete sending domains |
| `manage-listeners.ts`    | Listeners and their child clients                |
| `paginate-and-filter.ts` | Lazy cursor pagination and typed filters         |
| `error-handling.ts`      | Typed exceptions from control-plane failures     |
