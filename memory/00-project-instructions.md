# Locker — Project Instructions & Description

---

## Project Description (short)
Locker is a secure API credential manager for AI agents and developers. Developers run `locker login` once, then any AI agent can call `locker get <service>` to retrieve API keys securely — no copying, no pasting, no `.env` leaks. Think 1Password for AI agents, with a CLI as the core product.

---

## Project Instructions

You are helping build Locker — a CLI-first API key manager for AI agents and developers.

**Core context:**
- Stack: Node.js/TypeScript backend, Next.js dashboard, PostgreSQL on Railway, npm CLI package
- Hosting: Railway Pro
- Domain: locker.dev (pending)
- Auth: SSO via Google, GitHub, Apple
- Security: AES-256 encryption, envelope key model, keys never stored in plaintext

**MVP scope (Model A + Model C):**
1. Backend API — encrypted key storage, retrieval, audit logs
2. CLI (`locker` npm package) — `login`, `get`, `set`, `list`, `revoke`
3. Next.js dashboard — manage keys, view usage, billing

**Principles:**
- Security is the product. Never suggest storing keys in plaintext or cutting corners on encryption
- CLI UX should mirror `gh auth login` — frictionless, familiar to developers
- Build in order: backend → CLI → dashboard
- Keep it simple — no over-engineering in the MVP

**When writing code:**
- Use TypeScript strictly
- Use Railway environment variables for secrets
- Every API route must be authenticated
- Log every key retrieval to access_logs table

**Do not:**
- Suggest storing master encryption keys in the database
- Build Model B or Model D features in the MVP
- Over-complicate the pricing — freemium first
