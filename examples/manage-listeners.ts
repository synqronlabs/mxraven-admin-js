/**
 * Creates and manages listeners, and reaches the child clients that hang off a
 * listener.
 *
 * Set MXRAVEN_TOKEN and MXRAVEN_WORKSPACE below, then run:
 *   node examples/manage-listeners.ts
 */
import { AdminClient } from "@mxraven/admin";

const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";

const client = new AdminClient({ token: MXRAVEN_TOKEN });
const ws = client.workspace(MXRAVEN_WORKSPACE);

const listener = await ws.listeners().create({
  displayName: "Outbound transactional",
  listenerType: "submission",
  streamType: "transactional",
});

for await (const each of await ws.listeners().list()) {
  console.log(`${each.id} ${each.displayName} ${each.listenerType}`);
}

await listener.rename("Outbound primary");
await listener.updateRspamdScanning(true);

// Child clients scoped to this listener:
const script = listener.routingScript();
const draft = await script.createRevision(
  "function handle(mail, mx)\n  return mx.deliver:shared()\nend\n",
);
if (draft.publishable) {
  await script.publish(draft.revision);
}

for await (const key of await listener.apiKeys().list()) {
  console.log(`key ${key.id} ${key.username}`);
}

await listener.delete();
