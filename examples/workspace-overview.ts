/**
 * Reads workspace identity and the public login context.
 *
 * Set MXRAVEN_TOKEN and MXRAVEN_WORKSPACE below, then run:
 *   node examples/workspace-overview.ts
 */
import { AdminClient } from "@mxraven/admin";

const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";

const client = new AdminClient({ token: MXRAVEN_TOKEN });
const ws = client.workspace(MXRAVEN_WORKSPACE);

const tenant = await ws.tenant();
console.log(`slug=${tenant.slug} status=${tenant.status} provisioning=${tenant.provisioningState}`);

const login = await client.auth().loginContext(MXRAVEN_WORKSPACE);
console.log(`workspaceRef=${login.workspaceRef} displayName=${login.displayName}`);
