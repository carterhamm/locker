---
name: Always verify builds before finishing
description: Must run dev server and verify pages load (not just next build) before declaring changes done
type: feedback
---

Always run the dev server and verify pages actually load before finishing a batch of changes. `next build` passing is not enough — runtime errors can still occur from stale caches or webpack issues.

**Why:** Build passed but runtime had module errors from stale `.next` cache. User caught it.
**How to apply:** After any dashboard changes: `rm -rf .next`, `npx next dev -p 5003`, verify HTTP 200 on all changed routes, then stop server.
