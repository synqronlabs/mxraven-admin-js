/**
 * Demonstrates lazy cursor pagination and typed filters.
 *
 * Set MXRAVEN_TOKEN and MXRAVEN_WORKSPACE below, then run:
 *   node examples/paginate-and-filter.ts
 */
import { AdminClient, domainStatus } from "@mxraven/admin";

const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";

const client = new AdminClient({ token: MXRAVEN_TOKEN });
const ws = client.workspace(MXRAVEN_WORKSPACE);

const paged = await ws.domains().list({ status: domainStatus.verified, pageSize: 100 });

// Iteration follows cursor pages lazily; only consumed pages are fetched.
for await (const domain of paged) {
  console.log(domain.domainName);
}

console.log(`first page size=${paged.firstPage.items.length}`);

// Or pull a specific page and walk forwards.
if (paged.firstPage.hasNext) {
  const second = await paged.firstPage.nextPage();
  console.log(`second page size=${second.items.length}`);
}
