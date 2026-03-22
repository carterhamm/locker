---
name: Build Phases
description: The 4 phases of the Locker project build plan and their current status
type: project
---

# Locker Build Phases

## Phase 1 — Backend API (COMPLETE)
Postgres schema, AES-256-GCM envelope encryption, auth (register/login/logout), JWT middleware, key CRUD with audit logging, rate limiting, health check. 27 tests.

## Phase 2 — CLI (COMPLETE)
Commander.js CLI with 7 commands: login, logout, whoami, get, set, list, revoke. Token stored in ~/.locker/config (chmod 600). 14 tests.

## Phase 3 — Dashboard (COMPLETE)
Next.js App Router on port 5003. Dual theme (modern + terminal, terminal hidden for now). Landing page, continuity auth, keys management, logs, settings.

## Phase 4 — MCP Server (NOT STARTED)
MCP server exposing locker_get(service) tool. Auth via same JWT system. Publish alongside CLI.

**Why:** Build order is strict — each phase depends on the previous. Phase 4 is the key differentiator (AI agent access via MCP).
**How to apply:** Don't skip ahead. Each phase must be complete and tested before the next begins.
