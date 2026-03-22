---
name: Launch Plan
description: 6-step launch checklist — deploy, database, env vars, billing, readme, domain
type: project
---

# Locker Launch Plan

1. [x] **Deploy API + Dashboard to Railway** — DONE
   - API: https://api-production-449f.up.railway.app
   - Dashboard: https://dashboard-production-fe57.up.railway.app
2. [ ] **Domain (locker.dev)** — deferred, a few weeks out
3. [x] **Set up Postgres on Railway** — DONE (50GB volume, migration applied)
4. [x] **Set environment variables on Railway** — DONE (MASTER_ENCRYPTION_KEY, JWT_SECRET, DATABASE_URL, HOSTNAME)
5. [ ] **Stripe integration** — $9/month Pro plan billing
6. [ ] **README** — npm landing page, install example, security explanation

**Order:** 1 → 3 → 4 → 5 → 6 → 2

**Railway project:** https://railway.com/project/76c2399d-17a6-41ba-a68d-f22d4a8d0c02
**API service ID:** 16342f17-e9f8-49f1-b4ef-0d3d3b7ac415
**Dashboard service ID:** dade8bc0-47a7-4eec-a12f-cf416db4dce0
**Environment ID:** c712910d-4582-465b-ba84-d372e9e35f5f
