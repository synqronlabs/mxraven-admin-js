/**
 * Creates, reads, updates, and deletes sending domains for a workspace.
 *
 * Set MXRAVEN_TOKEN and MXRAVEN_WORKSPACE below, then run:
 *   node examples/manage-domains.ts
 */
import { AdminClient } from "@mxraven/admin";

const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";

const client = new AdminClient({ token: MXRAVEN_TOKEN });
const ws = client.workspace(MXRAVEN_WORKSPACE);

const domain = await ws.domains().create("example.com");
const replaced = await domain.replace("dmarc@example.com");

for await (const grant of await replaced.listenerGrants()) {
  console.log(`listener=${grant.listenerId} scope=${grant.subdomainScope}`);
}

for await (const each of await ws.domains().list()) {
  console.log(`${each.domainName} status=${each.status} dkimVerified=${each.dkimVerified}`);
}

await replaced.delete();
