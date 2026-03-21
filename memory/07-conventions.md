---
name: Conventions & Decisions
description: Architectural decisions, naming conventions, env vars, and file structure choices
type: reference
---

# Locker — Conventions & Decisions

## Architecture
- Monorepo with npm workspaces: packages/api, packages/cli, packages/dashboard
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL (Railway)
- Encryption: AES-256-GCM with envelope encryption (Master Key -> CEK -> API Key)
- Auth: JWT (24hr expiry)

## Env Vars
- `DATABASE_URL` — Postgres connection string
- `MASTER_ENCRYPTION_KEY` — 32 bytes, base64 encoded
- `JWT_SECRET` — 32 bytes, base64 encoded
- `PORT` — default 3001
- `NODE_ENV` — development | production

## Naming
- Service names: lowercase, no spaces (e.g., "resend", "openai", "stripe")
- DB tables: snake_case (users, keys, access_logs)
- TS files: camelCase filenames
- Routes: RESTful (/auth/*, /keys/*, /logs)

## Security Rules
- Zero plaintext keys in DB
- Parameterized SQL only
- JWT required on all non-auth routes
- Every key retrieval logged to access_logs
- Rate limiting on all routes
- Crash on missing env vars at startup
