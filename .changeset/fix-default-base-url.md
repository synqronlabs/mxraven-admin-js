---
"@mxraven/admin": patch
---

Fix the default base URL: `https://api.mxraven.email` does not resolve. The
client now defaults to `https://api.mxraven.com`, the production control-plane
host.
