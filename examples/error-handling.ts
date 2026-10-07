/**
 * Shows how control-plane failures surface as typed exceptions.
 *
 * Set MXRAVEN_TOKEN and MXRAVEN_WORKSPACE below, then run:
 *   node examples/error-handling.ts
 */
import {
  AdminClient,
  ApiException,
  NotFoundException,
  RateLimitException,
  ValidationException,
} from "@mxraven/admin";

const MXRAVEN_TOKEN = "your-access-token";
const MXRAVEN_WORKSPACE = "my-workspace";

const client = new AdminClient({ token: MXRAVEN_TOKEN });
const ws = client.workspace(MXRAVEN_WORKSPACE);

try {
  await ws.domains().get("missing-id");
} catch (error) {
  if (error instanceof NotFoundException) {
    console.log(`not found: ${error.detail} (trace ${error.traceId})`);
  } else if (error instanceof ValidationException) {
    for (const issue of error.errors) {
      console.log(`${issue.pointer}: ${issue.detail}`);
    }
  } else if (error instanceof RateLimitException) {
    console.log(`rate limited, retry after ${error.retryAfterMs}ms`);
  } else if (error instanceof ApiException) {
    console.log(`HTTP ${error.status} ${error.code}: ${error.detail}`);
  } else {
    throw error;
  }
}
