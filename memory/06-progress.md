---
name: Build Progress
description: Tracks what's built, what's next, and any blockers for the Locker project
type: project
---

# Locker — Build Progress

## Phase 1 — Backend API (COMPLETE)
- [x] Project scaffold + git init (monorepo, npm workspaces, .gitignore, docker-compose)
- [x] Postgres schema + migrations (users, keys, access_logs + migration runner)
- [x] Encryption service (AES-256-GCM, envelope model, 18 unit tests)
- [x] Auth endpoints (register with CEK gen, login, logout)
- [x] JWT middleware (24hr expiry, Bearer token validation)
- [x] Key endpoints (POST, GET list, GET :service with decrypt + audit log, DELETE)
- [x] Logs endpoint (GET /logs with pagination)
- [x] Rate limiting (global 100/15min, auth 20/15min)
- [x] Health check (GET /health)
- [x] .env.example with all required vars
- [x] Route integration tests (9 tests with mock DB)
- [x] 27 total passing tests

## Phase 2 — CLI
Not started. Next up.

## Phase 3 — Dashboard
Not started.

## Phase 4 — MCP Server
Not started.

## Blockers
None.

## Session Log
- 2026-03-20: Completed full Phase 1 scaffold and implementation. All tests passing.
