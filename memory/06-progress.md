---
name: Build Progress
description: Tracks what's built, what's next, and any blockers for the Locker project
type: project
---

# Locker — Build Progress

## Phase 1 — Backend API (COMPLETE)
- [x] Project scaffold + git init
- [x] Postgres schema + migrations (users, keys, access_logs)
- [x] Encryption service (AES-256-GCM, envelope model, 18 unit tests)
- [x] Auth endpoints (register with CEK gen, login, logout)
- [x] JWT middleware (24hr expiry, Bearer token validation)
- [x] Key endpoints (POST, GET list, GET :service with decrypt + audit log, DELETE)
- [x] Logs endpoint (GET /logs with pagination)
- [x] Rate limiting (global 100/15min, auth 20/15min)
- [x] Health check + .env.example
- [x] 27 API tests passing

## Phase 2 — CLI (COMPLETE)
- [x] npm package scaffold with Commander.js (bin: locker)
- [x] Config module (~/.locker/config, chmod 600, read/write/clear)
- [x] API client (authenticated + unauthenticated, error handling)
- [x] `locker login` — email/password auth, stores JWT + API URL
- [x] `locker login --register` — create new account
- [x] `locker get <service>` — retrieves key to stdout only, --agent flag for audit
- [x] `locker set <service> <key>` — stores encrypted key via API
- [x] `locker list` — shows service names (never key values)
- [x] `locker revoke <service>` — deletes key
- [x] `locker whoami` — shows logged-in email
- [x] `locker logout` — clears ~/.locker/config
- [x] Error handling: expired token (prompt re-login), network error, not found
- [x] 14 CLI tests passing (config, commands, API client)

## Total: 41 tests passing (27 API + 14 CLI)

## Phase 3 — Dashboard
Not started. Next up.

## Phase 4 — MCP Server
Not started.

## Blockers
None.

## Session Log
- 2026-03-20: Completed Phase 1 (backend API) and Phase 2 (CLI). All 41 tests passing.
