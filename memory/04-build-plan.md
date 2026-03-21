# Locker — 7-Day MVP Build Plan

## MVP Scope
Ship Model A + Model C:
- Backend API with encrypted key storage
- CLI (`locker` npm package)
- Web dashboard (auth, add keys, view usage)

---

## Day-by-Day

### Day 1 — Backend Foundation
- Railway project setup (Node/TypeScript + Postgres)
- Database schema (users, keys, access_logs)
- Auth endpoints (Clerk or Auth.js — Google, GitHub, Apple SSO)
- AES-256 encryption utility functions

### Day 2 — Core API Endpoints
- `POST /keys` — store encrypted key
- `GET /keys/:service` — retrieve + decrypt key (authenticated)
- `DELETE /keys/:service` — revoke key
- `GET /keys` — list all services for user
- `GET /logs` — usage log for user

### Day 3 — CLI Build
- Scaffold npm package (`locker`)
- `locker login` — browser OAuth flow, store token in `~/.locker/config`
- `locker get <service>` — call API, return key to stdout
- `locker set <service> <key>` — call API, store key

### Day 4 — CLI Polish + Testing
- `locker list`, `locker revoke`, `locker whoami`
- Error handling (expired token, service not found, network error)
- Test full end-to-end flow with Claude Code calling `locker get openai`

### Day 5 — Dashboard (Next.js)
- Login page (SSO)
- Keys page — list all services, add new key, revoke
- Usage logs page — simple table

### Day 6 — Dashboard Polish + Stripe
- Stripe integration (usage-based billing or flat $9/month)
- Basic pricing page
- Deploy dashboard to Railway

### Day 7 — Launch Prep
- Publish CLI to npm (`npm publish`)
- Write README (critical — this is your landing page for developers)
- Record a 60-second demo video
- Post to Hacker News (Show HN), r/ClaudeAI, r/LocalLLaMA, X

---

## Success Criteria for MVP
- Developer can run `npm install -g locker` and be set up in under 2 minutes
- Claude Code can call `locker get <service>` and receive a key
- Dashboard shows usage logs in real time
- At least one person outside the builder uses it on launch day
